import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Heart,
  Activity,
  FileText,
  ShieldCheck,
  CheckCircle,
  Plus,
  Trash2,
  Calendar,
  AlertTriangle,
  QrCode,
  UserCheck,
  Stethoscope,
  Radio,
  Copy,
  Check,
  Laptop,
  Users
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import api from '../services/api.ts';
import { Language, translations } from '../i18n/translations.ts';

interface WebRTCTelemedicineRoomProps {
  patient: any;
  doctor?: any;
  lang: Language;
  onClose: () => void;
  onPrescriptionCreated?: (prescription: any) => void;
}

export const WebRTCTelemedicineRoom: React.FC<WebRTCTelemedicineRoomProps> = ({
  patient,
  doctor = {
    name: 'Dr. Swapna Devi, MDS',
    designation: 'Chief Onco-Pathologist & Lead Tele-Consultant',
    hospitalDuty: 'PHC G. Madugula / GGH Paderu Tele-Lab Hub',
    uidn: 'DOC-SWAPNA'
  },
  lang,
  onClose,
  onPrescriptionCreated
}) => {
  const t = translations[lang];

  // Video stream refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Room & Connection States
  const [roomId, setRoomId] = useState(`room-${patient?.uidn || 'UIDN-ASR-2026-GM046'}`);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('Initializing WebRTC...');
  const [peerConnected, setPeerConnected] = useState(false);
  const [remoteStreamAvailable, setRemoteStreamAvailable] = useState(false);

  // Clinical Documentation States
  const [clinicalNotes, setClinicalNotes] = useState(
    'Patient presents with persistent non-scrapable white patch in right buccal pouch. History of 18-yr reverse smoking. Margins indurated. AI Onco-triage index: 92.4% urgent leukoplakia. Diagnostic 4mm punch biopsy required.'
  );

  const [biopsyScheduled, setBiopsyScheduled] = useState(true);
  const [biopsyDetails, setBiopsyDetails] = useState('4mm Diagnostic punch biopsy under local anesthesia at PHC G. Madugula / Area Hospital Paderu.');

  const [medicines, setMedicines] = useState([
    {
      name: 'Antioxidant & Lycopene 8mg Capsules',
      dosage: '1 capsule',
      frequency: 'Twice daily after meals',
      duration: '30 days',
      instructions: 'Swallow whole with warm water'
    },
    {
      name: 'Kenacort 0.1% Oral Mucosal Paste',
      dosage: 'Pea-sized dab',
      frequency: 'Thrice daily after food',
      duration: '14 days',
      instructions: 'Apply gently over cheek lesion'
    },
    {
      name: 'Chlorhexidine 0.2% Antiseptic Rinse',
      dosage: '10 ml',
      frequency: 'Twice daily',
      duration: '14 days',
      instructions: 'Swish for 60 seconds and spit'
    }
  ]);

  const [createdPrescription, setCreatedPrescription] = useState<any>(null);
  const [savingPrescription, setSavingPrescription] = useState(false);

  // STUN Servers configuration for real P2P NAT traversal
  const iceServers: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' }
    ]
  };

  useEffect(() => {
    let isMounted = true;

    const initWebRTC = async () => {
      try {
        // 1. Acquire Local Camera & Microphone Stream
        let stream: MediaStream | null = null;
        try {
          if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            stream = await navigator.mediaDevices.getUserMedia({
              video: { width: { ideal: 640 }, height: { ideal: 480 } },
              audio: true
            });
            localStreamRef.current = stream;
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = stream;
              localVideoRef.current.play().catch(() => {});
            }
          }
        } catch (mediaErr) {
          console.warn('[WebRTC] Camera access declined or unavailable, running preview fallback:', mediaErr);
        }

        // 2. Connect to Socket.io Signaling Engine
        const socketUrl = (import.meta as any).env?.VITE_SOCKET_URL || 'https://aarogya-drishti-9g70.onrender.com';
        const socket = io(socketUrl, {
          transports: ['websocket', 'polling'],
          reconnectionAttempts: 5
        });
        socketRef.current = socket;

        // 3. Initialize RTCPeerConnection
        const pc = new RTCPeerConnection(iceServers);
        peerConnectionRef.current = pc;

        // Attach local tracks to RTCPeerConnection
        if (stream) {
          stream.getTracks().forEach((track) => {
            pc.addTrack(track, stream!);
          });
        }

        // Handle remote stream incoming tracks
        pc.ontrack = (event) => {
          console.log('[WebRTC] Received remote stream track:', event.streams[0]);
          if (remoteVideoRef.current && event.streams[0]) {
            remoteVideoRef.current.srcObject = event.streams[0];
            remoteVideoRef.current.play().catch(() => {});
            setRemoteStreamAvailable(true);
            setPeerConnected(true);
            setConnectionStatus('Live P2P Connected (Two Systems Active)');
          }
        };

        // Handle ICE Candidates generated locally
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit('ice-candidate', {
              roomId,
              candidate: event.candidate
            });
          }
        };

        pc.onconnectionstatechange = () => {
          console.log('[WebRTC] Connection state changed:', pc.connectionState);
          if (pc.connectionState === 'connected') {
            setPeerConnected(true);
            setConnectionStatus('Live P2P Connected (<20ms)');
          } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
            setPeerConnected(false);
            setConnectionStatus('Waiting for Remote Peer / Simulated Specialist Active');
          }
        };

        // 4. Socket Signaling Event Handlers
        socket.on('connect', () => {
          console.log(`[WebRTC Socket] Connected as ${socket.id}, joining room ${roomId}`);
          setConnectionStatus('Signaling Active • Room Joined');
          socket.emit('join-room', roomId, {
            name: doctor?.name || patient?.name,
            uidn: doctor?.uidn || patient?.uidn,
            role: doctor?.uidn ? 'doctor' : 'patient'
          });
        });

        // Peer Joined: This peer will initiate offer
        socket.on('user-connected', async ({ socketId, userDetails }) => {
          console.log(`[WebRTC] Peer joined room: ${socketId}`, userDetails);
          setPeerConnected(true);
          setConnectionStatus('Peer Detected • Creating Handshake Offer...');
          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit('offer', { roomId, offer, senderDetails: { name: 'Aarogya Specialist' } });
            socket.emit('signal-offer', { roomId, targetSocketId: socketId, offer });
          } catch (offerErr) {
            console.error('[WebRTC] Error creating offer:', offerErr);
          }
        });

        // Receiving Offer
        const handleOffer = async (data: any) => {
          console.log('[WebRTC] Received offer from peer:', data);
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('answer', { roomId, answer });
            if (data.senderSocketId) {
              socket.emit('signal-answer', { roomId, targetSocketId: data.senderSocketId, answer });
            }
            setPeerConnected(true);
            setConnectionStatus('Offer Accepted • Handshake Complete');
          } catch (answerErr) {
            console.error('[WebRTC] Error handling offer:', answerErr);
          }
        };
        socket.on('offer', handleOffer);
        socket.on('signal-offer', handleOffer);

        // Receiving Answer
        const handleAnswer = async (data: any) => {
          console.log('[WebRTC] Received answer from peer:', data);
          try {
            if (pc.signalingState !== 'stable') {
              await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
              setPeerConnected(true);
              setConnectionStatus('Live P2P Connected (Encrypted)');
            }
          } catch (ansErr) {
            console.error('[WebRTC] Error setting remote answer:', ansErr);
          }
        };
        socket.on('answer', handleAnswer);
        socket.on('signal-answer', handleAnswer);

        // Receiving ICE Candidate
        socket.on('ice-candidate', async (data: any) => {
          try {
            if (data.candidate && pc.remoteDescription) {
              await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
            }
          } catch (iceErr) {
            console.warn('[WebRTC] Error adding ICE candidate:', iceErr);
          }
        });

        socket.on('user-disconnected', () => {
          setPeerConnected(false);
          setRemoteStreamAvailable(false);
          setConnectionStatus('Peer Left • Simulated Specialist Active');
        });
      } catch (err) {
        console.error('[WebRTC] General initialization error:', err);
        setConnectionStatus('Simulated Specialist Stream Active (Demo Mode)');
      }
    };

    initWebRTC();

    return () => {
      isMounted = false;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [roomId]);

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = isMuted;
      });
    }
  };

  const toggleVideo = () => {
    setIsVideoOff(!isVideoOff);
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = isVideoOff;
      });
    }
  };

  const handleEndCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    onClose();
  };

  const handleCopyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleAddMedicine = () => {
    setMedicines([
      ...medicines,
      {
        name: 'Beta-Carotene & Multivitamin Softgels',
        dosage: '1 capsule',
        frequency: 'Daily once',
        duration: '30 days',
        instructions: 'After breakfast'
      }
    ]);
  };

  const handleRemoveMedicine = (index: number) => {
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const handleSavePrescription = async () => {
    setSavingPrescription(true);
    try {
      const payload = {
        patientUidn: patient.uidn,
        doctorUidn: doctor.uidn,
        medicines,
        biopsyRecommended: biopsyScheduled,
        biopsyProcedureDetails: biopsyScheduled ? biopsyDetails : undefined,
        trackingStatus: biopsyScheduled ? 'Biopsy Scheduled' : 'Prescription Dispensed',
        clinicalNotes
      };

      const res = await api.createPrescription(payload);
      setCreatedPrescription(res.prescription);
      if (onPrescriptionCreated) {
        onPrescriptionCreated(res.prescription);
      }
      alert('Prescription successfully saved & linked to patient record with verified barcode!');
    } catch (err: any) {
      alert(`Error saving prescription: ${err.message}`);
    } finally {
      setSavingPrescription(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-7xl rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Top Header (Crisp Medical White & Royal Blue) */}
        <div className="bg-royal-700 text-white px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-royal-800">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <Radio className="w-4 h-4 text-emerald-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-sm tracking-wide">
                  Live WebRTC Telemedicine Consultation
                </h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-200 font-mono px-2 py-0.5 rounded-full border border-emerald-400/40">
                  {connectionStatus}
                </span>
              </div>
              <p className="text-[11px] text-blue-100">
                Peer-to-Peer Encrypted Tele-Oncology Network • ITDA Paderu
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Room ID Pill & 1-Click Copy for 2nd Laptop */}
            <div className="flex items-center space-x-1.5 bg-royal-800/80 px-3 py-1 rounded-xl text-xs border border-royal-600">
              <Laptop className="w-3.5 h-3.5 text-blue-200" />
              <span className="text-blue-200 font-mono text-[11px]">Room:</span>
              <span className="font-mono font-bold text-white text-[11px]">{roomId}</span>
              <button
                onClick={handleCopyRoomId}
                className="p-1 hover:bg-royal-700 rounded text-blue-200 hover:text-white transition-colors"
                title="Copy Room ID to join from second laptop/tab"
              >
                {copiedLink ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>

            <button
              onClick={handleEndCall}
              className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-sm"
            >
              <PhoneOff className="w-3.5 h-3.5" />
              <span>{t.endCall}</span>
            </button>
          </div>
        </div>

        {/* Patient Vitals & Clinical Context Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-800">
          <div className="flex items-center space-x-4">
            <span className="font-extrabold flex items-center space-x-1.5 text-slate-900">
              <UserCheck className="w-4 h-4 text-royal-600" />
              <span>{patient.name} ({patient.uidn})</span>
            </span>
            <span>Age: <strong className="text-slate-900">{patient.age} Yrs</strong></span>
            <span>Mandal: <strong className="text-slate-900">{patient.mandal}</strong></span>
            <span>Village: <strong className="text-slate-900">{patient.village}</strong></span>
          </div>

          <div className="flex items-center space-x-4 font-mono text-[11px]">
            <span className="flex items-center space-x-1 text-red-700 font-bold bg-white px-2.5 py-0.5 rounded-full border border-red-200 shadow-sm">
              <Heart className="w-3 h-3 text-red-500 animate-pulse" />
              <span>BP: 128/84</span>
            </span>
            <span className="flex items-center space-x-1 text-emerald-800 font-bold bg-white px-2.5 py-0.5 rounded-full border border-emerald-200 shadow-sm">
              <Activity className="w-3 h-3 text-emerald-600" />
              <span>SpO2: 98%</span>
            </span>
            <span className="bg-yellow-100 text-slate-900 px-2.5 py-0.5 rounded-full font-sans font-bold border border-yellow-300">
              Habit: 18-Yr Chewing Tobacco
            </span>
          </div>
        </div>

        {/* Main Body: Video Panes (Left) & Clinical Documentation (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden">
          {/* LEFT: Video Panes (7 Cols) */}
          <div className="lg:col-span-7 p-4 sm:p-6 bg-slate-900 flex flex-col justify-between space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
              {/* Doctor Video Pane (Remote) */}
              <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-700 flex items-center justify-center aspect-[4/3]">
                {/* When real remote stream is connected */}
                <video
                  ref={remoteVideoRef}
                  playsInline
                  autoPlay
                  className={`w-full h-full object-cover ${remoteStreamAvailable ? 'block' : 'hidden'}`}
                />

                {/* Simulated Specialist Stream fallback when 1 system is testing */}
                {!remoteStreamAvailable && (
                  <div className="relative w-full h-full">
                    <img
                      src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=600"
                      alt="Doctor Stream"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  </div>
                )}

                <div className="absolute bottom-3 left-3 z-20 text-white">
                  <div className="text-xs font-bold flex items-center space-x-1.5">
                    <Stethoscope className="w-3.5 h-3.5 text-blue-400" />
                    <span>{doctor.name}</span>
                  </div>
                  <div className="text-[10px] text-slate-300">{doctor.hospitalDuty}</div>
                </div>

                <div className="absolute top-3 right-3 z-20 bg-emerald-600 text-white font-bold text-[9px] px-2.5 py-0.5 rounded-full flex items-center space-x-1 shadow-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  <span>{remoteStreamAvailable ? '2ND LAPTOP LIVE' : 'SPECIALIST ONLINE'}</span>
                </div>
              </div>

              {/* Patient Video Pane (Local / User Stream) */}
              <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-700 flex items-center justify-center aspect-[4/3]">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
                {!isVideoOff ? (
                  <video
                    ref={localVideoRef}
                    playsInline
                    muted
                    autoPlay
                    className="w-full h-full object-cover transform -scale-x-100"
                  />
                ) : (
                  <div className="text-center text-slate-400 space-y-1">
                    <VideoOff className="w-8 h-8 mx-auto" />
                    <div className="text-xs">Camera is Off</div>
                  </div>
                )}

                <div className="absolute bottom-3 left-3 z-20 text-white">
                  <div className="text-xs font-bold">{patient.name} (Local User Feed)</div>
                  <div className="text-[10px] text-slate-300">G. Madugula Agency Unit</div>
                </div>
                <div className="absolute top-3 right-3 z-20 bg-royal-600 text-white font-bold text-[9px] px-2.5 py-0.5 rounded-full shadow-md">
                  LOCAL (YOU)
                </div>
              </div>
            </div>

            {/* In-Call Controls Toolbar */}
            <div className="bg-slate-800/90 backdrop-blur-md rounded-2xl p-3 border border-slate-700 flex items-center justify-center space-x-3">
              <button
                onClick={toggleMute}
                className={`p-3 rounded-xl transition-all ${
                  isMuted ? 'bg-red-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-white'
                }`}
                title={isMuted ? t.unmuteMic : t.muteMic}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              <button
                onClick={toggleVideo}
                className={`p-3 rounded-xl transition-all ${
                  isVideoOff ? 'bg-red-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-white'
                }`}
                title={isVideoOff ? t.cameraOn : t.cameraOff}
              >
                {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
              </button>

              <button
                onClick={handleEndCall}
                className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-all flex items-center space-x-1.5 shadow-lg shadow-red-600/30"
              >
                <PhoneOff className="w-4 h-4" />
                <span>{t.endCall}</span>
              </button>
            </div>
          </div>

          {/* RIGHT: Real-Time Clinical Documentation & Prescription Panel (5 Cols) */}
          <div className="lg:col-span-5 p-5 sm:p-6 bg-white border-l border-slate-200 overflow-y-auto space-y-5">
            <div>
              <h4 className="text-sm font-extrabold text-slate-900 flex items-center space-x-2">
                <FileText className="w-4 h-4 text-royal-600" />
                <span>{t.clinicalNotes}</span>
              </h4>
              <textarea
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                rows={3}
                className="w-full mt-2 p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-royal-500 text-slate-900"
              />
            </div>

            {/* 4mm Punch Biopsy Protocol */}
            <div className="bg-blue-50/70 p-3.5 rounded-2xl border border-blue-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 flex items-center space-x-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={biopsyScheduled}
                    onChange={(e) => setBiopsyScheduled(e.target.checked)}
                    className="rounded text-royal-600 focus:ring-royal-500 w-4 h-4"
                  />
                  <span>{t.schedulePunchBiopsy}</span>
                </label>
                <span className="text-[10px] font-bold bg-blue-100 text-royal-900 px-2 py-0.5 rounded">
                  PHC G. Madugula
                </span>
              </div>
              {biopsyScheduled && (
                <input
                  type="text"
                  value={biopsyDetails}
                  onChange={(e) => setBiopsyDetails(e.target.value)}
                  className="w-full text-xs p-2 bg-white rounded-lg border border-blue-200 text-slate-800"
                />
              )}
            </div>

            {/* Prescribed Medicines */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  {t.prescribeMedicines}
                </span>
                <button
                  onClick={handleAddMedicine}
                  className="text-[11px] font-bold text-royal-600 hover:text-royal-700 flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Item</span>
                </button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {medicines.map((m, idx) => (
                  <div key={idx} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs flex justify-between items-start">
                    <div>
                      <div className="font-bold text-slate-900">{m.name}</div>
                      <div className="text-[11px] text-slate-500">
                        {m.dosage} • {m.frequency} ({m.duration})
                      </div>
                      <div className="text-[10px] text-royal-700 mt-0.5 font-medium">{m.instructions}</div>
                    </div>
                    <button
                      onClick={() => handleRemoveMedicine(idx)}
                      className="text-slate-400 hover:text-red-500 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Save & Generate Barcode Prescription Button */}
            <button
              onClick={handleSavePrescription}
              disabled={savingPrescription}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-royal-600 via-royal-700 to-royal-800 text-white font-extrabold text-xs shadow-blue-card hover:brightness-110 active:scale-95 transition-all flex items-center justify-center space-x-2"
            >
              <QrCode className="w-4 h-4" />
              <span>{savingPrescription ? 'Saving...' : t.generatePrescription}</span>
            </button>

            {/* Generated Barcode Card */}
            {createdPrescription && (
              <div className="bg-emerald-50 rounded-2xl border border-emerald-300 p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-950 flex items-center space-x-1">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Prescription Saved & Verified</span>
                  </span>
                  <span className="font-mono text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded">
                    {createdPrescription.rxId}
                  </span>
                </div>
                <div className="flex items-center space-x-2 pt-1">
                  <QrCode className="w-6 h-6 text-royal-700" />
                  <span className="font-mono text-xs text-slate-700 font-bold">
                    {createdPrescription.printableBarcodeId}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebRTCTelemedicineRoom;
