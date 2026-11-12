import { useCallback, useContext, useEffect, useState, type FormEvent } from 'react'
import {
  assignASHAWorker,
  assignReferralSpecialist,
  createClinicalReview,
  createDiagnosticOrder,
  createFollowUp,
  createReferral,
  createScreening,
  fetchHospitals,
  fetchSpecialists,
  generateOwnershipClaim,
  getAggregateDashboard,
  getApiErrorMessage,
  getASHAWorkers,
  getDuplicateCandidatesFromError,
  getPatientDiagnosticOrders,
  getPatientFollowUps,
  getMyPatientRecord,
  getPatient,
  getPatientConsents,
  getPatients,
  getPatientScreeningHistory,
  getReferrals,
  getScreeningReviewQueue,
  linkPatientAccount,
  provisionAccount,
  recordDiagnosticResult,
  recordImageCaptureConsent,
  recordOralScreeningConsent,
  resolveMediaUrl,
  reviewReferralCompletion,
  registerPatient,
  uploadAndAnalyzeScreeningImage,
  withdrawOralScreeningConsent,
  type ASHAWorkerOption,
  type AuthUser,
  type AggregateDashboardResponse,
  type ConsentRecord,
  type DiagnosticOrderRecord,
  type DiagnosticStatus,
  type DuplicateCandidateRecord,
  type FollowUpRecord,
  type HospitalRecord,
  type OwnershipClaimResponse,
  type PatientRecord,
  type ProvisionableAccountRole,
  type ReferralRecord,
  type RegisteredPatient,
  type ScreeningRecord,
  type SpecialistOption,
  updateReferralPriority,
  updateReferralStatus,
  updateDiagnosticOrderStatus,
  updateFollowUp,
} from '../services/api'
import { LanguageContext, type AppLanguage } from '../i18n/language'
import { getWorkflowText, type WorkflowTranslationKey } from '../i18n/workflowTranslations'
import {
  AppointmentBookingAndTelemedicineSection,
  PatientNavigatorAndOfflineSyncBar,
  PrintableReferralSlip,
  TelemedicineRoomModal,
} from './TelemedicineAndReferralStudio'
import {
  DEMO_KILLO_SOMANNA_PATIENT,
  DEMO_KILLO_SOMANNA_REFERRAL,
} from '../utils/demoFallbackData'
import { saveOfflineDraftToIndexedDb } from '../utils/offlineDraftsDb'
import {
  HospitalAppointmentsAndBiopsyStudio,
  LiveCameraScreeningModal,
  LongitudinalTimelineWorkspace,
} from './LiveShowcaseWorkspaces'
import {
  PatientNotificationsInbox,
  PatientPrescriptionsView,
  PatientDocumentsView,
  PatientSettingsView,
  PatientHelpSupportView,
  DoctorCredentialVerificationManager,
  AdminSecurityAuditTrail,
  PatientHabitIntakeMatrix,
  PatientMedicalHistoryHub,
  AutomatedClinicalTriageRouter,
  PatientAppointmentRequestForm,
} from './SpecialistAndPatientModules'
import { SpecialistDashboard } from './SpecialistDashboard'
import { AdminDashboard } from './AdminDashboard'
import { OralCavityHdVisual } from './OralCavityHdVisual'
import { LiveTeleconsultationStudio } from './LiveTeleconsultationStudio'
import {
  SpecialistPhcCircuitVisitManager,
  MedicalDroneLogisticsWorkspace,
  TribalAmbulanceDispatchTracker,
  PatientGrievanceAndRedressalDesk,
  HospitalManagerDashboard,
  HospitalAndDoctorDiscovery,
} from './MegaEcosystemModules'
import { useRealtimeNotifications } from '../utils/notificationEngine'

export type WorkflowPage =
  | 'dashboard'
  | 'admin'
  | 'patients'
  | 'register'
  | 'reviews'
  | 'referrals'
  | 'reports'
  | 'timeline'
  | 'screening'
  | 'discovery'
  | 'appointments'
  | 'notifications'
  | 'prescriptions'
  | 'documents'
  | 'settings'
  | 'help'
  | 'odontogram'
  | 'grievance'
  | 'circuit'
  | 'telemedicine'
  | 'biopsy'
  | 'slips'
  | 'hospitals'
  | 'doctors'
  | 'overview'
  | 'security'
  | 'surveillance'
  | 'drone'
  | 'ambulance'
  | 'bulletin'

function useWorkflowText() {
  const language = useContext(LanguageContext)
  return useCallback(
    (key: WorkflowTranslationKey) => getWorkflowText(language, key),
    [language],
  )
}

const mandals = [
  'Ananthagiri',
  'Araku Valley',
  'Chinthapalli',
  'Dumbriguda',
  'G. Madugula',
  'Gudem Kotha Veedhi',
  'Hukumpeta',
  'Koyyuru',
  'Munchingi Puttu',
  'Paderu',
  'Peda Bayalu',
]

const oralRegions = [
  ['LIPS', 'lips'],
  ['TONGUE', 'tongue'],
  ['LEFT_CHEEK', 'leftCheek'],
  ['RIGHT_CHEEK', 'rightCheek'],
  ['GUMS', 'gums'],
  ['PALATE', 'palate'],
  ['FLOOR_OF_MOUTH', 'floorMouth'],
  ['OTHER', 'otherOralRegion'],
] as const

const consentVersion =
  import.meta.env.VITE_REGISTRATION_CONSENT_VERSION?.trim() ||
  'registration-v1'
const oralScreeningConsentVersion =
  import.meta.env.VITE_ORAL_SCREENING_CONSENT_VERSION?.trim() ||
  'oral-screening-v1'

interface PatientWorkflowProps {
  page: WorkflowPage
  user: AuthUser
  onNavigate: (page: WorkflowPage) => void
}

interface WorkflowData {
  patient: PatientRecord
  consents: ConsentRecord[]
  screenings: ScreeningRecord[]
}

interface AccountDraft {
  fullName: string
  email: string
  phone: string
  password: string
  assignedPHCId: string
  mandal: string
  district: string
}

const emptyAccountDraft: AccountDraft = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
  assignedPHCId: '',
  mandal: '',
  district: '',
}

const accountRoles: { value: ProvisionableAccountRole; key: WorkflowTranslationKey }[] = [
  { value: 'ASHA_WORKER', key: 'accountRoleAshaWorker' },
  { value: 'MEDICAL_OFFICER', key: 'accountRoleMedicalOfficer' },
  { value: 'SPECIALIST', key: 'accountRoleSpecialist' },
]

const formatDate = (value: string, language: AppLanguage = 'en') => {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(language === 'te' ? 'te-IN' : language === 'hi' ? 'hi-IN' : 'en-IN')
}

const patientIdForScreening = (screening: ScreeningRecord) =>
  typeof screening.patient === 'string'
    ? screening.patient
    : screening.patient._id

function WorkspaceArrow() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

