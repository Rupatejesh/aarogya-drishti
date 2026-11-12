import { useEffect, useRef, useState, useCallback } from 'react'
import type { AppointmentRecord, AuthUser, PatientRecord, ScreeningRecord } from '../services/api'
import { DEMO_KILLO_SOMANNA_PATIENT, DEMO_KILLO_SOMANNA_REFERRAL } from '../utils/demoFallbackData'
import { broadcastScreeningSnapshot } from '../utils/screeningSync'
import { speakBujjiTeluguVoice } from '../utils/bujjiVoiceEngine'

export interface TeleParticipant {
  id: string
  name: string
  role: 'DOCTOR' | 'PATIENT' | 'ASHA_WORKER' | 'FAMILY_MEMBER' | 'MEDICAL_OFFICER'
  title: string
  location: string
  isMuted: boolean
  isVideoActive: boolean
  isSpeaking: boolean
  isHost?: boolean
}

export interface LiveTeleconsultationStudioProps {
  user?: AuthUser | null
  appointment?: AppointmentRecord
  patient?: PatientRecord
  latestScreening?: ScreeningRecord
  canConclude?: boolean
  onClose?: () => void
  onConcluded?: () => Promise<void> | void
  onGeneratePrescription?: () => void
  onOrderBiopsy?: () => void
}

export function LiveTeleconsultationStudio({
  user,
  appointment = {
    _id: DEMO_KILLO_SOMANNA_REFERRAL._id,
    appointmentId: 'APT-20261111-GM01',
    patientId: DEMO_KILLO_SOMANNA_PATIENT._id,
    doctorId: 'doc-paderu-01',
    doctorName: 'Dr. V. Anitha Rao, MDS (Oral Oncology, DH Paderu)',
    hospitalId: 'HOSP-ASR-PADERU-01',
    hospitalName: 'District Hospital Paderu',
    appointmentType: 'TELEMEDICINE',
    scheduledDate: new Date().toISOString(),
    timeSlot: '10:30 AM - 11:00 AM',
    status: 'CONFIRMED',
    meetingRoomId: 'AarogyaDrishti-Live-Consultation-GMAD01',
    urgentReason: 'Chronic right buccal mucosal leukoplakia plaque (>3 months)',
    nextAction: 'URGENT_BIOPSY_REFERRAL',
  },
  patient = DEMO_KILLO_SOMANNA_PATIENT,
  canConclude = true,
  onClose,
  onConcluded,
  onGeneratePrescription,
  onOrderBiopsy,
}: LiveTeleconsultationStudioProps) {
  // 1. Dynamic Patient Identity Extraction
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  const urlPatientParam = urlParams?.get('patient')

  const isDoctorOrStaffName = (name?: string | null) => {
    if (!name) return false
    const n = name.toLowerCase()
    return (
      n.includes('dr.') ||
      n.includes('doctor') ||
      n.includes('oncologist') ||
      n.includes('specialist') ||
      n.includes('anitha') ||
      n.includes('rao')
    )
  }

  const activePatientName =
    urlPatientParam && !isDoctorOrStaffName(urlPatientParam)
      ? decodeURIComponent(urlPatientParam)
      : user?.role === 'PATIENT' && user.fullName
      ? user.fullName
      : patient?.fullName && !isDoctorOrStaffName(patient.fullName)
      ? patient.fullName
      : user?.role === 'PATIENT'
      ? (user?.fullName || 'rambabu')
      : 'rambabu'

  const activeMandal =
    user?.role === 'PATIENT' && user.mandal
      ? user.mandal
      : patient?.address?.mandal
      ? patient.address.mandal
      : (activePatientName.toLowerCase().includes('rambabu')
          ? 'Koyyuru'
          : activePatientName.toLowerCase().includes('tejesh')
          ? 'Chintapalli'
          : 'G. Madugula')

  const activeUidn =
    user?.role === 'PATIENT' && user.maaUidn
      ? user.maaUidn
      : patient?.maaUidn && !patient.maaUidn.includes('GMAD')
      ? patient.maaUidn
      : (activePatientName.toLowerCase().includes('rambabu')
          ? 'UIDN-ASR-KOYY-2026-8921'
          : activePatientName.toLowerCase().includes('tejesh')
          ? 'UIDN-ASR-CHIN-2026-8757'
          : 'UIDN-ASR-GMAD-2026-0842')

  const activePhc = `PHC ${activeMandal.toUpperCase()}`
  const activeAge = patient?.age || 46
  const activeSex = patient?.sex || 'Male'
  const roomCode = appointment.meetingRoomId || `AarogyaDrishti-Live-Consultation-${activeMandal.toUpperCase().slice(0, 4)}01`

  const patientVideoRef = useRef<HTMLVideoElement | null>(null)
  const patientCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const doctorCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const patientAnimRef = useRef<number>(0)
  const doctorAnimRef = useRef<number>(0)

  const [micMuted, setMicMuted] = useState(false)
  const [videoMuted, setVideoMuted] = useState(false)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')
  const [isHardwareCamera, setIsHardwareCamera] = useState(false)
  const [capturedSnapshot, setCapturedSnapshot] = useState<string | null>(null)
  const [snapshotTimestamp, setSnapshotTimestamp] = useState<string | null>(null)

  // Multi-participant state
  const [participants, setParticipants] = useState<TeleParticipant[]>([
    {
      id: 'doctor-anitha',
      name: 'Dr. V. Anitha Rao, MDS',
      role: 'DOCTOR',
      title: 'Oral Oncologist & Specialist Surgeon',
      location: 'District Hospital Paderu (Master Hub)',
      isMuted: false,
      isVideoActive: true,
      isSpeaking: true,
      isHost: true,
    },
    {
      id: 'patient-primary',
      name: activePatientName,
      role: 'PATIENT',
      title: `Primary Patient (${activeAge}Y / ${activeSex})`,
      location: `${activePhc} · ${activeUidn}`,
      isMuted: false,
      isVideoActive: true,
      isSpeaking: false,
    },
  ])

  // Modals & Menu States
  const [showShareModal, setShowShareModal] = useState(false)
  const [showMonitoringMenu, setShowMonitoringMenu] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)
  const [lowBandwidthMode, setLowBandwidthMode] = useState(false)
  const [callDurationSeconds, setCallDurationSeconds] = useState(582)
  const [customGuestName, setCustomGuestName] = useState('')
  const [customGuestRole, setCustomGuestRole] = useState<'FAMILY_MEMBER' | 'ASHA_WORKER' | 'MEDICAL_OFFICER'>('FAMILY_MEMBER')
  const [spotlightId, setSpotlightId] = useState<string | null>(null)

  // Prescription and consultation notes
  const [consultationNotes, setConsultationNotes] = useState(
    `Patient ${activePatientName} (${activeAge}Y / ${activeSex}, ${activeMandal}): Right buccal mucosa shows non-scrapable homogeneous leukoplakia plaque (~1.8 cm x 1.2 cm) with peripheral erythema. Advised punch biopsy at DH Paderu / weekly PHC cluster circuit camp.`,
  )

  useEffect(() => {
    setConsultationNotes(
      `Patient ${activePatientName} (${activeAge}Y / ${activeSex}, ${activeMandal}): Right buccal mucosa shows non-scrapable homogeneous leukoplakia plaque (~1.8 cm x 1.2 cm) with peripheral erythema. Advised punch biopsy at DH Paderu / weekly PHC cluster circuit camp.`,
    )
  }, [activePatientName, activeAge, activeSex, activeMandal])

  const [medications] = useState([
    { id: 1, name: 'Triamcinolone Acetonide 0.1% Orabase Paste', dose: 'Apply topically to lesion twice daily after meals', duration: '14 Days' },
    { id: 2, name: 'Lycopene 10mg + Vitamin A & E Antioxidant Capsules', dose: '1 Capsule orally once daily after breakfast', duration: '30 Days' },
    { id: 3, name: 'Chlorhexidine Gluconate 0.2% Antiseptic Oral Rinse', dose: '15 mL undiluted gargle thrice daily for 60 seconds', duration: '15 Days' },
  ])
  const [routeToDroneDelivery, setRouteToDroneDelivery] = useState(true)
  const [nextAction, setNextAction] = useState<'URGENT_BIOPSY_REFERRAL' | 'LOCAL_PHC_FOLLOWUP' | 'DISCHARGE'>(
    appointment.nextAction || 'URGENT_BIOPSY_REFERRAL',
  )
  const [showSignedModal, setShowSignedModal] = useState(false)
  const [isConcluding, setIsConcluding] = useState(false)

  // Timer for active call duration
  useEffect(() => {
    const timer = setInterval(() => {
      setCallDurationSeconds((prev) => prev + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatCallDuration = (secs: number) => {
    const mins = Math.floor(secs / 60)
    const rem = secs % 60
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`
  }

  // Update primary patient name if user prop loads dynamically
  useEffect(() => {
    setParticipants((prev) =>
      prev.map((p) =>
        p.role === 'PATIENT'
          ? {
              ...p,
              name: activePatientName,
              title: `Primary Patient (${activeAge}Y / ${activeSex})`,
              location: `${activePhc} · ${activeUidn}`,
            }
          : p,
      ),
    )
  }, [activePatientName, activeAge, activeSex, activePhc, activeUidn])

  // Hardware Camera Initialization
  const startHardwareCamera = useCallback(async () => {
    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        return false
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: lowBandwidthMode ? 640 : 1280 },
          height: { ideal: lowBandwidthMode ? 360 : 720 },
          facingMode,
        },
        audio: true,
      })
      streamRef.current = stream

      if (patientVideoRef.current) {
        patientVideoRef.current.srcObject = stream
        patientVideoRef.current.muted = true
        patientVideoRef.current.playsInline = true
        await patientVideoRef.current.play().catch(() => {})
      }
      setIsHardwareCamera(true)
      return true
    } catch {
      setIsHardwareCamera(false)
      return false
    }
  }, [facingMode, lowBandwidthMode])

  // Stop stream cleanup
  const stopHardwareCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (patientVideoRef.current) {
      patientVideoRef.current.srcObject = null
    }
    setIsHardwareCamera(false)
  }, [])

  // Doctor Simulated High-Definition Video Canvas Stream
  useEffect(() => {
    let frame = 0
    const canvas = doctorCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId = 0
    const renderDoctor = () => {
      frame++
      const w = 640
      const h = 480
      canvas.width = w
      canvas.height = h

      // Clinic background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, w, h)
      bgGrad.addColorStop(0, '#0f172a')
      bgGrad.addColorStop(0.5, '#1e293b')
      bgGrad.addColorStop(1, '#0f172a')
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, w, h)

      // Hospital examination room light
      const lightGrad = ctx.createRadialGradient(w * 0.5, h * 0.4, 40, w * 0.5, h * 0.4, 280)
      lightGrad.addColorStop(0, 'rgba(56, 189, 248, 0.15)')
      lightGrad.addColorStop(1, 'transparent')
      ctx.fillStyle = lightGrad
      ctx.fillRect(0, 0, w, h)

      const breath = Math.sin(frame * 0.04) * 3

      // Doctor White Coat & Stethoscope
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.ellipse(w * 0.5, h * 0.85 + breath, 150, 110, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#cbd5e1'
      ctx.lineWidth = 3
      ctx.stroke()

      // Stethoscope binaural tubes
      ctx.strokeStyle = '#0284c7'
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.arc(w * 0.5, h * 0.62 + breath, 48, Math.PI * 0.1, Math.PI * 0.9)
      ctx.stroke()

      // Doctor Face (Dr. V. Anitha Rao, MDS)
      const faceGrad = ctx.createRadialGradient(w * 0.5, h * 0.42 + breath, 10, w * 0.5, h * 0.42 + breath, 70)
      faceGrad.addColorStop(0, '#fed7aa')
      faceGrad.addColorStop(0.7, '#fdba74')
      faceGrad.addColorStop(1, '#fb923c')
      ctx.fillStyle = faceGrad
      ctx.beginPath()
      ctx.ellipse(w * 0.5, h * 0.42 + breath, 62, 75, 0, 0, Math.PI * 2)
      ctx.fill()

      // Doctor Hair
      ctx.fillStyle = '#1e1b4b'
      ctx.beginPath()
      ctx.arc(w * 0.5, h * 0.38 + breath, 68, Math.PI * 0.8, Math.PI * 2.2)
      ctx.fill()

      // Eyes & Blinking
      const blink = frame % 140 < 5
      ctx.fillStyle = '#ffffff'
      if (!blink) {
        ctx.beginPath()
        ctx.ellipse(w * 0.5 - 22, h * 0.4 + breath, 9, 6, 0, 0, Math.PI * 2)
        ctx.ellipse(w * 0.5 + 22, h * 0.4 + breath, 9, 6, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#0f172a'
        ctx.beginPath()
        ctx.arc(w * 0.5 - 22, h * 0.4 + breath, 4, 0, Math.PI * 2)
        ctx.arc(w * 0.5 + 22, h * 0.4 + breath, 4, 0, Math.PI * 2)
        ctx.fill()
      } else {
        ctx.strokeStyle = '#0f172a'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(w * 0.5 - 30, h * 0.4 + breath)
        ctx.lineTo(w * 0.5 - 14, h * 0.4 + breath)
        ctx.moveTo(w * 0.5 + 14, h * 0.4 + breath)
        ctx.lineTo(w * 0.5 + 30, h * 0.4 + breath)
        ctx.stroke()
      }

      // Surgical Mask
      ctx.fillStyle = '#e0f2fe'
      ctx.beginPath()
      ctx.roundRect(w * 0.5 - 38, h * 0.45 + breath, 76, 36, 8)
      ctx.fill()
      ctx.strokeStyle = '#38bdf8'
      ctx.lineWidth = 1.5
      ctx.stroke()

      // Hospital Overlay Stamp
      ctx.fillStyle = 'rgba(15, 23, 42, 0.75)'
      ctx.fillRect(16, 16, 260, 44)
      ctx.fillStyle = '#38bdf8'
      ctx.font = 'bold 13px system-ui, sans-serif'
      ctx.fillText('DISTRICT HOSPITAL PADERU', 26, 36)
      ctx.fillStyle = '#94a3b8'
      ctx.font = '11px system-ui, sans-serif'
      ctx.fillText('Tele-Oncology Master Console · Hub', 26, 52)

      animId = requestAnimationFrame(renderDoctor)
    }

    renderDoctor()
    doctorAnimRef.current = animId
    return () => cancelAnimationFrame(animId)
  }, [])

  // Patient Synthetic Fallback Animation (Using Active Patient Details)
  useEffect(() => {
    if (isHardwareCamera) return
    let frame = 0
    const canvas = patientCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId = 0
    const renderPatient = () => {
      frame++
      const w = 640
      const h = 480
      canvas.width = w
      canvas.height = h

      // Clinical Telehealth Spoke Background
      const bgGrad = ctx.createLinearGradient(0, 0, w, h)
      bgGrad.addColorStop(0, '#0c192c')
      bgGrad.addColorStop(0.5, '#1e293b')
      bgGrad.addColorStop(1, '#0c192c')
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, w, h)

      const breath = Math.sin(frame * 0.04) * 3

      // Patient Shoulders & Kurta
      ctx.fillStyle = '#b45309'
      ctx.beginPath()
      ctx.ellipse(w * 0.5, h * 0.85 + breath, 150, 110, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#78350f'
      ctx.lineWidth = 3
      ctx.stroke()

      // Patient Face (Warm Indian skin tone for active patient)
      const faceGrad = ctx.createRadialGradient(w * 0.5, h * 0.42 + breath, 10, w * 0.5, h * 0.42 + breath, 70)
      faceGrad.addColorStop(0, '#e5987d')
      faceGrad.addColorStop(0.7, '#d17e60')
      faceGrad.addColorStop(1, '#b56447')
      ctx.fillStyle = faceGrad
      ctx.beginPath()
      ctx.ellipse(w * 0.5, h * 0.42 + breath, 62, 75, 0, 0, Math.PI * 2)
      ctx.fill()

      // Hair
      ctx.fillStyle = '#1e293b'
      ctx.beginPath()
      ctx.arc(w * 0.5, h * 0.38 + breath, 68, Math.PI * 0.85, Math.PI * 2.15)
      ctx.fill()

      // Eyes & Blinking
      const blink = frame % 150 < 6
      ctx.fillStyle = '#ffffff'
      if (!blink) {
        ctx.beginPath()
        ctx.ellipse(w * 0.5 - 20, h * 0.4 + breath, 9, 6, 0, 0, Math.PI * 2)
        ctx.ellipse(w * 0.5 + 20, h * 0.4 + breath, 9, 6, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#1e1b4b'
        ctx.beginPath()
        ctx.arc(w * 0.5 - 20, h * 0.4 + breath, 4, 0, Math.PI * 2)
        ctx.arc(w * 0.5 + 20, h * 0.4 + breath, 4, 0, Math.PI * 2)
        ctx.fill()
      } else {
        ctx.strokeStyle = '#1e1b4b'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(w * 0.5 - 28, h * 0.4 + breath)
        ctx.lineTo(w * 0.5 - 12, h * 0.4 + breath)
        ctx.moveTo(w * 0.5 + 12, h * 0.4 + breath)
        ctx.lineTo(w * 0.5 + 28, h * 0.4 + breath)
        ctx.stroke()
      }

      // Mouth opening with non-scrapable leukoplakia oral observation
      ctx.fillStyle = '#881337'
      ctx.beginPath()
      ctx.ellipse(w * 0.5, h * 0.48 + breath, 18, 9, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#f8fafc'
      ctx.beginPath()
      ctx.ellipse(w * 0.5 + 7, h * 0.48 + breath, 5, 4, 0, 0, Math.PI * 2)
      ctx.fill()

      // Dynamic Patient Overlay Stamp with active patient name & mandal!
      ctx.fillStyle = 'rgba(15, 23, 42, 0.75)'
      ctx.fillRect(16, 16, 280, 44)
      ctx.fillStyle = '#22c55e'
      ctx.font = 'bold 13px system-ui, sans-serif'
      ctx.fillText(`${activePhc} (SPOKE)`, 26, 36)
      ctx.fillStyle = '#94a3b8'
      ctx.font = '11px system-ui, sans-serif'
      ctx.fillText(`${activePatientName} · MAA-UIDN: ${activeUidn}`, 26, 52)

      animId = requestAnimationFrame(renderPatient)
    }

    renderPatient()
    patientAnimRef.current = animId
    return () => cancelAnimationFrame(animId)
  }, [isHardwareCamera, activePhc, activePatientName, activeUidn])

  // Start camera on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      void startHardwareCamera()
    }, 0)
    return () => {
      clearTimeout(timer)
      stopHardwareCamera()
    }
  }, [startHardwareCamera, stopHardwareCamera])

  // Handle Mute Mic
  const handleToggleMic = () => {
    const next = !micMuted
    setMicMuted(next)
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = !next
      })
    }
  }

  // Handle Video Camera Toggle
  const handleToggleVideo = () => {
    const next = !videoMuted
    setVideoMuted(next)
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach((t) => {
        t.enabled = !next
      })
    }
  }

  // Handle Flip Camera
  const handleFlipCamera = async () => {
    const next = facingMode === 'user' ? 'environment' : 'user'
    setFacingMode(next)
    stopHardwareCamera()
    setTimeout(() => {
      void startHardwareCamera()
    }, 150)
  }

  // Handle Snapshot Capture
  const handleCaptureSnapshot = () => {
    let capturedUrl: string | null = null
    const stamp = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

    if (patientVideoRef.current && isHardwareCamera) {
      const v = patientVideoRef.current
      const c = document.createElement('canvas')
      c.width = v.videoWidth || 1280
      c.height = v.videoHeight || 720
      const ctx = c.getContext('2d')
      if (ctx) {
        if (facingMode === 'user') {
          ctx.translate(c.width, 0)
          ctx.scale(-1, 1)
        }
        ctx.drawImage(v, 0, 0, c.width, c.height)
        if (facingMode === 'user') {
          ctx.setTransform(1, 0, 0, 1, 0, 0)
        }
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
        ctx.fillRect(10, c.height - 40, 520, 30)
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 16px sans-serif'
        ctx.fillText(`${activePatientName} · Snapshot ${stamp} · Aarogya Drishti`, 20, c.height - 20)
        capturedUrl = c.toDataURL('image/png')
      }
    } else if (patientCanvasRef.current) {
      capturedUrl = patientCanvasRef.current.toDataURL('image/png')
    }

    if (capturedUrl) {
      setCapturedSnapshot(capturedUrl)
      setSnapshotTimestamp(stamp)
      broadcastScreeningSnapshot(capturedUrl)
      speakBujjiTeluguVoice(
        `${activePatientName} గారి నోటి మ్యూకోసా చిత్రం విజయవంతంగా తీయబడింది మరియు ఏఐ విశ్లేషణకు పంపబడింది.`,
        'TE',
      )
    }
  }

  // Conclude Consultation
  const handleConcludeConsultation = async () => {
    setIsConcluding(true)
    try {
      await onConcluded?.()
      setShowSignedModal(true)
      speakBujjiTeluguVoice(
        `డాక్టర్ వి. అనిత రావు గారితో టెలిమెడిసిన్ కన్సల్టేషన్ పూర్తయింది. డిజిటల్ ప్రిస్క్రిప్షన్ సిద్ధంగా ఉంది.`,
        'TE',
      )
    } finally {
      setIsConcluding(false)
    }
  }

  // Room Share Link logic
  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://aarogyadrishti.in'}/?teleRoom=${encodeURIComponent(roomCode)}&patient=${encodeURIComponent(activePatientName)}`

  const handleCopyShareLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(shareUrl)
    }
    setShareCopied(true)
    speakBujjiTeluguVoice(
      `వీడియో కాల్ ఆహ్వాన లింక్ కాపీ చేయబడింది! కుటుంబ సభ్యులు లేదా ఆశా వర్కర్‌కు పంపండి.`,
      'TE',
    )
    setTimeout(() => setShareCopied(false), 3000)
  }

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Aarogya Drishti Live Telemedicine · ${activePatientName}`,
          text: `Join the encrypted WebRTC consultation with Dr. V. Anitha Rao, MDS (Oral Oncology) for patient ${activePatientName}:`,
          url: shareUrl,
        })
      } catch {
        handleCopyShareLink()
      }
    } else {
      handleCopyShareLink()
    }
  }

  const handleAddParticipant = (
    name: string,
    role: 'ASHA_WORKER' | 'FAMILY_MEMBER' | 'MEDICAL_OFFICER',
    title: string,
    location: string,
  ) => {
    const newId = 'participant-' + Date.now()
    setParticipants((prev) => [
      ...prev,
      {
        id: newId,
        name,
        role,
        title,
        location,
        isMuted: false,
        isVideoActive: true,
        isSpeaking: false,
      },
    ])
    speakBujjiTeluguVoice(`${name} గారు వీడియో కాల్‌లో చేరారు.`, 'TE')
  }

  const handleRemoveParticipant = (id: string) => {
    setParticipants((prev) => prev.filter((p) => p.id !== id))
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        width: '100%',
        maxWidth: '1440px',
        margin: '0 auto',
      }}
    >
      {/* Top Bar / Room Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 20px',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          borderRadius: '16px',
          color: '#ffffff',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: '#22c55e',
              boxShadow: '0 0 10px #22c55e',
              animation: 'pulse 1.8s infinite',
            }}
          />
          <div>
            <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, letterSpacing: '0.02em' }}>
              ✦ LIVE TELEMEDICINE STUDIO · PEER-TO-PEER WEBRTC
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
              Encrypted Channel: <code>{roomCode}</code> · Patient:{' '}
              <strong style={{ color: '#38bdf8' }}>{activePatientName}</strong> ({activePhc})
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Call Monitoring Menu Button */}
          <button
            type="button"
            onClick={() => setShowMonitoringMenu(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '999px',
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1.5px solid #38bdf8',
              color: '#38bdf8',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <span>📊</span>
            <span>Call Monitoring &amp; Telemetry</span>
          </button>

          {/* Share Link & Invite Button */}
          <button
            type="button"
            onClick={() => setShowShareModal(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '999px',
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              border: 'none',
              color: '#ffffff',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 10px rgba(37, 99, 235, 0.3)',
            }}
          >
            <span>🔗</span>
            <span>Share Call Link &amp; Invite ({participants.length})</span>
          </button>

          <span
            style={{
              padding: '5px 12px',
              borderRadius: '999px',
              background: '#065f46',
              color: '#6ee7b7',
              fontSize: '0.75rem',
              fontWeight: 700,
              border: '1px solid #10b981',
            }}
          >
            ● LIVE SESSION ({formatCallDuration(callDurationSeconds)})
          </span>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                fontSize: '0.8rem',
                cursor: 'pointer',
              }}
            >
              Close Studio
            </button>
          )}
        </div>
      </div>

      {/* Main Studio Workspace: Multi-Participant Video Streams + Right Clinical Console */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.85fr) minmax(360px, 1fr)',
          gap: '18px',
        }}
      >
        {/* Left: Video Streams Grid + Interactive Controls Toolbar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                spotlightId
                  ? '1fr'
                  : participants.length <= 2
                    ? '1fr 1fr'
                    : participants.length === 3
                      ? 'repeat(auto-fit, minmax(280px, 1fr))'
                      : '1fr 1fr',
              gap: '12px',
              background: '#090d16',
              padding: '12px',
              borderRadius: '20px',
              border: '2px solid rgba(56, 189, 248, 0.3)',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.35)',
              minHeight: '380px',
            }}
          >
            {/* Stream 1: Specialist Doctor (Dr. V. Anitha Rao, MDS) */}
            {(!spotlightId || spotlightId === 'doctor-anitha') && (
              <div
                style={{
                  position: 'relative',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  background: '#0f172a',
                  border: '1.5px solid rgba(148, 163, 184, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '260px',
                }}
              >
                <canvas
                  ref={doctorCanvasRef}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: '10px',
                    left: '10px',
                    background: 'rgba(15, 23, 42, 0.85)',
                    backdropFilter: 'blur(4px)',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                  }}
                >
                  <div style={{ color: '#38bdf8', fontSize: '0.82rem', fontWeight: 800 }}>
                    🩺 Dr. V. Anitha Rao, MDS
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '0.70rem' }}>
                    Oral Oncologist · DH Paderu (Master Hub)
                  </div>
                </div>

                <div
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    background: '#0284c7',
                    color: '#ffffff',
                  }}
                >
                  ● SPECIALIST HOST · 1080p
                </div>
              </div>
            )}

            {/* Stream 2: Primary Patient (Rambabu or Active Patient) */}
            {(!spotlightId || spotlightId === 'patient-primary') && (
              <div
                style={{
                  position: 'relative',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  background: '#0f172a',
                  border: '1.5px solid rgba(148, 163, 184, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '260px',
                }}
              >
                {isHardwareCamera ? (
                  <video
                    ref={patientVideoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
                    }}
                  />
                ) : (
                  <canvas
                    ref={patientCanvasRef}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                )}

                {/* Patient Dynamic Identity Badge */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '10px',
                    left: '10px',
                    background: 'rgba(15, 23, 42, 0.85)',
                    backdropFilter: 'blur(4px)',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(34, 197, 94, 0.4)',
                  }}
                >
                  <div style={{ color: '#4ade80', fontSize: '0.82rem', fontWeight: 800 }}>
                    👤 {activePatientName} ({activeAge}Y / {activeSex})
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '0.70rem' }}>
                    MAA-UIDN: {activeUidn} · {activePhc}
                  </div>
                </div>

                {/* Hardware Camera Status Badge */}
                <div
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    background: isHardwareCamera ? '#065f46' : '#854d0e',
                    color: '#ffffff',
                  }}
                >
                  {isHardwareCamera ? '● WEBCAM ACTIVE' : '● SIMULATED ENDOSCOPY'}
                </div>
              </div>
            )}

            {/* Additional Invited Participants Tiles */}
            {participants
              .filter((p) => p.id !== 'doctor-anitha' && p.id !== 'patient-primary')
              .map((p) => {
                if (spotlightId && spotlightId !== p.id) return null
                return (
                  <div
                    key={p.id}
                    style={{
                      position: 'relative',
                      borderRadius: '14px',
                      overflow: 'hidden',
                      background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                      border: '1.5px solid rgba(148, 163, 184, 0.3)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: '260px',
                      padding: '20px',
                    }}
                  >
                    {/* Participant Avatar & Live Audio Waveform */}
                    <div
                      style={{
                        width: '74px',
                        height: '74px',
                        borderRadius: '50%',
                        background:
                          p.role === 'ASHA_WORKER'
                            ? 'linear-gradient(135deg, #ec4899, #be185d)'
                            : p.role === 'MEDICAL_OFFICER'
                              ? 'linear-gradient(135deg, #0284c7, #0369a1)'
                              : 'linear-gradient(135deg, #f59e0b, #d97706)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.8rem',
                        color: '#ffffff',
                        boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
                        marginBottom: '10px',
                      }}
                    >
                      {p.role === 'ASHA_WORKER' ? '👩‍⚕️' : p.role === 'MEDICAL_OFFICER' ? '🩺' : '👥'}
                    </div>

                    <div style={{ color: '#ffffff', fontWeight: 800, fontSize: '0.92rem' }}>{p.name}</div>
                    <div style={{ color: '#94a3b8', fontSize: '0.74rem' }}>{p.title}</div>

                    {/* Animated speaking audio waves */}
                    <div style={{ display: 'flex', gap: '3px', marginTop: '12px', alignItems: 'center' }}>
                      <span style={{ width: '3px', height: '14px', background: '#22c55e', borderRadius: '2px', animation: 'pulse 1s infinite' }} />
                      <span style={{ width: '3px', height: '22px', background: '#22c55e', borderRadius: '2px', animation: 'pulse 1.2s infinite' }} />
                      <span style={{ width: '3px', height: '10px', background: '#22c55e', borderRadius: '2px', animation: 'pulse 0.8s infinite' }} />
                      <span style={{ width: '3px', height: '18px', background: '#22c55e', borderRadius: '2px', animation: 'pulse 1.1s infinite' }} />
                    </div>

                    {/* Bottom overlay badge */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '10px',
                        left: '10px',
                        background: 'rgba(15, 23, 42, 0.85)',
                        backdropFilter: 'blur(4px)',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: '1px solid rgba(148, 163, 184, 0.4)',
                        fontSize: '0.68rem',
                        color: '#cbd5e1',
                      }}
                    >
                      📍 {p.location}
                    </div>

                    {/* Action: Remove or Disconnect Participant */}
                    <button
                      type="button"
                      onClick={() => handleRemoveParticipant(p.id)}
                      title="Disconnect Participant"
                      style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        background: 'rgba(239, 68, 68, 0.2)',
                        border: '1px solid #ef4444',
                        color: '#f87171',
                        borderRadius: '6px',
                        padding: '3px 8px',
                        fontSize: '0.70rem',
                        cursor: 'pointer',
                        fontWeight: 700,
                      }}
                    >
                      ✕ Remove
                    </button>
                  </div>
                )
              })}
          </div>

          {/* Spotlight reset button if active */}
          {spotlightId && (
            <div style={{ textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => setSpotlightId(null)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  background: '#1e293b',
                  color: '#38bdf8',
                  border: '1px solid #38bdf8',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                ✦ Exit Spotlight (Show All {participants.length} Participants)
              </button>
            </div>
          )}

          {/* Interactive Controls Toolbar */}
          <div
            style={{
              display: 'flex',
              gap: '10px',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '12px 18px',
              background: '#ffffff',
              borderRadius: '16px',
              border: '1.5px solid #e2e8f0',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
              flexWrap: 'wrap',
            }}
          >
            {/* Mic Toggle */}
            <button
              type="button"
              onClick={handleToggleMic}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '10px',
                border: '1.5px solid',
                borderColor: micMuted ? '#ef4444' : '#cbd5e1',
                background: micMuted ? '#fee2e2' : '#f8fafc',
                color: micMuted ? '#b91c1c' : '#1e293b',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              <span>{micMuted ? '🔇' : '🎤'}</span>
              <span>{micMuted ? 'Unmute' : 'Mute'}</span>
            </button>

            {/* Video Camera Toggle */}
            <button
              type="button"
              onClick={handleToggleVideo}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '10px',
                border: '1.5px solid',
                borderColor: videoMuted ? '#ef4444' : '#cbd5e1',
                background: videoMuted ? '#fee2e2' : '#f8fafc',
                color: videoMuted ? '#b91c1c' : '#1e293b',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              <span>{videoMuted ? '🚫' : '📹'}</span>
              <span>{videoMuted ? 'Cam Off' : 'Cam On'}</span>
            </button>

            {/* Flip Camera */}
            <button
              type="button"
              onClick={handleFlipCamera}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '10px',
                border: '1.5px solid #cbd5e1',
                background: '#f8fafc',
                color: '#1e293b',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              <span>🔄</span>
              <span>Flip Cam</span>
            </button>

            {/* Snapshot Capture */}
            <button
              type="button"
              onClick={handleCaptureSnapshot}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '10px',
                border: '1.5px solid #d97706',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.82rem',
                cursor: 'pointer',
                boxShadow: '0 4px 10px rgba(217, 119, 6, 0.25)',
              }}
            >
              <span>📸</span>
              <span>Capture Snapshot</span>
            </button>

            {/* Share Room Link Button */}
            <button
              type="button"
              onClick={() => setShowShareModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '10px',
                border: '1.5px solid #2563eb',
                background: '#eff6ff',
                color: '#1d4ed8',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              <span>🔗</span>
              <span>Share Call Link</span>
            </button>

            {/* Call Monitoring Menu Button */}
            <button
              type="button"
              onClick={() => setShowMonitoringMenu(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '10px',
                border: '1.5px solid #0284c7',
                background: '#f0f9ff',
                color: '#0369a1',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              <span>📊</span>
              <span>Monitoring Menu</span>
            </button>
          </div>

          {/* Captured Snapshot Thumbnail Preview Bar */}
          {capturedSnapshot && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '12px 16px',
                background: '#f0fdf4',
                border: '1.5px solid #86efac',
                borderRadius: '12px',
              }}
            >
              <img
                src={capturedSnapshot}
                alt="Captured Lesion Preview"
                style={{ width: '70px', height: '50px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #16a34a' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ color: '#166534', fontWeight: 800, fontSize: '0.84rem' }}>
                  ✓ Oral Lesion Snapshot Captured for {activePatientName} ({snapshotTimestamp})
                </div>
                <div style={{ color: '#15803d', fontSize: '0.74rem' }}>
                  Auto-attached to patient clinical review &amp; Gemini AI observation payload
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCapturedSnapshot(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#15803d',
                  fontSize: '1.2rem',
                  cursor: 'pointer',
                }}
              >
                ×
              </button>
            </div>
          )}
        </div>

        {/* Right Panel: Gemini AI Observation & Active Digital Prescription */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '20px',
            border: '2px solid #e2e8f0',
            padding: '20px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.06)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {/* Gemini AI Lesion Finding Card */}
          <div
            style={{
              padding: '14px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
              border: '1.5px solid #93c5fd',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#1e40af', textTransform: 'uppercase' }}>
                ✦ GEMINI VISION AI FINDINGS
              </span>
              <span
                style={{
                  fontSize: '0.74rem',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  background: '#1d4ed8',
                  color: '#ffffff',
                  fontWeight: 800,
                }}
              >
                94.2% CONFIDENCE
              </span>
            </div>
            <h4 style={{ margin: '6px 0 2px', fontSize: '0.98rem', color: '#1e3a8a' }}>
              Stage II Homogeneous Leukoplakia (OPMD)
            </h4>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#3b82f6' }}>
              Site: Right Buccal Mucosa · Trismus: 24mm · Biopsy Recommended
            </p>
          </div>

          {/* Clinical Consultation Notes */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.76rem',
                fontWeight: 800,
                color: '#475569',
                marginBottom: '6px',
                textTransform: 'uppercase',
              }}
            >
              Doctor Consultation Notes ({activePatientName}):
            </label>
            <textarea
              rows={3}
              value={consultationNotes}
              onChange={(e) => setConsultationNotes(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1.5px solid #cbd5e1',
                fontSize: '0.80rem',
                lineHeight: 1.45,
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Active Prescriptions Table */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.76rem',
                fontWeight: 800,
                color: '#475569',
                marginBottom: '6px',
                textTransform: 'uppercase',
              }}
            >
              Prescribed Oral Medications (3 Drugs):
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {medications.map((med, idx) => (
                <div
                  key={med.id}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '0.82rem', color: '#0f172a' }}>
                      {idx + 1}. {med.name}
                    </strong>
                    <span style={{ fontSize: '0.70rem', color: '#64748b', fontWeight: 600 }}>{med.duration}</span>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#475569', marginTop: '2px' }}>{med.dose}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Medical Drone Delivery Dispatch Checkbox */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 12px',
              background: '#fef3c7',
              borderRadius: '10px',
              border: '1px solid #fde68a',
            }}
          >
            <input
              type="checkbox"
              id="drone-dispatch"
              checked={routeToDroneDelivery}
              onChange={(e) => setRouteToDroneDelivery(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: '#d97706' }}
            />
            <label htmlFor="drone-dispatch" style={{ fontSize: '0.78rem', color: '#92400e', fontWeight: 700, cursor: 'pointer' }}>
              🚁 Auto-dispatch medication payload via BVLOS Medical Drone to {activePhc}
            </label>
          </div>

          {/* Next Action Referral Choice */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.76rem',
                fontWeight: 800,
                color: '#475569',
                marginBottom: '6px',
                textTransform: 'uppercase',
              }}
            >
              Next Clinical Protocol:
            </label>
            <select
              value={nextAction}
              onChange={(e) => setNextAction(e.target.value as typeof nextAction)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '10px',
                border: '1.5px solid #cbd5e1',
                fontSize: '0.82rem',
                fontWeight: 600,
                outline: 'none',
              }}
            >
              <option value="URGENT_BIOPSY_REFERRAL">Urgent Biopsy Referral (District Hospital Paderu / 3-PHC Circuit)</option>
              <option value="LOCAL_PHC_FOLLOWUP">Local PHC Follow-up (14 Days Re-examination)</option>
              <option value="DISCHARGE">Discharge with Preventative Counseling</option>
            </select>
          </div>

          {/* Primary Action: Conclude & Generate Signed Prescription */}
          <button
            type="button"
            onClick={handleConcludeConsultation}
            disabled={!canConclude || isConcluding}
            style={{
              padding: '14px 20px',
              borderRadius: '12px',
              background: !canConclude ? '#94a3b8' : 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
              color: '#ffffff',
              fontSize: '0.90rem',
              fontWeight: 800,
              border: 'none',
              cursor: !canConclude || isConcluding ? 'not-allowed' : 'pointer',
              boxShadow: !canConclude ? 'none' : '0 6px 16px rgba(22, 163, 74, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: 'auto',
            }}
          >
            <span>✍️</span>
            <span>
              {isConcluding
                ? 'Signing & Encrypting...'
                : 'Conclude Consultation & Generate Signed Digital Prescription'}
            </span>
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. SHARE LINK & INVITE DIFFERENT MEMBERS MODAL */}
      {/* ==================================================================== */}
      {showShareModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '24px',
              padding: '28px',
              maxWidth: '580px',
              width: '100%',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.35)',
              border: '2px solid #e2e8f0',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #f1f5f9', paddingBottom: '14px' }}>
              <div>
                <span style={{ fontSize: '0.70rem', fontWeight: 800, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  🔗 ENCRYPTED ROOM INVITE
                </span>
                <h3 style={{ margin: '4px 0 0', fontSize: '1.25rem', color: '#0f172a' }}>
                  Share Video Call Link &amp; Invite Members
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.80rem', color: '#64748b' }}>
                  Allow family members, local ASHA worker, or specialists to join {activePatientName}&apos;s consultation room.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#94a3b8' }}
              >
                ×
              </button>
            </div>

            <div style={{ marginTop: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#475569', marginBottom: '6px' }}>
                DIRECT WEBRTC JOIN LINK:
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.80rem',
                    background: '#f8fafc',
                    color: '#334155',
                    fontFamily: 'monospace',
                  }}
                />
                <button
                  type="button"
                  onClick={handleCopyShareLink}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '10px',
                    background: shareCopied ? '#16a34a' : '#2563eb',
                    border: 'none',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {shareCopied ? '✓ Copied!' : '📋 Copy Link'}
                </button>
              </div>

              {/* Instant Social / Mobile Sharing Buttons */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Aarogya Drishti Live Video Consultation with Specialist Dr. V. Anitha Rao for patient ${activePatientName}. Join here: ${shareUrl}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '9px 14px',
                    borderRadius: '10px',
                    background: '#25D366',
                    color: '#ffffff',
                    fontSize: '0.80rem',
                    fontWeight: 700,
                    textDecoration: 'none',
                  }}
                >
                  <span>💬</span>
                  <span>Share on WhatsApp</span>
                </a>
                <button
                  type="button"
                  onClick={() => void handleNativeShare()}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '9px 14px',
                    borderRadius: '10px',
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    color: '#334155',
                    fontSize: '0.80rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <span>📢</span>
                  <span>More Sharing Options</span>
                </button>
              </div>

              {/* Fast 1-Click Instant Add Member to Active Call */}
              <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1e3a8a', marginBottom: '8px' }}>
                  ⚡ ONE-CLICK ADD ROSTER MEMBERS TO LIVE VIDEO CALL:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      handleAddParticipant('Smt. Pangi Lakshmi', 'ASHA_WORKER', 'Local ASHA Health Worker', `${activePhc} Spoke`)
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: '#fdf2f8',
                      border: '1px solid #fbcfe8',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '0.82rem', color: '#9d174d' }}>👩‍⚕️ Smt. Pangi Lakshmi</strong>
                      <div style={{ fontSize: '0.72rem', color: '#be185d' }}>ASHA Health Worker · {activePhc}</div>
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#be185d' }}>+ Add to Call</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleAddParticipant(`${activePatientName} కుటుంబ సభ్యులు (Caregiver)`, 'FAMILY_MEMBER', 'Family Member / Caregiver', 'Patient Residence')
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: '#fef3c7',
                      border: '1px solid #fde68a',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '0.82rem', color: '#92400e' }}>👥 {activePatientName} కుటుంబ సభ్యులు (Family Attendant)</strong>
                      <div style={{ fontSize: '0.72rem', color: '#b45309' }}>Authorized Family Member / Caregiver</div>
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#b45309' }}>+ Add to Call</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleAddParticipant('Dr. Suresh Kumar, MBBS', 'MEDICAL_OFFICER', 'PHC Medical Officer', `${activePhc}`)
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: '#eff6ff',
                      border: '1px solid #bfdbfe',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '0.82rem', color: '#1e40af' }}>🩺 Dr. Suresh Kumar, MBBS</strong>
                      <div style={{ fontSize: '0.72rem', color: '#2563eb' }}>Medical Officer · {activePhc}</div>
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563eb' }}>+ Add to Call</span>
                  </button>
                </div>

                {/* Custom Guest Name Add */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <input
                    type="text"
                    placeholder="Or enter custom guest name (e.g. Ramesh)"
                    value={customGuestName}
                    onChange={(e) => setCustomGuestName(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.80rem',
                    }}
                  />
                  <select
                    value={customGuestRole}
                    onChange={(e) => setCustomGuestRole(e.target.value as typeof customGuestRole)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.78rem',
                    }}
                  >
                    <option value="FAMILY_MEMBER">Family Member</option>
                    <option value="ASHA_WORKER">Health Volunteer</option>
                    <option value="MEDICAL_OFFICER">Doctor / Nurse</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      if (!customGuestName.trim()) return
                      handleAddParticipant(
                        customGuestName.trim(),
                        customGuestRole,
                        customGuestRole === 'FAMILY_MEMBER' ? 'Family Attendee' : 'Remote Clinician',
                        'Remote Spoke',
                      )
                      setCustomGuestName('')
                    }}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      background: '#0f172a',
                      color: '#ffffff',
                      fontSize: '0.80rem',
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    + Add
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                style={{
                  padding: '9px 20px',
                  borderRadius: '10px',
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  color: '#334155',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 3. DEDICATED VIDEO CALL MONITORING & WEBRTC DIAGNOSTICS MENU */}
      {/* ==================================================================== */}
      {showMonitoringMenu && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.78)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '24px',
              padding: '28px',
              maxWidth: '680px',
              width: '100%',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.4)',
              border: '2px solid #cbd5e1',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #f1f5f9', paddingBottom: '14px' }}>
              <div>
                <span style={{ fontSize: '0.70rem', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  📊 REAL-TIME WEBRTC DIAGNOSTICS &amp; MONITORING
                </span>
                <h3 style={{ margin: '4px 0 0', fontSize: '1.25rem', color: '#0f172a' }}>
                  Video Call Monitoring &amp; Session Audit
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.80rem', color: '#64748b' }}>
                  Live carrier-grade diagnostics, low-bandwidth tribal adaptation, and MoHFW telemedicine compliance.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowMonitoringMenu(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#94a3b8' }}
              >
                ×
              </button>
            </div>

            {/* Live WebRTC Telemetry Status Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginTop: '18px' }}>
              <div style={{ padding: '12px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                  ⏱ Latency / RTT
                </span>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#16a34a', marginTop: '2px' }}>
                  24 ms
                </div>
                <div style={{ fontSize: '0.68rem', color: '#15803d' }}>● Ultra-low Latency</div>
              </div>

              <div style={{ padding: '12px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                  🖥 Video Quality
                </span>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0284c7', marginTop: '2px' }}>
                  {lowBandwidthMode ? '360p Adaptive' : '1080p FHD'}
                </div>
                <div style={{ fontSize: '0.68rem', color: '#0369a1' }}>
                  {lowBandwidthMode ? '15 FPS (Eco)' : '30 FPS (Lossless)'}
                </div>
              </div>

              <div style={{ padding: '12px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                  📊 Audio / Video Bitrate
                </span>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#7c3aed', marginTop: '2px' }}>
                  {lowBandwidthMode ? '320 kbps' : '2,480 kbps'}
                </div>
                <div style={{ fontSize: '0.68rem', color: '#6d28d9' }}>Opus 64 kbps (Voice)</div>
              </div>

              <div style={{ padding: '12px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                  🔒 Encryption &amp; Loss
                </span>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#059669', marginTop: '2px' }}>
                  0.00%
                </div>
                <div style={{ fontSize: '0.68rem', color: '#047857' }}>AES-256 GCM (E2EE)</div>
              </div>
            </div>

            {/* Tribal Forest Bandwidth Adaptation Controls */}
            <div
              style={{
                marginTop: '16px',
                padding: '14px',
                borderRadius: '14px',
                background: lowBandwidthMode ? '#fef3c7' : '#f0fdf4',
                border: lowBandwidthMode ? '1.5px solid #fde68a' : '1.5px solid #bbf7d0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '14px',
              }}
            >
              <div>
                <strong style={{ fontSize: '0.84rem', color: lowBandwidthMode ? '#92400e' : '#166534' }}>
                  🌲 Low-Bandwidth Mode for Remote ITDA Tribal Corridors
                </strong>
                <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: lowBandwidthMode ? '#b45309' : '#15803d' }}>
                  Prioritizes voice clarity during forest cellular drops in Koyyuru, Chintapalli, and G. Madugula.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const next = !lowBandwidthMode
                  setLowBandwidthMode(next)
                  speakBujjiTeluguVoice(
                    next
                      ? 'తక్కువ బ్యాండ్‌విడ్త్ మోడ్ ఆన్ చేయబడింది. అడవి ప్రాంతాల్లో ఆడియో స్పష్టంగా ఉంటుంది.'
                      : 'హై-డెఫినిషన్ బ్రాడ్‌బ్యాండ్ మోడ్ ప్రారంభించబడింది.',
                    'TE',
                  )
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '10px',
                  background: lowBandwidthMode ? '#d97706' : '#16a34a',
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.80rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {lowBandwidthMode ? '✓ Low-Data ON' : '⚡ Switch to Low-Data'}
              </button>
            </div>

            {/* Live Audio Decibel Waveform Visualizer */}
            <div style={{ marginTop: '16px', padding: '14px', borderRadius: '12px', background: '#0f172a', color: '#ffffff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#38bdf8' }}>
                  🎙 ACTIVE AUDIO SIGNAL &amp; VU LEVEL METER
                </span>
                <span style={{ fontSize: '0.70rem', color: '#4ade80' }}>● Mic Signal: -18 dB (Nominal)</span>
              </div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end', height: '32px' }}>
                {[30, 65, 80, 45, 90, 75, 50, 85, 40, 70, 95, 60].map((h, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      height: `${h}%`,
                      background: h > 85 ? '#f87171' : h > 60 ? '#facc15' : '#4ade80',
                      borderRadius: '3px',
                      transition: 'height 0.15s ease',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Connected Participants Active Moderation Roster */}
            <div style={{ marginTop: '16px' }}>
              <h4 style={{ margin: '0 0 8px', fontSize: '0.84rem', color: '#0f172a' }}>
                👥 Connected Call Participants ({participants.length}):
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {participants.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      fontSize: '0.80rem',
                    }}
                  >
                    <div>
                      <strong>{p.name}</strong>
                      <span style={{ marginLeft: '6px', fontSize: '0.70rem', color: '#64748b' }}>({p.title})</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.70rem', color: '#16a34a', fontWeight: 700 }}>● Active</span>
                      <button
                        type="button"
                        onClick={() => setSpotlightId(spotlightId === p.id ? null : p.id)}
                        style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: spotlightId === p.id ? '#0284c7' : '#f1f5f9',
                          color: spotlightId === p.id ? '#ffffff' : '#334155',
                          border: '1px solid #cbd5e1',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {spotlightId === p.id ? '★ In Spotlight' : 'Spotlight'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Regulatory Compliance & Session Record */}
            <div style={{ marginTop: '16px', padding: '12px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '0.74rem', color: '#475569' }}>
              <div>• Session Audit Token: <code>TC-ASR-20261111-9482</code></div>
              <div>• MoHFW National Telemedicine Guidelines 2020: <strong>COMPLIANT</strong></div>
              <div>• Patient Consent Recorded: <strong>VERIFIED DIGITAL AFFIRMATION</strong></div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '18px' }}>
              <button
                type="button"
                onClick={() => setShowMonitoringMenu(false)}
                style={{
                  padding: '9px 22px',
                  borderRadius: '10px',
                  background: '#0f172a',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Close Monitoring Console
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 4. SIGNED DIGITAL PRESCRIPTION MODAL */}
      {/* ==================================================================== */}
      {showSignedModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '24px',
              padding: '28px',
              maxWidth: '600px',
              width: '100%',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.35)',
              border: '2px solid #e2e8f0',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #f1f5f9', paddingBottom: '14px' }}>
              <div>
                <span style={{ fontSize: '0.70rem', fontWeight: 800, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  ✓ OFFICIAL TELEMEDICINE Rx
                </span>
                <h3 style={{ margin: '4px 0 0', fontSize: '1.2rem', color: '#0f172a' }}>
                  Digital Prescription &amp; Clinical Order
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSignedModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#94a3b8' }}
              >
                ×
              </button>
            </div>

            <div style={{ margin: '16px 0', fontSize: '0.85rem', color: '#334155', lineHeight: 1.6 }}>
              <p>
                Patient: <strong>{activePatientName}</strong> ({activeAge}Y / {activeSex}) · MAA-UIDN: <code>{activeUidn}</code> · {activePhc}
              </p>
              <p>
                Prescribing Oncologist: <strong>Dr. V. Anitha Rao, MDS</strong> · APMC Reg: <code>APMC-2018-84920</code>
              </p>
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', margin: '10px 0' }}>
                <strong>Rx Medications:</strong>
                <ol style={{ margin: '6px 0 0', paddingLeft: '20px' }}>
                  {medications.map((m) => (
                    <li key={m.id}>
                      <strong>{m.name}</strong> — {m.dose} ({m.duration})
                    </li>
                  ))}
                </ol>
              </div>
              <p>
                Next Step: <strong>{nextAction.replaceAll('_', ' ')}</strong>
                {routeToDroneDelivery && ` · 🚁 Drone delivery queued to ${activePhc}.`}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => window.print()}
                style={{
                  padding: '10px 18px',
                  borderRadius: '10px',
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  color: '#334155',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                }}
              >
                🖨️ Print Rx Slip
              </button>
              {onGeneratePrescription && (
                <button
                  type="button"
                  onClick={() => {
                    setShowSignedModal(false)
                    onGeneratePrescription()
                  }}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '10px',
                    background: '#0284c7',
                    border: 'none',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                  }}
                >
                  📄 View in Prescriptions
                </button>
              )}
              {onOrderBiopsy && nextAction === 'URGENT_BIOPSY_REFERRAL' && (
                <button
                  type="button"
                  onClick={() => {
                    setShowSignedModal(false)
                    onOrderBiopsy()
                  }}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '10px',
                    background: '#dc2626',
                    border: 'none',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                  }}
                >
                  🔬 Schedule Biopsy Now
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setShowSignedModal(false)
                  onClose?.()
                }}
                style={{
                  padding: '10px 22px',
                  borderRadius: '10px',
                  background: '#16a34a',
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
