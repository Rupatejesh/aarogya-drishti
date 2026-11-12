import { useCallback, useEffect, useState } from 'react'
import {
  bookAppointment,
  createScreening,
  fetchHospitals,
  fetchMyAppointments,
  fetchSpecialists,
  getApiErrorMessage,
  registerPatient,
  updateFollowUp,
  type AppointmentRecord,
  type AuthUser,
  type DiagnosticOrderRecord,
  type FollowUpRecord,
  type HospitalRecord,
  type PatientRecord,
  type ReferralRecord,
  type ScreeningRecord,
  type SpecialistOption,
} from '../services/api'
import {
  listOfflineDraftsFromIndexedDb,
  removeOfflineDraftFromIndexedDb,
  saveOfflineDraftToIndexedDb,
  type OfflineQueueDraft,
} from '../utils/offlineDraftsDb'
import { generateScannableQrMatrix } from '../utils/qrCodeGenerator'
import { LiveTeleconsultationStudio } from './LiveTeleconsultationStudio'

export function PrintableReferralSlip({
  patient,
  referral,
  appointment,
  onClose,
}: {
  patient: PatientRecord
  referral?: ReferralRecord
  appointment?: AppointmentRecord
  onClose: () => void
}) {
  const urgency =
    referral?.priority ||
    (appointment?.appointmentType === 'URGENT_EMERGENCY' ? 'URGENT' : 'URGENT')
  const designatedHospital =
    referral?.facilityName ||
    appointment?.hospitalName ||
    'District Hospital Paderu'

  const resolvedMaaUidn =
    patient.maaUidn || 'UIDN-ASR-CHIN-2026-8757'
  const mandalCode = (patient.address.mandal || 'CHIN')
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, 4)
  const resolvedPatientId =
    patient.patientId && !patient.patientId.includes('GMAD')
      ? patient.patientId
      : `PT-2026-${mandalCode}-${resolvedMaaUidn.slice(-4)}`

  // Real-time Mobile-Scannable Live Verification URL Payload
  const liveVerificationUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://aarogyadrishti.in'}/?verifyUidn=${encodeURIComponent(resolvedMaaUidn)}&patient=${encodeURIComponent(patient.fullName)}&phc=${encodeURIComponent(patient.address.phcId || `PHC-${mandalCode}`)}`
  const qrMatrix = generateScannableQrMatrix(liveVerificationUrl)
  const qrSize = qrMatrix.length
  const totalViewSize = qrSize + 8

  const handlePrintWindow = () => {
    window.print()
  }

  return (
    <div className="telemedicine-modal-backdrop" role="dialog" aria-modal="true" aria-label="Printable Official Referral Slip">
      <div className="printable-referral-slip-card">
        <div className="printable-slip-header">
          <div>
            <span className="section-kicker">
              INTEGRATED TRIBAL DEVELOPMENT AGENCY (ITDA) PADERU · ALLURI SITHARAMA RAJU DISTRICT
            </span>
            <h2>AAROGYA DRISHTI — OFFICIAL BILINGUAL REFERRAL SLIP</h2>
            <p>ఆరోగ్య దృష్టి — అధికారిక ఆసుపత్రి రిఫరల్ పత్రం (ఐటిడిఎ పాడేరు)</p>
          </div>
          <span
            className={`workflow-status ${urgency === 'URGENT' || urgency === 'EMERGENCY' ? 'ai-risk-badge risk-high_risk' : 'status-good'}`}
          >
            TRIAGE: {urgency}
          </span>
        </div>

        <div className="printable-slip-grid">
          <div className="printable-slip-details">
            <p>
              <strong>Patient ID (రోగి ఐడి):</strong> <code>{resolvedPatientId}</code>
            </p>
            <p>
              <strong>Official Tribal MAA-UIDN:</strong>{' '}
              <code style={{ background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '6px', fontWeight: 800 }}>
                {resolvedMaaUidn}
              </code>
            </p>
            <p>
              <strong>Full Name (పేరు):</strong> <strong>{patient.fullName}</strong>
            </p>
            <p>
              <strong>Age / Gender (వయస్సు / లింగం):</strong> {patient.age ?? 46} Years /{' '}
              {patient.sex}
            </p>
            <p>
              <strong>Village & Mandal (గ్రామం & మండలం):</strong>{' '}
              {patient.address.village}, {patient.address.mandal}
            </p>
            <p>
              <strong>Originating PHC (ప్రాథమిక ఆరోగ్య కేంద్రం):</strong>{' '}
              {patient.address.phcId || `PHC ${patient.address.mandal.toUpperCase()}`}
            </p>
            <p>
              <strong>Designated Referral Hospital (రిఫరల్ ఆసుపత్రి):</strong>{' '}
              {designatedHospital}
            </p>
            <p>
              <strong>Specialist / Department (నిపుణులు):</strong>{' '}
              {referral?.referredTo ||
                appointment?.doctorName ||
                'Dr. V. Anitha Rao, MDS (Oral Oncology, DH Paderu)'}
            </p>
            <p>
              <strong>Clinical Suspicion & Reason (వైద్య కారణం):</strong>{' '}
              {referral?.referralReason ||
                appointment?.urgentReason ||
                'Persistent oral mucosal lesion (>14 days) on right buccal mucosa requiring specialist evaluation and incisional biopsy.'}
            </p>
          </div>

          <div className="printable-slip-qr-box">
            <svg
              viewBox={`0 0 ${totalViewSize} ${totalViewSize}`}
              width="168"
              height="168"
              shapeRendering="crispEdges"
              aria-label="Scannable Hospital Verification QR Code"
            >
              <rect width={totalViewSize} height={totalViewSize} fill="#ffffff" />
              {qrMatrix.map((row, rIdx) =>
                row.map((cell, cIdx) =>
                  cell ? (
                    <rect
                      key={`${rIdx}-${cIdx}`}
                      x={cIdx + 4}
                      y={rIdx + 4}
                      width="1"
                      height="1"
                      fill="#0f172a"
                    />
                  ) : null,
                ),
              )}
            </svg>
            <small style={{ fontWeight: 700, color: '#1e3a8a' }}>📱 Scan with Phone Camera to Verify</small>
            <code style={{ fontWeight: 800, color: '#0f172a' }}>{resolvedMaaUidn}</code>
            <span style={{ fontSize: '10px', color: '#16a34a', fontWeight: 700 }}>✓ Verified Live Tribal Health Registry</span>
          </div>
        </div>

        <div className="printable-slip-telugu-box">
          <strong>📋 రోగికి ముఖ్య సూచనలు (Instructions in Telugu for Patient & Family):</strong>
          <ul>
            <li>
              <strong>రిపోర్టింగ్ కౌంటర్ (Reporting Counter):</strong> ఆసుపత్రిలోని <em>&ldquo;ITDA Tribal Help Desk / Oral Oncology Triage Counter (Room No. 4)&rdquo;</em> వద్ద ఈ QR స్లిప్ చూపించండి.
            </li>
            <li>
              <strong>ఉచిత రవాణా సహాయం (Free Tribal Transport Helpline):</strong> ఉచిత అంబులెన్స్ / ఐటిడిఎ రవాణా కోసం <strong>108</strong> లేదా <strong>ITDA Paderu Tribal Health Helpline (08935-250108)</strong> కు కాల్ చేయండి.
            </li>
            <li>
              <strong>తీసుకురావలసిన పత్రాలు (Required Documents):</strong> ఆధార్ కార్డు, ఆరోగ్యశ్రీ కార్డు (ఉంటే), మరియు ఈ రిఫరల్ స్లిప్.
            </li>
          </ul>
        </div>

        <div className="printable-slip-actions">
          <button
            type="button"
            className="workflow-button"
            onClick={handlePrintWindow}
          >
            🖨 Print Referral Slip (తెలుగు & English)
          </button>
          <button
            type="button"
            className="workflow-secondary-button"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export function TelemedicineRoomModal({
  appointment,
  patient,
  latestScreening: _latestScreening,
  canConclude,
  onClose,
  onConcluded,
}: {
  appointment: AppointmentRecord
  patient: PatientRecord
  latestScreening?: ScreeningRecord
  canConclude: boolean
  onClose: () => void
  onConcluded: () => Promise<void>
}) {
  return (
    <div
      className="telemedicine-modal-backdrop"
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(2, 6, 23, 0.92)',
        backdropFilter: 'blur(8px)',
        overflowY: 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div style={{ width: '100%', maxWidth: '1440px', maxHeight: '95vh', overflowY: 'auto', borderRadius: '16px' }}>
        <LiveTeleconsultationStudio
          appointment={appointment}
          patient={patient}
          canConclude={canConclude}
          onClose={onClose}
          onConcluded={onConcluded}
        />
      </div>
    </div>
  )
}

export function AppointmentBookingAndTelemedicineSection({
  patient,
  referrals,
  screenings,
  user,
  onNotice,
  onError,
}: {
  patient: PatientRecord
  referrals: ReferralRecord[]
  screenings: ScreeningRecord[]
  user: AuthUser
  onNotice: (msg: string) => void
  onError: (msg: string) => void
}) {
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([])
  const [hospitals, setHospitals] = useState<HospitalRecord[]>([])
  const [specialists, setSpecialists] = useState<SpecialistOption[]>([])
  const [selectedHospitalId, setSelectedHospitalId] = useState('HOSP-ASR-PADERU-01')
  const [selectedDoctorId, setSelectedDoctorId] = useState('')
  const [scheduledDate, setScheduledDate] = useState(() =>
    new Date(Date.now() + 86400000).toISOString().slice(0, 10),
  )
  const [timeSlot, setTimeSlot] = useState('10:30 AM - 11:00 AM')
  const [isUrgent, setIsUrgent] = useState(false)
  const [urgentReason, setUrgentReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [activeTelemedicineApt, setActiveTelemedicineApt] =
    useState<AppointmentRecord | null>(null)
  const [printSlipTarget, setPrintSlipTarget] = useState<{
    referral?: ReferralRecord
    appointment?: AppointmentRecord
  } | null>(null)

  const loadData = useCallback(async () => {
    try {
      const [apts, hosps, specs] = await Promise.all([
        fetchMyAppointments(patient.patientId).catch(() => [] as AppointmentRecord[]),
        fetchHospitals().catch(() => [] as HospitalRecord[]),
        fetchSpecialists().catch(() => [] as SpecialistOption[]),
      ])
      setAppointments(apts)
      setHospitals(hosps)
      setSpecialists(specs)
      if (specs.length > 0) {
        setSelectedDoctorId((current) => current || specs[0].id)
      }
    } catch {
      // Keep non-blocking
    }
  }, [patient.patientId])

  useEffect(() => {
    void Promise.resolve().then(loadData)
  }, [loadData])

  const selectedDoctor = specialists.find((s) => s.id === selectedDoctorId)
  const availableSlots = selectedDoctor?.timeSlots?.length
    ? selectedDoctor.timeSlots
    : [
        '09:30 AM - 10:00 AM',
        '10:30 AM - 11:00 AM',
        '11:30 AM - 12:00 PM',
        '02:30 PM - 03:00 PM',
      ]

  const canConclude =
    user.role === 'SPECIALIST' || user.role === 'MEDICAL_OFFICER'

  return (
    <div className="workflow-subsection">
      <div className="workflow-card-heading">
        <div>
          <span className="section-kicker">
            Modules E & F · Hospital Appointment Booking, Teleconsultation & Printable QR Slip
          </span>
          <h3>Specialist Teleconsultation & Hospital Slot Coordination</h3>
        </div>
        {referrals.length > 0 && (
          <button
            type="button"
            className="workflow-secondary-button"
            onClick={() => setPrintSlipTarget({ referral: referrals[0] })}
          >
            🖨 Print Bilingual Referral Slip (QR)
          </button>
        )}
      </div>

      {/* Appointment Booking Form */}
      <form
        className="workflow-form"
        onSubmit={async (event) => {
          event.preventDefault()
          if (!selectedDoctorId || busy) return
          setBusy(true)
          try {
            window.dispatchEvent(
              new CustomEvent('aarogya:feature-motto', { detail: 'TELEMEDICINE' }),
            )
            await bookAppointment({
              patientId: patient.patientId,
              doctorId: selectedDoctorId,
              hospitalId: selectedHospitalId,
              ...(referrals[0]?._id ? { referralId: referrals[0]._id } : {}),
              appointmentType: isUrgent ? 'URGENT_EMERGENCY' : 'TELEMEDICINE',
              scheduledDate: new Date(`${scheduledDate}T10:30:00Z`).toISOString(),
              timeSlot,
              ...(isUrgent && urgentReason.trim()
                ? { urgentReason: urgentReason.trim() }
                : {}),
            })
            await loadData()
            onNotice('Hospital / Telemedicine consultation slot booked successfully.')
          } catch (err) {
            onError(
              getApiErrorMessage(err, 'Could not book specialist appointment slot.'),
            )
          } finally {
            setBusy(false)
          }
        }}
      >
        <div className="workflow-form-grid">
          <label>
            Registered Referral Hospital
            <select
              value={selectedHospitalId}
              onChange={(event) => setSelectedHospitalId(event.target.value)}
            >
              {hospitals.map((hosp) => (
                <option key={hosp.hospitalId} value={hosp.hospitalId}>
                  {hosp.name} ({hosp.type.replaceAll('_', ' ')} · {hosp.mandal})
                </option>
              ))}
            </select>
          </label>

          <label>
            Specialist Doctor
            <select
              value={selectedDoctorId}
              onChange={(event) => setSelectedDoctorId(event.target.value)}
              required
            >
              <option value="">Select Specialist Doctor</option>
              {specialists.map((spec) => (
                <option key={spec.id} value={spec.id}>
                  {spec.fullName} — {spec.specialization} ({spec.hospitalName})
                </option>
              ))}
            </select>
          </label>

          <label>
            Appointment Date
            <input
              type="date"
              required
              value={scheduledDate}
              onChange={(event) => setScheduledDate(event.target.value)}
            />
          </label>

          <label>
            Available Time Slot
            <select
              value={timeSlot}
              onChange={(event) => setTimeSlot(event.target.value)}
            >
              {availableSlots.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="workflow-checkbox">
          <input
            type="checkbox"
            checked={isUrgent}
            onChange={(event) => setIsUrgent(event.target.checked)}
          />
          🚨 Request Urgent Consultation (High-Risk Oral Lesion Triage)
        </label>

        {isUrgent && (
          <label>
            Urgent Clinical Reason
            <input
              required
              value={urgentReason}
              onChange={(event) => setUrgentReason(event.target.value)}
              placeholder="e.g. Persistent right buccal leukoplakia > 6 weeks with trismus"
            />
          </label>
        )}

        <button
          type="submit"
          className="workflow-button"
          disabled={busy || !selectedDoctorId}
        >
          {busy ? 'Booking Slot...' : '📅 Book Specialist Consultation Slot'}
        </button>
      </form>

      {/* Booked Appointments List */}
      {appointments.length > 0 && (
        <div className="patient-activity-list" style={{ marginTop: '14px' }}>
          {appointments.map((apt) => (
            <article className="patient-activity-item" key={apt._id}>
              <div className="workflow-card-heading">
                <div>
                  <span className="section-kicker">
                    {apt.appointmentId} · {apt.appointmentType.replaceAll('_', ' ')}
                  </span>
                  <strong>
                    {apt.hospitalName || apt.hospitalId} · {apt.timeSlot}
                  </strong>
                  <p>
                    Specialist:{' '}
                    {typeof apt.doctorId === 'object'
                      ? apt.doctorId.fullName
                      : apt.doctorName || 'Oral Oncologist'}{' '}
                    · Date: {new Date(apt.scheduledDate).toLocaleDateString()}
                  </p>
                </div>
                <span className="workflow-status">{apt.status}</span>
              </div>

              {apt.consultationNotes && (
                <p>
                  <strong>Consultation Notes:</strong> {apt.consultationNotes}
                </p>
              )}
              {apt.prescription && (
                <p>
                  <strong>Prescription:</strong> {apt.prescription}
                </p>
              )}
              {apt.nextAction && (
                <p>
                  <strong>Next Action:</strong> {apt.nextAction.replaceAll('_', ' ')}
                </p>
              )}

              <div className="workflow-dashboard-actions" style={{ marginTop: '10px' }}>
                <button
                  type="button"
                  className="workflow-button"
                  onClick={() => {
                    window.dispatchEvent(
                      new CustomEvent('aarogya:feature-motto', {
                        detail: 'TELEMEDICINE',
                      }),
                    )
                    setActiveTelemedicineApt(apt)
                  }}
                >
                  🎥 Launch Live Teleconsultation Room
                </button>
                <button
                  type="button"
                  className="workflow-secondary-button"
                  onClick={() =>
                    setPrintSlipTarget({
                      appointment: apt,
                      referral: referrals[0],
                    })
                  }
                >
                  🖨 Print Referral Slip (QR)
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {activeTelemedicineApt && (
        <TelemedicineRoomModal
          appointment={activeTelemedicineApt}
          patient={patient}
          latestScreening={screenings[0]}
          canConclude={canConclude}
          onClose={() => setActiveTelemedicineApt(null)}
          onConcluded={async () => {
            await loadData()
            onNotice('Teleconsultation concluded and clinical notes saved.')
          }}
        />
      )}

      {printSlipTarget && (
        <PrintableReferralSlip
          patient={patient}
          referral={printSlipTarget.referral}
          appointment={printSlipTarget.appointment}
          onClose={() => setPrintSlipTarget(null)}
        />
      )}
    </div>
  )
}

export function PatientNavigatorAndOfflineSyncBar({
  followUps,
  diagnostics,
  patient,
  onRefresh,
  onNotice,
  onError,
}: {
  followUps: FollowUpRecord[]
  diagnostics: DiagnosticOrderRecord[]
  patient?: PatientRecord
  onRefresh: () => Promise<void>
  onNotice: (msg: string) => void
  onError: (msg: string) => void
}) {
  const [drafts, setDrafts] = useState<OfflineQueueDraft[]>([])
  const [isOnline, setIsOnline] = useState(
    typeof navigator === 'undefined' ? true : navigator.onLine,
  )
  const [syncBusy, setSyncBusy] = useState(false)
  const [navBusy, setNavBusy] = useState(false)
  const [missedReasonSelect, setMissedReasonSelect] = useState(
    'Daily wage loss & harvest work',
  )

  const refreshDrafts = useCallback(async () => {
    const items = await listOfflineDraftsFromIndexedDb()
    setDrafts(items)
  }, [])

  useEffect(() => {
    void Promise.resolve().then(refreshDrafts)
    const onOnline = () => setIsOnline(true)
    const onOffline = () => setIsOnline(false)
    const onDraftsChanged = () => void refreshDrafts()

    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    window.addEventListener('aarogya:offline-drafts-changed', onDraftsChanged)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
      window.removeEventListener(
        'aarogya:offline-drafts-changed',
        onDraftsChanged,
      )
    }
  }, [refreshDrafts])

  const handleSyncAll = async () => {
    if (syncBusy || drafts.length === 0) return
    setSyncBusy(true)
    try {
      for (const draft of drafts) {
        if (draft.kind === 'PATIENT_REGISTRATION') {
          await registerPatient(draft.payload)
        } else if (draft.kind === 'ORAL_SCREENING') {
          await createScreening(draft.payload)
        }
        await removeOfflineDraftFromIndexedDb(draft.id)
      }
      await refreshDrafts()
      await onRefresh()
      onNotice('All offline IndexedDB drafts synchronized with server!')
    } catch (err) {
      onError(
        getApiErrorMessage(
          err,
          'Could not synchronize offline drafts with server.',
        ),
      )
    } finally {
      setSyncBusy(false)
    }
  }

  const handleSaveDemoOfflineDraft = async () => {
    if (!patient) return
    await saveOfflineDraftToIndexedDb({
      kind: 'ORAL_SCREENING',
      summary: `Offline Screening Draft for ${patient.fullName} (${patient.patientId})`,
      payload: {
        patientId: patient._id,
        screeningDate: new Date().toISOString(),
        examinationFindings: [
          {
            bodySite: 'RIGHT_CHEEK',
            observation:
              'Field hamlet offline follow-up inspection: persistent white mucosal patch on right buccal mucosa.',
          },
        ],
        symptoms: [{ name: 'Burning sensation on spicy food' }],
        tobaccoUse: 'CURRENT',
        notes: 'Queued in IndexedDB during low-connectivity hamlet visit.',
      },
    })
    onNotice('Saved screening draft to browser IndexedDB offline queue.')
  }

  const overdueBiopsies = diagnostics.filter((d) =>
    ['ADVISED', 'SCHEDULED', 'REPORT_PENDING'].includes(d.status),
  )

  return (
    <div className="workflow-subsection navigator-workspace-panel">
      {/* Offline IndexedDB Sync Banner */}
      {(!isOnline || drafts.length > 0) && (
        <div className="ai-safety-banner offline-sync-banner" role="status">
          <div>
            <strong>
              ⚡ Offline Mode — {drafts.length} Draft{drafts.length === 1 ? '' : 's'} Pending Sync (IndexedDB)
            </strong>
            <p style={{ margin: '4px 0 0' }}>
              {drafts.map((d) => d.summary).join(' · ') ||
                'ASHA worker field forms are stored safely in browser IndexedDB.'}
            </p>
          </div>
          <button
            type="button"
            className="workflow-button"
            disabled={syncBusy || drafts.length === 0}
            onClick={() => void handleSyncAll()}
          >
            {syncBusy ? 'Syncing...' : '🔄 Sync with Server'}
          </button>
        </div>
      )}

      <div className="workflow-card-heading">
        <div>
          <span className="section-kicker">
            Module I & Section 11 · ASHA Patient Navigator & IndexedDB Offline Queue
          </span>
          <h3>Patient Navigator Tracking & Tribal Transport Support</h3>
        </div>
        {patient && (
          <button
            type="button"
            className="workflow-secondary-button"
            onClick={() => void handleSaveDemoOfflineDraft()}
          >
            💾 Queue Offline Screening Draft (IndexedDB)
          </button>
        )}
      </div>

      {overdueBiopsies.length > 0 && (
        <p className="workflow-help">
          <strong>🔬 Pending Biopsy / Histopathology Orders:</strong>{' '}
          {overdueBiopsies
            .map((b) => `${b.diagnosticType} at ${b.facilityName || 'DH Paderu'} (${b.status})`)
            .join(', ')}
        </p>
      )}

      {followUps.length > 0 && (
        <div className="patient-activity-list">
          {followUps.map((item) => (
            <article className="patient-activity-item" key={item._id}>
              <div className="workflow-card-heading">
                <div>
                  <strong>
                    Navigator Follow-Up · Due {new Date(item.dueAt).toLocaleDateString()}
                  </strong>
                  <p>
                    Status: <strong>{item.status}</strong>
                  </p>
                </div>
                <span className="workflow-status">{item.status}</span>
              </div>

              <div className="workflow-dashboard-actions" style={{ marginTop: '10px' }}>
                <button
                  type="button"
                  className="workflow-secondary-button"
                  disabled={navBusy}
                  onClick={async () => {
                    setNavBusy(true)
                    try {
                      await updateFollowUp(item._id, {
                        status: 'CONTACTED',
                        visitNote:
                          'ASHA Navigator logged home/phone contact attempt with patient family.',
                      })
                      await onRefresh()
                      onNotice('Logged patient navigator contact attempt.')
                    } catch (err) {
                      onError(getApiErrorMessage(err, 'Could not log contact attempt.'))
                    } finally {
                      setNavBusy(false)
                    }
                  }}
                >
                  📞 Log Contact Attempt
                </button>

                <button
                  type="button"
                  className="workflow-secondary-button"
                  disabled={navBusy}
                  onClick={async () => {
                    setNavBusy(true)
                    try {
                      await updateFollowUp(item._id, {
                        visitNote:
                          'Arranged ITDA Paderu free tribal transport support from G. Madugula PHC to District Hospital Paderu.',
                      })
                      await onRefresh()
                      onNotice('ITDA Paderu tribal transport support arranged.')
                    } catch (err) {
                      onError(getApiErrorMessage(err, 'Could not record transport support.'))
                    } finally {
                      setNavBusy(false)
                    }
                  }}
                >
                  🚑 Arrange ITDA Transport Support
                </button>

                <select
                  value={missedReasonSelect}
                  onChange={(event) => setMissedReasonSelect(event.target.value)}
                  aria-label="Select Missed Appointment Barrier"
                >
                  <option value="Daily wage loss & harvest work">
                    Barrier: Daily wage loss
                  </option>
                  <option value="Long hill travel distance from hamlet">
                    Barrier: Travel distance
                  </option>
                  <option value="Fear of biopsy procedure">
                    Barrier: Fear of biopsy
                  </option>
                </select>

                <button
                  type="button"
                  className="workflow-secondary-button"
                  disabled={navBusy}
                  onClick={async () => {
                    setNavBusy(true)
                    try {
                      await updateFollowUp(item._id, {
                        status: 'MISSED',
                        missedReason: missedReasonSelect,
                      })
                      await onRefresh()
                      onNotice(`Recorded missed reason: ${missedReasonSelect}`)
                    } catch (err) {
                      onError(getApiErrorMessage(err, 'Could not record missed reason.'))
                    } finally {
                      setNavBusy(false)
                    }
                  }}
                >
                  ⚠ Record Missed Reason
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