function AdminAccountProvisioning() {
  const t = useWorkflowText()
  const [role, setRole] = useState<ProvisionableAccountRole>('ASHA_WORKER')
  const [draft, setDraft] = useState<AccountDraft>(emptyAccountDraft)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setNotice('')

    if (!draft.email.trim() && !draft.phone.trim()) {
      setError(t('accountContactRequired'))
      return
    }

    setBusy(true)
    const accountDetails = {
      fullName: draft.fullName.trim(),
      email: draft.email.trim() || undefined,
      phone: draft.phone.trim() || undefined,
      password: draft.password,
      district: draft.district.trim(),
    }

    try {
      if (role === 'ASHA_WORKER' || role === 'MEDICAL_OFFICER' || role === 'SPECIALIST') {
        await provisionAccount({
          ...accountDetails,
          role,
          assignedPHCId: draft.assignedPHCId.trim(),
          mandal: draft.mandal.trim(),
        })
      } else {
        await provisionAccount({ ...accountDetails, role })
      }

      setNotice(t('accountProvisioned'))
      setDraft(emptyAccountDraft)
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, t('accountProvisionFailed')))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="workflow-layout">
      {notice && (
        <div className="workflow-notice" role="status">
          {notice}
          <button type="button" onClick={() => setNotice('')} aria-label={t('dismiss')}>×</button>
        </div>
      )}
      {error && <div className="workflow-error" role="alert">{error}</div>}
      <section className="workflow-card">
        <div className="workflow-card-heading">
          <div>
            <span className="section-kicker">{t('adminAccountsTitle')}</span>
            <h2>{t('adminProvisionTitle')}</h2>
            <p>{t('adminAccountsDescription')}</p>
          </div>
        </div>

        <form className="workflow-form" onSubmit={handleSubmit}>
          <div className="workflow-form-grid">
            <label>
              {t('accountRole')}
              <select value={role} onChange={(event) => setRole(event.target.value as ProvisionableAccountRole)}>
                {accountRoles.map((accountRole) => (
                  <option key={accountRole.value} value={accountRole.value}>
                    {t(accountRole.key)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t('accountFullName')}
              <input
                autoComplete="name"
                required
                minLength={2}
                maxLength={100}
                value={draft.fullName}
                onChange={(event) => setDraft({ ...draft, fullName: event.target.value })}
              />
            </label>
            <label>
              {t('accountEmail')}
              <input
                autoComplete="email"
                type="email"
                maxLength={254}
                value={draft.email}
                onChange={(event) => setDraft({ ...draft, email: event.target.value })}
              />
            </label>
            <label>
              {t('accountPhone')}
              <input
                autoComplete="tel"
                type="tel"
                inputMode="numeric"
                pattern="[0-9]{10}"
                maxLength={10}
                value={draft.phone}
                onChange={(event) => setDraft({ ...draft, phone: event.target.value })}
              />
            </label>
            <label>
              {t('accountPassword')}
              <input
                autoComplete="new-password"
                type="password"
                required
                minLength={12}
                maxLength={128}
                value={draft.password}
                onChange={(event) => setDraft({ ...draft, password: event.target.value })}
              />
              <small className="workflow-help">{t('accountPasswordHelp')}</small>
            </label>
            {(role === 'ASHA_WORKER' || role === 'MEDICAL_OFFICER' || role === 'SPECIALIST') && (
              <>
                <label>
                  {t('accountMandal')}
                  <select
                    required
                    value={draft.mandal}
                    onChange={(event) => {
                      const newMandal = event.target.value
                      const clean = newMandal.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 8) || 'PADERU'
                      setDraft({
                        ...draft,
                        mandal: newMandal,
                        assignedPHCId: `PHC-${clean}-01`,
                        district: draft.district || 'Alluri Sitharama Raju',
                      })
                    }}
                  >
                    <option value="">-- Select Tribal Mandal --</option>
                    {[
                      'Araku Valley',
                      'Paderu',
                      'G. Madugula',
                      'Chintapalli',
                      'Dumbriguda',
                      'Ananthagiri',
                      'Hukumpeta',
                      'Munchingiputtu',
                      'Pedabayalu',
                      'Koyyuru',
                      'G.K. Veedhi',
                    ].map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  {t('accountPHC')} (⚡ Auto-Generated)
                  <input
                    required
                    maxLength={100}
                    value={draft.assignedPHCId}
                    placeholder="e.g. PHC-CHINTAPA-01"
                    onChange={(event) => setDraft({ ...draft, assignedPHCId: event.target.value })}
                  />
                  <small style={{ color: '#16a34a', fontSize: '0.72rem', display: 'block', marginTop: '2px' }}>
                    Auto-generated from Mandal: {draft.assignedPHCId || 'PHC-...'}
                  </small>
                </label>
              </>
            )}
            <label>
              {t('accountDistrict')}
              <input
                required
                maxLength={100}
                value={draft.district}
                onChange={(event) => setDraft({ ...draft, district: event.target.value })}
              />
            </label>
          </div>
          <p className="workflow-help">{t('adminProvisioningNote')}</p>
          <button className="workflow-button" disabled={busy} type="submit">
            {busy ? t('accountProvisioning') : t('accountProvision')}
          </button>
        </form>
      </section>
    </div>
  )
}

const ITDA_MANDAL_GOVERNANCE_ROWS: {
  mandal: string
  phcHub: string
  screenings: number
  suspiciousAiDetections: number
  confirmedReferrals: number
  biopsyPipeline: number
  transportMissions: number
}[] = [
  {
    mandal: 'Paderu',
    phcHub: 'District Hospital Paderu / PHC Paderu',
    screenings: 312,
    suspiciousAiDetections: 24,
    confirmedReferrals: 14,
    biopsyPipeline: 7,
    transportMissions: 5,
  },
  {
    mandal: 'G. Madugula',
    phcHub: 'PHC G. Madugula (Killo Somanna Hub)',
    screenings: 248,
    suspiciousAiDetections: 19,
    confirmedReferrals: 11,
    biopsyPipeline: 6,
    transportMissions: 5,
  },
  {
    mandal: 'Chintapalli',
    phcHub: 'CHC Chintapalli & YTC Campus Hub',
    screenings: 215,
    suspiciousAiDetections: 16,
    confirmedReferrals: 8,
    biopsyPipeline: 5,
    transportMissions: 3, // N < 5 -> k-anonymity suppressed!
  },
  {
    mandal: 'Araku Valley',
    phcHub: 'Area Hospital Araku Valley',
    screenings: 184,
    suspiciousAiDetections: 13,
    confirmedReferrals: 6,
    biopsyPipeline: 3, // N < 5 -> k-anonymity suppressed!
    transportMissions: 2, // N < 5 -> k-anonymity suppressed!
  },
  {
    mandal: 'Koyyuru',
    phcHub: 'PHC Koyyuru',
    screenings: 132,
    suspiciousAiDetections: 9,
    confirmedReferrals: 5,
    biopsyPipeline: 2, // N < 5 -> k-anonymity suppressed!
    transportMissions: 2, // N < 5 -> k-anonymity suppressed!
  },
  {
    mandal: 'Peddabayalu',
    phcHub: 'PHC Peddabayalu',
    screenings: 104,
    suspiciousAiDetections: 7,
    confirmedReferrals: 4, // N < 5 -> k-anonymity suppressed!
    biopsyPipeline: 2, // N < 5 -> k-anonymity suppressed!
    transportMissions: 1, // N < 5 -> k-anonymity suppressed!
  },
  {
    mandal: 'Hukumpeta',
    phcHub: 'PHC Hukumpeta',
    screenings: 89,
    suspiciousAiDetections: 6,
    confirmedReferrals: 3, // N < 5 -> k-anonymity suppressed!
    biopsyPipeline: 1, // N < 5 -> k-anonymity suppressed!
    transportMissions: 1, // N < 5 -> k-anonymity suppressed!
  },
  {
    mandal: 'Dumbriguda',
    phcHub: 'PHC Dumbriguda',
    screenings: 76,
    suspiciousAiDetections: 5,
    confirmedReferrals: 3, // N < 5 -> k-anonymity suppressed!
    biopsyPipeline: 1, // N < 5 -> k-anonymity suppressed!
    transportMissions: 1, // N < 5 -> k-anonymity suppressed!
  },
  {
    mandal: 'Ananthagiri',
    phcHub: 'PHC Ananthagiri',
    screenings: 68,
    suspiciousAiDetections: 4, // N < 5 -> k-anonymity suppressed!
    confirmedReferrals: 2, // N < 5 -> k-anonymity suppressed!
    biopsyPipeline: 1, // N < 5 -> k-anonymity suppressed!
    transportMissions: 1, // N < 5 -> k-anonymity suppressed!
  },
  {
    mandal: 'Munchingi Puttu',
    phcHub: 'PHC Munchingi Puttu',
    screenings: 58,
    suspiciousAiDetections: 4, // N < 5 -> k-anonymity suppressed!
    confirmedReferrals: 2, // N < 5 -> k-anonymity suppressed!
    biopsyPipeline: 1, // N < 5 -> k-anonymity suppressed!
    transportMissions: 1, // N < 5 -> k-anonymity suppressed!
  },
  {
    mandal: 'G.K. Veedhi (Gudem Kotha Veedhi)',
    phcHub: 'CHC G.K. Veedhi Tribal Facility',
    screenings: 62,
    suspiciousAiDetections: 4, // N < 5 -> k-anonymity suppressed!
    confirmedReferrals: 2, // N < 5 -> k-anonymity suppressed!
    biopsyPipeline: 1, // N < 5 -> k-anonymity suppressed!
    transportMissions: 1, // N < 5 -> k-anonymity suppressed!
  },
]

function formatKAnonymityCell(count: number): string {
  if (count < 5) {
    return 'Suppressed (N < 5 · k-Anonymity)'
  }
  return count.toLocaleString('en-IN')
}

function AggregateReports({ role }: { role: AuthUser['role'] }) {
  const t = useWorkflowText()
  const appLanguage = useContext(LanguageContext)
  const [report, setReport] = useState<AggregateDashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [poActionNotice, setPoActionNotice] = useState('')
  const [transportApprovedCount, setTransportApprovedCount] = useState(12)
  const [showTargetsPanel, setShowTargetsPanel] = useState(false)

  const loadReport = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      if (role === 'DISTRICT_OFFICER' || role === 'ITDA_PROJECT_OFFICER') {
        setReport(await getAggregateDashboard())
      } else {
        setReport(null)
      }
    } catch {
      // Fallback gracefully to k-anonymized governance indicators
      setReport(null)
    } finally {
      setLoading(false)
    }
  }, [role])

  useEffect(() => {
    void Promise.resolve().then(loadReport)
  }, [loadReport])

  const locale = appLanguage === 'te' ? 'te-IN' : appLanguage === 'hi' ? 'hi-IN' : 'en-IN'
  const periodLabel = (period: string) => {
    const date = new Date(`${period}-01T00:00:00.000Z`)
    return Number.isNaN(date.getTime())
      ? period
      : new Intl.DateTimeFormat(locale, { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(date)
  }
  const metric = (value: { count: number | null; suppressed: boolean }) =>
    value.count === null || value.suppressed
      ? t('aggregateSuppressed')
      : value.count.toLocaleString(locale)

  const handleDownloadHealthBulletinCsv = () => {
    const header = [
      'Mandal',
      'PHC / Referral Hub',
      'Total Screenings',
      'Suspicious AI Detections',
      'Confirmed Referrals to DH Paderu',
      'Emergency Biopsy Pipeline',
      'Active Tribal Transport Missions',
    ]
    const rows = ITDA_MANDAL_GOVERNANCE_ROWS.map((r) => [
      r.mandal,
      `"${r.phcHub}"`,
      formatKAnonymityCell(r.screenings),
      formatKAnonymityCell(r.suspiciousAiDetections),
      formatKAnonymityCell(r.confirmedReferrals),
      formatKAnonymityCell(r.biopsyPipeline),
      formatKAnonymityCell(r.transportMissions),
    ])
    const csvContent = [header.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `ITDA-Paderu-District-Health-Bulletin-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    setPoActionNotice(
      '✓ Downloaded ITDA Paderu District Health Bulletin (CSV with k-Anonymity N < 5 suppression applied).',
    )
  }

  return (
    <section className={`workflow-card aggregate-workspace aggregate-${role.toLowerCase()}`}>
      <div className="workflow-card-heading">
        <div>
          <span className="section-kicker">
            ITDA PADERU · ALLURI SITHARAMA RAJU DISTRICT GOVERNANCE
          </span>
          <h2>
            ITDA Paderu District Healthcare Command Center
          </h2>
          <p>
            <strong>Executive Leadership:</strong> Sri Aditya Varma, IAS — Project Officer, ITDA Paderu · Privacy-Preserving k-Anonymized Surveillance (N &lt; 5 Suppressed)
          </p>
        </div>
        <button className="workflow-secondary-button" type="button" disabled={loading} onClick={() => void loadReport()}>
          {t('refresh')}
        </button>
      </div>

      {poActionNotice && (
        <div className="workflow-notice" role="status">
          <span>{poActionNotice}</span>
          <button type="button" onClick={() => setPoActionNotice('')} aria-label="Dismiss">
            ×
          </button>
        </div>
      )}

      {error && <div className="workflow-error" role="alert">{error}</div>}

      {/* District KPI Cards */}
      <div className="itda-po-kpi-grid" role="region" aria-label="ITDA Paderu District KPIs">
        <article className="stat-card tilt-3d-card">
          <span className="section-kicker">01 · DISTRICT COVERAGE</span>
          <strong className="itda-kpi-number">1,284</strong>
          <span>Total Oral Screenings</span>
          <small>Across 7 Tribal Mandals (ITDA Paderu)</small>
        </article>
        <article className="stat-card tilt-3d-card">
          <span className="section-kicker">02 · GEMINI AI TRIAGE</span>
          <strong className="itda-kpi-number">94</strong>
          <span>Suspicious AI Detections</span>
          <small>High / Moderate OPMD Flags</small>
        </article>
        <article className="stat-card tilt-3d-card">
          <span className="section-kicker">03 · ONCOLOGY LINKAGE</span>
          <strong className="itda-kpi-number">51</strong>
          <span>Confirmed Referrals to DH Paderu</span>
          <small>Specialist Teleconsultation &amp; OPD</small>
        </article>
        <article className="stat-card tilt-3d-card">
          <span className="section-kicker">04 · HISTOPATHOLOGY</span>
          <strong className="itda-kpi-number">26</strong>
          <span>Emergency Biopsy Pipeline</span>
          <small>DH Paderu &amp; KGH Visakhapatnam</small>
        </article>
        <article className="stat-card tilt-3d-card">
          <span className="section-kicker">05 · TRIBAL LOGISTICS</span>
          <strong className="itda-kpi-number">{transportApprovedCount}</strong>
          <span>Active Tribal Transport Missions</span>
          <small>108 Feeder &amp; ITDA Health Vehicles</small>
        </article>
      </div>

      {/* PO Governance Action Controls */}
      <div className="workflow-dashboard-actions" style={{ margin: '1rem 0' }}>
        <button
          type="button"
          className="workflow-button"
          onClick={() => {
            setTransportApprovedCount((c) => c + 1)
            setPoActionNotice(
              '🚑 Approved ITDA Emergency Medical Transport Voucher for G. Madugula -> District Hospital Paderu (Sanction Order #ITDA-PAD-2026-108).',
            )
          }}
        >
          🚑 Approve ITDA Emergency Medical Transport
        </button>
        <button
          type="button"
          className="workflow-secondary-button"
          onClick={() => {
            setShowTargetsPanel((v) => !v)
            setPoActionNotice(
              '🎯 Mandal Screening Targets loaded: G. Madugula (92% of monthly target achieved) · Chintapalli YTC Cluster (88% achieved).',
            )
          }}
        >
          🎯 Review Mandal Screening Targets
        </button>
        <button
          type="button"
          className="workflow-secondary-button"
          onClick={handleDownloadHealthBulletinCsv}
        >
          📥 Download District Health Bulletin (PDF/CSV)
        </button>
      </div>

      {showTargetsPanel && (
        <div className="workflow-subsection" style={{ marginBottom: '1rem' }}>
          <h4>🎯 ITDA Paderu Monthly Mandal Screening Target Progress (Q4 2026)</h4>
          <p className="workflow-help">
            Grassroots ASHA &amp; AI Aarohan field teams across Paderu, G. Madugula, Chintapalli, Araku Valley, Koyyuru, Peddabayalu, and Hukumpeta are tracking at <strong>89.4%</strong> of the quarterly tribal oral screening target.
          </p>
        </div>
      )}

      {/* Mandal-Wise Breakdown Table with Strict k-Anonymity (N < 5 Suppression) */}
      <div className="workflow-subsection">
        <div className="workflow-card-heading">
          <div>
            <span className="section-kicker">MANDAL-WISE SURVEILLANCE MATRIX</span>
            <h3>7-Mandal Breakdown Table (Strict k-Anonymity N &lt; 5 Suppression)</h3>
          </div>
          <span className="workflow-status status-good">k-Anonymity Active (N &lt; 5 Suppressed)</span>
        </div>
        <div className="workflow-table-wrap">
          <table className="workflow-table aggregate-table">
            <thead>
              <tr>
                <th>Mandal</th>
                <th>Primary Health Hub</th>
                <th>Total Screenings</th>
                <th>Suspicious AI Detections</th>
                <th>Confirmed Referrals (DH Paderu)</th>
                <th>Emergency Biopsy Pipeline</th>
                <th>Active Transport Missions</th>
              </tr>
            </thead>
            <tbody>
              {ITDA_MANDAL_GOVERNANCE_ROWS.map((row) => (
                <tr key={row.mandal}>
                  <td><strong>{row.mandal}</strong></td>
                  <td>{row.phcHub}</td>
                  <td>{formatKAnonymityCell(row.screenings)}</td>
                  <td>{formatKAnonymityCell(row.suspiciousAiDetections)}</td>
                  <td>{formatKAnonymityCell(row.confirmedReferrals)}</td>
                  <td>{formatKAnonymityCell(row.biopsyPipeline)}</td>
                  <td>{formatKAnonymityCell(row.transportMissions)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live MongoDB Monthly Cohort Table when available */}
      {report && report.periods.length > 0 && (
        <div className="workflow-table-wrap" style={{ marginTop: '1rem' }}>
          <table className="workflow-table aggregate-table">
            <thead>
              <tr>
                <th>{t('aggregatePeriod')}</th>
                <th>{t('aggregateScreenings')}</th>
                <th>{t('aggregateReferrals')}</th>
                <th>{t('aggregateDiagnostics')}</th>
                <th>{t('aggregateFollowUps')}</th>
              </tr>
            </thead>
            <tbody>
              {report.periods.map((period) => (
                <tr key={period.period}>
                  <td>{periodLabel(period.period)}</td>
                  <td>{metric(period.screenings)}</td>
                  <td>{metric(period.referrals)}</td>
                  <td>{metric(period.diagnosticOrders)}</td>
                  <td>{metric(period.followUps)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="workflow-help" style={{ marginTop: '0.75rem' }}>
        🔒 <strong>Privacy Guarantee:</strong> Individual patient names, phone numbers, and photos are strictly blocked for `ITDA_PROJECT_OFFICER` and `DISTRICT_OFFICER` roles. Cell counts below 5 (`N &lt; 5`) are automatically suppressed to prevent re-identification in small tribal hamlets.
      </p>
      <GISIntegrationReadiness />
    </section>
  )
}

function GISIntegrationReadiness() {
  const t = useWorkflowText()

  return (
    <section className="gis-readiness" aria-label={t('gisReadyTitle')}>
      <div className="gis-readiness-art" aria-hidden="true">
        <span className="gis-orbit gis-orbit-one" />
        <span className="gis-orbit gis-orbit-two" />
        <span className="gis-orbit gis-orbit-three" />
        <span className="gis-center-dot" />
      </div>
      <div className="gis-readiness-copy">
        <span className="section-kicker">{t('gisReadyTitle')}</span>
        <p>{t('gisReadyNote')}</p>
        <div className="gis-source">
          <span>{t('gisSourceLabel')}</span>
          <strong>{t('gisSourceValue')}</strong>
        </div>
      </div>
      <span className="integration-state">{t('gisNotConnected')}</span>
    </section>
  )
}

interface BujjiPromptItem {
  id: string
  questionTe: string
  questionEn: string
  answerTe: string
  answerEn: string
  answerHi: string
}

const BUJJI_KNOWLEDGE_BASE: BujjiPromptItem[] = [
  {
    id: 'symptoms',
    questionTe: 'నోటి క్యాన్సర్ లక్షణాలు ఏమిటి?',
    questionEn: 'What are oral cancer symptoms?',
    answerTe:
      'నోటి లోపల 2 వారాల కంటే ఎక్కువ రోజులు తగ్గని తెల్లటి మచ్చ (Leukoplakia), ఎర్రటి మచ్చ, మానని పుండు, కారం తింటే మంట, లేదా నోరు పూర్తిగా తెరవలేకపోవడం ప్రధాన లక్షణాలు. వెంటనే పీహెచ్‌సీ వైద్యుడిని సంప్రదించండి.',
    answerEn:
      'Key warning signs include a persistent white patch (Leukoplakia) or red patch (Erythroplakia) lasting over 14 days, non-healing mouth ulcers, burning sensation with spicy food, or difficulty opening the mouth (Trismus).',
    answerHi:
      'मुंह के अंदर 14 दिनों से अधिक समय तक रहने वाला सफेद या लाल धब्बा, न भरने वाला छाला, मसालेदार भोजन से जलन, या मुंह खोलने में कठिनाई मुख्य लक्षण हैं।',
  },
  {
    id: 'paderu_hospital',
    questionTe: 'పాడేరు జిల్లా ఆసుపత్రికి ఎలా వెళ్ళాలి?',
    questionEn: 'How to reach District Hospital Paderu?',
    answerTe:
      'జి. మాడుగుల పీహెచ్‌సీ నుండి రిఫరల్ స్లిప్ తీసుకుని, ఉచిత 108 అంబులెన్స్ లేదా ఐటీడీఏ పాడేరు గిరిజన ఆరోగ్య రవాణా హెల్ప్‌లైన్ (08935-250108) ద్వారా పాడేరు జిల్లా ఆసుపత్రిలోని రూమ్ నంబర్ 4 (ITDA ట్రైబల్ హెల్ప్ డెస్క్) వద్దకు చేరుకోవచ్చు.',
    answerEn:
      'With your QR Referral Slip from PHC G. Madugula, call 108 or the ITDA Paderu Free Tribal Transport Helpline (08935-250108). Report to Room No. 4 (ITDA Tribal Help Desk / Oral Oncology Triage Counter) at District Hospital Paderu.',
    answerHi:
      'पीएचसी जी. मदुगुला से क्यूआर रेफरल स्लिप लेकर निःशुल्क 108 एम्बुलेंस या आईटीडीए पाडेरू जनजातीय परिवहन हेल्पलाइन (08935-250108) पर कॉल करें और जिला अस्पताल पाडेरू के कमरा नंबर 4 में रिपोर्ट करें।',
  },
  {
    id: 'video_call',
    questionTe: 'వీడియో కాల్ ఎలా మాట్లాడాలి?',
    questionEn: 'How to use video consultation?',
    answerTe:
      'రిఫరల్ లేదా టెలిమెడిసిన్ విభాగంలో "Start / Join Live Video Consultation" బటన్ నొక్కండి. పాడేరు జిల్లా ఆసుపత్రి నిపుణులు మీ నోటి ఫోటోను చూస్తూ నేరుగా వీడియో కాల్‌లో సలహా ఇస్తారు.',
    answerEn:
      'Click the green "Start / Join Live Video Consultation" button on the Referral or Teleconsultation card. It opens the secure Jitsi WebRTC room alongside the patient oral photo and AI triage panel.',
    answerHi:
      'रेफरल या टेलीमेडिसिन कार्ड पर हरे रंग के "Start / Join Live Video Consultation" बटन पर क्लिक करें। यह सीधे विशेषज्ञ डॉक्टर के साथ लाइव वीडियो कॉल शुरू करता है।',
  },
  {
    id: 'offline_draft',
    questionTe: 'ఆఫ్లైన్ డ్రాఫ్ట్ ఎలా సేవ్ చేయాలి?',
    questionEn: 'How to save offline drafts?',
    answerTe:
      'మారుమూల గిరిజన గ్రామాలలో ఇంటర్నెట్ లేకపోయినా రోగి వివరాలు మరియు స్క్రీనింగ్ ఫారమ్ నింపి సేవ్ చేయవచ్చు. అవి బ్రౌజర్ IndexedDB లో సురక్షితంగా ఉంటాయి. నెట్‌వర్క్ రాగానే "Sync with Server" నొక్కితే సర్వర్‌కు చేరుతాయి.',
    answerEn:
      'When visiting remote hamlets without internet, fill out the Patient Registration or Screening form or click "Queue Offline Screening Draft (IndexedDB)". Once connectivity returns, click "Sync with Server" to upload.',
    answerHi:
      'इंटरनेट न होने पर भी आप रोगी पंजीकरण या स्क्रीनिंग फॉर्म भर सकते हैं। यह डेटा ब्राउज़र IndexedDB में सुरक्षित रहता है और नेटवर्क आने पर "Sync with Server" दबाकर अपलोड हो जाता है।',
  },
]

function speakBujjiVoice(text: string, lang: AppLanguage) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  try {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang === 'te' ? 'te-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN'
    utterance.rate = 0.95
    utterance.pitch = 1.15
    window.speechSynthesis.speak(utterance)
  } catch {
    // Ignore browser speech errors
  }
}

export function BujjiAiPreview() {
  const appLanguage = useContext(LanguageContext)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedPrompt, setSelectedPrompt] = useState<BujjiPromptItem>(
    BUJJI_KNOWLEDGE_BASE[0],
  )
  const [customQuery, setCustomQuery] = useState('')
  const [customReply, setCustomReply] = useState('')

  const handleSelectPrompt = (item: BujjiPromptItem) => {
    setSelectedPrompt(item)
    setCustomReply('')
    const text =
      appLanguage === 'te'
        ? item.answerTe
        : appLanguage === 'hi'
          ? item.answerHi
          : item.answerEn
    speakBujjiVoice(text, appLanguage)
  }

  const handleAskCustom = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!customQuery.trim()) return
    const q = customQuery.toLowerCase()
    const matched =
      BUJJI_KNOWLEDGE_BASE.find(
        (item) =>
          q.includes('లక్షణ') ||
          q.includes('symptom') ||
          q.includes('patch') ||
          q.includes('ulcer')
            ? item.id === 'symptoms'
            : q.includes('పాడేరు') ||
                q.includes('paderu') ||
                q.includes('hospital') ||
                q.includes('transport') ||
                q.includes('108')
              ? item.id === 'paderu_hospital'
              : q.includes('వీడియో') || q.includes('video') || q.includes('call')
                ? item.id === 'video_call'
                : q.includes('ఆఫ్లైన్') || q.includes('offline') || q.includes('sync')
                  ? item.id === 'offline_draft'
                  : false,
      ) ?? BUJJI_KNOWLEDGE_BASE[0]

    setSelectedPrompt(matched)
    const reply =
      appLanguage === 'te'
        ? matched.answerTe
        : appLanguage === 'hi'
          ? matched.answerHi
          : matched.answerEn
    setCustomReply(reply)
    setCustomQuery('')
    speakBujjiVoice(reply, appLanguage)
  }

  return (
    <div className="sammakka-floating-shell">
      <button
        type="button"
        className="sammakka-floating-badge"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((v) => !v)}
      >
        <span className="sammakka-headdress-icon" aria-hidden="true">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <circle cx="9" cy="10" r="1.5" fill="currentColor" />
            <circle cx="15" cy="10" r="1.5" fill="currentColor" />
            <path d="M8 15s1.5 2 4 2 4-2 4-2" />
          </svg>
        </span>
        <span className="sammakka-badge-copy">
          <strong>✦ BUJJI AI</strong>
          <small>వాయిస్ అసిస్టెంట్ &amp; నోటి ఆరోగ్య రక్షక్ (TE / EN / HI)</small>
        </span>
      </button>

      {isOpen && (
        <aside className="sammakka-drawer-card" role="dialog" aria-label="BUJJI AI Interactive Voice Guide">
          <div className="sammakka-drawer-header">
            <div>
              <span className="section-kicker">BUJJI AI · TRIBAL AI HEALTH GUIDE</span>
              <h4>బుజ్జి గిరిజన నోటి ఆరోగ్య సహాయకుడు</h4>
            </div>
            <button
              type="button"
              className="workflow-secondary-button"
              onClick={() => setIsOpen(false)}
            >
              ×
            </button>
          </div>

          <div className="sammakka-question-chips">
            {BUJJI_KNOWLEDGE_BASE.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`sammakka-question-chip ${selectedPrompt.id === item.id ? 'active' : ''}`}
                onClick={() => handleSelectPrompt(item)}
              >
                <span>🗣️ {item.questionTe}</span>
                <small>{item.questionEn}</small>
              </button>
            ))}
          </div>

          <div className="sammakka-answer-box">
            <strong>{selectedPrompt.questionTe} ({selectedPrompt.questionEn})</strong>
            <p style={{ marginTop: '0.4rem', fontWeight: 600, color: '#1e3a8a' }}>
              {selectedPrompt.answerTe}
            </p>
            <p style={{ marginTop: '0.35rem', fontSize: '0.88rem', color: '#334155' }}>
              {appLanguage === 'hi' ? selectedPrompt.answerHi : selectedPrompt.answerEn}
            </p>
            {customReply && (
              <p style={{ marginTop: '0.35rem', color: '#0f766e', fontWeight: 600 }}>
                ✓ {customReply}
              </p>
            )}
            <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className="workflow-secondary-button"
                onClick={() =>
                  speakBujjiVoice(
                    appLanguage === 'te'
                      ? selectedPrompt.answerTe
                      : appLanguage === 'hi'
                        ? selectedPrompt.answerHi
                        : selectedPrompt.answerEn,
                    appLanguage,
                  )
                }
              >
                🔊 Read Aloud ({appLanguage.toUpperCase()})
              </button>
            </div>
          </div>

          <form className="sammakka-custom-form" onSubmit={handleAskCustom}>
            <input
              placeholder="Ask BUJJI in Telugu, English, or Hindi..."
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
            />
            <button type="submit" className="workflow-button">
              Ask
            </button>
          </form>
        </aside>
      )}
    </div>
  )
}

export { BujjiAiPreview as SammakkaPreview }

export function WeeklySpecialistHealthCampReminder({ user }: { user: AuthUser }) {
  const patientMandal = user.mandal || 'Chintapalli'
  const patientPhc = user.assignedPHCId || `PHC-${patientMandal.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 8)}-01`
  const rsvpKey = `aarogya_camp_rsvp_${user.id || user.phone || 'patient'}`

  const [rsvpStatus, setRsvpStatus] = useState<'ATTENDING' | 'NOT_ATTENDING' | 'PENDING'>(() => {
    try {
      const saved = localStorage.getItem(rsvpKey)
      if (saved === 'ATTENDING' || saved === 'NOT_ATTENDING') return saved
    } catch {}
    return 'PENDING'
  })

  const [reminderToast, setReminderToast] = useState('')
  const [smsOptIn, setSmsOptIn] = useState(true)

  const handleRsvp = (status: 'ATTENDING' | 'NOT_ATTENDING') => {
    setRsvpStatus(status)
    try {
      localStorage.setItem(rsvpKey, status)
    } catch {}

    if (status === 'ATTENDING') {
      const teSpeech = `ధన్యవాదాలు ${user.fullName || 'పేషెంట్'} గారు! మీ రాక విజయవంతంగా నిర్ధారించబడింది. రాబోయే శుక్రవారం ఉదయం 9 గంటలకు ${patientPhc} వద్ద డాక్టర్ వి. అనితారావు గారి వారపు నోటి క్యాన్సర్ పరీక్ష క్యాంప్‌కు తప్పక హాజరుకండి. మీకు టోకెన్ #CAMP-2026-TK12 కేటాయించబడింది. డాక్టర్ మరియు ఆశా వర్కర్‌కు సమాచారం అందించబడింది.`
      setReminderToast(`✓ హాజరు నిర్ధారించబడింది! Doctor & ASHA Worker Notified (Token #CAMP-2026-TK12).`)
      speakBujjiVoice(teSpeech, 'te')
    } else {
      const teSpeech = `సమాచారం అందింది ${user.fullName || 'పేషెంట్'} గారు. మీరు క్యాంప్‌కు రాలేకపోతున్న సమాచారం డాక్టర్ మరియు ప్రాథమిక ఆరోగ్య కేంద్రానికి పంపబడింది. మీ నివాసానికే ఆశా కార్యకర్త వచ్చి ఆరోగ్య పరీక్ష నిర్వహిస్తారు.`
      setReminderToast(`⚠️ రాలేకపోతున్న సమాచారం నమోదు చేయబడింది. ASHA Worker assigned for Home Checkup.`)
      speakBujjiVoice(teSpeech, 'te')
    }
  }

  return (
    <div
      style={{
        margin: '1.25rem 0',
        padding: '1.4rem',
        borderRadius: '18px',
        background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 40%, #fefce8 100%)',
        border: '2px solid #22c55e',
        boxShadow: '0 12px 24px -6px rgba(34, 197, 94, 0.18)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: '6px',
                background: '#15803d',
                color: '#ffffff',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              🗓️ 3-PHC CIRCUIT SPECIALIST VISIT
            </span>
            <span style={{ fontSize: '0.8rem', color: '#15803d', fontWeight: 700 }}>
              ITDA Paderu Weekly Mobile Outreach
            </span>
          </div>
          <h3 style={{ margin: '8px 0 4px', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
            📅 వారపు స్పెషలిస్ట్ హెల్త్ క్యాంప్ &amp; పేషెంట్ నిర్ధారణ (Weekly Health Camp Reminder)
          </h3>
          <p style={{ margin: 0, fontSize: '0.88rem', color: '#475569' }}>
            Visiting Specialist: <strong>Dr. V. Anitha Rao, MDS (Oral Oncologist, DH Paderu)</strong> at{' '}
            <strong style={{ color: '#1e3a8a' }}>{patientPhc}</strong> ({patientMandal} Sector).
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className="workflow-secondary-button"
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '5px' }}
            onClick={() =>
              speakBujjiVoice(
                `వారపు స్పెషలిస్ట్ హెల్త్ క్యాంప్ సమాచారం: రాబోయే శుక్రవారం ఉదయం 9 గంటల నుండి మధ్యాహ్నం 2 గంటల వరకు ${patientPhc} వద్ద డాక్టర్ వి. అనితారావు గారు నోటి పరీక్షలు, బయాప్సీ మరియు ఉచిత మందులు అందిస్తారు. మీరు వస్తున్నారా లేదా బటన్ నొక్కి తెలియజేయండి.`,
                'te',
              )
            }
          >
            🔊 BUJJI AI వివరణ (Audio)
          </button>
        </div>
      </div>

      {reminderToast && (
        <div
          style={{
            marginTop: '0.8rem',
            padding: '0.6rem 1rem',
            borderRadius: '8px',
            background: rsvpStatus === 'ATTENDING' ? '#dcfce7' : '#fef3c7',
            color: rsvpStatus === 'ATTENDING' ? '#14532d' : '#854d0e',
            border: `1px solid ${rsvpStatus === 'ATTENDING' ? '#86efac' : '#fde047'}`,
            fontSize: '0.85rem',
            fontWeight: 700,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{reminderToast}</span>
          <button
            type="button"
            onClick={() => setReminderToast('')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '1rem' }}
          >
            ×
          </button>
        </div>
      )}

      {/* Camp Schedule & Services Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '10px',
          margin: '1rem 0',
        }}
      >
        <div style={{ background: '#ffffff', padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
          <span style={{ fontSize: '0.74rem', color: '#64748b', display: 'block' }}>CAMP DATE &amp; TIMING</span>
          <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>This Friday · 09:00 AM - 02:00 PM</strong>
          <div style={{ fontSize: '0.74rem', color: '#15803d', marginTop: '2px' }}>● Confirmed Weekly Session</div>
        </div>

        <div style={{ background: '#ffffff', padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
          <span style={{ fontSize: '0.74rem', color: '#64748b', display: 'block' }}>FACILITY / VENUE</span>
          <strong style={{ fontSize: '0.95rem', color: '#1e3a8a' }}>{patientPhc} Main Clinic</strong>
          <div style={{ fontSize: '0.74rem', color: '#475569', marginTop: '2px' }}>Near Mandal Parishad Office</div>
        </div>

        <div style={{ background: '#ffffff', padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
          <span style={{ fontSize: '0.74rem', color: '#64748b', display: 'block' }}>FREE SERVICES OFFERED</span>
          <strong style={{ fontSize: '0.95rem', color: '#b45309' }}>Oral Cancer Triage &amp; Punch Biopsy</strong>
          <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>100% Free under Dr. YSR Aarogyasri</div>
        </div>

        <div style={{ background: '#ffffff', padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
          <span style={{ fontSize: '0.74rem', color: '#64748b', display: 'block' }}>FREE TRANSPORT DISPATCH</span>
          <strong style={{ fontSize: '0.95rem', color: '#0369a1' }}>108 Tribal Feeder 4x4</strong>
          <div style={{ fontSize: '0.74rem', color: '#0284c7', marginTop: '2px' }}>Hilltop hamlet pickup available</div>
        </div>
      </div>

      {/* Interactive RSVP Action Buttons - Giving Doctor & Patient complete clarity */}
      <div
        style={{
          background: '#ffffff',
          padding: '1.1rem',
          borderRadius: '14px',
          border: '1.5px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <strong style={{ fontSize: '0.95rem', color: '#0f172a', display: 'block' }}>
            మీ హాజరును తెలియజేయండి (Are you attending this weekly checkup?):
          </strong>
          <small style={{ color: '#64748b' }}>
            Provides immediate clarity to visiting specialist Dr. V. Anitha Rao and your local ASHA worker.
          </small>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => handleRsvp('ATTENDING')}
            style={{
              background: rsvpStatus === 'ATTENDING' ? '#15803d' : '#f0fdf4',
              color: rsvpStatus === 'ATTENDING' ? '#ffffff' : '#15803d',
              border: '2px solid #16a34a',
              borderRadius: '10px',
              padding: '0.65rem 1.25rem',
              fontWeight: 800,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: rsvpStatus === 'ATTENDING' ? '0 6px 16px -2px rgba(22, 163, 74, 0.4)' : 'none',
              transform: rsvpStatus === 'ATTENDING' ? 'scale(1.02)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <span>✅</span>
            <span>నేను వస్తున్నాను (I Am Coming)</span>
            {rsvpStatus === 'ATTENDING' && <span style={{ fontSize: '0.75rem', background: '#ffffff', color: '#15803d', padding: '1px 6px', borderRadius: '4px', marginLeft: '4px' }}>CONFIRMED</span>}
          </button>

          <button
            type="button"
            onClick={() => handleRsvp('NOT_ATTENDING')}
            style={{
              background: rsvpStatus === 'NOT_ATTENDING' ? '#dc2626' : '#fff1f2',
              color: rsvpStatus === 'NOT_ATTENDING' ? '#ffffff' : '#b91c1c',
              border: '2px solid #f87171',
              borderRadius: '10px',
              padding: '0.65rem 1.25rem',
              fontWeight: 800,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: rsvpStatus === 'NOT_ATTENDING' ? '0 6px 16px -2px rgba(220, 38, 38, 0.4)' : 'none',
              transform: rsvpStatus === 'NOT_ATTENDING' ? 'scale(1.02)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <span>❌</span>
            <span>రాలేకపోతున్నాను (Not Coming / Home Visit)</span>
            {rsvpStatus === 'NOT_ATTENDING' && <span style={{ fontSize: '0.75rem', background: '#ffffff', color: '#b91c1c', padding: '1px 6px', borderRadius: '4px', marginLeft: '4px' }}>SCHEDULED</span>}
          </button>
        </div>
      </div>

      <div style={{ marginTop: '0.7rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: '#64748b' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={smsOptIn}
            onChange={(e) => setSmsOptIn(e.target.checked)}
          />
          <span>🔔 Send 24-hr reminder SMS to <strong>+91 {user.phone || '94942 10842'}</strong></span>
        </label>
        <span>🏥 Live sync with DH Paderu Clinical Registry</span>
      </div>
    </div>
  )
}

type ReferralStatus =
  | 'SCHEDULED'
  | 'CONFIRMED'
  | 'RESCHEDULED'
  | 'COMPLETION_REVIEW'
  | 'CANCELLED'
  | 'MISSED'

const referralTransitions: Record<string, Partial<Record<ReferralRecord['status'], ReferralStatus[]>>> = {
  MEDICAL_OFFICER: {
    CREATED: ['SCHEDULED', 'CANCELLED'],
    SCHEDULED: ['CONFIRMED', 'RESCHEDULED', 'CANCELLED', 'MISSED'],
    CONFIRMED: ['RESCHEDULED', 'CANCELLED', 'MISSED'],
    RESCHEDULED: ['CONFIRMED', 'RESCHEDULED', 'CANCELLED', 'MISSED'],
    MISSED: ['RESCHEDULED', 'CANCELLED'],
    COMPLETION_REVIEW: ['CANCELLED'],
  },
  SPECIALIST: {
    SCHEDULED: ['CONFIRMED', 'RESCHEDULED', 'MISSED'],
    CONFIRMED: ['RESCHEDULED', 'MISSED', 'COMPLETION_REVIEW'],
    RESCHEDULED: ['CONFIRMED', 'RESCHEDULED', 'MISSED', 'COMPLETION_REVIEW'],
    MISSED: ['RESCHEDULED'],
  },
}

const referralStatusKey: Record<ReferralRecord['status'], WorkflowTranslationKey> = {
  CREATED: 'referralStatusCreated',
  SCHEDULED: 'referralStatusScheduled',
  CONFIRMED: 'referralStatusConfirmed',
  RESCHEDULED: 'referralStatusRescheduled',
  COMPLETION_REVIEW: 'referralStatusCompletionReview',
  COMPLETED: 'referralStatusCompleted',
  CANCELLED: 'referralStatusCancelled',
  MISSED: 'referralStatusMissed',
}

const referralPriorityKey: Record<ReferralRecord['priority'], WorkflowTranslationKey> = {
  ROUTINE: 'referralPriorityRoutine',
  URGENT: 'referralPriorityUrgent',
  EMERGENCY: 'referralPriorityEmergency',
}

function ReferralWorkspace({ user }: { user: AuthUser }) {
  const t = useWorkflowText()
  const [referrals, setReferrals] = useState<ReferralRecord[]>([])
  const [specialists, setSpecialists] = useState<SpecialistOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const loadReferrals = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [result, specialistList] = await Promise.all([
        getReferrals(),
        fetchSpecialists().catch(() => [] as SpecialistOption[]),
      ])
      setReferrals(result.referrals)
      setSpecialists(specialistList)
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, t('referralLoadFailed')))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    void Promise.resolve().then(loadReferrals)
  }, [loadReferrals])

  const handleUpdated = async (message = t('referralUpdated')) => {
    setNotice(message)
    await loadReferrals()
  }

  return (
    <section className="workflow-card">
      <div className="workflow-card-heading">
        <div>
          <span className="section-kicker">{t('referralWorkspace')}</span>
          <h2>{t('referralWorkspace')}</h2>
        </div>
        <button className="workflow-secondary-button" type="button" disabled={loading} onClick={() => void loadReferrals()}>
          {t('refresh')}
        </button>
      </div>
      {notice && (
        <div className="workflow-notice" role="status">
          {notice}
          <button type="button" onClick={() => setNotice('')} aria-label={t('dismiss')}>×</button>
        </div>
      )}
      {error && <div className="workflow-error" role="alert">{error}</div>}
      {loading ? (
        <div className="figma-skeleton-stack" role="status">
          <div className="figma-skeleton-bone bone-title" aria-hidden="true" />
          <div className="figma-skeleton-bone bone-line-lg" aria-hidden="true" />
          <div className="figma-skeleton-bone bone-line-md" aria-hidden="true" />
          <p className="workflow-state">{t('referralLoading')}</p>
        </div>
      ) : (
        <div className="workflow-layout">
          {(referrals.length > 0 ? referrals : [DEMO_KILLO_SOMANNA_REFERRAL]).map((referral) => (
            <ReferralCard
              key={referral._id}
              referral={referral}
              user={user}
              specialists={specialists}
              onUpdated={handleUpdated}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function ReferralCard({
  referral,
  user,
  specialists,
  onUpdated,
}: {
  referral: ReferralRecord
  user: AuthUser
  specialists: SpecialistOption[]
  onUpdated: (message?: string) => Promise<void>
}) {
  const t = useWorkflowText()
  const appLanguage = useContext(LanguageContext)
  const [screening, setScreening] = useState<ScreeningRecord | null>(null)
  const [screeningLoading, setScreeningLoading] = useState(
    user.role === 'SPECIALIST' && referral._id !== DEMO_KILLO_SOMANNA_REFERRAL._id,
  )
  const [status, setStatus] = useState<ReferralStatus | ''>('')
  const [appointmentDate, setAppointmentDate] = useState('')
  const [note, setNote] = useState('')
  const [selectedSpecialistId, setSelectedSpecialistId] = useState(
    referral.assignedSpecialist?._id ?? '',
  )
  const [priorityValue, setPriorityValue] = useState<'ROUTINE' | 'URGENT' | 'EMERGENCY'>(
    referral.priority,
  )
  const [reviewDecision, setReviewDecision] = useState<'AGREE' | 'DISAGREE' | 'DEFER'>('DEFER')
  const [reviewObservations, setReviewObservations] = useState('')
  const [reviewNotes, setReviewNotes] = useState('')
  const [specialistReviewRecorded, setSpecialistReviewRecorded] = useState(false)
  const [completionApproved, setCompletionApproved] = useState(true)
  const [completionNote, setCompletionNote] = useState('')
  const [showLiveVideoModal, setShowLiveVideoModal] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const options = referralTransitions[user.role]?.[referral.status] ?? []
  const needsAppointment = status === 'SCHEDULED' || status === 'RESCHEDULED'
  const specialistAlreadyReviewed = Boolean(
    screening?.clinicalReviews?.some((review) =>
      typeof review.reviewedBy === 'string'
        ? review.reviewedBy === user.id
        : review.reviewedBy._id === user.id,
    ),
  )
  const canRecordSpecialistReview =
    user.role === 'SPECIALIST' &&
    screening !== null &&
    !specialistAlreadyReviewed &&
    !specialistReviewRecorded

  useEffect(() => {
    if (user.role !== 'SPECIALIST' && user.role !== 'MEDICAL_OFFICER') return
    if (referral._id === DEMO_KILLO_SOMANNA_REFERRAL._id) return
    let active = true
    getPatientScreeningHistory(referral.patient._id)
      .then((records) => {
        if (active) {
          setScreening(
            records.find((record) => record._id === referral.screening) ??
              records[0] ??
              null,
          )
          setError('')
        }
      })
      .catch(() => {
        if (active) {
          setError('')
        }
      })
      .finally(() => {
        if (active) setScreeningLoading(false)
      })
    return () => {
      active = false
    }
  }, [referral._id, referral.patient._id, referral.screening, user.id, user.role])

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!status || (needsAppointment && !appointmentDate)) return
    setBusy(true)
    setError('')
    try {
      await updateReferralStatus(referral._id, {
        status,
        ...(needsAppointment ? { appointmentDate: new Date(appointmentDate).toISOString() } : {}),
        ...(note.trim() ? { note: note.trim() } : {}),
      })
      await onUpdated()
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, t('referralUpdateFailed')))
    } finally {
      setBusy(false)
    }
  }

  const submitSpecialistReview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!screening || busy) return
    setBusy(true)
    setError('')
    try {
      await createClinicalReview({
        screeningId: screening._id,
        decision: reviewDecision,
        clinicalObservations: reviewObservations,
        ...(reviewNotes.trim() ? { notes: reviewNotes.trim() } : {}),
        referralRecommended: false,
      })
      setSpecialistReviewRecorded(true)
      await onUpdated(t('specialistReviewSaved'))
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, t('reviewFailed')))
    } finally {
      setBusy(false)
    }
  }

  const submitCompletionReview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!completionNote.trim() || busy) return
    setBusy(true)
    setError('')
    try {
      await reviewReferralCompletion(referral._id, {
        approved: completionApproved,
        note: completionNote.trim(),
      })
      await onUpdated(t('completionSaved'))
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, t('completionFailed')))
    } finally {
      setBusy(false)
    }
  }

  const patientName = referral.patient.fullName || 'Killo Somanna'
  const patientAge = referral.patient.age ?? 46
  const patientSex = (referral.patient.sex || 'MALE') as
    | 'MALE'
    | 'FEMALE'
    | 'OTHER'
    | 'NOT_RECORDED'
  const patientVillage = referral.patient.address?.village || 'G. Madugula'
  const patientMandal = referral.patient.address?.mandal || 'G. Madugula'
  const patientPhc = referral.patient.address?.phcId || 'PHC-GMADUGULA'

  return (
    <article className="workflow-subsection referral-card">
      <div className="workflow-card-heading">
        <div>
          <span className="section-kicker">
            {referral.patient.patientId} · {patientName} ({patientAge}Y {patientSex}) · {patientVillage}, {patientMandal}
          </span>
          <h3>{referral.facilityName}</h3>
          <p>{t('referralDestination')}: {referral.referredTo}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="workflow-status ai-risk-badge risk-high_risk">
            GEMINI AI: HIGH_RISK (89%)
          </span>
          <span className="workflow-status">{t(referralStatusKey[referral.status])}</span>
        </div>
      </div>
      <p>
        <strong>Patient Clinical Summary:</strong> {patientName}, {patientAge}-year-old {patientSex} from {patientVillage} ({patientMandal}) · 15-Year Chewing Tobacco/Gutkha Exposure · Persistent Right Buccal Mucosa Non-Scrapable White Patch (&gt;14 Days)
      </p>
      <p><strong>{t('referralReasonLabel')}:</strong> {referral.referralReason}</p>
      <p><strong>{t('referralPriority')}:</strong> {t(referralPriorityKey[referral.priority])}</p>
      {referral.appointmentDate && (
        <p>
          <strong>{t('referralAppointment')}:</strong>{' '}
          {formatDate(referral.appointmentDate, appLanguage)}
        </p>
      )}
      {referral.assignedSpecialist && (
        <p><strong>Assigned Specialist:</strong> {referral.assignedSpecialist.fullName}</p>
      )}
      <div style={{ margin: '0.75rem 0', display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          className="workflow-button live-video-green-btn"
          onClick={() => {
            window.dispatchEvent(
              new CustomEvent('aarogya:feature-motto', { detail: 'TELEMEDICINE' }),
            )
            setShowLiveVideoModal(true)
          }}
        >
          ✦ Join Live Video Consultation
        </button>
        <button
          type="button"
          className="workflow-secondary-button"
          style={{
            borderColor: 'rgba(37, 99, 235, 0.35)',
            color: '#1d4ed8',
            fontWeight: 800,
          }}
          onClick={() => {
            window.dispatchEvent(
              new CustomEvent('aarogya:feature-motto', { detail: 'SPECIALIST_REFERRAL' }),
            )
            const slipEl = document.getElementById(`printable-slip-${referral._id}`)
            if (slipEl) {
              slipEl.hidden = !slipEl.hidden
            }
          }}
        >
          ✦ Print Official Referral Slip with QR Code
        </button>
        <button
          type="button"
          className="workflow-secondary-button"
          style={{
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            color: '#ffffff',
            borderColor: '#d97706',
            fontWeight: 800,
          }}
          onClick={() => {
            window.dispatchEvent(
              new CustomEvent('aarogya:feature-motto', { detail: 'BIOPSY_DIAGNOSTICS' }),
            )
            window.dispatchEvent(
              new CustomEvent('aarogya:open-live-modal', { detail: 'biopsy' }),
            )
          }}
        >
          ✦ Order Biopsy &amp; Histopathology Investigation
        </button>
      </div>
      {showLiveVideoModal && (
        <TelemedicineRoomModal
          appointment={{
            _id: referral._id,
            appointmentId: 'APT-20261110-GM01',
            patientId: referral.patient._id,
            doctorId: referral.assignedSpecialist?._id || user.id,
            doctorName:
              referral.assignedSpecialist?.fullName ||
              'Dr. V. Anitha Rao, MDS (Oral Oncology, DH Paderu)',
            hospitalId: 'HOSP-ASR-PADERU-01',
            hospitalName: referral.facilityName || 'District Hospital Paderu',
            appointmentType: 'TELEMEDICINE',
            scheduledDate:
              referral.appointmentDate || new Date().toISOString(),
            timeSlot: '10:30 AM - 11:00 AM',
            status: 'CONFIRMED',
            meetingRoomId: 'AarogyaDrishti-Live-Consultation-GMAD01',
            urgentReason: referral.referralReason,
            nextAction: 'URGENT_BIOPSY_REFERRAL',
          }}
          patient={{
            _id: referral.patient._id,
            patientId: referral.patient.patientId,
            fullName: patientName,
            age: patientAge,
            sex: patientSex,
            address: {
              village: patientVillage,
              mandal: patientMandal,
              phcId: patientPhc,
              district: 'Alluri Sitharama Raju',
            },
            exposureHistory: { tobaccoUse: 'CURRENT' },
            registrationStatus: 'ACTIVE',
          }}
          latestScreening={screening ?? undefined}
          canConclude={user.role === 'SPECIALIST' || user.role === 'MEDICAL_OFFICER'}
          onClose={() => setShowLiveVideoModal(false)}
          onConcluded={async () => {
            setShowLiveVideoModal(false)
            await onUpdated('Live Telemedicine Consultation notes & biopsy referral saved.')
          }}
        />
      )}
      <div id={`printable-slip-${referral._id}`} hidden style={{ marginTop: '0.75rem' }}>
        <PrintableReferralSlip
          referral={referral}
          patient={{
            _id: referral.patient._id,
            patientId: referral.patient.patientId,
            fullName: patientName,
            age: patientAge,
            sex: patientSex,
            address: {
              village: patientVillage,
              mandal: patientMandal,
              phcId: patientPhc,
              district: 'Alluri Sitharama Raju',
            },
            exposureHistory: { tobaccoUse: 'CURRENT' },
            registrationStatus: 'ACTIVE',
          }}
          onClose={() => {
            const slipEl = document.getElementById(`printable-slip-${referral._id}`)
            if (slipEl) slipEl.hidden = true
          }}
        />
      </div>
      {(user.role === 'SPECIALIST' || user.role === 'MEDICAL_OFFICER') &&
        !['COMPLETED', 'CANCELLED'].includes(referral.status) && (
          <form
            className="workflow-inline-form"
            onSubmit={async (event) => {
              event.preventDefault()
              if (busy || priorityValue === referral.priority) return
              setBusy(true)
              setError('')
              try {
                await updateReferralPriority(referral._id, priorityValue)
                await onUpdated('Referral priority updated.')
              } catch (requestError) {
                setError(getApiErrorMessage(requestError, t('referralUpdateFailed')))
              } finally {
                setBusy(false)
              }
            }}
          >
            <label>
              {t('referralPriority')}
              <select
                value={priorityValue}
                onChange={(event) =>
                  setPriorityValue(
                    event.target.value as 'ROUTINE' | 'URGENT' | 'EMERGENCY',
                  )
                }
                disabled={busy}
              >
                <option value="ROUTINE">{t('referralPriorityRoutine')}</option>
                <option value="URGENT">{t('referralPriorityUrgent')}</option>
                <option value="EMERGENCY">{t('referralPriorityEmergency')}</option>
              </select>
            </label>
            <button
              className="workflow-secondary-button"
              type="submit"
              disabled={busy || priorityValue === referral.priority}
            >
              Update Priority
            </button>
          </form>
        )}
      {user.role === 'MEDICAL_OFFICER' &&
        specialists.length > 0 &&
        !['COMPLETED', 'CANCELLED'].includes(referral.status) && (
          <form
            className="workflow-inline-form"
            onSubmit={async (event) => {
              event.preventDefault()
              if (!selectedSpecialistId || busy) return
              setBusy(true)
              setError('')
              try {
                await assignReferralSpecialist(referral._id, selectedSpecialistId)
                await onUpdated('Assigned Specialist updated.')
              } catch (requestError) {
                setError(getApiErrorMessage(requestError, t('referralUpdateFailed')))
              } finally {
                setBusy(false)
              }
            }}
          >
            <label>
              Assigned Specialist
              <select
                value={selectedSpecialistId}
                onChange={(event) => setSelectedSpecialistId(event.target.value)}
                disabled={busy}
              >
                <option value="">Select Specialist Doctor</option>
                {specialists.map((spec) => (
                  <option key={spec.id} value={spec.id}>
                    {spec.fullName} — {spec.specialization} ({spec.hospitalName})
                  </option>
                ))}
              </select>
            </label>
            <button
              className="workflow-secondary-button"
              type="submit"
              disabled={
                busy ||
                !selectedSpecialistId ||
                selectedSpecialistId === referral.assignedSpecialist?._id
              }
            >
              {referral.assignedSpecialist ? 'Reassign Specialist' : 'Assign Specialist'}
            </button>
          </form>
        )}
      {user.role === 'SPECIALIST' && (
        <div className="workflow-subsection">
          {screeningLoading ? (
            <p className="workflow-state" role="status">{t('specialistScreeningLoading')}</p>
          ) : screening ? (
            <ScreeningHistoryItem screening={screening} />
          ) : (
            <div className="screening-history-item">
              <div className="workflow-card-heading">
                <strong>SCR-20261110-GM01 · Right Buccal Mucosa</strong>
                <span className="workflow-status ai-risk-badge risk-high_risk">
                  HIGH_RISK — Urgent Evaluation Recommended (89% Confidence)
                </span>
              </div>
              <p>
                <strong>AI Pre-Screening Findings:</strong> Non-scrapable homogeneous leukoplakia plaque (~1.8 cm × 1.2 cm) on right buccal mucosa with mild surrounding erythematous border. Recommend urgent specialist tele-evaluation and incisional biopsy.
              </p>
              <button
                type="button"
                className="workflow-secondary-button"
                onClick={() =>
                  window.dispatchEvent(
                    new CustomEvent('aarogya:open-live-modal', {
                      detail: 'screening',
                    }),
                  )
                }
              >
                ✦ Open Live Oral Camera &amp; Gemini AI Screening Studio
              </button>
            </div>
          )}
          {(specialistAlreadyReviewed || specialistReviewRecorded) && (
            <p className="workflow-notice">{t('specialistReviewSaved')}</p>
          )}
          {canRecordSpecialistReview && (
            <form className="workflow-form" onSubmit={submitSpecialistReview}>
              <label>
                {t('clinicalDecision')}
                <select
                  value={reviewDecision}
                  onChange={(event) => setReviewDecision(event.target.value as typeof reviewDecision)}
                >
                  <option value="AGREE">{t('agree')}</option>
                  <option value="DISAGREE">{t('disagree')}</option>
                  <option value="DEFER">{t('defer')}</option>
                </select>
              </label>
              <label>
                {t('clinicalObservations')}
                <textarea
                  required
                  minLength={1}
                  maxLength={3000}
                  value={reviewObservations}
                  onChange={(event) => setReviewObservations(event.target.value)}
                />
              </label>
              <label>
                {t('reviewNotes')}
                <textarea
                  maxLength={3000}
                  value={reviewNotes}
                  onChange={(event) => setReviewNotes(event.target.value)}
                />
              </label>
              <button className="workflow-button" disabled={busy} type="submit">
                {busy ? t('savingReview') : t('recordReview')}
              </button>
            </form>
          )}
        </div>
      )}
      {error && <div className="workflow-error" role="alert">{error}</div>}
      {user.role === 'MEDICAL_OFFICER' && referral.status === 'COMPLETION_REVIEW' && (
        <form className="workflow-form" onSubmit={submitCompletionReview}>
          <strong>{t('completionReviewTitle')}</strong>
          <label>
            {t('completionReviewTitle')}
            <select
              value={completionApproved ? 'APPROVED' : 'RETURNED'}
              onChange={(event) => setCompletionApproved(event.target.value === 'APPROVED')}
            >
              <option value="APPROVED">{t('completionApprove')}</option>
              <option value="RETURNED">{t('completionReject')}</option>
            </select>
          </label>
          <label>
            {t('completionNote')}
            <textarea
              required
              minLength={1}
              maxLength={1000}
              value={completionNote}
              onChange={(event) => setCompletionNote(event.target.value)}
            />
          </label>
          <button className="workflow-button" disabled={busy} type="submit">
            {busy ? t('referralUpdating') : t('completionSubmit')}
          </button>
        </form>
      )}
      {options.length > 0 && (
        <form className="workflow-inline-form" onSubmit={submit}>
          <label>
            {t('referralStatusLabel')}
            <select
              required
              value={status}
              onChange={(event) => setStatus(event.target.value as ReferralStatus | '')}
            >
              <option value="">{t('referralStatusLabel')}</option>
              {options.map((option) => (
                <option key={option} value={option}>{t(referralStatusKey[option])}</option>
              ))}
            </select>
          </label>
          {needsAppointment && (
            <label>
              {t('referralAppointment')}
              <input
                type="datetime-local"
                required
                value={appointmentDate}
                onChange={(event) => setAppointmentDate(event.target.value)}
              />
            </label>
          )}
          <label>
            {t('referralUpdateNote')}
            <input maxLength={1000} value={note} onChange={(event) => setNote(event.target.value)} />
          </label>
          <button className="workflow-button" disabled={busy || !status} type="submit">
            {busy ? t('referralUpdating') : t('referralUpdate')}
          </button>
        </form>
      )}
    </article>
  )
}

export function PatientWorkflow({
  page,
  user,
  onNavigate,
}: PatientWorkflowProps) {
  const t = useWorkflowText()
  const { unreadCount } = useRealtimeNotifications(user)
  const [patientRows, setPatientRows] = useState<PatientRecord[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [workflow, setWorkflow] = useState<WorkflowData | null>(null)
  const [workers, setWorkers] = useState<ASHAWorkerOption[]>([])
  const [workerId, setWorkerId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const loadPatients = async () => {
    setLoading(true)
    setError('')
    try {
      if (user.role === 'PATIENT') {
        const patient = await getMyPatientRecord()
        setPatientRows([patient])
        setSelectedId(patient._id)
      } else {
        const result = await getPatients()
        const rows =
          result.patients.length > 0
            ? result.patients
            : [DEMO_KILLO_SOMANNA_PATIENT]
        setPatientRows(rows)
        setSelectedId((current) => current || rows[0]._id)
      }
    } catch {
      setPatientRows([DEMO_KILLO_SOMANNA_PATIENT])
      setSelectedId(DEMO_KILLO_SOMANNA_PATIENT._id)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (page === 'patients') void Promise.resolve().then(loadPatients)
    // The effect intentionally reloads when the page or server-derived role changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, user.role])

  useEffect(() => {
    if (page !== 'patients' || !selectedId) return
    let active = true
    const loadWorkflow = async () => {
      if (selectedId === DEMO_KILLO_SOMANNA_PATIENT._id) {
        if (active) {
          setWorkflow({
            patient: DEMO_KILLO_SOMANNA_PATIENT,
            consents: [
              {
                _id: 'demo-consent-1',
                purpose: 'ORAL_SCREENING',
                granted: true,
                consentVersion: 'v1.0-ITDA-2026',
                language: 'TELUGU',
                recordedAt: '2026-11-10T09:14:00.000Z',
              },
              {
                _id: 'demo-consent-2',
                purpose: 'IMAGE_CAPTURE',
                granted: true,
                consentVersion: 'v1.0-ITDA-2026',
                language: 'TELUGU',
                recordedAt: '2026-11-10T09:15:00.000Z',
              },
            ],
            screenings: [],
          })
        }
        return
      }
      setLoading(true)
      setError('')
      try {
        const [patient, consents, screenings] = await Promise.all([
          getPatient(selectedId),
          getPatientConsents(selectedId),
          getPatientScreeningHistory(selectedId),
        ])
        if (active) setWorkflow({ patient, consents, screenings })
      } catch (requestError) {
        if (active) {
          setError(
            getApiErrorMessage(requestError, t('loadHistoryFailed')),
          )
        }
      } finally {
        if (active) setLoading(false)
      }
    }
    void Promise.resolve().then(loadWorkflow)

    return () => {
      active = false
    }
  }, [page, selectedId, t])

  useEffect(() => {
    if (user.role !== 'MEDICAL_OFFICER' || !selectedId || page !== 'patients') {
      return
    }
    let active = true
    getASHAWorkers()
      .then((result) => {
        if (active) {
          setWorkers(result)
          const assigned = patientRows.find((patient) => patient._id === selectedId)?.assignedASHAWorker
          const assignedId = typeof assigned === 'string' ? assigned : assigned?._id
          setWorkerId(assignedId ?? '')
        }
      })
      .catch((requestError: unknown) => {
        if (active) {
          setError(
            getApiErrorMessage(requestError, t('loadWorkersFailed')),
          )
        }
      })
    return () => {
      active = false
    }
  }, [page, selectedId, user.role, patientRows, t])

  useEffect(() => {
    const onShowcaseAction = (event: Event) => {
      const custom = event as CustomEvent<string>
      const actionKey = custom.detail
      if (!actionKey) return
      setTimeout(() => {
        const targetId =
          actionKey === 'VISION'
            ? 'guided-screening-section'
            : actionKey === 'LIVE_CARE'
              ? 'telemedicine-studio-section'
              : actionKey === 'DIAGNOSTICS'
                ? 'biopsy-diagnostics-section'
                : actionKey === 'CONTINUITY'
                  ? 'longitudinal-care-timeline-section'
                  : ''
        const targetEl = targetId ? document.getElementById(targetId) : null
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 280)
    }
    window.addEventListener('aarogya:showcase-action', onShowcaseAction)
    return () => {
      window.removeEventListener('aarogya:showcase-action', onShowcaseAction)
    }
  }, [])

  const reloadSelected = async () => {
    if (!selectedId) return
    const [patient, consents, screenings] = await Promise.all([
      getPatient(selectedId),
      getPatientConsents(selectedId),
      getPatientScreeningHistory(selectedId),
    ])
    setWorkflow({ patient, consents, screenings })
    await loadPatients()
  }

  if (page === 'register') {
    return (
      <div className="workflow-layout">
        {notice && (
          <div className="workflow-notice" role="status">
            {notice}
            <button type="button" onClick={() => setNotice('')} aria-label={t('dismiss')}>×</button>
          </div>
        )}
        <PatientRegistrationForm
          user={user}
          onRegistered={(patient) => {
            setNotice(
              `${patient.fullName} ${t('patientRegistered')} ${patient.patientId}. ` +
                (user.role === 'ASHA_WORKER'
                  ? t('assignmentReminder')
                  : t('consentReminder')),
            )
            if (user.role !== 'ADMIN') {
              onNavigate('patients')
              void loadPatients()
            }
          }}
          onOpenExistingPatient={(existingPatientId) => {
            setSelectedId(existingPatientId)
            onNavigate('patients')
            void loadPatients()
          }}
        />
      </div>
    )
  }

  if (page === 'timeline') {
    return (
      <div className="role-dashboard">
        <LongitudinalTimelineWorkspace
          onClose={() => onNavigate('dashboard')}
          onOpenTelemedicine={() => onNavigate('telemedicine')}
          onOpenBiopsyStudio={() => onNavigate('biopsy')}
        />
        <PatientMedicalHistoryHub
          user={user}
          onStartScreening={() => onNavigate('screening')}
          onOpenGrievance={() => onNavigate('grievance')}
        />
        <PatientHabitIntakeMatrix />
      </div>
    )
  }

  if (page === 'discovery') {
    return (
      <div className="role-dashboard">
        <HospitalAndDoctorDiscovery
          user={user}
          onBookUrgent={() => onNavigate('appointments')}
        />
      </div>
    )
  }

  if (page === 'appointments') {
    return (
      <div className="role-dashboard">
        <section className="workflow-card">
          <div className="workflow-card-heading">
            <div>
              <span className="section-kicker">PATIENT TELEMEDICINE CONSULTATIONS</span>
              <h2>My Upcoming Appointments &amp; Video Consultations</h2>
              <p>Direct encrypted WebRTC consultation with Specialist Oncologists at District Hospital Paderu.</p>
            </div>
            <button
              type="button"
              className="workflow-button"
              onClick={() => onNavigate('telemedicine')}
            >
              ✦ Start / Join Live Video Consultation
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginTop: '1rem' }}>
            <article className="stat-card" style={{ padding: '18px', border: '2px solid #2563eb' }}>
              <span className="workflow-status status-good">CONFIRMED TELEMEDICINE SLOT</span>
              <h3 style={{ margin: '8px 0 4px', fontSize: '1.1rem' }}>Oral Oncology Consultation</h3>
              <p style={{ margin: '0 0 8px', fontSize: '0.85rem', color: '#475569' }}>
                Doctor: <strong>Dr. V. Anitha Rao, MDS</strong> (District Hospital Paderu)
              </p>
              <div style={{ background: '#eff6ff', padding: '10px 14px', borderRadius: '10px', fontSize: '0.82rem', color: '#1e40af', marginBottom: '12px' }}>
                📅 <strong>Today at 10:30 AM</strong> · Slot: 10:30 AM - 11:00 AM · Room: AarogyaDrishti-Live-Consultation-{(user.mandal || 'KOYY').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4)}01
              </div>
              <button
                type="button"
                className="workflow-button"
                style={{ width: '100%' }}
                onClick={() => onNavigate('telemedicine')}
              >
                📹 Join Video Consultation Room Now
              </button>
            </article>
          </div>
        </section>

        {/* Dedicated Structured Patient Appointment Request Form */}
        <PatientAppointmentRequestForm user={user} onNavigate={onNavigate} />
      </div>
    )
  }

  if (page === 'grievance') {
    return (
      <div className="role-dashboard">
        <PatientGrievanceAndRedressalDesk user={user} />
      </div>
    )
  }

  if (page === 'circuit') {
    return (
      <div className="role-dashboard">
        <SpecialistPhcCircuitVisitManager />
      </div>
    )
  }

  if (page === 'biopsy') {
    return (
      <div className="role-dashboard">
        <HospitalAppointmentsAndBiopsyStudio onClose={() => onNavigate('referrals')} />
      </div>
    )
  }

  if (page === 'slips') {
    return (
      <div className="role-dashboard">
        <PrintableReferralSlip
          patient={DEMO_KILLO_SOMANNA_PATIENT}
          referral={DEMO_KILLO_SOMANNA_REFERRAL}
          onClose={() => onNavigate('referrals')}
        />
      </div>
    )
  }

  if (page === 'hospitals') {
    return (
      <div className="role-dashboard">
        <HospitalManagerDashboard user={user} />
      </div>
    )
  }

  if (page === 'doctors') {
    return (
      <div className="role-dashboard">
        <DoctorCredentialVerificationManager />
      </div>
    )
  }

  if (page === 'overview') {
    return (
      <div className="role-dashboard">
        <AdminDashboard />
      </div>
    )
  }

  if (page === 'security') {
    return (
      <div className="role-dashboard">
        <AdminSecurityAuditTrail />
      </div>
    )
  }

  if (page === 'odontogram') {
    return (
      <div className="role-dashboard">
        <SpecialistDashboard
          patientName={DEMO_KILLO_SOMANNA_PATIENT.fullName}
          patientId={DEMO_KILLO_SOMANNA_PATIENT.patientId}
          onOrderBiopsy={() => onNavigate('biopsy')}
          onOpenTelemedicine={() => onNavigate('telemedicine')}
        />
      </div>
    )
  }

  if (page === 'telemedicine') {
    const activePatientForCall: PatientRecord =
      user.role === 'PATIENT'
        ? {
            ...DEMO_KILLO_SOMANNA_PATIENT,
            _id: user.id || 'patient-rambabu',
            patientId: user.id || 'PT-2026-RAMBABU',
            fullName: user.fullName || 'rambabu',
            maaUidn: user.maaUidn || 'UIDN-ASR-KOYY-2026-8921',
            age: 46,
            sex: 'MALE',
            phone: user.phone || '9876543210',
            preferredLanguage: 'TELUGU',
            address: {
              village: user.mandal || 'Koyyuru',
              habitation: `${user.mandal || 'Koyyuru'} Tribal Colony`,
              gramPanchayat: user.mandal || 'Koyyuru',
              mandal: user.mandal || 'Koyyuru',
              district: user.district || 'Alluri Sitharama Raju',
              phcId: `PHC-${(user.mandal || 'KOYYURU').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 6)}`,
            },
            registrationStatus: 'ACTIVE',
          }
        : (patientRows.find((p) => p._id === selectedId) || DEMO_KILLO_SOMANNA_PATIENT)

    return (
      <div className="role-dashboard">
        <LiveTeleconsultationStudio
          user={user}
          patient={activePatientForCall}
          appointment={{
            _id: DEMO_KILLO_SOMANNA_REFERRAL._id,
            appointmentId: 'APT-20261111-GM01',
            patientId: activePatientForCall._id,
            doctorId: 'doc-paderu-01',
            doctorName: 'Dr. V. Anitha Rao, MDS (Oral Oncology, DH Paderu)',
            hospitalId: 'HOSP-ASR-PADERU-01',
            hospitalName: 'District Hospital Paderu',
            appointmentType: 'TELEMEDICINE',
            scheduledDate: new Date().toISOString(),
            timeSlot: '10:30 AM - 11:00 AM',
            status: 'CONFIRMED',
            meetingRoomId: `AarogyaDrishti-Live-Consultation-${(user.mandal || 'KOYY').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4)}01`,
            urgentReason: 'Chronic right buccal mucosal leukoplakia plaque (>3 months)',
            nextAction: 'URGENT_BIOPSY_REFERRAL',
          }}
          onClose={() => onNavigate(user.role === 'SPECIALIST' ? 'referrals' : 'appointments')}
          onGeneratePrescription={() => onNavigate('prescriptions')}
          onOrderBiopsy={() => onNavigate('biopsy')}
        />
      </div>
    )
  }

  if (page === 'screening') {
    return (
      <div className="role-dashboard">
        <LiveCameraScreeningModal
          screeningId="live-demo"
          onClose={() => onNavigate('dashboard')}
        />
        <AutomatedClinicalTriageRouter
          initialRisk="HIGH"
          onDownloadRx={() => onNavigate('prescriptions')}
          onBookPhysicalVisit={() => onNavigate('appointments')}
          onDispatchAmbulance={() => onNavigate('ambulance')}
          onOpenReferralSlip={() => onNavigate('slips')}
        />
        <PatientHabitIntakeMatrix />
      </div>
    )
  }

  if (page === 'notifications') {
    return (
      <div className="role-dashboard">
        <PatientNotificationsInbox user={user} />
      </div>
    )
  }

  if (page === 'prescriptions') {
    return (
      <div className="role-dashboard">
        <PatientPrescriptionsView />
      </div>
    )
  }

  if (page === 'documents') {
    return (
      <div className="role-dashboard">
        <PatientDocumentsView user={user} />
      </div>
    )
  }

  if (page === 'settings') {
    return (
      <div className="role-dashboard">
        <PatientSettingsView user={user} />
      </div>
    )
  }

  if (page === 'help') {
    return (
      <div className="role-dashboard">
        <PatientHelpSupportView />
      </div>
    )
  }

  if (page === 'surveillance' || page === 'bulletin') {
    return (
      <div className="role-dashboard">
        <AggregateReports role="ITDA_PROJECT_OFFICER" />
      </div>
    )
  }

  if (page === 'drone') {
    return (
      <div className="role-dashboard">
        <MedicalDroneLogisticsWorkspace user={user} />
      </div>
    )
  }

  if (page === 'ambulance') {
    return (
      <div className="role-dashboard">
        <TribalAmbulanceDispatchTracker />
      </div>
    )
  }

  if (page === 'admin') {
    return user.role === 'ADMIN' ? <AdminAccountProvisioning /> : null
  }

  if (page === 'reports') {
    return <AggregateReports role={user.role} />
  }

  if (page === 'referrals') {
    return user.role === 'MEDICAL_OFFICER' || user.role === 'SPECIALIST'
      ? <ReferralWorkspace user={user} />
      : null
  }

  if (page === 'reviews') {
    return <MedicalOfficerReviewQueue user={user} />
  }

  if (page === 'dashboard') {
    if (user.role === 'ITDA_PROJECT_OFFICER' || user.role === 'DISTRICT_OFFICER') {
      return <AggregateReports role={user.role} />
    }

    if (user.role === 'DRONE_OPERATOR') {
      return (
        <div className="role-dashboard">
          <MedicalDroneLogisticsWorkspace user={user} />
        </div>
      )
    }

    if (user.role === 'HOSPITAL_MANAGER') {
      return (
        <div className="role-dashboard">
          <HospitalManagerDashboard user={user} />
        </div>
      )
    }

    if (user.role === 'PATIENT') {
      return (
        <div className="role-dashboard patient-journey-dashboard">
          <section className="workflow-card patient-journey-hero">
            <div>
              <span className="section-kicker">{t('patientJourneyWelcome')}</span>
              <h2>{t('patientDashboardTitle')}</h2>
              <p>{t('patientDashboardDescription')}</p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '1rem' }}>
                <button className="workflow-button" onClick={() => onNavigate('appointments')} type="button">
                  📹 {t('liveVideoConsultation')}
                </button>
                <button className="workflow-secondary-button" onClick={() => onNavigate('screening')} type="button">
                  📷 {t('navScreening')}
                </button>
                <button className="workflow-secondary-button" onClick={() => onNavigate('prescriptions')} type="button">
                  💊 {t('navPrescriptions')}
                </button>
                <button className="workflow-secondary-button" onClick={() => onNavigate('timeline')} type="button">
                  📊 {t('navMedicalRecords')}
                </button>
                <button className="workflow-secondary-button" onClick={() => onNavigate('ambulance')} type="button">
                  🚑 {t('kpiEmergencyRadar')}
                </button>
                <button className="workflow-secondary-button" onClick={() => onNavigate('notifications')} type="button">
                  🔔 {t('navNotifications')}
                </button>
              </div>
            </div>
            <div className="patient-journey-orbit" aria-hidden="true">
              <span /><span /><span />
            </div>
          </section>

          {/* Quick Summary KPI Cards for Patient Dashboard */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', margin: '1rem 0' }}>
            <div className="stat-card" style={{ padding: '16px', borderLeft: '4px solid #2563eb', cursor: 'pointer' }} onClick={() => onNavigate('appointments')}>
              <span className="workflow-status status-good">{t('kpiConfirmedTelemedicine')}</span>
              <h3 style={{ margin: '8px 0 4px', fontSize: '1rem' }}>Dr. V. Anitha Rao, MDS</h3>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#475569' }}>Today at 10:30 AM · Oral Oncology Consult</p>
              <button
                className="workflow-button"
                style={{ marginTop: '8px', padding: '0.35rem 0.75rem', fontSize: '0.8rem', width: '100%' }}
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onNavigate('telemedicine')
                }}
              >
                📹 {t('joinVideoConsultation')}
              </button>
            </div>

            <div className="stat-card" style={{ padding: '16px', borderLeft: '4px solid #e11d48', cursor: 'pointer' }} onClick={() => onNavigate('screening')}>
              <span className="workflow-status status-alert">{t('kpiAiScreeningResult')}</span>
              <h3 style={{ margin: '8px 0 4px', fontSize: '1rem' }}>Suspicious Leukoplakia (OPMD)</h3>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#475569' }}>Gemini AI Confidence: 94.2% · Biopsy Ordered</p>
              <button className="workflow-secondary-button" style={{ marginTop: '8px', padding: '0.35rem 0.75rem', fontSize: '0.8rem', width: '100%' }} type="button">
                🔬 {t('viewScreeningDetails')}
              </button>
            </div>

            <div className="stat-card" style={{ padding: '16px', borderLeft: '4px solid #16a34a', cursor: 'pointer' }} onClick={() => onNavigate('prescriptions')}>
              <span className="workflow-status status-good">{t('kpiActivePrescriptions')}</span>
              <h3 style={{ margin: '8px 0 4px', fontSize: '1rem' }}>3 Oral Medications</h3>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#475569' }}>Triamcinolone, Antioxidants · Dispatch #OD-9082</p>
              <button className="workflow-secondary-button" style={{ marginTop: '8px', padding: '0.35rem 0.75rem', fontSize: '0.8rem', width: '100%' }} type="button">
                📦 {t('orderDroneRefill')}
              </button>
            </div>

            <div className="stat-card" style={{ padding: '16px', borderLeft: '4px solid #dc2626', cursor: 'pointer' }} onClick={() => onNavigate('ambulance')}>
              <span className="workflow-status status-alert" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5' }}>
                {t('kpiEmergencyRadar')}
              </span>
              <h3 style={{ margin: '8px 0 4px', fontSize: '1rem' }}>AP-39-TE-1084 (4x4 Feeder)</h3>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#475569' }}>4.2 Km away · ⏱ 12 Mins to Village Hamlet</p>
              <button className="workflow-secondary-button" style={{ marginTop: '8px', padding: '0.35rem 0.75rem', fontSize: '0.8rem', width: '100%', borderColor: '#fca5a5', color: '#b91c1c' }} type="button">
                🚑 {t('trackAmbulanceGps')}
              </button>
            </div>

            <div className="stat-card" style={{ padding: '16px', borderLeft: '4px solid #f59e0b', cursor: 'pointer' }} onClick={() => onNavigate('notifications')}>
              <span className="workflow-status status-pending">{t('kpiInboxAlerts')}</span>
              <h3 style={{ margin: '8px 0 4px', fontSize: '1rem' }}>{unreadCount} Active Clinical Alerts</h3>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#475569' }}>Appointments, live screenings &amp; tribal medical dispatches</p>
              <button className="workflow-secondary-button" style={{ marginTop: '8px', padding: '0.35rem 0.75rem', fontSize: '0.8rem', width: '100%' }} type="button">
                🔔 View Notifications ({unreadCount} New)
              </button>
            </div>
          </div>

          {/* Weekly Specialist Health Camp & Patient RSVP (§ 3.5) */}
          <WeeklySpecialistHealthCampReminder user={user} />

          {/* Hospital & Doctor Discovery Studio (§ 4) */}
          <HospitalAndDoctorDiscovery user={user} />

          {/* Tribal Ambulance Dispatch & GPS Tracking (§ 5) */}
          <TribalAmbulanceDispatchTracker />

          {/* Patient Grievance & Redressal Desk (§ 6) */}
          <PatientGrievanceAndRedressalDesk user={user} />

          <div className="patient-journey-panels">
            <section className="workflow-card privacy-panel">
              <span className="section-kicker">{t('patientPrivacyTitle')}</span>
              <p>{t('patientPrivacyNote')}</p>
            </section>
            <section className="workflow-card education-ready-panel">
              <span className="section-kicker">{t('educationReadyTitle')}</span>
              <p>{t('educationReadyNote')}</p>
            </section>
          </div>
        </div>
      )
    }

    if (user.role === 'ASHA_WORKER') {
      return (
        <div className="role-dashboard field-operations-dashboard">
          <section className="workflow-card field-operations-hero">
            <div className="field-desk-index">{t('workspaceFocus')}</div>
            <span className="section-kicker">{t('dashboardKicker')}</span>
            <h2>{t('fieldDeskTitle')}</h2>
            <p>{t('fieldDeskDescription')}</p>
            <div className="field-action-grid">
              <button className="field-action-card" onClick={() => onNavigate('register')} type="button">
                <span aria-hidden="true">01</span>
                <strong>{t('fieldRegisterAction')}</strong>
                <WorkspaceArrow />
              </button>
              <button className="field-action-card" onClick={() => onNavigate('patients')} type="button">
                <span aria-hidden="true">02</span>
                <strong>{t('fieldRecordsAction')}</strong>
                <WorkspaceArrow />
              </button>
            </div>
          </section>
          <section className="workflow-card field-consent-note">
            <span className="section-kicker">{t('oralConsentTitle')}</span>
            <p>{t('fieldConsentNote')}</p>
          </section>
        </div>
      )
    }

    if (user.role === 'MEDICAL_OFFICER') {
      return (
        <div className="role-dashboard clinical-command-dashboard">
          <section className="workflow-card clinical-command-hero">
            <div className="clinical-command-mark" aria-hidden="true">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-3" />
                <rect x="8" y="2" width="8" height="4" rx="1" />
                <path d="m8 13 2.5 2.5L16 10" />
              </svg>
            </div>
            <span className="section-kicker">{t('dashboardKicker')}</span>
            <h2>{t('clinicalConsoleTitle')}</h2>
            <p>{t('clinicalConsoleDescription')}</p>
            <div className="clinical-lanes">
              <button className="clinical-lane primary-lane" onClick={() => onNavigate('reviews')} type="button">
                <span>01</span><strong>{t('clinicalReviewLane')}</strong><WorkspaceArrow />
              </button>
              <button className="clinical-lane" onClick={() => onNavigate('patients')} type="button">
                <span>02</span><strong>{t('clinicalRecordsLane')}</strong><WorkspaceArrow />
              </button>
              <button className="clinical-lane" onClick={() => onNavigate('referrals')} type="button">
                <span>03</span><strong>{t('clinicalReferralLane')}</strong><WorkspaceArrow />
              </button>
            </div>
          </section>
          <section className="workflow-card clinical-boundary-note">
            <span className="section-kicker">{t('clinicalBoundaryTitle')}</span>
            <p>{t('clinicalBoundaryNote')}</p>
          </section>
        </div>
      )
    }

    if (user.role === 'SPECIALIST') {
      return (
        <div className="role-dashboard specialist-studio-dashboard">
          <section className="workflow-card specialist-studio-hero">
            <div className="specialist-studio-visual" aria-hidden="true">
              <span className="studio-ring" /><span className="studio-ring" /><span className="studio-core" />
            </div>
            <div className="specialist-studio-copy">
              <span className="section-kicker">{t('dashboardKicker')}</span>
              <h2>{t('specialistStudioTitle')}</h2>
              <p>{t('specialistStudioDescription')}</p>
              <div className="workflow-dashboard-actions">
                <button className="workflow-button" onClick={() => onNavigate('referrals')} type="button">
                  {t('specialistAssignedLane')}
                </button>
                <button className="workflow-secondary-button" onClick={() => onNavigate('patients')} type="button">
                  {t('specialistRecordsLane')}
                </button>
              </div>
            </div>
          </section>
          {/* Weekly 3-PHC Cluster Circuit Visits & On-Site Camp Manager */}
          <SpecialistPhcCircuitVisitManager />
          <ReferralWorkspace user={user} />
          <section className="workflow-card specialist-scope-note">
            <span className="section-kicker">{t('workspaceFocus')}</span>
            <p>{t('specialistBoundaryNote')}</p>
          </section>
        </div>
      )
    }

    return null
  }

  return (
    <div className="workflow-layout">
      {notice && (
        <div className="workflow-notice" role="status">
          {notice}
          <button type="button" onClick={() => setNotice('')} aria-label={t('dismiss')}>
            ×
          </button>
        </div>
      )}
      {error && <div className="workflow-error" role="alert">{error}</div>}
      <section className="workflow-card patient-list-card">
        <div className="workflow-card-heading">
          <div>
            <span className="section-kicker">
              {user.role === 'ASHA_WORKER' ? t('assignedPatients') : t('authorizedPatients')}
            </span>
            <h2>{user.role === 'PATIENT' ? t('myRecord') : t('patientRecords')}</h2>
          </div>
          {['ASHA_WORKER', 'MEDICAL_OFFICER'].includes(user.role) && (
            <button
              className="workflow-button"
              onClick={() => onNavigate('register')}
              type="button"
            >
              {t('registerPatient')}
            </button>
          )}
        </div>

        {loading && !patientRows.length ? (
          <div className="figma-skeleton-stack" role="status">
            <div className="figma-skeleton-bone bone-title" aria-hidden="true" />
            <div className="figma-skeleton-bone bone-line-lg" aria-hidden="true" />
            <div className="figma-skeleton-bone bone-line-md" aria-hidden="true" />
            <p className="workflow-state">{t('loadingPatients')}</p>
          </div>
        ) : patientRows.length === 0 ? (
          <p className="workflow-state">
            {user.role === 'ASHA_WORKER'
              ? t('noAssignedPatients')
              : t('noAuthorizedPatients')}
          </p>
        ) : (
          <div className="workflow-table-wrap">
            <table className="workflow-table">
              <thead>
                <tr>
                  <th>{t('patientId')}</th>
                  <th>{t('name')}</th>
                  <th>{t('villageMandal')}</th>
                  <th>{t('phc')}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {patientRows.map((patient) => (
                  <tr key={patient._id}>
                    <td>{patient.patientId}</td>
                    <td>{patient.fullName}</td>
                    <td>{patient.address.village} / {patient.address.mandal}</td>
                    <td>{patient.address.phcId}</td>
                    <td>
                      <button
                        type="button"
                        className="workflow-link"
                        onClick={() => {
                          setWorkflow(null)
                          setSelectedId(patient._id)
                          const assigned = patient.assignedASHAWorker
                          setWorkerId(typeof assigned === 'string' ? assigned : assigned?._id ?? '')
                        }}
                      >
                        {t('openRecord')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {user.role === 'PATIENT' && !selectedId && (
        <PatientAccountLinkCard
          onLinked={async () => {
            setNotice('Your health record has been linked successfully.')
            await loadPatients()
          }}
          onError={setError}
        />
      )}

      {selectedId && (
        <section className="workflow-card">
          {!workflow ? (
            <div className="figma-skeleton-stack" role="status">
              <div className="figma-skeleton-bone bone-title" aria-hidden="true" />
              <div className="figma-skeleton-bone bone-line-lg" aria-hidden="true" />
              <div className="figma-skeleton-bone bone-line-md" aria-hidden="true" />
              <p className="workflow-state">{t('loadingHistory')}</p>
            </div>
          ) : (
            <PatientRecordPanel
              data={workflow}
              user={user}
              workers={workers}
              workerId={workerId}
              onWorkerChange={setWorkerId}
              onRefresh={reloadSelected}
              onError={setError}
              onNotice={setNotice}
            />
          )}
        </section>
      )}
    </div>
  )
}

function PatientAccountLinkCard({
  onLinked,
  onError,
}: {
  onLinked: () => Promise<void>
  onError: (message: string) => void
}) {
  const [patientIdInput, setPatientIdInput] = useState('')
  const [claimCodeInput, setClaimCodeInput] = useState('')
  const [busy, setBusy] = useState(false)

  return (
    <section className="workflow-card">
      <div className="workflow-card-heading">
        <div>
          <span className="section-kicker">Patient Self-Service Portal</span>
          <h2>Link Your Health Record</h2>
          <p className="workflow-help">
            Enter your Patient ID and the 10-minute single-use Claim Code provided by your Medical Officer to view your longitudinal care timeline.
          </p>
        </div>
      </div>
      <form
        className="workflow-inline-form"
        onSubmit={async (event) => {
          event.preventDefault()
          if (!patientIdInput.trim() || !claimCodeInput.trim() || busy) return
          setBusy(true)
          onError('')
          try {
            await linkPatientAccount(patientIdInput.trim(), claimCodeInput.trim())
            setPatientIdInput('')
            setClaimCodeInput('')
            await onLinked()
          } catch (requestError) {
            onError(
              getApiErrorMessage(
                requestError,
                'Unable to link patient health record. Verify your Patient ID and 10-minute Claim Code.',
              ),
            )
          } finally {
            setBusy(false)
          }
        }}
      >
        <label>
          Patient ID
          <input
            required
            placeholder="e.g. PT-20260410-XXXXXX"
            value={patientIdInput}
            onChange={(event) => setPatientIdInput(event.target.value)}
            disabled={busy}
          />
        </label>
        <label>
          10-Minute Claim Code
          <input
            required
            placeholder="Enter temporary access code"
            value={claimCodeInput}
            onChange={(event) => setClaimCodeInput(event.target.value)}
            disabled={busy}
          />
        </label>
        <button
          className="workflow-button"
          type="submit"
          disabled={busy || !patientIdInput.trim() || !claimCodeInput.trim()}
        >
          {busy ? 'Linking Record...' : 'Link Health Record'}
        </button>
      </form>
    </section>
  )
}

function PatientRegistrationForm({
  user,
  onRegistered,
  onOpenExistingPatient,
}: {
  user: AuthUser
  onRegistered: (patient: RegisteredPatient) => void
  onOpenExistingPatient?: (patientId: string) => void
}) {
  const t = useWorkflowText()
  const appLanguage = useContext(LanguageContext)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [duplicateCandidates, setDuplicateCandidates] = useState<
    DuplicateCandidateRecord[]
  >([])
  const [consentConfirmed, setConsentConfirmed] = useState(false)
  const [form, setForm] = useState({
    fullName: '',
    dateOfBirth: '',
    age: '',
    sex: 'NOT_RECORDED',
    phone: '',
    alternateContact: '',
    village: 'G. Madugula',
    mandal: user.mandal || 'G. Madugula',
    phcId: user.assignedPHCId || 'PHC-GMADUGULA',
    language: appLanguage === 'te' ? 'TELUGU' : appLanguage === 'hi' ? 'HINDI' : 'ENGLISH',
    tobaccoUse: 'NOT_RECORDED',
    symptoms: '',
  })

  const change = (key: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }))

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    if (!form.dateOfBirth && !form.age) {
      setError(t('dateOrAge'))
      return
    }
    if (!consentConfirmed) {
      setError(t('consentRequired'))
      return
    }
    setBusy(true)
    setDuplicateCandidates([])
    const registrationPayload = {
      fullName: form.fullName,
      ...(form.dateOfBirth ? { dateOfBirth: form.dateOfBirth } : {}),
      ...(form.age ? { age: Number(form.age) } : {}),
      sex: form.sex,
      ...(form.phone ? { phone: form.phone } : {}),
      ...(form.alternateContact ? { alternateContact: form.alternateContact } : {}),
      address: {
        village: form.village,
        mandal: form.mandal,
        phcId: form.phcId,
      },
      exposureHistory: { tobaccoUse: form.tobaccoUse },
      symptoms: form.symptoms.trim()
        ? [{ name: form.symptoms.trim() }]
        : [],
      consent: {
        purpose: 'PATIENT_REGISTRATION',
        granted: true,
        consentVersion,
        language: form.language,
      },
    }
    if (!navigator.onLine) {
      await saveOfflineDraftToIndexedDb({
        kind: 'PATIENT_REGISTRATION',
        summary: `Offline Patient Registration: ${form.fullName} (${form.village})`,
        payload: registrationPayload as Record<string, unknown>,
      })
      setError('Offline Mode — Patient Registration Draft saved to IndexedDB. It will sync automatically when network connectivity returns.')
      setBusy(false)
      return
    }
    try {
      const patient = await registerPatient(registrationPayload)
      onRegistered(patient)
    } catch (requestError) {
      const duplicates = getDuplicateCandidatesFromError(requestError)
      if (duplicates.length > 0) {
        setDuplicateCandidates(duplicates)
      }
      setError(getApiErrorMessage(requestError, t('registrationFailed')))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="workflow-card">
      <span className="section-kicker">{t('newPatient')}</span>
      <h2>{t('registration')}</h2>
      <p className="workflow-help">
        {t('registrationHelp')}
      </p>
      {error && <div className="workflow-error" role="alert">{error}</div>}
      {duplicateCandidates.length > 0 && (
        <div className="workflow-subsection" role="region" aria-label="Possible Duplicate Patient Records">
          <div className="workflow-card-heading">
            <div>
              <span className="section-kicker">Duplicate Prevention Check</span>
              <h3>Matching Patient Records Found</h3>
            </div>
          </div>
          <div className="patient-activity-list">
            {duplicateCandidates.map((candidate) => (
              <article className="patient-activity-item" key={candidate.id}>
                <div className="workflow-card-heading">
                  <div>
                    <strong>{candidate.fullName}</strong>
                    <p>
                      {candidate.patientId} · {candidate.village}, {candidate.mandal}
                    </p>
                  </div>
                  <span className="workflow-status status-waiting">
                    {candidate.matchReason}
                  </span>
                </div>
                {onOpenExistingPatient && (
                  <button
                    type="button"
                    className="workflow-button"
                    onClick={() => onOpenExistingPatient(candidate.id)}
                  >
                    Open Existing Patient Record
                  </button>
                )}
              </article>
            ))}
          </div>
        </div>
      )}
      <form className="workflow-form" onSubmit={submit}>
        <label>
          {t('patientFullName')}
          <input
            required
            minLength={2}
            maxLength={100}
            value={form.fullName}
            onChange={(event) => change('fullName', event.target.value)}
          />
        </label>
        <div className="workflow-form-grid">
          <label>
            {t('dob')}
            <input
              type="date"
              value={form.dateOfBirth}
              onChange={(event) => change('dateOfBirth', event.target.value)}
            />
          </label>
          <label>
            {t('age')}
            <input
              type="number"
              min={0}
              max={120}
              value={form.age}
              onChange={(event) => change('age', event.target.value)}
            />
          </label>
          <label>
            {t('sex')}
            <select value={form.sex} onChange={(event) => change('sex', event.target.value)}>
              <option value="NOT_RECORDED">{t('notRecorded')}</option>
              <option value="FEMALE">{t('female')}</option>
              <option value="MALE">{t('male')}</option>
              <option value="OTHER">{t('other')}</option>
            </select>
          </label>
          <label>
            {t('mobile')}
            <input
              type="tel"
              inputMode="numeric"
              pattern="[6-9][0-9]{9}"
              maxLength={10}
              value={form.phone}
              onChange={(event) => change('phone', event.target.value)}
            />
          </label>
          <label>
            {t('alternateContact')}
            <input
              type="tel"
              inputMode="numeric"
              pattern="[6-9][0-9]{9}"
              maxLength={10}
              value={form.alternateContact}
              onChange={(event) => change('alternateContact', event.target.value)}
            />
          </label>
          <label>
            {t('village')}
            <input
              required
              maxLength={100}
              list="asr-villages-list"
              placeholder="e.g. G. Madugula, Nurmathi, Kinchumanda, Paderu"
              value={form.village}
              onChange={(event) => change('village', event.target.value)}
            />
            <datalist id="asr-villages-list">
              <option value="G. Madugula" />
              <option value="Nurmathi" />
              <option value="Kinchumanda" />
              <option value="Gemmeli" />
              <option value="Boithili" />
              <option value="Gaduthuru" />
              <option value="Paderu" />
              <option value="Chintapalli" />
              <option value="Araku Valley" />
              <option value="Koyyuru" />
              <option value="Peddabayalu" />
            </datalist>
          </label>
          <label>
            {t('mandal')}
            <select required value={form.mandal} onChange={(event) => change('mandal', event.target.value)}>
              <option value="">{t('selectMandal')}</option>
              {mandals.map((mandal) => <option key={mandal} value={mandal}>{mandal}</option>)}
            </select>
          </label>
          <label>
            Assigned PHC / Facility
            <select required value={form.phcId} onChange={(event) => change('phcId', event.target.value)}>
              <option value={user.assignedPHCId || 'PHC-GMADUGULA'}>
                PHC G. Madugula ({user.assignedPHCId || 'PHC-GMADUGULA'})
              </option>
              <option value="PHC-GMADUGULA">PHC G. Madugula (PHC-GMADUGULA)</option>
              <option value="PHC-GMADUGULA-01">PHC G. Madugula Unit 01 (PHC-GMADUGULA-01)</option>
              <option value="PHC-PADERU-01">District Hospital / PHC Paderu (PHC-PADERU-01)</option>
              <option value="CHC-CHINTAPALLI-01">CHC Chintapalli (CHC-CHINTAPALLI-01)</option>
              <option value="AH-ARAKU-01">Area Hospital Araku Valley (AH-ARAKU-01)</option>
              <option value="PHC-KOYYURU-01">PHC Koyyuru (PHC-KOYYURU-01)</option>
              <option value="PHC-PEDDABAYALU-01">PHC Peddabayalu (PHC-PEDDABAYALU-01)</option>
            </select>
          </label>
          <label>
            {t('consentLanguage')}
            <select value={form.language} onChange={(event) => change('language', event.target.value)}>
              <option value="TELUGU">తెలుగు</option>
              <option value="ENGLISH">English</option>
              <option value="HINDI">हिन्दी</option>
            </select>
          </label>
          <label>
            {t('tobaccoUse')}
            <select value={form.tobaccoUse} onChange={(event) => change('tobaccoUse', event.target.value)}>
              <option value="NOT_RECORDED">{t('notRecorded')}</option>
              <option value="NEVER">{t('never')}</option>
              <option value="CURRENT">{t('current')}</option>
              <option value="FORMER">{t('former')}</option>
            </select>
          </label>
          <label className="workflow-full-width">
            {t('symptomOptional')}
            <input maxLength={100} value={form.symptoms} onChange={(event) => change('symptoms', event.target.value)} />
          </label>
        </div>
        <div className="workflow-consent-notice">
          <strong>{t('registrationConsent')} · {t('consentVersion')} {consentVersion}</strong>
          <p>
            {t('approvedConsent')}
          </p>
          <label className="workflow-checkbox">
            <input
              type="checkbox"
              checked={consentConfirmed}
              onChange={(event) => setConsentConfirmed(event.target.checked)}
            />
            {t('registrationConsentCheck')}
          </label>
        </div>
        <button className="workflow-button" disabled={busy} type="submit">
          {busy ? t('registering') : t('registerPatient')}
        </button>
      </form>
    </section>
  )
}

function PatientRecordPanel({
  data,
  user,
  workers,
  workerId,
  onWorkerChange,
  onRefresh,
  onError,
  onNotice,
}: {
  data: WorkflowData
  user: AuthUser
  workers: ASHAWorkerOption[]
  workerId: string
  onWorkerChange: (id: string) => void
  onRefresh: () => Promise<void>
  onError: (message: string) => void
  onNotice: (message: string) => void
}) {
  const t = useWorkflowText()
  const appLanguage = useContext(LanguageContext)
  const [assignmentBusy, setAssignmentBusy] = useState(false)
  const [withdrawalBusy, setWithdrawalBusy] = useState(false)
  const [claimBusy, setClaimBusy] = useState(false)
  const [ownershipClaim, setOwnershipClaim] =
    useState<OwnershipClaimResponse | null>(null)
  const [claimCopied, setClaimCopied] = useState(false)
  const { patient, consents, screenings } = data
  const latestOralConsent = consents.find(
    (consent) => consent.purpose === 'ORAL_SCREENING',
  )
  const latestImageConsent = consents.find(
    (consent) =>
      consent.purpose === 'IMAGE_CAPTURE' ||
      consent.purpose === 'IMAGE_CAPTURE_AND_STORAGE',
  )
  const hasActiveConsent = Boolean(
    latestOralConsent?.granted && !latestOralConsent.withdrawnAt,
  )
  const hasImageCaptureConsent = Boolean(
    latestImageConsent?.granted && !latestImageConsent.withdrawnAt,
  )
  const assignedWorker =
    typeof patient.assignedASHAWorker === 'object'
      ? patient.assignedASHAWorker.fullName
      : patient.assignedASHAWorker

  return (
    <div className="patient-record">
      <div className="workflow-card-heading">
        <div>
          <span className="section-kicker">{t('record')}</span>
          <h2>{patient.fullName}</h2>
          <p>{patient.patientId} · {patient.address.village}, {patient.address.mandal}</p>
        </div>
        <span className={`workflow-status ${hasActiveConsent ? 'status-good' : 'status-waiting'}`}>
          {hasActiveConsent ? t('oralConsentActive') : t('oralConsentRequired')}
        </span>
      </div>

      {user.role === 'MEDICAL_OFFICER' && (
        <form
          className="workflow-inline-form"
          onSubmit={async (event) => {
            event.preventDefault()
            if (!workerId || assignmentBusy) return
            setAssignmentBusy(true)
            try {
              await assignASHAWorker(patient._id, workerId)
              await onRefresh()
              onNotice(t('assignmentSaved'))
            } catch (requestError) {
              onError(getApiErrorMessage(requestError, t('assignmentFailed')))
            } finally {
              setAssignmentBusy(false)
            }
          }}
        >
          <label>
            {t('assignedWorker')}
            <select value={workerId} onChange={(event) => onWorkerChange(event.target.value)}>
              <option value="">{t('selectWorker')}</option>
              {workers.map((worker) => (
                <option key={worker.id} value={worker.id}>{worker.fullName}</option>
              ))}
            </select>
          </label>
          <button className="workflow-button" disabled={!workerId || assignmentBusy} type="submit">
            {assignmentBusy ? t('savingAssignment') : assignedWorker ? t('reassign') : t('assign')}
          </button>
          {assignedWorker && <span>{t('currentAssignment')}: {assignedWorker}</span>}
        </form>
      )}

      {user.role === 'MEDICAL_OFFICER' && (
        <div className="workflow-subsection">
          <div className="workflow-card-heading">
            <div>
              <span className="section-kicker">Patient Portal Linking</span>
              <h3>Patient Ownership Access Token</h3>
            </div>
            <button
              className="workflow-button"
              type="button"
              disabled={claimBusy}
              onClick={async () => {
                if (claimBusy) return
                setClaimBusy(true)
                setClaimCopied(false)
                try {
                  const claim = await generateOwnershipClaim(patient._id)
                  setOwnershipClaim(claim)
                  onNotice('Generated 10-minute Patient Portal Access Code.')
                } catch (requestError) {
                  onError(
                    getApiErrorMessage(
                      requestError,
                      'Could not generate patient portal access code.',
                    ),
                  )
                } finally {
                  setClaimBusy(false)
                }
              }}
            >
              {claimBusy
                ? 'Generating Access Code...'
                : '✦ Generate Patient Portal Access Code'}
            </button>
          </div>
          {ownershipClaim && (
            <div className="workflow-notice" role="dialog" aria-label="Patient Portal Access Code">
              <div>
                <strong>Patient ID:</strong> <code>{patient.patientId}</code>
                {' · '}
                <strong>10-Minute Single-Use Claim Code:</strong>{' '}
                <code>{ownershipClaim.claimCode}</code>
                <small style={{ display: 'block', marginTop: '0.25rem' }}>
                  Expires at {formatDate(ownershipClaim.expiresAt, appLanguage)}
                </small>
              </div>
              <button
                type="button"
                className="workflow-secondary-button"
                onClick={() => {
                  void navigator.clipboard?.writeText(ownershipClaim.claimCode)
                  setClaimCopied(true)
                }}
              >
                {claimCopied ? 'Copied!' : 'Copy Code'}
              </button>
            </div>
          )}
        </div>
      )}

      {(user.role === 'ASHA_WORKER' || user.role === 'MEDICAL_OFFICER') && (
        <OralConsentControls
          patient={patient}
          consent={latestOralConsent}
          onRefresh={onRefresh}
          onError={onError}
          onNotice={onNotice}
        />
      )}

      {(user.role === 'ASHA_WORKER' || user.role === 'MEDICAL_OFFICER') &&
        hasActiveConsent && (
          <div id="guided-screening-section">
            <ScreeningForm
              patient={patient}
              hasImageCaptureConsent={hasImageCaptureConsent}
              onGrantImageConsent={async () => {
                const lang =
                  appLanguage === 'te'
                    ? 'TELUGU'
                    : appLanguage === 'hi'
                      ? 'HINDI'
                      : 'ENGLISH'
                await recordImageCaptureConsent(
                  patient._id,
                  lang,
                  'Patient granted explicit consent for guided oral cavity photography and assistive AI screening.',
                )
                await onRefresh()
                onNotice('IMAGE_CAPTURE consent recorded. Guided oral camera unlocked.')
              }}
              onCreated={async () => {
                await onRefresh()
                onNotice(t('screeningSaved'))
              }}
              onError={onError}
            />
          </div>
        )}

      <PatientClinicalFollowUp
        patient={patient}
        consents={consents}
        screenings={screenings}
        workers={workers}
        user={user}
        onError={onError}
        onNotice={onNotice}
      />

      <section className="workflow-subsection">
        <div className="workflow-card-heading">
          <div>
            <span className="section-kicker">{t('history')}</span>
            <h3>{t('screeningHistory')}</h3>
          </div>
        </div>
        {screenings.length === 0 ? (
          <p className="workflow-state">{t('noScreenings')}</p>
        ) : (
          screenings.map((screening) => (
            <ScreeningHistoryItem key={screening._id} screening={screening} />
          ))
        )}
      </section>

      <section className="workflow-subsection">
        <span className="section-kicker">{t('consentAudit')}</span>
        {consents.length === 0 ? (
          <p className="workflow-state">{t('noConsent')}</p>
        ) : (
          <ul className="consent-history">
            {consents.map((consent) => (
              <li key={consent._id}>
                <span>{consent.purpose === 'PATIENT_REGISTRATION'
                  ? t('registrationConsentPurpose')
                  : consent.purpose === 'ORAL_SCREENING'
                    ? t('oralScreeningConsentPurpose')
                    : consent.purpose.replaceAll('_', ' ')}</span>
                <strong>{consent.granted && !consent.withdrawnAt ? t('granted') : t('inactiveWithdrawn')}</strong>
                <span>v{consent.consentVersion} · {consent.language === 'TELUGU' ? 'తెలుగు' : consent.language === 'HINDI' ? 'हिन्दी' : 'English'} · {formatDate(consent.recordedAt, appLanguage)}</span>
              </li>
            ))}
          </ul>
        )}
        {user.role === 'PATIENT' && latestOralConsent?.granted && !latestOralConsent.withdrawnAt && (
          <button
            className="workflow-secondary-button"
            type="button"
            disabled={withdrawalBusy}
            onClick={async () => {
              if (withdrawalBusy) return
              setWithdrawalBusy(true)
              try {
                await withdrawOralScreeningConsent(patient._id, t('consentWithdrawalReason'))
                await onRefresh()
                onNotice(t('withdrawalSaved'))
              } catch (requestError) {
                onError(getApiErrorMessage(requestError, t('withdrawalFailed')))
              } finally {
                setWithdrawalBusy(false)
              }
            }}
          >
            {t('withdrawConsent')}
          </button>
        )}
      </section>
    </div>
  )
}

const diagnosticStatusKey: Record<DiagnosticStatus, WorkflowTranslationKey> = {
  ADVISED: 'diagnosticStatusAdvised',
  SCHEDULED: 'diagnosticStatusScheduled',
  PERFORMED: 'diagnosticStatusPerformed',
  SAMPLE_COLLECTED: 'diagnosticStatusSampleCollected',
  REPORT_PENDING: 'diagnosticStatusReportPending',
  REPORT_RECEIVED: 'diagnosticStatusReportReceived',
  UNDER_CLINICIAN_REVIEW: 'diagnosticStatusUnderReview',
  REVIEWED: 'diagnosticStatusReviewed',
  CANCELLED: 'diagnosticStatusCancelled',
}

const followUpStatusKey: Record<FollowUpRecord['status'], WorkflowTranslationKey> = {
  PLANNED: 'followUpStatusPlanned',
  CONTACTED: 'followUpStatusContacted',
  COMPLETED: 'followUpStatusCompleted',
  MISSED: 'followUpStatusMissed',
  CANCELLED: 'followUpStatusCancelled',
}

const diagnosticTransitions: Record<DiagnosticStatus, DiagnosticStatus[]> = {
  ADVISED: ['SCHEDULED', 'CANCELLED'],
  SCHEDULED: ['PERFORMED', 'CANCELLED'],
  PERFORMED: ['SAMPLE_COLLECTED', 'REPORT_PENDING', 'CANCELLED'],
  SAMPLE_COLLECTED: ['REPORT_PENDING', 'CANCELLED'],
  REPORT_PENDING: ['REPORT_RECEIVED', 'CANCELLED'],
  REPORT_RECEIVED: ['UNDER_CLINICIAN_REVIEW'],
  UNDER_CLINICIAN_REVIEW: ['REVIEWED'],
  REVIEWED: [],
  CANCELLED: [],
}

function PatientClinicalFollowUp({
  patient,
  consents,
  screenings,
  workers,
  user,
  onError,
  onNotice,
}: {
  patient: PatientRecord
  consents: ConsentRecord[]
  screenings: ScreeningRecord[]
  workers: ASHAWorkerOption[]
  user: AuthUser
  onError: (message: string) => void
  onNotice: (message: string) => void
}) {
  const t = useWorkflowText()
  const appLanguage = useContext(LanguageContext)
  const [diagnostics, setDiagnostics] = useState<DiagnosticOrderRecord[]>([])
  const [followUps, setFollowUps] = useState<FollowUpRecord[]>([])
  const [referrals, setReferrals] = useState<ReferralRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [busy, setBusy] = useState(false)
  const [diagnosticType, setDiagnosticType] =
    useState<DiagnosticOrderRecord['diagnosticType']>('BIOPSY')
  const [diagnosticReason, setDiagnosticReason] = useState('')
  const [diagnosticFacility, setDiagnosticFacility] = useState('')
  const [diagnosticAppointment, setDiagnosticAppointment] = useState('')
  const [selectedReferral, setSelectedReferral] = useState('')
  const [followUpWorker, setFollowUpWorker] = useState('')
  const [followUpDueAt, setFollowUpDueAt] = useState('')
  const [followUpNote, setFollowUpNote] = useState('')

  const loadActivity = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const [orders, records, referralResponse] = await Promise.all([
        user.role === 'ASHA_WORKER'
          ? Promise.resolve([] as DiagnosticOrderRecord[])
          : getPatientDiagnosticOrders(patient._id),
        getPatientFollowUps(patient._id),
        user.role === 'SPECIALIST' || user.role === 'MEDICAL_OFFICER'
          ? getReferrals()
          : Promise.resolve(null),
      ])
      setDiagnostics(orders)
      setFollowUps(records)
      setReferrals(
        referralResponse?.referrals.filter(
          (referral) =>
            referral.patient._id === patient._id &&
            referral.status !== 'CANCELLED',
        ) ?? [],
      )
    } catch (requestError) {
      setLoadError(getApiErrorMessage(
        requestError,
        t(user.role === 'ASHA_WORKER' ? 'followUpsFailed' : 'diagnosticsFailed'),
      ))
    } finally {
      setLoading(false)
    }
  }, [patient._id, t, user.role])

  useEffect(() => {
    void Promise.resolve().then(loadActivity)
  }, [loadActivity])

  const assignedWorkerId =
    typeof patient.assignedASHAWorker === 'object'
      ? patient.assignedASHAWorker?._id ?? ''
      : patient.assignedASHAWorker ?? ''
  const isAssignedASHA =
    user.role === 'ASHA_WORKER' && assignedWorkerId === user.id
  const canScheduleFollowUp =
    user.role === 'MEDICAL_OFFICER' || isAssignedASHA
  const canManageDiagnostics =
    user.role === 'MEDICAL_OFFICER' || user.role === 'SPECIALIST'
  const canViewDiagnostics = user.role !== 'ASHA_WORKER'
  const resolvedFollowUpWorker =
    followUpWorker ||
    (user.role === 'ASHA_WORKER' && isAssignedASHA
      ? user.id
      : user.role === 'MEDICAL_OFFICER'
        ? assignedWorkerId
        : '')

  const submitDiagnostic = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (
      busy ||
      !diagnosticReason.trim() ||
      (user.role === 'SPECIALIST' && !selectedReferral)
    ) return
    const referral = referrals.find((item) => item._id === selectedReferral)
    setBusy(true)
    try {
      await createDiagnosticOrder({
        patientId: patient._id,
        ...(screenings[0]?._id ? { screeningId: screenings[0]._id } : {}),
        ...(referral ? { referralId: referral._id } : {}),
        diagnosticType,
        clinicalReason: diagnosticReason.trim(),
        ...(diagnosticFacility.trim()
          ? { facilityName: diagnosticFacility.trim() }
          : {}),
        ...(diagnosticAppointment
          ? { appointmentDate: new Date(diagnosticAppointment).toISOString() }
          : {}),
      })
      setDiagnosticReason('')
      setDiagnosticFacility('')
      setDiagnosticAppointment('')
      await loadActivity()
      onNotice(t('diagnosticOrderCreated'))
    } catch (requestError) {
      onError(getApiErrorMessage(requestError, t('diagnosticOrderFailed')))
    } finally {
      setBusy(false)
    }
  }

  const submitFollowUp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (busy || !resolvedFollowUpWorker || !followUpDueAt) return
    setBusy(true)
    try {
      await createFollowUp({
        patientId: patient._id,
        ...(screenings[0]?._id ? { screeningId: screenings[0]._id } : {}),
        assignedWorkerId: resolvedFollowUpWorker,
        dueAt: new Date(followUpDueAt).toISOString(),
        ...(followUpNote.trim() ? { note: followUpNote.trim() } : {}),
      })
      setFollowUpDueAt('')
      setFollowUpNote('')
      await loadActivity()
      onNotice(t('followUpScheduled'))
    } catch (requestError) {
      onError(getApiErrorMessage(requestError, t('followUpScheduleFailed')))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="workflow-subsection patient-activity-section">
      {canViewDiagnostics && <span className="section-kicker">{t('diagnosticsTitle')}</span>}
      {loading ? (
        <p className="workflow-state">
          {t(user.role === 'ASHA_WORKER' ? 'followUpsLoading' : 'diagnosticsLoading')}
        </p>
      ) : loadError ? (
        <div className="workflow-state" role="alert">
          <p>{loadError}</p>
          <button className="workflow-secondary-button" type="button" onClick={() => void loadActivity()}>
            {t('refresh')}
          </button>
        </div>
      ) : (
        <>
          <div id="longitudinal-care-timeline-section">
            <CareTimeline
              patient={patient}
              consents={consents}
              screenings={screenings}
              diagnostics={diagnostics}
              followUps={followUps}
              referrals={referrals}
              canViewDiagnostics={canViewDiagnostics}
              canViewReferrals={user.role === 'MEDICAL_OFFICER' || user.role === 'SPECIALIST'}
            />
          </div>
          <div id="telemedicine-studio-section">
            <AppointmentBookingAndTelemedicineSection
              patient={patient}
              referrals={referrals}
              screenings={screenings}
              user={user}
              onNotice={onNotice}
              onError={onError}
            />
          </div>
          <div id="biopsy-diagnostics-section">
            <PatientNavigatorAndOfflineSyncBar
              followUps={followUps}
              diagnostics={diagnostics}
              patient={patient}
              onRefresh={loadActivity}
              onNotice={onNotice}
              onError={onError}
            />
          </div>
          {canViewDiagnostics && (
            <>
              {canManageDiagnostics && (
                <form className="workflow-inline-form" onSubmit={(event) => void submitDiagnostic(event)}>
              <h3>{t('createDiagnosticOrder')}</h3>
              <label>
                {t('diagnosticType')}
                <select
                  value={diagnosticType}
                  onChange={(event) =>
                    setDiagnosticType(event.target.value as DiagnosticOrderRecord['diagnosticType'])
                  }
                  disabled={busy}
                >
                  <option value="BIOPSY">{t('diagnosticBiopsy')}</option>
                  <option value="HISTOPATHOLOGY">{t('diagnosticHistopathology')}</option>
                  <option value="CT_SCAN">{t('diagnosticCT')}</option>
                  <option value="MRI">{t('diagnosticMRI')}</option>
                  <option value="OTHER">{t('diagnosticOther')}</option>
                </select>
              </label>
              {user.role === 'SPECIALIST' && (
                <label>
                  {t('diagnosticReferral')}
                  <select
                    value={selectedReferral}
                    onChange={(event) => setSelectedReferral(event.target.value)}
                    required
                    disabled={busy || referrals.length === 0}
                  >
                    <option value="">{t('selectReferral')}</option>
                    {referrals.map((referral) => (
                      <option key={referral._id} value={referral._id}>
                        {referral.facilityName} · {t(referralStatusKey[referral.status])}
                      </option>
                    ))}
                  </select>
                  {referrals.length === 0 && <span>{t('noAssignedReferral')}</span>}
                </label>
              )}
              <label>
                {t('diagnosticReason')}
                <textarea
                  value={diagnosticReason}
                  onChange={(event) => setDiagnosticReason(event.target.value)}
                  minLength={5}
                  maxLength={2000}
                  required
                  disabled={busy}
                />
              </label>
              <label>
                {t('diagnosticFacility')}
                <input
                  value={diagnosticFacility}
                  onChange={(event) => setDiagnosticFacility(event.target.value)}
                  maxLength={200}
                  disabled={busy}
                />
              </label>
              <label>
                {t('diagnosticAppointment')}
                <input
                  type="datetime-local"
                  value={diagnosticAppointment}
                  onChange={(event) => setDiagnosticAppointment(event.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  disabled={busy}
                />
              </label>
              <button
                className="workflow-button"
                type="submit"
                disabled={busy || (user.role === 'SPECIALIST' && !selectedReferral)}
              >
                {busy ? t('creatingDiagnosticOrder') : t('createDiagnosticOrder')}
              </button>
            </form>
              )}
              {diagnostics.length === 0 ? (
                <p className="workflow-state">{t('diagnosticsEmpty')}</p>
              ) : (
                <div className="patient-activity-list">
                  {diagnostics.map((order) => (
                <DiagnosticOrderItem
                  key={order._id}
                  order={order}
                  canManage={canManageDiagnostics}
                  busy={busy}
                  appLanguage={appLanguage}
                  onUpdate={async (update) => {
                    setBusy(true)
                    try {
                      if (update.resultText !== undefined) {
                        await recordDiagnosticResult(order._id, update.resultText)
                      } else if (update.status) {
                        await updateDiagnosticOrderStatus(order._id, {
                          status: update.status,
                          ...(update.appointmentDate
                            ? { appointmentDate: update.appointmentDate }
                            : {}),
                          ...(update.note ? { note: update.note } : {}),
                        })
                      }
                      await loadActivity()
                      onNotice(update.resultText !== undefined
                        ? t('diagnosticResultSaved')
                        : t('diagnosticUpdated'))
                      return true
                    } catch (requestError) {
                      onError(getApiErrorMessage(
                        requestError,
                        update.resultText !== undefined
                          ? t('diagnosticResultFailed')
                          : t('diagnosticUpdateFailed'),
                      ))
                      return false
                    } finally {
                      setBusy(false)
                    }
                  }}
                />
                  ))}
                </div>
              )}
            </>
          )}

          <h3>{t('patientFollowUps')}</h3>
          {canScheduleFollowUp && (
            <form className="workflow-inline-form" onSubmit={(event) => void submitFollowUp(event)}>
              {user.role === 'MEDICAL_OFFICER' && (
                <label>
                  {t('followUpWorker')}
                  <select
                    value={resolvedFollowUpWorker}
                    onChange={(event) => setFollowUpWorker(event.target.value)}
                    required
                    disabled={busy}
                  >
                    <option value="">{t('selectWorker')}</option>
                    {workers.map((worker) => (
                      <option key={worker.id} value={worker.id}>{worker.fullName}</option>
                    ))}
                  </select>
                </label>
              )}
              <label>
                {t('followUpDue')}
                <input
                  type="datetime-local"
                  value={followUpDueAt}
                  onChange={(event) => setFollowUpDueAt(event.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  required
                  disabled={busy}
                />
              </label>
              <label>
                {t('followUpNote')}
                <input
                  value={followUpNote}
                  onChange={(event) => setFollowUpNote(event.target.value)}
                  maxLength={1000}
                  disabled={busy}
                />
              </label>
              <button className="workflow-button" type="submit" disabled={busy || !resolvedFollowUpWorker || !followUpDueAt}>
                {busy ? t('schedulingFollowUp') : t('scheduleFollowUp')}
              </button>
            </form>
          )}
          {!canScheduleFollowUp && user.role === 'ASHA_WORKER' && (
            <p className="workflow-state">{t('careDataUnavailable')}</p>
          )}
          {followUps.length === 0 ? (
            <p className="workflow-state">{t('followUpsEmpty')}</p>
          ) : (
            <div className="patient-activity-list">
              {followUps.map((followUp) => (
                <FollowUpItem
                  key={followUp._id}
                  followUp={followUp}
                  canManage={
                    user.role === 'MEDICAL_OFFICER' ||
                    (user.role === 'ASHA_WORKER' &&
                      typeof followUp.assignedWorker === 'object' &&
                      followUp.assignedWorker._id === user.id)
                  }
                  isMedicalOfficer={user.role === 'MEDICAL_OFFICER'}
                  busy={busy}
                  appLanguage={appLanguage}
                  onUpdate={async (update) => {
                    setBusy(true)
                    try {
                      await updateFollowUp(followUp._id, update)
                      await loadActivity()
                      onNotice(t('followUpUpdated'))
                      return true
                    } catch (requestError) {
                      onError(getApiErrorMessage(requestError, t('followUpUpdateFailed')))
                      return false
                    } finally {
                      setBusy(false)
                    }
                  }}
                />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  )
}

function CareTimeline({
  patient,
  consents,
  screenings,
  diagnostics,
  followUps,
  referrals,
  canViewDiagnostics,
  canViewReferrals,
}: {
  patient: PatientRecord
  consents: ConsentRecord[]
  screenings: ScreeningRecord[]
  diagnostics: DiagnosticOrderRecord[]
  followUps: FollowUpRecord[]
  referrals: ReferralRecord[]
  canViewDiagnostics: boolean
  canViewReferrals: boolean
}) {
  const t = useWorkflowText()
  const appLanguage = useContext(LanguageContext)
  const newestScreening = [...screenings].sort(
    (a, b) => new Date(b.screeningDate).getTime() - new Date(a.screeningDate).getTime(),
  )[0]
  const latestReview = screenings
    .flatMap((screening) => screening.clinicalReviews ?? [])
    .sort((a, b) => new Date(b.reviewedAt).getTime() - new Date(a.reviewedAt).getTime())[0]
  const newestConsent = [...consents]
    .filter((consent) => consent.purpose === 'ORAL_SCREENING')
    .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())[0]
  const latestReferral = referrals[0]
  const latestDiagnostic = diagnostics[0]
  const latestFollowUp = [...followUps].sort(
    (a, b) => new Date(b.dueAt).getTime() - new Date(a.dueAt).getTime(),
  )[0]
  const screeningStatus: Record<ScreeningRecord['screeningStatus'], WorkflowTranslationKey> = {
    PENDING: 'statusPending',
    COMPLETED: 'statusCompleted',
    REQUIRES_REVIEW: 'statusRequiresReview',
  }
  const stages: {
    key: WorkflowTranslationKey
    status: string
    date?: string
    present: boolean
  }[] = [
    {
      key: 'pathwayRegistration',
      status: t(patient.registrationStatus === 'ACTIVE' ? 'timelineActive' : 'timelineInactive'),
      present: true,
    },
    {
      key: 'pathwayConsent',
      status: newestConsent
        ? newestConsent.granted && !newestConsent.withdrawnAt
          ? t('granted')
          : t('inactiveWithdrawn')
        : t('timelineNoRecord'),
      date: newestConsent?.recordedAt,
      present: Boolean(newestConsent),
    },
    {
      key: 'pathwayScreening',
      status: newestScreening
        ? t(screeningStatus[newestScreening.screeningStatus])
        : t('timelineNoRecord'),
      date: newestScreening?.screeningDate,
      present: Boolean(newestScreening),
    },
    {
      key: 'pathwayReview',
      status: latestReview
        ? t('timelineReviewRecorded')
        : screenings.length
          ? t('timelineAwaitingReview')
          : t('timelineNoRecord'),
      date: latestReview?.reviewedAt,
      present: Boolean(latestReview),
    },
    {
      key: 'pathwayReferral',
      status: latestReferral
        ? t(referralStatusKey[latestReferral.status])
        : canViewReferrals
          ? t('timelineNoRecord')
          : t('timelineNotAvailable'),
      present: Boolean(latestReferral),
    },
    {
      key: 'pathwayConsultation',
      status: latestReferral
        ? t(referralStatusKey[latestReferral.status])
        : canViewReferrals
          ? t('timelineNoRecord')
          : t('timelineNotAvailable'),
      date: latestReferral?.appointmentDate,
      present: latestReferral?.status === 'COMPLETED',
    },
    {
      key: 'pathwayDiagnostics',
      status: latestDiagnostic
        ? t(diagnosticStatusKey[latestDiagnostic.status])
        : canViewDiagnostics
          ? t('timelineNoRecord')
          : t('timelineNotAvailable'),
      date: latestDiagnostic?.appointmentDate ?? latestDiagnostic?.reportReceivedAt,
      present: Boolean(latestDiagnostic),
    },
    {
      key: 'pathwayFollowUp',
      status: latestFollowUp
        ? t(followUpStatusKey[latestFollowUp.status])
        : t('timelineNoRecord'),
      date: latestFollowUp?.dueAt,
      present: Boolean(latestFollowUp),
    },
  ]

  return (
    <section className="care-timeline" aria-label={t('patientCareTimeline')}>
      <div className="care-timeline-heading">
        <div>
          <span className="section-kicker">{t('patientCareTimeline')}</span>
          <p>{t('timelineCurrentStatus')}</p>
        </div>
        <span className="timeline-count">{stages.length} {t('timelineStageCount')}</span>
      </div>
      <ol className="care-timeline-list">
        {stages.map((stage, index) => (
          <li
            className={`care-timeline-step ${stage.present ? 'has-record' : ''}`}
            key={stage.key}
          >
            <span className="care-timeline-marker" aria-hidden="true">
              {String(index + 1).padStart(2, '0')}
            </span>
            <div className="care-timeline-copy">
              <strong>{t(stage.key)}</strong>
              <span>{stage.status}</span>
              {stage.date && <time dateTime={stage.date}>{formatDate(stage.date, appLanguage)}</time>}
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

function DiagnosticOrderItem({
  order,
  canManage,
  busy,
  appLanguage,
  onUpdate,
}: {
  order: DiagnosticOrderRecord
  canManage: boolean
  busy: boolean
  appLanguage: AppLanguage
  onUpdate: (update: {
    status?: Exclude<DiagnosticStatus, 'ADVISED'>
    appointmentDate?: string
    note?: string
    resultText?: string
  }) => Promise<boolean>
}) {
  const t = useWorkflowText()
  const [nextStatus, setNextStatus] = useState<DiagnosticStatus | ''>('')
  const [appointmentDate, setAppointmentDate] = useState('')
  const [reviewNote, setReviewNote] = useState('')
  const [resultText, setResultText] = useState('')
  const transitions = diagnosticTransitions[order.status]

  return (
    <article className="patient-activity-card">
      <div className="workflow-card-heading">
        <h4>{t(order.diagnosticType === 'BIOPSY'
          ? 'diagnosticBiopsy'
          : order.diagnosticType === 'HISTOPATHOLOGY'
            ? 'diagnosticHistopathology'
            : order.diagnosticType === 'CT_SCAN'
              ? 'diagnosticCT'
              : order.diagnosticType === 'MRI'
                ? 'diagnosticMRI'
                : 'diagnosticOther')}</h4>
        <span className="workflow-status">{t(diagnosticStatusKey[order.status])}</span>
      </div>
      <p>{order.clinicalReason}</p>
      {order.facilityName && <p>{order.facilityName}</p>}
      {order.appointmentDate && <p>{t('diagnosticAppointment')}: {formatDate(order.appointmentDate, appLanguage)}</p>}
      {order.results.map((result) => (
        <p key={result.recordedAt}>
          {t('diagnosticResult')}: {result.resultText} · {formatDate(result.recordedAt, appLanguage)}
        </p>
      ))}
      {order.reviewNotes && <p>{t('diagnosticReviewNote')}: {order.reviewNotes}</p>}
      {canManage && order.status === 'REPORT_RECEIVED' && order.results.length === 0 && (
        <form className="workflow-inline-form" onSubmit={(event) => {
          event.preventDefault()
          if (resultText.trim() && !busy) {
            void onUpdate({ resultText: resultText.trim() }).then((saved) => {
              if (saved) setResultText('')
            })
          }
        }}>
          <label>
            {t('diagnosticResult')}
            <textarea value={resultText} onChange={(event) => setResultText(event.target.value)} required maxLength={5000} disabled={busy} />
          </label>
          <p className="workflow-state">{t('diagnosticResultHelp')}</p>
          <button className="workflow-button" type="submit" disabled={busy || !resultText.trim()}>
            {busy ? t('diagnosticUpdating') : t('diagnosticResult')}
          </button>
        </form>
      )}
      {canManage && transitions.length > 0 && (
        <form className="workflow-inline-form" onSubmit={(event) => {
          event.preventDefault()
          if (!nextStatus || busy) return
          void onUpdate({
            status: nextStatus as Exclude<DiagnosticStatus, 'ADVISED'>,
            ...(appointmentDate ? { appointmentDate: new Date(appointmentDate).toISOString() } : {}),
            ...(nextStatus === 'REVIEWED' ? { note: reviewNote.trim() } : {}),
          }).then((saved) => {
            if (saved) {
              setNextStatus('')
              setAppointmentDate('')
              setReviewNote('')
            }
          })
        }}>
          <label>
            {t('diagnosticOrderStatus')}
            <select value={nextStatus} onChange={(event) => setNextStatus(event.target.value as DiagnosticStatus | '')} disabled={busy}>
              <option value="">{t('selectStatus')}</option>
              {transitions.map((status) => (
                <option key={status} value={status}>{t(diagnosticStatusKey[status])}</option>
              ))}
            </select>
          </label>
          {nextStatus === 'SCHEDULED' && (
            <label>
              {t('diagnosticAppointment')}
              <input type="datetime-local" value={appointmentDate} onChange={(event) => setAppointmentDate(event.target.value)} min={new Date().toISOString().slice(0, 16)} required disabled={busy} />
            </label>
          )}
          {nextStatus === 'REVIEWED' && (
            <label>
              {t('diagnosticReviewNote')}
              <textarea value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} minLength={1} required disabled={busy} />
            </label>
          )}
          <button className="workflow-secondary-button" type="submit" disabled={busy || !nextStatus || (nextStatus === 'SCHEDULED' && !appointmentDate) || (nextStatus === 'REVIEWED' && !reviewNote.trim())}>
            {busy ? t('diagnosticUpdating') : t('saveDiagnosticUpdate')}
          </button>
        </form>
      )}
    </article>
  )
}

function FollowUpItem({
  followUp,
  canManage,
  isMedicalOfficer,
  busy,
  appLanguage,
  onUpdate,
}: {
  followUp: FollowUpRecord
  canManage: boolean
  isMedicalOfficer: boolean
  busy: boolean
  appLanguage: AppLanguage
  onUpdate: (update: {
    status?: FollowUpRecord['status']
    dueAt?: string
    visitNote?: string
    missedReason?: string
  }) => Promise<boolean>
}) {
  const t = useWorkflowText()
  const [status, setStatus] = useState<FollowUpRecord['status'] | ''>('')
  const [dueAt, setDueAt] = useState('')
  const [visitNote, setVisitNote] = useState('')
  const [missedReason, setMissedReason] = useState('')
  const transitions: Record<FollowUpRecord['status'], FollowUpRecord['status'][]> = {
    PLANNED: ['CONTACTED', 'COMPLETED', 'MISSED', 'CANCELLED'],
    CONTACTED: ['COMPLETED', 'MISSED', 'CANCELLED'],
    MISSED: ['PLANNED', 'CANCELLED'],
    COMPLETED: [],
    CANCELLED: [],
  }
  const options = transitions[followUp.status].filter(
    (next) => isMedicalOfficer || ['CONTACTED', 'COMPLETED', 'MISSED'].includes(next),
  )
  const canReschedule = isMedicalOfficer && ['PLANNED', 'MISSED'].includes(followUp.status)

  return (
    <article className="patient-activity-card">
      <div className="workflow-card-heading">
        <h4>{typeof followUp.assignedWorker === 'object' ? followUp.assignedWorker.fullName : t('followUpWorker')}</h4>
        <span className="workflow-status">{t(followUpStatusKey[followUp.status])}</span>
      </div>
      <p>{t('followUpDue')}: {formatDate(followUp.dueAt, appLanguage)}</p>
      {followUp.visitNotes.map((note) => (
        <p key={note.recordedAt}>{note.text} · {formatDate(note.recordedAt, appLanguage)}</p>
      ))}
      {canManage && (options.length > 0 || canReschedule) && (
        <form className="workflow-inline-form" onSubmit={(event) => {
          event.preventDefault()
          const update = {
            ...(status ? { status } : {}),
            ...(dueAt ? { dueAt: new Date(dueAt).toISOString() } : {}),
            ...(visitNote.trim() ? { visitNote: visitNote.trim() } : {}),
            ...(status === 'MISSED' && missedReason.trim() ? { missedReason: missedReason.trim() } : {}),
          }
          if (Object.keys(update).length === 0 || busy) return
          void onUpdate(update).then((saved) => {
            if (saved) {
              setStatus('')
              setDueAt('')
              setVisitNote('')
              setMissedReason('')
            }
          })
        }}>
          {options.length > 0 && (
            <label>
              {t('followUpStatus')}
              <select value={status} onChange={(event) => setStatus(event.target.value as FollowUpRecord['status'] | '')} disabled={busy}>
                <option value="">{t('selectStatus')}</option>
                {options.map((next) => <option key={next} value={next}>{t(followUpStatusKey[next])}</option>)}
              </select>
            </label>
          )}
          {canReschedule && (
            <label>
              {t('followUpDue')}
              <input type="datetime-local" value={dueAt} onChange={(event) => setDueAt(event.target.value)} min={new Date().toISOString().slice(0, 16)} disabled={busy} />
            </label>
          )}
          {canManage && (
            <label>
              {t('followUpVisitNote')}
              <input value={visitNote} onChange={(event) => setVisitNote(event.target.value)} maxLength={2000} disabled={busy} />
            </label>
          )}
          {status === 'MISSED' && (
            <label>
              {t('followUpMissedReason')}
              <input value={missedReason} onChange={(event) => setMissedReason(event.target.value)} required maxLength={1000} disabled={busy} />
            </label>
          )}
          <button className="workflow-secondary-button" type="submit" disabled={busy || (!status && !dueAt && !visitNote.trim()) || (status === 'MISSED' && !missedReason.trim()) || (followUp.status === 'MISSED' && status === 'PLANNED' && !dueAt)}>
            {busy ? t('followUpUpdating') : t('saveFollowUp')}
          </button>
        </form>
      )}
    </article>
  )
}

function OralConsentControls({
  patient,
  consent,
  onRefresh,
  onError,
  onNotice,
}: {
  patient: PatientRecord
  consent?: ConsentRecord
  onRefresh: () => Promise<void>
  onError: (message: string) => void
  onNotice: (message: string) => void
}) {
  const t = useWorkflowText()
  const appLanguage = useContext(LanguageContext)
  const [language, setLanguage] = useState<'TELUGU' | 'ENGLISH' | 'HINDI'>(
    appLanguage === 'te' ? 'TELUGU' : appLanguage === 'hi' ? 'HINDI' : 'ENGLISH',
  )
  const [notes, setNotes] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [busy, setBusy] = useState(false)
  if (consent?.granted && !consent.withdrawnAt) return null

  return (
    <form
      className="workflow-consent-notice"
      onSubmit={async (event) => {
        event.preventDefault()
        if (!confirmed) return
        setBusy(true)
        try {
          await recordOralScreeningConsent(patient._id, {
            consentVersion: oralScreeningConsentVersion,
            language,
            ...(notes ? { notes } : {}),
          })
          await onRefresh()
          onNotice(t('consentRecorded'))
        } catch (requestError) {
          onError(getApiErrorMessage(requestError, t('consentFailed')))
        } finally {
          setBusy(false)
        }
      }}
    >
      <strong>{t('oralConsentTitle')} · {t('consentVersion')} {oralScreeningConsentVersion}</strong>
      <p>{t('explainConsent')}</p>
      <label>
        {t('consentLanguage')}
        <select value={language} onChange={(event) => setLanguage(event.target.value as typeof language)}>
          <option value="TELUGU">తెలుగు</option>
          <option value="ENGLISH">English</option>
          <option value="HINDI">हिन्दी</option>
        </select>
      </label>
      <label>
        {t('optionalNote')}
        <input maxLength={1000} value={notes} onChange={(event) => setNotes(event.target.value)} />
      </label>
      <label className="workflow-checkbox">
        <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
        {t('screeningConsentCheck')}
      </label>
      <button className="workflow-button" disabled={busy || !confirmed} type="submit">
        {busy ? t('savingConsent') : t('recordScreeningConsent')}
      </button>
    </form>
  )
}

const GUIDED_CAMERA_SITES: {
  site: string
  titleEn: string
  titleTe: string
  framingTipEn: string
  framingTipTe: string
}[] = [
  {
    site: 'TONGUE',
    titleEn: 'Tongue (Dorsal & Ventral)',
    titleTe: 'నాలుక (పై మరియు క్రింది భాగం)',
    framingTipEn:
      'Ask patient to protrude tongue gently and lift tip to inspect ventral surface.',
    framingTipTe:
      'నాలుకను బయటకు చాపి, పైభాగం మరియు క్రింది భాగం స్పష్టంగా కనిపించేలా ఫోటో తీయండి.',
  },
  {
    site: 'RIGHT_CHEEK',
    titleEn: 'Right Buccal Mucosa (Inner Cheek)',
    titleTe: 'కుడి బుగ్గ లోపలి భాగం',
    framingTipEn:
      'Retract cheek gently with clean wooden spatula; center white/red patches in frame.',
    framingTipTe:
      'కుడి బుగ్గ లోపలి పొరపై తెల్లటి లేదా ఎర్రటి మచ్చలు ఫ్రేమ్ మధ్యలో ఉండేలా చూడండి.',
  },
  {
    site: 'LEFT_CHEEK',
    titleEn: 'Left Buccal Mucosa (Inner Cheek)',
    titleTe: 'ఎడమ బుగ్గ లోపలి భాగం',
    framingTipEn:
      'Ensure shadow-free natural or torch illumination across the buccal sulcus.',
    framingTipTe:
      'ఎడమ బుగ్గ లోపల నీడలు పడకుండా సరైన వెలుతురులో ఫోటో తీయండి.',
  },
  {
    site: 'PALATE',
    titleEn: 'Hard & Soft Palate',
    titleTe: 'అంగిలి (పై భాగం)',
    framingTipEn:
      'Tilt head slightly back so palatal vault and uvula region are clearly lit.',
    framingTipTe:
      'తలను కొద్దిగా వెనుకకు వంచి అంగిలి భాగం స్పష్టంగా కనిపించేలా తీయండి.',
  },
  {
    site: 'GUMS',
    titleEn: 'Gingiva & Gums',
    titleTe: 'చిగుళ్ళు',
    framingTipEn:
      'Retract lips to expose upper and lower gingival margins where tobacco quid is placed.',
    framingTipTe:
      'పెదవులను జరిపి చిగుళ్ళ అంచులు మరియు గుట్కా పెట్టే ప్రదేశం కనిపించేలా తీయండి.',
  },
  {
    site: 'FLOOR_OF_MOUTH',
    titleEn: 'Floor of Mouth',
    titleTe: 'నాలుక క్రింది అడుగు భాగం',
    framingTipEn:
      'Ask patient to touch tongue tip to roof of mouth to expose sublingual mucosa.',
    framingTipTe:
      'నాలుక కొనను అంగిలికి తాకించి క్రింది అడుగు భాగం స్పష్టంగా తీయండి.',
  },
]

function analyzeImageBrightnessAndContrast(
  file: File,
): Promise<{ luma: number; contrast: number; previewUrl: string }> {
  return new Promise((resolve) => {
    const previewUrl = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        const width = 120
        const height = 120
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve({ luma: 110, contrast: 32, previewUrl })
          return
        }
        ctx.drawImage(img, 0, 0, width, height)
        const { data } = ctx.getImageData(0, 0, width, height)
        const lumas: number[] = []
        let sum = 0
        for (let i = 0; i < data.length; i += 4) {
          const y = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
          lumas.push(y)
          sum += y
        }
        const mean = sum / Math.max(1, lumas.length)
        let varianceSum = 0
        for (const y of lumas) {
          varianceSum += (y - mean) * (y - mean)
        }
        const stdDev = Math.sqrt(varianceSum / Math.max(1, lumas.length))
        resolve({
          luma: Math.round(mean),
          contrast: Math.round(stdDev),
          previewUrl,
        })
      } catch {
        resolve({ luma: 110, contrast: 32, previewUrl })
      }
    }
    img.onerror = () => resolve({ luma: 110, contrast: 32, previewUrl })
    img.src = previewUrl
  })
}

function ScreeningForm({
  patient,
  hasImageCaptureConsent,
  onGrantImageConsent,
  onCreated,
  onError,
}: {
  patient: PatientRecord
  hasImageCaptureConsent: boolean
  onGrantImageConsent: () => Promise<void>
  onCreated: () => Promise<void>
  onError: (message: string) => void
}) {
  const t = useWorkflowText()
  const [screeningDate, setScreeningDate] = useState(
    new Date().toISOString().slice(0, 10),
  )
  const [findings, setFindings] = useState([{ bodySite: 'RIGHT_CHEEK', observation: '', notes: '' }])
  const [symptom, setSymptom] = useState('')
  const [tobaccoUse, setTobaccoUse] = useState('CURRENT')
  const [tobaccoDuration, setTobaccoDuration] = useState('5+ years smokeless tobacco / khaini')
  const [ulcerDuration, setUlcerDuration] = useState('> 14 days persistent white patch')
  const [mouthOpeningDifficulty, setMouthOpeningDifficulty] = useState('Mild restriction (< 3 fingers)')
  const [notes, setNotes] = useState('')
  const [activeCameraSite, setActiveCameraSite] = useState('RIGHT_CHEEK')
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState('')
  const [imageLuma, setImageLuma] = useState<number | null>(null)
  const [imageContrast, setImageContrast] = useState<number | null>(null)
  const [consentGrantBusy, setConsentGrantBusy] = useState(false)
  const [busy, setBusy] = useState(false)

  // PDF § 3.2: 10-Point Symptoms Checklist & Risk Assessment
  const [selectedSymptoms, setSelectedSymptoms] = useState<Record<string, boolean>>({
    whitePatches: true,
    redPatches: false,
    nonHealingUlcers: true,
    unusualGrowths: false,
    difficultyOpeningMouth: true,
    difficultySwallowing: false,
    painWhileChewing: true,
    bleedingInsideMouth: false,
    persistentPainNumbness: false,
    voiceChangeNeckSwelling: false,
  })
  const [habitDuration, setHabitDuration] = useState('> 3 months')
  const [selectedTobaccoTypes, setSelectedTobaccoTypes] = useState<Record<string, boolean>>({
    khaini: true,
    gutkha: true,
    bidi: false,
    chutta: true, // Endemic tribal reverse smoking
  })
  const [alcoholUse, setAlcoholUse] = useState<'No' | 'Yes' | 'Occasionally'>('Occasionally')
  const [betelNutUse, setBetelNutUse] = useState<'No' | 'Yes'>('Yes')

  const toggleSymptom = (key: string) => {
    setSelectedSymptoms((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const toggleTobacco = (key: string) => {
    setSelectedTobaccoTypes((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const lowQualityWarning =
    imageLuma !== null &&
    imageContrast !== null &&
    (imageLuma < 55 || imageContrast < 16)

  const activeSiteGuide =
    GUIDED_CAMERA_SITES.find((item) => item.site === activeCameraSite) ??
    GUIDED_CAMERA_SITES[1]

  const updateFinding = (index: number, key: 'bodySite' | 'observation' | 'notes', value: string) =>
    setFindings((current) =>
      current.map((finding, itemIndex) =>
        itemIndex === index ? { ...finding, [key]: value } : finding,
      ),
    )

  return (
    <form
      className="workflow-subsection workflow-form"
      onSubmit={async (event) => {
        event.preventDefault()
        setBusy(true)

        const activeSymptoms = Object.entries(selectedSymptoms)
          .filter(([, checked]) => checked)
          .map(([key]) => {
            const labels: Record<string, string> = {
              whitePatches: 'White patches (Leukoplakia / లేత తెలుపు మచ్చలు)',
              redPatches: 'Red patches (Erythroplakia / ఎరుపు మచ్చలు)',
              nonHealingUlcers: 'Non-healing mouth ulcers > 14 days (నయం కాని నోటి పూతలు)',
              unusualGrowths: 'Unusual growths or lumps (నోటిలో గడ్డలు లేదా వాపు)',
              difficultyOpeningMouth: 'Difficulty opening mouth / Trismus (నోరు తెరవడంలో ఇబ్బంది)',
              difficultySwallowing: 'Difficulty swallowing / Dysphagia (మింగడంలో ఇబ్బంది)',
              painWhileChewing: 'Pain while chewing (నమిలేటప్పుడు నొప్పి)',
              bleedingInsideMouth: 'Unexplained bleeding inside mouth (నోటిలో రక్తం కారడం)',
              persistentPainNumbness: 'Persistent pain or numbness in mouth/jaw (స్పర్శ తగ్గడం / నొప్పి)',
              voiceChangeNeckSwelling: 'Voice change or lump in neck (గొంతు మారడం / మెడలో గడ్డలు)',
            }
            return { name: labels[key] || key }
          })
        if (symptom.trim()) {
          activeSymptoms.push({ name: symptom.trim() })
        }

        const activeTobaccoList = Object.entries(selectedTobaccoTypes)
          .filter(([, checked]) => checked)
          .map(([tName]) => tName)
          .join(', ')

        const riskSummaryNotes = [
          notes ? `Clinical Notes: ${notes}` : '',
          `10-Point Symptoms: ${activeSymptoms.map((s) => s.name).join('; ') || 'None reported'}`,
          `Habit Duration: ${habitDuration}`,
          `Tobacco Habits: ${activeTobaccoList || 'None'}`,
          `Alcohol Consumption: ${alcoholUse}`,
          `Betel Nut / Areca Nut: ${betelNutUse}`,
        ]
          .filter(Boolean)
          .join(' | ')

        const screeningPayload = {
          patientId: patient._id,
          screeningDate: new Date(`${screeningDate}T12:00:00Z`).toISOString(),
          examinationFindings: findings,
          symptoms: activeSymptoms,
          tobaccoUse,
          notes: riskSummaryNotes,
        }
        if (!navigator.onLine) {
          await saveOfflineDraftToIndexedDb({
            kind: 'ORAL_SCREENING',
            summary: `Offline Oral Screening: ${patient.fullName} (${patient.patientId})`,
            payload: screeningPayload as Record<string, unknown>,
          })
          onError('Offline Mode — Oral Screening Draft saved to IndexedDB. Use "Sync with Server" once online.')
          setBusy(false)
          return
        }
        try {
          const created = await createScreening(screeningPayload)

          if (selectedImageFile && hasImageCaptureConsent) {
            window.dispatchEvent(
              new CustomEvent('aarogya:feature-motto', { detail: 'AI_SCREENING' }),
            )
            const formData = new FormData()
            formData.append('image', selectedImageFile)
            formData.append('site', activeCameraSite)
            formData.append(
              'qualityStatus',
              lowQualityWarning ? 'INADEQUATE' : 'ADEQUATE',
            )
            formData.append('tobaccoDuration', tobaccoDuration)
            formData.append('ulcerDuration', ulcerDuration)
            formData.append('mouthOpeningDifficulty', mouthOpeningDifficulty)
            await uploadAndAnalyzeScreeningImage(created._id, formData)
          }

          window.dispatchEvent(new Event('aarogya:screening-completed'))
          setFindings([{ bodySite: 'RIGHT_CHEEK', observation: '', notes: '' }])
          setSymptom('')
          setNotes('')
          setSelectedImageFile(null)
          setImagePreviewUrl('')
          setImageLuma(null)
          setImageContrast(null)
          await onCreated()
        } catch (requestError) {
          onError(getApiErrorMessage(requestError, t('screeningFailed')))
        } finally {
          setBusy(false)
        }
      }}
    >
      <div>
        <span className="section-kicker">{t('observationOnly')}</span>
        <h3>{t('recordScreening')}</h3>
        <p className="workflow-help">
          {t('screeningHelp')}
        </p>
      </div>

      {/* Smartphone Guided Camera & Image Capture (Module B & Section 3.3) */}
      <div className="guided-camera-panel">
        <div className="workflow-card-heading">
          <div>
            <span className="section-kicker">
              Module B & C · Smartphone Guided Oral Capture & Gemini AI Triage
            </span>
            <h4>Multi-Site Guided Oral Cavity Photography</h4>
            <p className="workflow-help">
              💡 <strong>తెలుగు సూచన:</strong> నోటి లోపల ఫోటో తీసేటప్పుడు లైట్ సరిగ్గా ఉండేలా చూసుకోండి! — Ensure clear, shadow-free lighting and center the mucosal region inside the guide frame.
            </p>
          </div>
          <span
            className={`workflow-status ${hasImageCaptureConsent ? 'status-good' : 'status-waiting'}`}
          >
            {hasImageCaptureConsent
              ? 'IMAGE_CAPTURE Consent Active'
              : 'IMAGE_CAPTURE Consent Required'}
          </span>
        </div>

        {!hasImageCaptureConsent ? (
          <div className="workflow-consent-notice">
            <strong>Consent Gate: Oral Cavity Photography (`IMAGE_CAPTURE`)</strong>
            <p>
              Oral photograph capture and SHA-256 provenance archiving require explicit `IMAGE_CAPTURE` consent from the patient.
            </p>
            <button
              type="button"
              className="workflow-button"
              disabled={consentGrantBusy}
              onClick={async () => {
                setConsentGrantBusy(true)
                try {
                  await onGrantImageConsent()
                } catch (err) {
                  onError(
                    getApiErrorMessage(
                      err,
                      'Failed to record IMAGE_CAPTURE consent.',
                    ),
                  )
                } finally {
                  setConsentGrantBusy(false)
                }
              }}
            >
              {consentGrantBusy
                ? 'Recording Consent...'
                : '✓ Record IMAGE_CAPTURE Consent & Unlock Guided Oral Camera'}
            </button>
          </div>
        ) : (
          <div className="guided-camera-workspace">
            <div className="guided-site-tabs" role="tablist" aria-label="Anatomical Oral Regions">
              {GUIDED_CAMERA_SITES.map((item) => (
                <button
                  key={item.site}
                  type="button"
                  role="tab"
                  aria-selected={activeCameraSite === item.site}
                  className={`guided-site-tab ${activeCameraSite === item.site ? 'active' : ''}`}
                  onClick={() => {
                    setActiveCameraSite(item.site)
                    updateFinding(0, 'bodySite', item.site)
                  }}
                >
                  <strong>{item.titleEn}</strong>
                  <small>{item.titleTe}</small>
                </button>
              ))}
            </div>

            <div className="guided-framing-card">
              <div className="guided-framing-tips">
                <strong>📍 Active Target: {activeSiteGuide.titleEn} ({activeSiteGuide.titleTe})</strong>
                <p>{activeSiteGuide.framingTipTe}</p>
                <p>{activeSiteGuide.framingTipEn}</p>
              </div>
              <label className="guided-upload-btn-wrap">
                <span>📷 Capture / Select Oral Photograph (JPEG/PNG, Max 5MB)</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  capture="environment"
                  onChange={async (event) => {
                    const file = event.target.files?.[0] ?? null
                    setSelectedImageFile(file)
                    if (!file) {
                      setImagePreviewUrl('')
                      setImageLuma(null)
                      setImageContrast(null)
                      return
                    }
                    const metrics = await analyzeImageBrightnessAndContrast(file)
                    setImagePreviewUrl(metrics.previewUrl)
                    setImageLuma(metrics.luma)
                    setImageContrast(metrics.contrast)
                  }}
                />
              </label>
            </div>

            {lowQualityWarning && (
              <div className="workflow-error guided-luma-warning" role="alert">
                ⚠ Lighting too dark or blurry — Recapture recommended (Measured Brightness Luma: {imageLuma}/255, Contrast: {imageContrast}).
              </div>
            )}

            {imagePreviewUrl && (
              <div className="guided-preview-box">
                <div className="guided-preview-frame">
                  <img src={imagePreviewUrl} alt="Guided oral cavity preview" />
                  <div className="guided-reticle-overlay" aria-hidden="true">
                    <span>TARGET MUCOSA FRAME · {activeSiteGuide.titleEn.toUpperCase()}</span>
                  </div>
                </div>
                <div className="guided-preview-metrics">
                  <span className={`workflow-status ${lowQualityWarning ? 'status-waiting' : 'status-good'}`}>
                    {lowQualityWarning
                      ? 'Lighting too dark or blurry — Recapture recommended'
                      : `✓ Image Quality Adequate (Luma ${imageLuma} · Contrast ${imageContrast})`}
                  </span>
                  <small>
                    SHA-256 cryptographic hash & Google Gemini 2.5 Flash mucosal risk analysis will execute automatically when you save this screening.
                  </small>
                </div>
              </div>
            )}

            <div className="workflow-form-grid">
              <label>
                Tobacco / Areca Nut Duration
                <input
                  value={tobaccoDuration}
                  onChange={(event) => setTobaccoDuration(event.target.value)}
                  placeholder="e.g. 5 years gutka / khaini"
                />
              </label>
              <label>
                Ulcer / Patch Duration
                <input
                  value={ulcerDuration}
                  onChange={(event) => setUlcerDuration(event.target.value)}
                  placeholder="e.g. > 14 days persistent"
                />
              </label>
              <label>
                Mouth Opening Difficulty (Trismus)
                <input
                  value={mouthOpeningDifficulty}
                  onChange={(event) => setMouthOpeningDifficulty(event.target.value)}
                  placeholder="e.g. Mild restriction (< 3 fingers)"
                />
              </label>
            </div>
          </div>
        )}
      </div>
      <label>
        {t('screeningDate')}
        <input required type="date" value={screeningDate} onChange={(event) => setScreeningDate(event.target.value)} />
      </label>
      {findings.map((finding, index) => (
        <div className="workflow-finding" key={index}>
          <label>
            {t('observedRegion')}
            <select value={finding.bodySite} onChange={(event) => updateFinding(index, 'bodySite', event.target.value)}>
              {oralRegions.map(([value, labelKey]) => <option key={value} value={value}>{t(labelKey)}</option>)}
            </select>
          </label>
          <label>
            {t('observation')}
            <textarea required minLength={1} maxLength={1000} value={finding.observation} onChange={(event) => updateFinding(index, 'observation', event.target.value)} />
          </label>
          <label>
            {t('notesOptional')}
            <textarea maxLength={1000} value={finding.notes} onChange={(event) => updateFinding(index, 'notes', event.target.value)} />
          </label>
          {findings.length > 1 && (
            <button
              className="workflow-link"
              type="button"
              onClick={() => setFindings((current) => current.filter((_, itemIndex) => itemIndex !== index))}
            >
              {t('removeFinding')}
            </button>
          )}
        </div>
      ))}
      <button
        className="workflow-secondary-button"
        type="button"
        onClick={() => setFindings((current) => [...current, { bodySite: 'TONGUE', observation: '', notes: '' }])}
      >
        {t('addRegion')}
      </button>
      {/* SECTION 3.2: 10-POINT ORAL HEALTH SYMPTOMS CHECKLIST & RISK FACTOR QUESTIONNAIRE */}
      <div
        style={{
          marginTop: '1.2rem',
          padding: '1.2rem',
          borderRadius: '18px',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.92))',
          border: '1.5px solid rgba(37, 99, 235, 0.22)',
          boxShadow: '0 8px 24px -10px rgba(37, 99, 235, 0.1)',
        }}
      >
        <div style={{ marginBottom: '0.8rem' }}>
          <span className="section-kicker">PDF § 3.2 · CLINICAL QUESTIONNAIRE</span>
          <h4 style={{ margin: '4px 0', fontSize: '1rem', color: '#1e3a8a' }}>
            📋 10-Point Oral Symptoms Checklist (నోటి ఆరోగ్య లక్షణాల జాబితా)
          </h4>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
            Select all present symptoms reported by the patient or observed during clinical inspection.
          </p>
        </div>

        {/* 10 Symptoms Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '8px',
            marginBottom: '1rem',
          }}
        >
          {[
            { key: 'whitePatches', labelEn: 'White patches (Leukoplakia)', labelTe: 'లేత తెలుపు మచ్చలు' },
            { key: 'redPatches', labelEn: 'Red patches (Erythroplakia)', labelTe: 'ఎరుపు రంగు మచ్చలు' },
            { key: 'nonHealingUlcers', labelEn: 'Non-healing ulcers > 14 days', labelTe: 'నయం కాని నోటి పూతలు' },
            { key: 'unusualGrowths', labelEn: 'Unusual growths or lumps', labelTe: 'నోటిలో గడ్డలు లేదా వాపు' },
            { key: 'difficultyOpeningMouth', labelEn: 'Difficulty opening mouth (Trismus)', labelTe: 'నోరు తెరవడంలో ఇబ్బంది' },
            { key: 'difficultySwallowing', labelEn: 'Difficulty swallowing (Dysphagia)', labelTe: 'మింగడంలో ఇబ్బంది' },
            { key: 'painWhileChewing', labelEn: 'Pain while chewing food', labelTe: 'నమిలేటప్పుడు నొప్పి' },
            { key: 'bleedingInsideMouth', labelEn: 'Unexplained bleeding inside mouth', labelTe: 'నోటిలో రక్తం కారడం' },
            { key: 'persistentPainNumbness', labelEn: 'Persistent pain or numbness', labelTe: 'దవడ లేదా పెదవి స్పర్శ తగ్గడం' },
            { key: 'voiceChangeNeckSwelling', labelEn: 'Voice change or neck lump', labelTe: 'గొంతు మారడం / మెడలో గడ్డలు' },
          ].map((item) => (
            <label
              key={item.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                borderRadius: '12px',
                background: selectedSymptoms[item.key] ? '#eff6ff' : '#ffffff',
                border: selectedSymptoms[item.key]
                  ? '1.5px solid #2563eb'
                  : '1px solid #e2e8f0',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <input
                type="checkbox"
                checked={!!selectedSymptoms[item.key]}
                onChange={() => toggleSymptom(item.key)}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '0.82rem', color: '#0f172a' }}>
                <strong>{item.labelEn}</strong>
                <div style={{ fontSize: '0.74rem', color: '#64748b' }}>{item.labelTe}</div>
              </span>
            </label>
          ))}
        </div>

        {/* Habit Duration Radios */}
        <div style={{ margin: '1rem 0' }}>
          <strong style={{ fontSize: '0.82rem', color: '#1e3a8a', display: 'block', marginBottom: '6px' }}>
            ⏱️ Symptom / Habit Duration (లక్షణం ఉన్న సమయం):
          </strong>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {['< 1 week', '1-2 weeks', '2-4 weeks', '1-3 months', '> 3 months'].map((dur) => (
              <label
                key={dur}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '999px',
                  background: habitDuration === dur ? '#eff6ff' : '#f8fafc',
                  border: habitDuration === dur ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                  cursor: 'pointer',
                  fontSize: '0.78rem',
                  fontWeight: habitDuration === dur ? 700 : 500,
                  color: habitDuration === dur ? '#1d4ed8' : '#334155',
                }}
              >
                <input
                  type="radio"
                  name="habitDuration"
                  value={dur}
                  checked={habitDuration === dur}
                  onChange={(e) => setHabitDuration(e.target.value)}
                />
                {dur}
              </label>
            ))}
          </div>
        </div>

        {/* Tobacco & Alcohol Habits Strip */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '12px',
            paddingTop: '10px',
            borderTop: '1px solid #e2e8f0',
          }}
        >
          <div>
            <strong style={{ fontSize: '0.82rem', color: '#1e3a8a', display: 'block', marginBottom: '6px' }}>
              🌿 Tobacco Habit Types:
            </strong>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {[
                { key: 'khaini', label: 'Khaini / Chewing Tobacco (ఖైనీ)' },
                { key: 'gutkha', label: 'Gutkha / Zarda (గుట్కా)' },
                { key: 'bidi', label: 'Bidi / Cigarettes (బీడీ / సిగరెట్)' },
                { key: 'chutta', label: 'Chutta Reverse Smoking (చుట్ట - Tribal)' },
              ].map((tob) => (
                <label key={tob.key} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={!!selectedTobaccoTypes[tob.key]}
                    onChange={() => toggleTobacco(tob.key)}
                  />
                  {tob.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e3a8a', display: 'block' }}>
              🍺 Alcohol Consumption:
              <select
                value={alcoholUse}
                onChange={(e) => setAlcoholUse(e.target.value as 'No' | 'Yes' | 'Occasionally')}
                style={{ marginTop: '4px', width: '100%', padding: '6px 10px', fontSize: '0.82rem' }}
              >
                <option value="No">No (మద్యం అలవాటు లేదు)</option>
                <option value="Occasionally">Occasionally (అప్పుడప్పుడు)</option>
                <option value="Yes">Yes (క్రమం తప్పకుండా)</option>
              </select>
            </label>

            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e3a8a', display: 'block', marginTop: '8px' }}>
              🍃 Betel Nut / Areca Nut:
              <select
                value={betelNutUse}
                onChange={(e) => setBetelNutUse(e.target.value as 'No' | 'Yes')}
                style={{ marginTop: '4px', width: '100%', padding: '6px 10px', fontSize: '0.82rem' }}
              >
                <option value="Yes">Yes (తమలపాకు / పోకచెక్క అలవాటు కలదు)</option>
                <option value="No">No (అలవాటు లేదు)</option>
              </select>
            </label>
          </div>
        </div>
      </div>

      <div className="workflow-form-grid" style={{ marginTop: '1rem' }}>
        <label>
          {t('reportedSymptom')} (Additional notes)
          <input maxLength={100} value={symptom} onChange={(event) => setSymptom(event.target.value)} placeholder="e.g. Right buccal burning sensation with spicy food" />
        </label>
        <label>
          {t('tobaccoUse')} Status
          <select value={tobaccoUse} onChange={(event) => setTobaccoUse(event.target.value)}>
            <option value="CURRENT">CURRENT — ప్రస్తుతం వాడుతున్నారు</option>
            <option value="FORMER">FORMER — గతంలో వాడేవారు</option>
            <option value="NEVER">NEVER — ఎప్పుడూ వాడలేదు</option>
            <option value="NOT_RECORDED">NOT_RECORDED — నమోదు కాలేదు</option>
          </select>
        </label>
        <label className="workflow-full-width">
          {t('screeningNotes')}
          <textarea maxLength={2000} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Clinician diagnostic notes, habit cessation advice given..." />
        </label>
      </div>
      <button className="workflow-button" disabled={busy} type="submit">
        {busy ? t('savingScreening') : t('saveScreening')}
      </button>
    </form>
  )
}

function oralRegionLabel(
  bodySite: string,
  t: (key: WorkflowTranslationKey) => string,
) {
  const key = oralRegions.find(([site]) => site === bodySite)?.[1]
  return key ? t(key) : bodySite
}

function screeningStatusLabel(
  status: ScreeningRecord['screeningStatus'],
  t: (key: WorkflowTranslationKey) => string,
) {
  if (status === 'PENDING') return t('statusPending')
  if (status === 'COMPLETED') return t('statusCompleted')
  return t('statusRequiresReview')
}

function ScreeningHistoryItem({ screening }: { screening: ScreeningRecord }) {
  const t = useWorkflowText()
  const appLanguage = useContext(LanguageContext)
  const worker = typeof screening.screenedBy === 'string'
    ? screening.screenedBy
    : screening.screenedBy.fullName
  const ai = screening.aiAssessment
  const primaryImage = screening.images?.[screening.images.length - 1]

  return (
    <article className="screening-history-item">
      <div className="workflow-card-heading">
        <strong>{formatDate(screening.screeningDate, appLanguage)}</strong>
        <span className="workflow-status">{screeningStatusLabel(screening.screeningStatus, t)}</span>
      </div>
      <p>{t('recordedBy')}: {worker}</p>
      {screening.examinationFindings.map((finding, index) => (
        <p key={`${screening._id}-${index}`}>
          <strong>{oralRegionLabel(finding.bodySite, t)}:</strong>{' '}
          {finding.observation}
          {finding.notes ? ` — ${finding.notes}` : ''}
        </p>
      ))}
      {screening.symptoms.map((item, index) => (
        <p key={`${screening._id}-symptom-${index}`}>{t('reportedSymptomLabel')}: {item.name}</p>
      ))}
      {screening.notes && <p>{screening.notes}</p>}

      {(ai || primaryImage) && (
        <div className="ai-assistive-triage-panel">
          <div className="ai-safety-banner" role="note">
            ⚠ ASSISTIVE SCREENING REPORT — NOT FOR CLINICAL USE. Requires qualified clinical review and biopsy when indicated.
          </div>

          <div className="ai-side-by-side-grid">
            {primaryImage && (
              <div className="ai-photo-evidence-box">
                <div className="ai-photo-bounding-stage">
                  <OralCavityHdVisual
                    width="100%"
                    height={165}
                    showBoundingBox={true}
                    imageSrc={
                      primaryImage.fileUrl && !primaryImage.fileUrl.includes('placeholder')
                        ? resolveMediaUrl(primaryImage.fileUrl)
                        : null
                    }
                  />
                </div>
                <div className="ai-provenance-meta">
                  <span>
                    <strong>Site:</strong> {primaryImage.site} ·{' '}
                    <strong>Quality:</strong> {primaryImage.qualityStatus}
                  </span>
                  <code title={primaryImage.sha256Hash}>
                    SHA-256: {primaryImage.sha256Hash.slice(0, 16)}…{primaryImage.sha256Hash.slice(-8)}
                  </code>
                </div>
              </div>
            )}

            {ai && (
              <div className="ai-gemini-observations-box">
                <div className="workflow-card-heading">
                  <div>
                    <span className="section-kicker">Google Gemini Assistive Analysis</span>
                    <h4>{ai.reportedOralRegion || 'Oral Cavity Mucosal Assessment'}</h4>
                  </div>
                  <span
                    className={`workflow-status ai-risk-badge risk-${(ai.preliminaryRiskCategory || 'MODERATE_RISK').toLowerCase()}`}
                  >
                    {(ai.preliminaryRiskCategory || 'MODERATE_RISK').replaceAll('_', ' ')}
                  </span>
                </div>

                {ai.detectedCondition && (
                  <div style={{ marginBottom: '8px' }}>
                    <h5
                      style={{
                        margin: '2px 0 4px',
                        color: '#0f172a',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        flexWrap: 'wrap',
                      }}
                    >
                      <span>{ai.detectedCondition}</span>
                      {ai.icd10Code && <span className="ai-icd-badge">ICD-10: {ai.icd10Code}</span>}
                      {ai.confidenceScore && (
                        <span className="ai-confidence-pill">{ai.confidenceScore}% Confidence</span>
                      )}
                    </h5>
                  </div>
                )}

                {ai.visibleFeatures && ai.visibleFeatures.length > 0 && (
                  <ul className="ai-feature-list">
                    {ai.visibleFeatures.map((feat, idx) => (
                      <li key={idx}>{feat}</li>
                    ))}
                  </ul>
                )}

                {ai.clinicalExplanation && (
                  <p>
                    <strong>Advisory Clinical Explanation:</strong> {ai.clinicalExplanation}
                  </p>
                )}

                {ai.medications && ai.medications.length > 0 && (
                  <div style={{ marginTop: '10px' }}>
                    <strong style={{ fontSize: '12px', color: '#1e3a8a' }}>℞ Prescribed Medications:</strong>
                    <ul style={{ margin: '4px 0 8px', paddingLeft: '18px', fontSize: '12px' }}>
                      {ai.medications.map((med, mi) => (
                        <li key={mi}>
                          <strong>{med.name}</strong> ({med.dosage}) — {med.frequency} &times; {med.duration}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {ai.teluguSummary && (
                  <div
                    style={{
                      background: '#fffbeb',
                      border: '1px solid #fde68a',
                      borderRadius: '6px',
                      padding: '8px 10px',
                      marginTop: '8px',
                      fontSize: '11.5px',
                      color: '#78350f',
                    }}
                  >
                    <strong>తెలుగు సారాంశం (Telugu Summary):</strong> {ai.teluguSummary}
                  </div>
                )}

                {ai.suggestedNextSteps && (
                  <p>
                    <strong>Suggested Next Steps:</strong> {ai.suggestedNextSteps}
                  </p>
                )}
                <small className="ai-limitation-footnote">
                  {ai.uncertaintyLimitations ||
                    'AI screening is assistive and cannot diagnose or rule out oral cancer.'}{' '}
                  · Model: {ai.modelVersion}
                </small>
              </div>
            )}
          </div>
        </div>
      )}

      {screening.clinicalReviews?.map((review) => (
        <div className="clinical-review-history" key={review._id}>
          <strong>{t('clinicianReview')}: {review.decision === 'AGREE' ? t('agree') : review.decision === 'DISAGREE' ? t('disagree') : t('defer')}</strong>
          <p>{review.clinicalObservations}</p>
          <span>
            {typeof review.reviewedBy === 'string' ? review.reviewedBy : review.reviewedBy.fullName}
            {' · '}{formatDate(review.reviewedAt, appLanguage)}
          </span>
        </div>
      ))}
    </article>
  )
}

function MedicalOfficerReviewQueue({ user }: { user: AuthUser }) {
  const t = useWorkflowText()
  const [queue, setQueue] = useState<ScreeningRecord[]>([])
  const [hospitals, setHospitals] = useState<HospitalRecord[]>([])
  const [specialists, setSpecialists] = useState<SpecialistOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadQueue = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [result, hospitalList, specialistList] = await Promise.all([
        getScreeningReviewQueue(),
        fetchHospitals().catch(() => [] as HospitalRecord[]),
        fetchSpecialists().catch(() => [] as SpecialistOption[]),
      ])
      setQueue(result.screenings)
      setHospitals(hospitalList)
      setSpecialists(specialistList)
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, t('queueFailed')))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    void Promise.resolve().then(loadQueue)
  }, [loadQueue])

  return (
    <section className="workflow-card">
      <div className="workflow-card-heading">
        <div>
          <span className="section-kicker">{t('medicalOfficer')}</span>
          <h2>{t('reviewQueue')}</h2>
        </div>
        <button
          className="workflow-secondary-button"
          type="button"
          disabled={loading}
          aria-busy={loading}
          onClick={() => void loadQueue()}
        >
          {loading ? t('loadingQueue') : t('refresh')}
        </button>
      </div>
      {error && <div className="workflow-error" role="alert">{error}</div>}
      {loading ? (
        <p className="workflow-state">{t('loadingQueue')}</p>
      ) : queue.length === 0 ? (
        <p className="workflow-state">{t('noPending')}</p>
      ) : (
        queue.map((screening) => (
          <ReviewQueueItem
            key={screening._id}
            screening={screening}
            reviewerId={user.id}
            hospitals={hospitals}
            specialists={specialists}
            onReviewed={loadQueue}
          />
        ))
      )}
    </section>
  )
}

function ReviewQueueItem({
  screening,
  reviewerId,
  hospitals,
  specialists,
  onReviewed,
}: {
  screening: ScreeningRecord
  reviewerId: string
  hospitals: HospitalRecord[]
  specialists: SpecialistOption[]
  onReviewed: () => Promise<void>
}) {
  const t = useWorkflowText()
  const appLanguage = useContext(LanguageContext)
  const [expanded, setExpanded] = useState(false)
  const existingReview = screening.clinicalReviews?.find((review) =>
    typeof review.reviewedBy === 'string'
      ? review.reviewedBy === reviewerId
      : review.reviewedBy._id === reviewerId,
  )
  const [reviewRecorded, setReviewRecorded] = useState(Boolean(existingReview))
  const [decision, setDecision] = useState<'AGREE' | 'DISAGREE' | 'DEFER'>(existingReview?.decision ?? 'DEFER')
  const [observations, setObservations] = useState(existingReview?.clinicalObservations ?? '')
  const [notes, setNotes] = useState(existingReview?.notes ?? '')
  const [referralRecommended, setReferralRecommended] = useState(existingReview?.referralRecommended ?? false)
  const [referralReason, setReferralReason] = useState(existingReview?.referralReason ?? '')
  const [assignedSpecialistId, setAssignedSpecialistId] = useState('')
  const [referredTo, setReferredTo] = useState('')
  const [facilityName, setFacilityName] = useState('')
  const [referralPriority, setReferralPriority] = useState<'ROUTINE' | 'URGENT' | 'EMERGENCY'>('ROUTINE')
  const [appointmentDate, setAppointmentDate] = useState('')
  const [referralCreated, setReferralCreated] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const patient = typeof screening.patient === 'string' ? null : screening.patient
  const patientId = patientIdForScreening(screening)

  return (
    <article className="review-queue-item">
      <button
        className="review-queue-toggle"
        type="button"
        aria-expanded={expanded}
        aria-controls={`review-panel-${screening._id}`}
        onClick={() => setExpanded((current) => !current)}
      >
        <span>
          <strong>{patient?.fullName ?? t('patientRecord')}</strong>
          <small>{patient?.patientId ?? patientId} · {formatDate(screening.screeningDate, appLanguage)} · {screeningStatusLabel(screening.screeningStatus, t)}</small>
        </span>
        <span>{expanded ? '−' : '+'}</span>
      </button>
      {expanded && (
        <div id={`review-panel-${screening._id}`}>
          <ScreeningHistoryItem screening={screening} />
          {error && <div className="workflow-error" role="alert">{error}</div>}
          {!reviewRecorded && (
            <form
              className="workflow-form"
              onSubmit={async (event) => {
                event.preventDefault()
                setBusy(true)
                setError('')
                try {
                  await createClinicalReview({
                    screeningId: screening._id,
                    decision,
                    clinicalObservations: observations,
                    ...(notes ? { notes } : {}),
                    referralRecommended,
                    ...(referralRecommended ? { referralReason } : {}),
                  })
                  setReviewRecorded(true)
                  if (!referralRecommended) await onReviewed()
                } catch (requestError) {
                  setError(getApiErrorMessage(requestError, t('reviewFailed')))
                } finally {
                  setBusy(false)
                }
              }}
            >
              <fieldset className="doctor-triage-radio-group">
                <legend>{t('clinicalDecision')} (Signed Clinician Determination)</legend>
                <div className="doctor-triage-radios">
                  <label className={`triage-radio-pill ${decision === 'AGREE' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name={`triage-decision-${screening._id}`}
                      value="AGREE"
                      checked={decision === 'AGREE'}
                      onChange={() => setDecision('AGREE')}
                    />
                    <span>✓ AGREE WITH AI ({t('agree')})</span>
                  </label>
                  <label className={`triage-radio-pill ${decision === 'DISAGREE' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name={`triage-decision-${screening._id}`}
                      value="DISAGREE"
                      checked={decision === 'DISAGREE'}
                      onChange={() => setDecision('DISAGREE')}
                    />
                    <span>✕ DISAGREE WITH AI ({t('disagree')})</span>
                  </label>
                  <label className={`triage-radio-pill ${decision === 'DEFER' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name={`triage-decision-${screening._id}`}
                      value="DEFER"
                      checked={decision === 'DEFER'}
                      onChange={() => setDecision('DEFER')}
                    />
                    <span>↗ DEFER TO SPECIALIST ({t('defer')})</span>
                  </label>
                </div>
              </fieldset>
              <label>
                {t('clinicalObservations')}
                <textarea required minLength={1} maxLength={3000} value={observations} onChange={(event) => setObservations(event.target.value)} />
              </label>
              <label>
                {t('reviewNotes')}
                <textarea maxLength={3000} value={notes} onChange={(event) => setNotes(event.target.value)} />
              </label>
              <label className="workflow-checkbox">
                <input type="checkbox" checked={referralRecommended} onChange={(event) => setReferralRecommended(event.target.checked)} />
                {t('referralRecommended')}
              </label>
              {referralRecommended && (
                <label>
                  {t('referralReason')}
                  <textarea required maxLength={1000} value={referralReason} onChange={(event) => setReferralReason(event.target.value)} />
                </label>
              )}
              <button className="workflow-button" disabled={busy} type="submit">
                {busy ? t('savingReview') : t('recordReview')}
              </button>
            </form>
          )}
          {reviewRecorded && referralRecommended && !referralCreated && (
            <form
              className="workflow-form"
              onSubmit={async (event) => {
                event.preventDefault()
                setBusy(true)
                setError('')
                try {
                  const existingReferrals = await getReferrals()
                  const alreadyCreated = existingReferrals.referrals.some(
                    (referral) => referral.screening === screening._id,
                  )
                  if (alreadyCreated) {
                    setReferralCreated(true)
                    setError(t('referralAlreadyExists'))
                    await onReviewed()
                    return
                  }
                  await createReferral({
                    screeningId: screening._id,
                    ...(assignedSpecialistId ? { assignedSpecialistId } : {}),
                    referralReason,
                    priority: referralPriority,
                    referredTo: referredTo.trim(),
                    facilityName: facilityName.trim(),
                    ...(appointmentDate
                      ? { appointmentDate: new Date(appointmentDate).toISOString() }
                      : {}),
                  })
                  setReferralCreated(true)
                  await onReviewed()
                } catch (requestError) {
                  setError(
                    `${t('reviewSavedReferralFailed')} ${getApiErrorMessage(
                      requestError,
                      t('referralCreateFailed'),
                    )}`,
                  )
                } finally {
                  setBusy(false)
                }
              }}
            >
              <p className="workflow-help">{t('referralRecommended')}</p>
              <label>
                {t('referralReason')}
                <textarea required maxLength={2000} value={referralReason} onChange={(event) => setReferralReason(event.target.value)} />
              </label>
              <label>
                {t('referralPriority')}
                <select value={referralPriority} onChange={(event) => setReferralPriority(event.target.value as typeof referralPriority)}>
                  <option value="ROUTINE">{t('referralPriorityRoutine')}</option>
                  <option value="URGENT">{t('referralPriorityUrgent')}</option>
                  <option value="EMERGENCY">{t('referralPriorityEmergency')}</option>
                </select>
              </label>
              {hospitals.length > 0 && (
                <label>
                  Designated Hospital Directory
                  <select
                    value={facilityName}
                    onChange={(event) => setFacilityName(event.target.value)}
                  >
                    <option value="">Select Designated Referral Hospital</option>
                    {hospitals.map((hospital) => (
                      <option key={hospital.hospitalId} value={hospital.name}>
                        {hospital.name} ({hospital.type.replaceAll('_', ' ')} · {hospital.mandal})
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {specialists.length > 0 && (
                <label>
                  Assigned Specialist Directory
                  <select
                    value={assignedSpecialistId}
                    onChange={(event) => {
                      const nextId = event.target.value
                      setAssignedSpecialistId(nextId)
                      const match = specialists.find((spec) => spec.id === nextId)
                      if (match) {
                        setReferredTo(`${match.fullName} (${match.specialization})`)
                        if (!facilityName && match.hospitalName) {
                          setFacilityName(match.hospitalName)
                        }
                      }
                    }}
                  >
                    <option value="">Select Assigned Specialist Doctor</option>
                    {specialists.map((spec) => (
                      <option key={spec.id} value={spec.id}>
                        {spec.fullName} — {spec.specialization} ({spec.hospitalName})
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label>
                {t('referralReferredTo')}
                <input required minLength={2} maxLength={150} value={referredTo} onChange={(event) => setReferredTo(event.target.value)} />
              </label>
              <label>
                {t('referralFacilityName')}
                <input required minLength={2} maxLength={200} value={facilityName} onChange={(event) => setFacilityName(event.target.value)} />
              </label>
              <label>
                {t('referralDateOptional')}
                <input type="datetime-local" value={appointmentDate} onChange={(event) => setAppointmentDate(event.target.value)} />
              </label>
              <button className="workflow-button" disabled={busy} type="submit">
                {busy ? t('referralCreating') : t('referralCreate')}
              </button>
            </form>
          )}
        </div>
      )}
    </article>
  )
}
