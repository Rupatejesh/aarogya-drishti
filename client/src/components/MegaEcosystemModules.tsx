import { useCallback, useEffect, useState, type FormEvent } from 'react'
import {
  fetchGrievances,
  resolveGrievance,
  submitGrievance,
  type AuthUser,
  type GrievanceRecord,
} from '../services/api'
import {
  useRealtimeNotifications,
  pushRealtimeNotification,
  type NotificationAlertItem,
} from '../utils/notificationEngine'
import { speakBujjiTeluguVoice } from '../utils/bujjiVoiceEngine'

export { type NotificationAlertItem }

/* ============================================================================
   SECTION 1: SPECIALIST WEEKLY 3-PHC CLUSTER CIRCUIT VISITS
   ============================================================================ */
interface ClusteredPatientRow {
  patientId: string
  maaUidn: string
  name: string
  ageSex: string
  village: string
  lesionSummary: string
  riskBadge: 'HIGH_RISK' | 'MODERATE_RISK'
  onSiteIntervention: string
}

interface PhcClusterCircuitItem {
  id: string
  dayLabel: string
  phcName: string
  mandal: string
  clusterTitle: string
  screenedCount: number
  coordinates: string
  visitCompleted: boolean
  lastSyncedAt?: string
  patients: ClusteredPatientRow[]
}

const INITIAL_PHC_CIRCUITS: PhcClusterCircuitItem[] = [
  {
    id: 'phc-gmadugula',
    dayLabel: 'Day 1 (Monday)',
    phcName: 'PHC G. Madugula',
    mandal: 'G. Madugula',
    clusterTitle: 'Oral Premalignant Cluster: 14 Screened Patients',
    screenedCount: 14,
    coordinates: '17.9842° N, 82.5186° E (G. Madugula Agency)',
    visitCompleted: false,
    patients: [
      {
        patientId: 'PT-20261110-GMAD01',
        maaUidn: 'UIDN-ASR-GMAD-2026-0842',
        name: 'Killo Somanna',
        ageSex: '46Y / MALE',
        village: 'G. Madugula',
        lesionSummary: 'Non-scrapable right buccal mucosa leukoplakia (>6 weeks)',
        riskBadge: 'HIGH_RISK',
        onSiteIntervention: 'Scheduled for On-Site Punch Biopsy & Topical Triamcinolone',
      },
      {
        patientId: 'PT-20261110-GMAD02',
        maaUidn: 'UIDN-ASR-GMAD-2026-0849',
        name: 'Pangi Suryamma',
        ageSex: '52Y / FEMALE',
        village: 'Boddapadu (G. Madugula)',
        lesionSummary: 'Palatal smoker/reverse-chutta keratosis with erythema',
        riskBadge: 'HIGH_RISK',
        onSiteIntervention: 'Pending Specialist Toluidine Blue Vital Staining',
      },
      {
        patientId: 'PT-20261110-GMAD03',
        maaUidn: 'UIDN-ASR-GMAD-2026-0854',
        name: 'Korra Apparao',
        ageSex: '39Y / MALE',
        village: 'Nurmathi (G. Madugula)',
        lesionSummary: 'Bilateral fibrous bands (Early Oral Submucous Fibrosis)',
        riskBadge: 'MODERATE_RISK',
        onSiteIntervention: 'Intralesional Hyaluronidase + Physiotherapy Counseling',
      },
    ],
  },
  {
    id: 'phc-hukumpeta',
    dayLabel: 'Day 2 (Wednesday)',
    phcName: 'PHC Hukumpeta',
    mandal: 'Hukumpeta',
    clusterTitle: 'Leukoplakia & OSF High-Risk Cluster: 9 Screened Patients',
    screenedCount: 9,
    coordinates: '18.1462° N, 82.6814° E (Hukumpeta Tribal Belt)',
    visitCompleted: false,
    patients: [
      {
        patientId: 'PT-20261110-HUKU01',
        maaUidn: 'UIDN-ASR-HUKU-2026-0318',
        name: 'Vanthala Balaraju',
        ageSex: '48Y / MALE',
        village: 'Sobhakota (Hukumpeta)',
        lesionSummary: 'Speckled erythro-leukoplakia on lateral tongue border',
        riskBadge: 'HIGH_RISK',
        onSiteIntervention: 'Urgent On-Site Incisional Punch Biopsy Required',
      },
      {
        patientId: 'PT-20261110-HUKU02',
        maaUidn: 'UIDN-ASR-HUKU-2026-0322',
        name: 'Killo Neelamma',
        ageSex: '44Y / FEMALE',
        village: 'Bakuru (Hukumpeta)',
        lesionSummary: 'Severe trismus (20mm interincisal opening) — Grade III OSF',
        riskBadge: 'HIGH_RISK',
        onSiteIntervention: 'Topical Steroid + Antioxidant Regimen + Mouth Gag Exercise',
      },
    ],
  },
  {
    id: 'phc-chintapalli',
    dayLabel: 'Day 3 (Friday)',
    phcName: 'PHC Chintapalli',
    mandal: 'Chinthapalli',
    clusterTitle: 'Severe Ulcer & Suspicious Biopsy Camp: 12 Screened Patients',
    screenedCount: 12,
    coordinates: '17.8685° N, 82.3504° E (Chintapalli Agency)',
    visitCompleted: false,
    patients: [
      {
        patientId: 'PT-20261110-CHIN01',
        maaUidn: 'UIDN-ASR-CHIN-2026-0512',
        name: 'Gemmeli Ramबाबू (Ramababu)',
        ageSex: '55Y / MALE',
        village: 'Lammasingi (Chintapalli)',
        lesionSummary: 'Indurated non-healing ulcer in right retromolar trigone (>4 weeks)',
        riskBadge: 'HIGH_RISK',
        onSiteIntervention: 'Punch Biopsy Sample Collected + 108 Ambulance Transfer to DH Paderu',
      },
      {
        patientId: 'PT-20261110-CHIN02',
        maaUidn: 'UIDN-ASR-CHIN-2026-0519',
        name: 'Siveri Padma',
        ageSex: '41Y / FEMALE',
        village: 'Tajangi (Chintapalli)',
        lesionSummary: 'Homogeneous buccal leukoplakia plaque (1.2 cm)',
        riskBadge: 'MODERATE_RISK',
        onSiteIntervention: 'Topical Triamcinolone Orabase + Tobacco Cessation Counseling',
      },
    ],
  },
]

export function SpecialistPhcCircuitVisitManager() {
  const [circuits, setCircuits] = useState<PhcClusterCircuitItem[]>(INITIAL_PHC_CIRCUITS)
  const [expandedPhcId, setExpandedPhcId] = useState<string>('phc-gmadugula')
  const [activeBiopsyPhcId, setActiveBiopsyPhcId] = useState<string | null>(null)
  const [interventionNote, setInterventionNote] = useState(
    'On-site 4mm Punch Biopsy performed under 2% Lignocaine local anesthesia; specimen preserved in 10% neutral buffered formalin and routed to DH Paderu Histopathology Lab.',
  )
  const [bannerNotice, setBannerNotice] = useState('')

  const handleRecordOnSiteBiopsy = (phcId: string) => {
    setCircuits((current) =>
      current.map((item) =>
        item.id === phcId
          ? {
              ...item,
              patients: item.patients.map((pt, idx) =>
                idx === 0
                  ? { ...pt, onSiteIntervention: `✓ RECORDED: ${interventionNote}` }
                  : pt,
              ),
            }
          : item,
      ),
    )
    const targetPhc = circuits.find((c) => c.id === phcId)
    setBannerNotice(
      `✓ On-Site Physical Treatment & Punch Biopsy recorded at ${targetPhc?.phcName || 'PHC'} and synced to longitudinal EHR!`,
    )
    setActiveBiopsyPhcId(null)
  }

  const handleOrderEmergencyDrone = (circuit: PhcClusterCircuitItem) => {
    window.dispatchEvent(
      new CustomEvent('aarogya:drone-order-dispatched', {
        detail: {
          patientName: `${circuit.phcName} Camp Cluster (${circuit.patients[0]?.name || 'Killo Somanna'})`,
          patientId: circuit.patients[0]?.patientId || 'PT-20261110-GMAD01',
          maaUidn: circuit.patients[0]?.maaUidn || 'UIDN-ASR-GMAD-2026-0842',
          destination: `${circuit.phcName} (${circuit.coordinates})`,
          medicines:
            'Emergency Punch Biopsy Kit, 10% Buffered Formalin Vials, Lignocaine 2% Cartridges, Triamcinolone Paste & Chlorhexidine Gargles',
        },
      }),
    )
    setBannerNotice(
      `🚁 Emergency Medical Drone Payload dispatched from Paderu Central Drone Base to ${circuit.phcName} (ETA: 18 mins)!`,
    )
  }

  const handleMarkVisitCompleted = (phcId: string) => {
    const timestamp = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })
    setCircuits((current) =>
      current.map((item) =>
        item.id === phcId
          ? { ...item, visitCompleted: true, lastSyncedAt: timestamp }
          : item,
      ),
    )
    const targetPhc = circuits.find((c) => c.id === phcId)
    setBannerNotice(
      `✓ Weekly Cluster Circuit Visit at ${targetPhc?.phcName} marked COMPLETED & clinical camp report synced with ITDA Paderu Command Center (${timestamp}).`,
    )
  }

  return (
    <section className="workflow-card" style={{ marginBottom: '1.25rem' }}>
      <div className="workflow-card-heading">
        <div>
          <span className="section-kicker">
            SPECIALIST WEEKLY 3-PHC CLUSTER CIRCUIT VISITS · DISTRICT HOSPITAL PADERU OUTREACH
          </span>
          <h2>Weekly 3-PHC Cluster Circuit Visit &amp; On-Site Camp Treatment Studio</h2>
          <p className="workflow-help">
            District Hospital Paderu Oral Oncologists visit 3 designated rural PHCs every week (Monday, Wednesday, Friday) to treat clustered OPMD &amp; oral cancer cases in person.
          </p>
        </div>
        <span className="workflow-status status-good">35 Clustered Patients Active This Week</span>
      </div>

      {bannerNotice && (
        <div className="workflow-notice" role="status" style={{ marginBottom: '1rem' }}>
          <span>{bannerNotice}</span>
          <button type="button" onClick={() => setBannerNotice('')} aria-label="Dismiss">
            ×
          </button>
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
          gap: '1rem',
        }}
      >
        {circuits.map((circuit) => {
          const isExpanded = expandedPhcId === circuit.id
          return (
            <article
              key={circuit.id}
              className="workflow-subsection"
              style={{
                border: circuit.visitCompleted
                  ? '2px solid rgba(22, 163, 74, 0.45)'
                  : '1.5px solid rgba(37, 99, 235, 0.25)',
                background: circuit.visitCompleted
                  ? 'rgba(240, 253, 244, 0.9)'
                  : 'rgba(255, 255, 255, 0.96)',
              }}
            >
              <div className="workflow-card-heading">
                <div>
                  <span className="section-kicker">
                    {circuit.dayLabel} · {circuit.mandal} Mandal
                  </span>
                  <h3>{circuit.phcName}</h3>
                  <p style={{ fontWeight: 700, color: '#1e3a8a', margin: '0.2rem 0' }}>
                    {circuit.clusterTitle}
                  </p>
                  <small style={{ color: '#64748b' }}>📍 {circuit.coordinates}</small>
                </div>
                <span
                  className={`workflow-status ${circuit.visitCompleted ? 'status-good' : 'ai-risk-badge risk-high_risk'}`}
                >
                  {circuit.visitCompleted
                    ? `✓ VISIT SYNCED (${circuit.lastSyncedAt})`
                    : `${circuit.screenedCount} CLUSTERED CASES`}
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                  marginTop: '0.85rem',
                }}
              >
                <button
                  type="button"
                  className="workflow-secondary-button"
                  onClick={() =>
                    setExpandedPhcId(isExpanded ? '' : circuit.id)
                  }
                >
                  ✦ View Clustered Patients at this PHC ({circuit.patients.length} Priority)
                </button>
                <button
                  type="button"
                  className="workflow-secondary-button"
                  style={{
                    borderColor: 'rgba(217, 119, 6, 0.45)',
                    color: '#b45309',
                    fontWeight: 800,
                  }}
                  onClick={() =>
                    setActiveBiopsyPhcId(
                      activeBiopsyPhcId === circuit.id ? null : circuit.id,
                    )
                  }
                >
                  ✦ Record On-Site Physical Treatment / Punch Biopsy
                </button>
                <button
                  type="button"
                  className="workflow-secondary-button"
                  style={{
                    borderColor: 'rgba(37, 99, 235, 0.45)',
                    color: '#1d4ed8',
                    fontWeight: 800,
                  }}
                  onClick={() => handleOrderEmergencyDrone(circuit)}
                >
                  ✦ Order Emergency Medical Drone Delivery to this PHC
                </button>
                <button
                  type="button"
                  className="workflow-button"
                  disabled={circuit.visitCompleted}
                  onClick={() => handleMarkVisitCompleted(circuit.id)}
                >
                  {circuit.visitCompleted
                    ? '✓ Weekly PHC Visit Completed & Synced'
                    : '✦ Mark Weekly PHC Visit Completed & Sync Clinical Report'}
                </button>
              </div>

              {activeBiopsyPhcId === circuit.id && (
                <div
                  className="workflow-subsection"
                  style={{
                    marginTop: '0.85rem',
                    background: '#fffbeb',
                    border: '1px solid rgba(245, 158, 11, 0.45)',
                  }}
                >
                  <h4>Record On-Site Physical Treatment / Punch Biopsy ({circuit.phcName})</h4>
                  <textarea
                    rows={3}
                    value={interventionNote}
                    onChange={(event) => setInterventionNote(event.target.value)}
                    style={{ width: '100%', marginTop: '0.4rem', marginBottom: '0.6rem' }}
                  />
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      className="workflow-button"
                      onClick={() => handleRecordOnSiteBiopsy(circuit.id)}
                    >
                      ✓ Save On-Site Biopsy &amp; Treatment Note
                    </button>
                    <button
                      type="button"
                      className="workflow-secondary-button"
                      onClick={() => setActiveBiopsyPhcId(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {isExpanded && (
                <div className="workflow-table-wrap" style={{ marginTop: '0.9rem' }}>
                  <table className="workflow-table">
                    <thead>
                      <tr>
                        <th>Patient ID &amp; MAA-UIDN</th>
                        <th>Patient Name</th>
                        <th>Village</th>
                        <th>Lesion / AI Finding</th>
                        <th>On-Site Camp Intervention</th>
                      </tr>
                    </thead>
                    <tbody>
                      {circuit.patients.map((pt) => (
                        <tr key={pt.patientId}>
                          <td>
                            <strong>{pt.patientId}</strong>
                            <br />
                            <code
                              style={{
                                fontSize: '0.72rem',
                                background: '#fef3c7',
                                color: '#92400e',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontWeight: 700,
                              }}
                            >
                              {pt.maaUidn}
                            </code>
                          </td>
                          <td>
                            <strong>{pt.name}</strong>
                            <br />
                            <small>{pt.ageSex}</small>
                          </td>
                          <td>{pt.village}</td>
                          <td>
                            <span
                              className={`workflow-status ${pt.riskBadge === 'HIGH_RISK' ? 'ai-risk-badge risk-high_risk' : ''}`}
                              style={{ marginBottom: '4px', display: 'inline-block' }}
                            >
                              {pt.riskBadge}
                            </span>
                            <br />
                            <small>{pt.lesionSummary}</small>
                          </td>
                          <td>{pt.onSiteIntervention}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}

/* ============================================================================
   SECTION 4: MEDICAL DRONE DELIVERY WORKFLOW & FIGMA FLYING DRONE ANIMATION
   ============================================================================ */
export interface DroneDeliveryOrderItem {
  orderId: string
  patientName: string
  patientId: string
  maaUidn: string
  destination: string
  coordinates: string
  medicinePackage: string
  altitude: string
  weatherStatus: string
  status: 'PENDING_PHC_APPROVAL' | 'AWAITING_LAUNCH' | 'IN_FLIGHT' | 'DELIVERED'
  speedKmh: number
  batteryPct: number
  etaMinutes: number
  routeLabel: string
}

const INITIAL_DRONE_ORDERS: DroneDeliveryOrderItem[] = [
  {
    orderId: 'DRN-20261110-PAD01',
    patientName: 'Killo Somanna',
    patientId: 'PT-20261110-GMAD01',
    maaUidn: 'UIDN-ASR-GMAD-2026-0842',
    destination: 'G. Madugula Habitation (PHC G. Madugula Spoke)',
    coordinates: '17.9842° N, 82.5186° E',
    medicinePackage:
      'Triamcinolone Acetonide 0.1% Orabase Paste + Chlorhexidine 0.2% Gargle + Vitamin A/E Capsules + Formalin Biopsy Vial',
    altitude: '420m AGL (Eastern Ghats Corridor)',
    weatherStatus: 'Clear Sky · Wind 11 km/h NE · Visibility 9.8 km',
    status: 'IN_FLIGHT',
    speedKmh: 42,
    batteryPct: 88,
    etaMinutes: 18,
    routeLabel: 'Paderu Central Drone Base → G. Madugula Habitation',
  },
  {
    orderId: 'DRN-20261110-PAD02',
    patientName: 'Vanthala Balaraju (PHC Hukumpeta Cluster)',
    patientId: 'PT-20261110-HUKU01',
    maaUidn: 'UIDN-ASR-HUKU-2026-0318',
    destination: 'PHC Hukumpeta Hilltop Camp',
    coordinates: '18.1462° N, 82.6814° E',
    medicinePackage:
      'Punch Biopsy Instruments (4mm) + Lignocaine 2% Local Anesthetic + Toluidine Blue Vital Dye Kit',
    altitude: '460m AGL',
    weatherStatus: 'Clear Sky · Wind 9 km/h E',
    status: 'AWAITING_LAUNCH',
    speedKmh: 42,
    batteryPct: 96,
    etaMinutes: 14,
    routeLabel: 'Paderu Central Drone Base → PHC Hukumpeta',
  },
]

export function MedicalDroneLogisticsWorkspace({ user }: { user: AuthUser }) {
  const [orders, setOrders] = useState<DroneDeliveryOrderItem[]>(INITIAL_DRONE_ORDERS)
  const [droneNotice, setDroneNotice] = useState('')

  useEffect(() => {
    const onDroneDispatched = (event: Event) => {
      const custom = event as CustomEvent<{
        patientName?: string
        patientId?: string
        maaUidn?: string
        destination?: string
        medicines?: string
      }>
      const detail = custom.detail || {}
      const newOrder: DroneDeliveryOrderItem = {
        orderId: `DRN-20261110-PAD${String(Math.floor(10 + Math.random() * 89))}`,
        patientName: detail.patientName || 'Killo Somanna',
        patientId: detail.patientId || 'PT-20261110-GMAD01',
        maaUidn: detail.maaUidn || 'UIDN-ASR-GMAD-2026-0842',
        destination: detail.destination || 'G. Madugula Habitation',
        coordinates: '17.9842° N, 82.5186° E',
        medicinePackage:
          detail.medicines ||
          'Antiseptic Gargle, Triamcinolone Paste, Vitamin A & E Supplements',
        altitude: '420m AGL',
        weatherStatus: 'Clear · Wind 11 km/h',
        status: 'AWAITING_LAUNCH',
        speedKmh: 42,
        batteryPct: 94,
        etaMinutes: 18,
        routeLabel: `Paderu Central Drone Base → ${detail.destination || 'G. Madugula'}`,
      }
      setOrders((prev) => [newOrder, ...prev])
      setDroneNotice(
        `🚁 New Urgent Medical Drone Payload queued (${newOrder.orderId}) for ${newOrder.patientName}!`,
      )
    }
    window.addEventListener('aarogya:drone-order-dispatched', onDroneDispatched)
    return () =>
      window.removeEventListener('aarogya:drone-order-dispatched', onDroneDispatched)
  }, [])

  const handleAcceptAndLaunch = (orderId: string) => {
    setOrders((current) =>
      current.map((ord) =>
        ord.orderId === orderId
          ? { ...ord, status: 'IN_FLIGHT', speedKmh: 42, batteryPct: 88, etaMinutes: 18 }
          : ord,
      ),
    )
    setDroneNotice(
      `🚀 Medical Drone ${orderId} launched from Paderu Central Drone Base! Cruising at 42 km/h (Battery: 88%, ETA: 18 mins).`,
    )
  }

  const handleMarkDelivered = (orderId: string) => {
    setOrders((current) =>
      current.map((ord) =>
        ord.orderId === orderId
          ? { ...ord, status: 'DELIVERED', etaMinutes: 0 }
          : ord,
      ),
    )
    setDroneNotice(
      `✓ Medical Drone ${orderId} safely landed at destination and payload verified by ASHA/PHC team!`,
    )
  }

  return (
    <section className="workflow-card" style={{ marginBottom: '1.25rem', overflow: 'hidden' }}>
      <div className="workflow-card-heading">
        <div>
          <span className="section-kicker">
            MEDICAL DRONE LOGISTICS UNIT · ITDA PADERU AERIAL MEDICINE &amp; BIOPSY CORRIDOR
          </span>
          <h2>Paderu Central Medical Drone Dispatch &amp; Live Telemetry</h2>
          <p className="workflow-help">
            Beyond-Visual-Line-of-Sight (BVLOS) cold-chain medical drone network delivering urgent oral oncology medicines and biopsy vials across remote Eastern Ghats tribal habitations.
          </p>
        </div>
        <span className="workflow-status status-good">
          🚁 ACTIVE FLIGHT: 42 km/h · BATTERY 88% · ETA 18 MINS
        </span>
      </div>

      {/* Figma Flying Medical Drone Sky Stage (@keyframes flyDroneCrossing) */}
      <div className="drone-sky-corridor" aria-label="Animated Medical Drone Flight Corridor">
        <div className="drone-corridor-endpoints">
          <span>🏥 Paderu Central Drone Base (Hub)</span>
          <span className="drone-route-dashed" />
          <span>⛰️ G. Madugula / Hukumpeta / Chintapalli (Spokes)</span>
        </div>
        <div className="flying-medical-drone-actor" aria-hidden="true">
          <svg width="110" height="58" viewBox="0 0 110 58" fill="none">
            {/* Spinning Rotors */}
            <ellipse cx="22" cy="12" rx="16" ry="3.5" fill="#2563eb" opacity="0.65" />
            <ellipse cx="88" cy="12" rx="16" ry="3.5" fill="#2563eb" opacity="0.65" />
            <rect x="20" y="12" width="4" height="10" rx="2" fill="#1e293b" />
            <rect x="86" y="12" width="4" height="10" rx="2" fill="#1e293b" />
            {/* Drone Arms & Fuselage */}
            <path d="M16 22 H94" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
            <rect x="34" y="16" width="42" height="16" rx="8" fill="#2563eb" />
            {/* Medical Payload Pod */}
            <rect x="41" y="31" width="28" height="16" rx="5" fill="#ffffff" stroke="#ef4444" strokeWidth="2" />
            <path d="M55 34 V44 M50 39 H60" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
            {/* Landing Skids */}
            <path d="M36 32 L30 50 M74 32 L80 50 M26 50 H40 M70 50 H84" stroke="#475569" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
          <span className="flying-drone-tag">DRN-PAD01 · 42 km/h · 88%</span>
        </div>
      </div>

      {droneNotice && (
        <div className="workflow-notice" role="status" style={{ marginTop: '0.85rem' }}>
          <span>{droneNotice}</span>
          <button type="button" onClick={() => setDroneNotice('')} aria-label="Dismiss">
            ×
          </button>
        </div>
      )}

      <div className="workflow-layout" style={{ marginTop: '1rem' }}>
        {orders.map((ord) => (
          <article key={ord.orderId} className="workflow-subsection">
            <div className="workflow-card-heading">
              <div>
                <span className="section-kicker">
                  {ord.orderId} · Patient: {ord.patientName} ({ord.patientId} · {ord.maaUidn})
                </span>
                <h3>{ord.routeLabel}</h3>
                <p style={{ margin: '0.25rem 0', fontSize: '0.88rem' }}>
                  <strong>Delivery Coordinates:</strong> {ord.destination} ({ord.coordinates})
                </p>
              </div>
              <span
                className={`workflow-status ${
                  ord.status === 'IN_FLIGHT' || ord.status === 'DELIVERED'
                    ? 'status-good'
                    : 'ai-risk-badge risk-high_risk'
                }`}
              >
                {ord.status.replaceAll('_', ' ')}
              </span>
            </div>

            <p style={{ margin: '0.35rem 0' }}>
              <strong>Medicine &amp; Biopsy Payload:</strong> {ord.medicinePackage}
            </p>
            <p style={{ margin: '0.35rem 0', fontSize: '0.86rem', color: '#475569' }}>
              <strong>Altitude:</strong> {ord.altitude} · <strong>Weather Status:</strong>{' '}
              {ord.weatherStatus}
            </p>

            {/* Real-Time Telemetry Metrics Strip */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '0.6rem',
                padding: '0.75rem',
                borderRadius: '12px',
                background: 'rgba(37, 99, 235, 0.06)',
                border: '1px solid rgba(37, 99, 235, 0.18)',
                margin: '0.65rem 0',
              }}
            >
              <div>
                <small style={{ color: '#64748b', display: 'block' }}>CRUISE SPEED</small>
                <strong style={{ color: '#1d4ed8', fontSize: '1.05rem' }}>
                  {ord.speedKmh} km/h
                </strong>
              </div>
              <div>
                <small style={{ color: '#64748b', display: 'block' }}>BATTERY TELEMETRY</small>
                <strong style={{ color: '#15803d', fontSize: '1.05rem' }}>
                  {ord.batteryPct}% LiPo
                </strong>
              </div>
              <div>
                <small style={{ color: '#64748b', display: 'block' }}>ESTIMATED ARRIVAL</small>
                <strong style={{ color: '#b45309', fontSize: '1.05rem' }}>
                  {ord.status === 'DELIVERED' ? 'Delivered' : `${ord.etaMinutes} mins`}
                </strong>
              </div>
              <div>
                <small style={{ color: '#64748b', display: 'block' }}>FLIGHT CORRIDOR</small>
                <strong style={{ color: '#0f172a', fontSize: '0.88rem' }}>
                  Paderu Base → G. Madugula
                </strong>
              </div>
            </div>

            {(user.role === 'DRONE_OPERATOR' ||
              user.role === 'SPECIALIST' ||
              user.role === 'MEDICAL_OFFICER' ||
              user.role === 'ITDA_PROJECT_OFFICER' ||
              user.role === 'ADMIN') && (
              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                {ord.status !== 'IN_FLIGHT' && ord.status !== 'DELIVERED' && (
                  <button
                    type="button"
                    className="workflow-button"
                    onClick={() => handleAcceptAndLaunch(ord.orderId)}
                  >
                    ✦ Accept &amp; Launch Drone
                  </button>
                )}
                {ord.status === 'IN_FLIGHT' && (
                  <button
                    type="button"
                    className="workflow-secondary-button"
                    onClick={() => handleMarkDelivered(ord.orderId)}
                  >
                    ✓ Confirm Safe Landing &amp; Payload Handover
                  </button>
                )}
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}

/* ============================================================================
   SECTION 5: TRIBAL AMBULANCE PICKUP & DROP TRACKING SYSTEM (5-Stage Real-Time Journey)
   ============================================================================ */
export const AMBULANCE_5_STAGES = [
  {
    key: 'DISPATCHED_FROM_BASE',
    labelEn: 'Ambulance Dispatched from Hospital Base',
    labelTe: 'ఆసుపత్రి బేస్ నుండి అంబులెన్స్ బయలుదేరింది',
    labelHi: 'अस्पताल बेस से एम्बुलेंस रवाना',
    descEn: 'Dispatched at 10:40 AM from Area Hospital Base. Driver & EMT on board.',
    descTe: 'ఉదయం 10:40 కి బేస్ నుండి బయలుదేరింది. డ్రైవర్ మరియు పారామెడిక్ సిద్ధంగా ఉన్నారు.',
    time: '10:40 AM · Dispatched',
    icon: '🚨',
    proximity: '14.8 Km away · 35 Mins Est. Travel Time',
  },
  {
    key: 'APPROACHING_VILLAGE',
    labelEn: 'En Route & Approaching Tribal Village',
    labelTe: 'మార్గంలో ఉంది & గిరిజన గ్రామానికి సమీపిస్తోంది',
    labelHi: 'रास्ते में है और गांव के निकट पहुंच रही है',
    descEn: 'Passing Chintapalli Ghat Corridor. High-clearance 4x4 mode engaged.',
    descTe: 'చింతపల్లి ఘాట్ మార్గంలో ప్రయాణిస్తోంది. గ్రామానికి చేరుకోవడానికి 12 నిమిషాలు.',
    time: '11:05 AM · Approaching',
    icon: '🗺️',
    proximity: '4.2 Km away · ⏱ 12 Minutes Countdown',
  },
  {
    key: 'REACHED_VILLAGE_BOARDED',
    labelEn: 'Village Reached & Patient Boarded',
    labelTe: 'గ్రామానికి చేరింది & రోగిని ఎక్కించుకున్నారు',
    labelHi: 'गांव पहुँच गई और रोगी सवार हो गया',
    descEn: 'Ambulance on-site. Patient vitals stabilized by EMT Sri K. Ramesh (SpO2: 98%, BP: 120/82).',
    descTe: 'అంబులెన్స్ గ్రామానికి చేరుకుంది. పారామెడిక్ ద్వారా ప్రాథమిక పరీక్షలు మరియు ఆక్సిజన్ అందించబడ్డాయి.',
    time: '11:18 AM · Boarded',
    icon: '🏡',
    proximity: '0.0 Km · Hamlet On-Site Pickup Complete',
  },
  {
    key: 'RETURN_TRANSIT',
    labelEn: 'Return Transit to Hospital / Referral PHC',
    labelTe: 'ఆసుపత్రికి తిరుగు ప్రయాణం ప్రారంభమైంది',
    labelHi: 'अस्पताल / रेफ़रल पीएचसी के लिए वापसी',
    descEn: 'Navigating ghat highway toward District Hospital Paderu. Green corridor priority.',
    descTe: 'పాడేరు జిల్లా ఆసుపత్రికి తరలిస్తున్నారు. అత్యవసర కారిడార్ క్లియరెన్స్ యాక్టివ్.',
    time: '11:28 AM · In Transit',
    icon: '🚑',
    proximity: 'En Route to DH Paderu · ⏱ 24 Minutes to Emergency OPD',
  },
  {
    key: 'ARRIVED_ADMITTED',
    labelEn: 'Reached Hospital & Admitted to Oncology Ward',
    labelTe: 'ఆసుపత్రికి చేరింది & వార్డులో చేర్చారు',
    labelHi: 'अस्पताल पहुंच गए और भर्ती किया गया',
    descEn: 'Patient safely admitted to Room No. 4, ITDA Helpdesk & Oral Oncology Emergency OPD.',
    descTe: 'పాడేరు జిల్లా ఆసుపత్రికి సురక్షితంగా చేరుకున్నారు. డ్యూటీ మెడికల్ ఆఫీసర్‌కు రోగిని అప్పగించారు.',
    time: '11:55 AM · Admitted',
    icon: '🏥',
    proximity: 'Arrived at Destination · Admission Complete ✓',
  },
] as const

export function TribalAmbulanceDispatchTracker() {
  const [stageIndex, setStageIndex] = useState<number>(1) // Default: EN ROUTE & APPROACHING VILLAGE
  const [ambulanceNotice, setAmbulanceNotice] = useState('')
  const currentStage = AMBULANCE_5_STAGES[stageIndex]

  const advanceStage = () => {
    const nextIdx = (stageIndex + 1) % AMBULANCE_5_STAGES.length
    setStageIndex(nextIdx)
    const stage = AMBULANCE_5_STAGES[nextIdx]
    setAmbulanceNotice(`🚑 Ambulance AP-39-TE-1084 advanced to: ${stage.labelEn}!`)
    pushRealtimeNotification({
      title: `🚑 108 Ambulance: ${stage.labelEn}`,
      message: `Vehicle AP-39-TE-1084 update: ${stage.proximity} (Paderu ITDA Emergency Grid).`,
      category: 'APPOINTMENT',
    })
    speakBujjiTeluguVoice(
      `108 అత్యవసర అంబులెన్స్ సమాచారం: ${stage.labelTe}. ${stage.proximity}`,
      'TE'
    )
  }

  const resetStage = () => {
    setStageIndex(0)
    setAmbulanceNotice('🔄 Ambulance route reset to Stage 01: Dispatched from Hospital Base.')
  }

  return (
    <section className="workflow-card" style={{ marginBottom: '1.25rem', border: '1.5px solid #2563eb', borderRadius: '18px', overflow: 'hidden' }}>
      <div className="workflow-card-heading" style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)', padding: '20px 24px', borderBottom: '1px solid #dbeafe' }}>
        <div>
          <span className="section-kicker" style={{ color: '#2563eb', fontWeight: 800 }}>
            TRIBAL EMERGENCY AMBULANCE PICKUP &amp; DROP TRACKING · ITDA 108 FEEDER SERVICE
          </span>
          <h2 style={{ fontSize: '1.25rem', margin: '4px 0 6px', color: '#0f172a' }}>
            5-Stage Live GPS Journey Tracker · AP-39-TE-1084 (4x4 Feeder)
          </h2>
          <p className="workflow-help" style={{ margin: 0, fontSize: '0.86rem', color: '#475569' }}>
            Dedicated zero-cost tribal patient transport coordination for urgent biopsy and oral oncology care across Alluri Sitharama Raju District.
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span className="workflow-status ai-risk-badge risk-high_risk" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', padding: '6px 12px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#dc2626', animation: 'pulse 1.5s infinite' }} />
            STAGE 0{stageIndex + 1} / 05 · {currentStage.key}
          </span>
          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
            Live Satellite Beacon · 30s Polling Rate
          </div>
        </div>
      </div>

      <div style={{ padding: '20px 24px' }}>
        {ambulanceNotice && (
          <div className="workflow-notice" role="status" style={{ marginBottom: '1rem', background: '#eff6ff', borderLeft: '4px solid #2563eb', color: '#1e40af', fontWeight: 600 }}>
            <span>{ambulanceNotice}</span>
            <button type="button" onClick={() => setAmbulanceNotice('')} aria-label="Dismiss" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: '#1e40af' }}>
              ×
            </button>
          </div>
        )}

        {/* Dynamic Vehicle & Crew Telemetry Card (§ 3.A) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '12px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '14px',
            padding: '16px',
            marginBottom: '20px',
          }}
        >
          <div>
            <small style={{ color: '#64748b', display: 'block', fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase' }}>
              Vehicle Reg Number
            </small>
            <strong style={{ fontSize: '1.02rem', color: '#0f172a' }}>
              AP-39-TE-1084
            </strong>
            <div style={{ fontSize: '11px', color: '#2563eb', marginTop: '2px' }}>
              ASR Tribal 4x4 Feeder Ambulance
            </div>
          </div>

          <div>
            <small style={{ color: '#64748b', display: 'block', fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase' }}>
              Assigned Driver &amp; Direct Call
            </small>
            <strong style={{ fontSize: '0.96rem', color: '#0f172a', display: 'block' }}>
              Sri M. Simhachalam
            </strong>
            <a
              href="tel:+919440108108"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                color: '#16a34a',
                fontSize: '11.5px',
                fontWeight: 700,
                textDecoration: 'none',
                marginTop: '3px',
              }}
            >
              📞 Call: +91 94401-08108
            </a>
          </div>

          <div>
            <small style={{ color: '#64748b', display: 'block', fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase' }}>
              Paramedic Onboard (EMT)
            </small>
            <strong style={{ fontSize: '0.96rem', color: '#0f172a', display: 'block' }}>
              Sri K. Ramesh, EMT
            </strong>
            <a
              href="tel:+919440108109"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                color: '#0284c7',
                fontSize: '11.5px',
                fontWeight: 700,
                textDecoration: 'none',
                marginTop: '3px',
              }}
            >
              📞 Call: +91 94401-08109
            </a>
          </div>

          <div>
            <small style={{ color: '#64748b', display: 'block', fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase' }}>
              Base Hospital &amp; Destination
            </small>
            <strong style={{ fontSize: '0.96rem', color: '#1e3a8a', display: 'block' }}>
              Area Hospital Chintapalli
            </strong>
            <div style={{ fontSize: '11px', color: '#dc2626', marginTop: '2px' }}>
              Destination: District Hospital Paderu
            </div>
          </div>
        </div>

        {/* Live Proximity Countdown Banner */}
        <div
          style={{
            background: stageIndex === 4 ? '#f0fdf4' : '#eff6ff',
            border: `1.5px solid ${stageIndex === 4 ? '#86efac' : '#93c5fd'}`,
            borderRadius: '12px',
            padding: '12px 18px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>{currentStage.icon}</span>
            <div>
              <strong style={{ fontSize: '0.96rem', color: stageIndex === 4 ? '#166534' : '#1e40af' }}>
                {currentStage.labelEn}
              </strong>
              <div style={{ fontSize: '0.82rem', color: stageIndex === 4 ? '#15803d' : '#2563eb' }}>
                {currentStage.descEn}
              </div>
            </div>
          </div>
          <div style={{ background: '#ffffff', padding: '6px 14px', borderRadius: '20px', border: '1px solid #cbd5e1', fontWeight: 800, fontSize: '0.86rem', color: '#0f172a' }}>
            📍 {currentStage.proximity}
          </div>
        </div>

        {/* 5-Stage Live Visual Progression Stepper (§ 3.B - Amazon/Uber Style) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          {AMBULANCE_5_STAGES.map((stg, idx) => {
            const isCompleted = idx < stageIndex
            const isCurrent = idx === stageIndex
            return (
              <div
                key={stg.key}
                onClick={() => {
                  setStageIndex(idx)
                  setAmbulanceNotice(`🚑 Switched view to Stage 0${idx + 1}: ${stg.labelEn}`)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '14px',
                  padding: '14px 18px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  border: isCurrent
                    ? '2px solid #2563eb'
                    : isCompleted
                      ? '1.5px solid #86efac'
                      : '1px solid #e2e8f0',
                  background: isCurrent
                    ? '#eff6ff'
                    : isCompleted
                      ? '#f0fdf4'
                      : '#ffffff',
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Step Indicator Circle */}
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '13px',
                    fontWeight: 800,
                    flexShrink: 0,
                    background: isCurrent
                      ? '#2563eb'
                      : isCompleted
                        ? '#16a34a'
                        : '#e2e8f0',
                    color: isCurrent || isCompleted ? '#ffffff' : '#64748b',
                    boxShadow: isCurrent ? '0 0 0 4px rgba(37, 99, 235, 0.25)' : 'none',
                  }}
                >
                  {isCompleted ? '✓' : `0${idx + 1}`}
                </div>

                {/* Step Text Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                    <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: isCurrent ? '#1e40af' : '#0f172a' }}>
                      {stg.labelEn}
                    </h4>
                    <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
                      {stg.time}
                    </span>
                  </div>

                  <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: isCurrent ? '#1d4ed8' : '#64748b' }}>
                    {stg.descEn}
                  </p>

                  <div style={{ margin: '3px 0 0', fontSize: '0.78rem', color: '#475569', fontStyle: 'italic' }}>
                    తెలుగు: {stg.labelTe}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Interactive Controls Bar (§ 3.B Simulation Bar) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', paddingTop: '14px', borderTop: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.84rem', color: '#334155', fontWeight: 600 }}>
            📍 <strong>GPS Highway Corridor:</strong> Area Hospital Chintapalli Base → Ghat Mile 14 → G. Madugula Hamlet → District Hospital Paderu
          </span>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="workflow-secondary-button"
              onClick={resetStage}
              style={{ fontSize: '0.82rem', padding: '8px 14px' }}
            >
              ↺ Reset Route (రీసెట్)
            </button>
            <button
              type="button"
              className="workflow-button"
              onClick={advanceStage}
              style={{ fontSize: '0.84rem', padding: '8px 18px', background: '#2563eb', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <span>✦ Advance Stage (దశను మార్చండి)</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ============================================================================
   SECTION 6: PATIENT GRIEVANCE & TREATMENT FEEDBACK REDRESSAL SYSTEM
   ============================================================================ */
const FALLBACK_GRIEVANCES: GrievanceRecord[] = [
  {
    grievanceId: 'GRV-20261110-0104',
    patientId: 'PT-20261110-GMAD01',
    patientName: 'Killo Somanna',
    mandal: 'G. Madugula',
    category: 'TRANSPORT_ISSUE',
    description:
      'Need ITDA 108 tribal feeder ambulance pickup from G. Madugula hilltop hamlet to District Hospital Paderu for punch biopsy.',
    status: 'UNDER_REVIEW',
    filedAt: '2026-11-10T09:40:00.000Z',
  },
]

export function PatientGrievanceAndRedressalDesk({ user }: { user: AuthUser }) {
  const [grievances, setGrievances] = useState<GrievanceRecord[]>(FALLBACK_GRIEVANCES)
  const [category, setCategory] =
    useState<GrievanceRecord['category']>('TRANSPORT_ISSUE')
  const [mandal, setMandal] = useState(user.mandal || 'G. Madugula')
  const [description, setDescription] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')

  const loadGrievances = useCallback(async () => {
    try {
      const list = await fetchGrievances()
      if (list.length > 0) setGrievances(list)
    } catch {
      // Keep fallback list if offline
    }
  }, [])

  useEffect(() => {
    void Promise.resolve().then(loadGrievances)
  }, [loadGrievances])

  const handleSubmitGrievance = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!description.trim() || busy) return
    setBusy(true)
    try {
      const created = await submitGrievance({
        patientId: 'PT-20261110-GMAD01',
        patientName: user.role === 'PATIENT' ? user.fullName : 'Killo Somanna',
        mandal,
        category,
        description: description.trim(),
      })
      setGrievances((prev) => [created, ...prev])
      setDescription('')
      setNotice(
        `✓ Grievance ${created.grievanceId} registered! ITDA Project Officer & Medical Officer Redressal Desk notified.`,
      )
      pushRealtimeNotification(
        {
          title: '⚠️ Patient Grievance Registered',
          message: `Grievance ticket #${created.grievanceId} filed for ${user.fullName} (${mandal}). ITDA Redressal desk notified.`,
          category: 'GRIEVANCE',
        },
        user,
      )
    } catch {
      const fallbackItem: GrievanceRecord = {
        grievanceId: `GRV-20261110-${String(Math.floor(1000 + Math.random() * 9000))}`,
        patientId: 'PT-20261110-GMAD01',
        patientName: user.role === 'PATIENT' ? user.fullName : 'Killo Somanna',
        mandal,
        category,
        description: description.trim(),
        status: 'SUBMITTED',
        filedAt: new Date().toISOString(),
      }
      setGrievances((prev) => [fallbackItem, ...prev])
      setDescription('')
      setNotice(
        `✓ Grievance ${fallbackItem.grievanceId} recorded and queued for ITDA Redressal Desk!`,
      )
      pushRealtimeNotification(
        {
          title: '⚠️ Patient Grievance Registered',
          message: `Grievance ticket #${fallbackItem.grievanceId} filed for ${user.fullName} (${mandal}). ITDA Redressal desk notified.`,
          category: 'GRIEVANCE',
        },
        user,
      )
    } finally {
      setBusy(false)
    }
  }

  const handleResolve = async (item: GrievanceRecord) => {
    const redressalNote =
      'ITDA Paderu Grievance Cell & Medical Officer verified and dispatched immediate 108 transport + medicine support.'
    try {
      const updated = await resolveGrievance(
        item._id || item.grievanceId,
        redressalNote,
      )
      setGrievances((prev) =>
        prev.map((g) => (g.grievanceId === item.grievanceId ? updated : g)),
      )
    } catch {
      setGrievances((prev) =>
        prev.map((g) =>
          g.grievanceId === item.grievanceId
            ? { ...g, status: 'RESOLVED', actionTaken: redressalNote }
            : g,
        ),
      )
    }
    setNotice(
      `✓ Grievance ${item.grievanceId} marked RESOLVED & redressal action dispatched to patient!`,
    )
  }

  const canResolve =
    user.role === 'ITDA_PROJECT_OFFICER' ||
    user.role === 'MEDICAL_OFFICER' ||
    user.role === 'SPECIALIST' ||
    user.role === 'DISTRICT_OFFICER' ||
    user.role === 'ADMIN'

  return (
    <section className="workflow-card" style={{ marginBottom: '1.25rem' }}>
      <div className="workflow-card-heading">
        <div>
          <span className="section-kicker">
            PATIENT GRIEVANCE &amp; TREATMENT FEEDBACK REDRESSAL DESK · ITDA PADERU GOVERNANCE
          </span>
          <h2>
            File a Grievance / సమస్య లేదా ఫిర్యాదు నమోదు &amp; Redressal Desk
          </h2>
          <p className="workflow-help">
            Direct tribal patient feedback and rapid grievance redressal monitored by the ITDA Project Officer Paderu and PHC Medical Officers.
          </p>
        </div>
        <span className="workflow-status status-good">
          {grievances.filter((g) => g.status !== 'RESOLVED').length} Active Complaints
        </span>
      </div>

      {notice && (
        <div className="workflow-notice" role="status" style={{ marginBottom: '0.9rem' }}>
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice('')} aria-label="Dismiss">
            ×
          </button>
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1rem',
        }}
      >
        {/* File a Grievance Form */}
        <form className="workflow-subsection workflow-form" onSubmit={handleSubmitGrievance}>
          <h3>📝 File a Grievance / సమస్య లేదా ఫిర్యాదు నమోదు</h3>
          <div className="workflow-form-grid">
            <label>
              Grievance Category (సమస్య రకం)
              <select
                value={category}
                onChange={(event) =>
                  setCategory(event.target.value as GrievanceRecord['category'])
                }
              >
                <option value="TRANSPORT_ISSUE">
                  TRANSPORT_ISSUE — Ambulance / Travel Delay
                </option>
                <option value="MEDICINE_SHORTAGE">
                  MEDICINE_SHORTAGE — Medicine / Topical Paste Availability
                </option>
                <option value="TREATMENT_DELAY">
                  TREATMENT_DELAY — Biopsy / Appointment Waiting Time
                </option>
                <option value="STAFF_BEHAVIOR">
                  STAFF_BEHAVIOR — Hospital Helpdesk Assistance
                </option>
                <option value="OTHER">OTHER — General Feedback</option>
              </select>
            </label>
            <label>
              Tribal Mandal (మండలం)
              <input
                type="text"
                value={mandal}
                onChange={(event) => setMandal(event.target.value)}
              />
            </label>
          </div>
          <label>
            Describe Issue or Treatment Feedback (సమస్య వివరాలు)
            <textarea
              required
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="ఉదా: పాడేరు ఆసుపత్రికి వెళ్ళడానికి 108 అంబులెన్స్ సహాయం కావాలి / Describe any medicine, transport, or appointment issue..."
            />
          </label>
          <button type="submit" className="workflow-button" disabled={busy}>
            {busy ? 'Submitting Grievance...' : '✦ Submit Grievance to ITDA Redressal Desk'}
          </button>
        </form>

        {/* Active Grievances & Redressal Desk */}
        <div className="workflow-subsection">
          <h3>⚖️ ITDA &amp; Medical Officer Grievance Redressal Desk</h3>
          <div className="workflow-layout" style={{ marginTop: '0.6rem' }}>
            {grievances.map((item) => (
              <article
                key={item.grievanceId}
                style={{
                  padding: '0.85rem',
                  borderRadius: '14px',
                  background: '#ffffff',
                  border:
                    item.status === 'RESOLVED'
                      ? '1.5px solid rgba(22, 163, 74, 0.4)'
                      : '1.5px solid rgba(245, 158, 11, 0.45)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '0.5rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <strong>
                    {item.grievanceId} · {item.patientName} ({item.mandal})
                  </strong>
                  <span
                    className={`workflow-status ${
                      item.status === 'RESOLVED'
                        ? 'status-good'
                        : 'ai-risk-badge risk-high_risk'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
                <p style={{ fontSize: '0.84rem', margin: '0.35rem 0', color: '#1e293b' }}>
                  <strong>[{item.category.replaceAll('_', ' ')}]:</strong> {item.description}
                </p>
                {item.actionTaken && (
                  <p style={{ fontSize: '0.82rem', color: '#15803d', margin: '0.3rem 0' }}>
                    <strong>✓ Redressal Action:</strong> {item.actionTaken}
                  </p>
                )}
                {canResolve && item.status !== 'RESOLVED' && (
                  <button
                    type="button"
                    className="workflow-button"
                    style={{ marginTop: '0.4rem' }}
                    onClick={() => void handleResolve(item)}
                  >
                    ✦ Resolve &amp; Dispatch Redressal Action
                  </button>
                )}
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ============================================================================
   SECTION 5: HOSPITAL MANAGER OPERATIONS & DOCTOR ROSTER MANAGEMENT (PDF § 2.2 & § 8.2)
   ============================================================================ */
export interface DoctorRosterItem {
  id: string
  name: string
  qualifications: string
  specialization: string
  registrationNumber: string
  contactPhone: string
  status: 'ON_DUTY' | 'CIRCUIT_VISIT' | 'OFF_DUTY'
  consultationFee: string
  opdSchedule: string
  availableToday: boolean
  mandal: string
  assignedHospital: string
}

const INITIAL_DOCTORS: DoctorRosterItem[] = [
  {
    id: 'doc-01',
    name: 'Dr. V. Anitha Rao, MDS',
    qualifications: 'MDS (Oral & Maxillofacial Oncology)',
    specialization: 'Oral Oncology & Premalignant Lesions',
    registrationNumber: 'AP-DENT-4482',
    contactPhone: '+91 98480 23451',
    status: 'ON_DUTY',
    consultationFee: '₹0 (Free Govt / Aarogyasri)',
    opdSchedule: 'Mon, Wed, Fri (9:00 AM - 1:00 PM)',
    availableToday: true,
    mandal: 'Paderu',
    assignedHospital: 'District Hospital Paderu',
  },
  {
    id: 'doc-02',
    name: 'Dr. P. Anitha',
    qualifications: 'BDS, PGDHM (Senior Dental Surgeon)',
    specialization: 'Oral Surgery & Biopsy Extraction',
    registrationNumber: 'AP-DENT-6719',
    contactPhone: '+91 98480 34562',
    status: 'ON_DUTY',
    consultationFee: '₹0 (Free Govt / Aarogyasri)',
    opdSchedule: 'Mon - Sat (9:00 AM - 4:00 PM)',
    availableToday: true,
    mandal: 'Paderu',
    assignedHospital: 'District Hospital Paderu',
  },
  {
    id: 'doc-03',
    name: 'Dr. M. Varma',
    qualifications: 'MD (Pathology), DNB',
    specialization: 'Histopathology & Tele-Pathology',
    registrationNumber: 'AP-MED-9021',
    contactPhone: '+91 98480 45673',
    status: 'ON_DUTY',
    consultationFee: '₹0 (Free Govt / Aarogyasri)',
    opdSchedule: 'Tue, Thu, Sat (10:00 AM - 3:00 PM)',
    availableToday: true,
    mandal: 'Paderu',
    assignedHospital: 'District Hospital Paderu',
  },
  {
    id: 'doc-04',
    name: 'Dr. A. Ramesh',
    qualifications: 'MBBS (Medical Officer)',
    specialization: 'Primary Oral Health & Clinical Triage',
    registrationNumber: 'AP-MED-7834',
    contactPhone: '+91 94942 55671',
    status: 'ON_DUTY',
    consultationFee: '₹0 (Free Govt / Aarogyasri)',
    opdSchedule: 'Mon - Sat (9:00 AM - 4:00 PM)',
    availableToday: true,
    mandal: 'G. Madugula',
    assignedHospital: 'PHC G. Madugula Clinical Hub',
  },
  {
    id: 'doc-05',
    name: 'Dr. S. Haritha',
    qualifications: 'BDS (Dental Surgeon)',
    specialization: 'Preventive Dentistry & Tobacco Cessation',
    registrationNumber: 'AP-DENT-8120',
    contactPhone: '+91 94401 22390',
    status: 'CIRCUIT_VISIT',
    consultationFee: '₹0 (Free Govt / Aarogyasri)',
    opdSchedule: 'Mon, Wed, Fri (9:30 AM - 1:30 PM)',
    availableToday: false,
    mandal: 'Chintapalli',
    assignedHospital: 'CHC Chintapalli Tribal Hospital',
  },
]

export function HospitalManagerDashboard({ user }: { user: AuthUser }) {
  const [doctors, setDoctors] = useState<DoctorRosterItem[]>(INITIAL_DOCTORS)
  const [notice, setNotice] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [newDocName, setNewDocName] = useState('')
  const [newDocQual, setNewDocQual] = useState('')
  const [newDocSpec, setNewDocSpec] = useState('Oral Oncology')
  const [newDocReg, setNewDocReg] = useState('')
  const [newDocPhone, setNewDocPhone] = useState('')
  const [newDocSchedule, setNewDocSchedule] = useState('Mon - Fri (9:00 AM - 2:00 PM)')
  const [doctorViewMode, setDoctorViewMode] = useState<'CARDS' | 'TABLE'>('CARDS')
  const [hoveredDocId, setHoveredDocId] = useState<string | null>(null)

  const toggleDoctorStatus = (docId: string) => {
    setDoctors((prev) =>
      prev.map((d) => {
        if (d.id !== docId) return d
        const nextStatus =
          d.status === 'ON_DUTY'
            ? 'CIRCUIT_VISIT'
            : d.status === 'CIRCUIT_VISIT'
              ? 'OFF_DUTY'
              : 'ON_DUTY'
        return {
          ...d,
          status: nextStatus,
          availableToday: nextStatus === 'ON_DUTY',
        }
      }),
    )
    setNotice(`Updated duty status for doctor roster.`)
  }

  const handleAddDoctor = (e: FormEvent) => {
    e.preventDefault()
    if (!newDocName.trim() || !newDocReg.trim()) return
    const newEntry: DoctorRosterItem = {
      id: `doc-${Date.now().toString().slice(-4)}`,
      name: newDocName.trim(),
      qualifications: newDocQual.trim() || 'MBBS / BDS',
      specialization: newDocSpec,
      registrationNumber: newDocReg.trim(),
      contactPhone: newDocPhone.trim() || '+91 891 254 8899',
      status: 'ON_DUTY',
      consultationFee: '₹0 (Free Govt / Aarogyasri)',
      opdSchedule: newDocSchedule,
      availableToday: true,
      mandal: 'Paderu',
      assignedHospital: 'District Hospital Paderu',
    }
    setDoctors([newEntry, ...doctors])
    setNotice(`✓ Successfully added and verified ${newEntry.name} (Reg #${newEntry.registrationNumber}) to DH Paderu roster.`)
    setShowAddModal(false)
    setNewDocName('')
    setNewDocQual('')
    setNewDocReg('')
    setNewDocPhone('')
  }

  return (
    <section className="workflow-card aggregate-workspace">
      <div className="workflow-card-heading">
        <div>
          <span className="section-kicker">
            HOSPITAL OPERATIONS CONSOLE · PDF § 2.2 &amp; § 8.2
          </span>
          <h2>🏥 District Hospital Paderu — Operational Command &amp; Doctor Roster</h2>
          <p>
            <strong>Hospital Administrator:</strong> {user.fullName} · 100-Bed Secondary Tribal Referral Hub · 24x7 Emergency Oral Oncology, Telemedicine Suite &amp; Mobile Dental Clinic Operations
          </p>
        </div>
        <button
          type="button"
          className="workflow-button"
          onClick={() => setShowAddModal(true)}
        >
          ✦ + Add / Verify Doctor Credentials
        </button>
      </div>

      {notice && (
        <div className="workflow-notice" role="status" style={{ margin: '1rem 0' }}>
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice('')} aria-label="Dismiss">
            ×
          </button>
        </div>
      )}

      {/* Hospital Operations KPIs Bento Grid with Luxury Figma Micro-Interactions */}
      <div
        className="itda-po-kpi-grid"
        role="region"
        aria-label="DH Paderu Operational Metrics"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
        }}
      >
        <article
          className="stat-card tilt-3d-card"
          style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)',
            border: '1.5px solid rgba(37, 99, 235, 0.28)',
            borderRadius: '16px',
            padding: '1.25rem',
            boxShadow: '0 8px 20px -4px rgba(37, 99, 235, 0.15)',
            transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          <span className="section-kicker" style={{ color: '#1d4ed8' }}>01 · MEDICAL ROSTER</span>
          <strong className="itda-kpi-number" style={{ color: '#1e3a8a', fontSize: '2rem' }}>{doctors.length}</strong>
          <span style={{ fontWeight: 600, color: '#0f172a' }}>Verified Clinicians</span>
          <small style={{ color: '#16a34a' }}>● {doctors.filter((d) => d.availableToday).length} Available for Consults</small>
        </article>

        <article
          className="stat-card tilt-3d-card"
          style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)',
            border: '1.5px solid rgba(22, 163, 74, 0.28)',
            borderRadius: '16px',
            padding: '1.25rem',
            boxShadow: '0 8px 20px -4px rgba(22, 163, 74, 0.15)',
            transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          <span className="section-kicker" style={{ color: '#15803d' }}>02 · PATIENT FOOTFALL</span>
          <strong className="itda-kpi-number" style={{ color: '#15803d', fontSize: '2rem' }}>1,284</strong>
          <span style={{ fontWeight: 600, color: '#0f172a' }}>Cumulative Footfall</span>
          <small style={{ color: '#475569' }}>Across 11 Tribal Mandals</small>
        </article>

        <article
          className="stat-card tilt-3d-card"
          style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #eef2ff 100%)',
            border: '1.5px solid rgba(79, 70, 229, 0.28)',
            borderRadius: '16px',
            padding: '1.25rem',
            boxShadow: '0 8px 20px -4px rgba(79, 70, 229, 0.15)',
            transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          <span className="section-kicker" style={{ color: '#4338ca' }}>03 · APPOINTMENTS</span>
          <strong className="itda-kpi-number" style={{ color: '#3730a3', fontSize: '2rem' }}>18</strong>
          <span style={{ fontWeight: 600, color: '#0f172a' }}>Confirmed Consults</span>
          <small style={{ color: '#4338ca' }}>Next: Killo Somanna (10:30 AM)</small>
        </article>

        <article
          className="stat-card tilt-3d-card"
          style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #fefce8 100%)',
            border: '1.5px solid rgba(202, 138, 4, 0.28)',
            borderRadius: '16px',
            padding: '1.25rem',
            boxShadow: '0 8px 20px -4px rgba(202, 138, 4, 0.15)',
            transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          <span className="section-kicker" style={{ color: '#a16207' }}>04 · HISTOPATHOLOGY</span>
          <strong className="itda-kpi-number" style={{ color: '#854d0e', fontSize: '2rem' }}>7</strong>
          <span style={{ fontWeight: 600, color: '#0f172a' }}>Urgent Biopsies</span>
          <small style={{ color: '#a16207' }}>DH Paderu Shared Lab</small>
        </article>

        <article
          className="stat-card tilt-3d-card"
          style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #fff1f2 100%)',
            border: '1.5px solid rgba(225, 29, 72, 0.28)',
            borderRadius: '16px',
            padding: '1.25rem',
            boxShadow: '0 8px 20px -4px rgba(225, 29, 72, 0.15)',
            transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          <span className="section-kicker" style={{ color: '#be123c' }}>05 · EMERGENCY 108</span>
          <strong className="itda-kpi-number" style={{ color: '#9f1239', fontSize: '2rem' }}>4</strong>
          <span style={{ fontWeight: 600, color: '#0f172a' }}>Active 4x4 Feeder Dispatches</span>
          <small style={{ color: '#be123c' }}>Alluri Agency Topography</small>
        </article>
      </div>

      {/* Hospital Profile & Infrastructure Card */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1rem',
          margin: '1.2rem 0',
        }}
      >
        <div
          style={{
            padding: '1.1rem',
            borderRadius: '18px',
            background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)',
            border: '1.5px solid rgba(37, 99, 235, 0.22)',
          }}
        >
          <h4 style={{ margin: '0 0 0.5rem', color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🏛️</span> Hospital Infrastructure &amp; Capabilities
          </h4>
          <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.86rem', color: '#334155', lineHeight: 1.6 }}>
            <li><strong>Capacity:</strong> 100 Inpatient Beds with 10-bed Post-Biopsy Day Care Unit</li>
            <li><strong>Specialty Suites:</strong> Oral Oncology OPD, Histopathology Lab, WebRTC Telemedicine Suite</li>
            <li><strong>Logistics:</strong> 2 Dedicated 108 Feeder Ambulances + BVLOS Medical Drone Corridors</li>
            <li><strong>Working Hours:</strong> OPD (9:00 AM - 4:00 PM) · Emergency Triage: 24x7</li>
            <li><strong>Contact:</strong> +91 891 254 8899 · dh-paderu@asr.ap.gov.in</li>
          </ul>
        </div>

        <div
          style={{
            padding: '1.1rem',
            borderRadius: '18px',
            background: 'linear-gradient(135deg, #fffbeb 0%, #ffffff 100%)',
            border: '1.5px solid rgba(245, 158, 11, 0.35)',
          }}
        >
          <h4 style={{ margin: '0 0 0.5rem', color: '#92400e', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📋</span> Operational Protocols &amp; Free Care
          </h4>
          <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.86rem', color: '#334155', lineHeight: 1.6 }}>
            <li><strong>Aarogyasri Health Scheme:</strong> 100% Free Consultations, Punch Biopsies, and Histopathology</li>
            <li><strong>Zero-Delay Biopsy Policy:</strong> All suspicious OPMD cases biopsied within 48 hours</li>
            <li><strong>Weekly PHC Circuit Support:</strong> Specialists rotate across G. Madugula, Hukumpeta, and Chintapalli</li>
            <li><strong>Language Accessibility:</strong> Native Telugu, Adivasi Odia, and Koya translators on duty</li>
          </ul>
        </div>
      </div>

      {/* Doctor Roster & Verification Management with Figma Animation Motion */}
      <div className="workflow-subsection">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '1rem',
          }}
        >
          <div>
            <h3 style={{ margin: '0 0 2px', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
              🩺 Verified Doctors, Specialists &amp; Clinical Schedules
            </h3>
            <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
              APMC Council verified oral oncology clinicians, live duty toggling &amp; weekly 3-PHC circuit rotations
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ background: '#f1f5f9', padding: '3px', borderRadius: '8px', display: 'flex', gap: '2px' }}>
              <button
                type="button"
                onClick={() => setDoctorViewMode('CARDS')}
                style={{
                  background: doctorViewMode === 'CARDS' ? '#ffffff' : 'transparent',
                  color: doctorViewMode === 'CARDS' ? '#1e3a8a' : '#64748b',
                  border: 'none',
                  padding: '4px 12px',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  boxShadow: doctorViewMode === 'CARDS' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                🎴 Luxury Cards
              </button>
              <button
                type="button"
                onClick={() => setDoctorViewMode('TABLE')}
                style={{
                  background: doctorViewMode === 'TABLE' ? '#ffffff' : 'transparent',
                  color: doctorViewMode === 'TABLE' ? '#1e3a8a' : '#64748b',
                  border: 'none',
                  padding: '4px 12px',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  boxShadow: doctorViewMode === 'TABLE' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                📋 Table View
              </button>
            </div>

            <button
              type="button"
              className="workflow-button"
              style={{ fontSize: '0.82rem', padding: '0.45rem 0.95rem' }}
              onClick={() => setShowAddModal(true)}
            >
              ✦ + Add Doctor to Roster
            </button>
          </div>
        </div>

        {/* Luxury Figma Motion Doctor Cards View */}
        {doctorViewMode === 'CARDS' ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '14px',
            }}
          >
            {doctors.map((doc) => {
              const isHovered = hoveredDocId === doc.id
              const isOnDuty = doc.status === 'ON_DUTY'
              const isCircuit = doc.status === 'CIRCUIT_VISIT'
              const statusColor = isOnDuty ? '#16a34a' : isCircuit ? '#d97706' : '#64748b'
              const statusBg = isOnDuty ? '#dcfce7' : isCircuit ? '#fef3c7' : '#f1f5f9'

              return (
                <div
                  key={doc.id}
                  onMouseEnter={() => setHoveredDocId(doc.id)}
                  onMouseLeave={() => setHoveredDocId(null)}
                  style={{
                    background: '#ffffff',
                    border: isHovered ? `2px solid ${statusColor}` : '1.5px solid #e2e8f0',
                    borderRadius: '16px',
                    padding: '1.25rem',
                    boxShadow: isHovered
                      ? `0 16px 32px -8px ${statusColor}30, 0 4px 8px rgba(0,0,0,0.04)`
                      : '0 4px 8px -2px rgba(0,0,0,0.04)',
                    transform: isHovered ? 'translateY(-5px) scale(1.015)' : 'none',
                    transition: 'all 0.28s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '12px',
                    position: 'relative',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <div
                          style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '50%',
                            background: `linear-gradient(135deg, ${statusColor}20, #eff6ff)`,
                            border: `2px solid ${statusColor}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.1rem',
                            fontWeight: 800,
                            color: statusColor,
                          }}
                        >
                          👨‍⚕️
                        </div>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                            {doc.name}
                          </h4>
                          <span style={{ fontSize: '0.78rem', color: '#64748b' }}>{doc.qualifications}</span>
                        </div>
                      </div>

                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: statusBg,
                          color: statusColor,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        {isOnDuty ? '🟢 ON DUTY' : isCircuit ? '🚐 3-PHC CIRCUIT' : '⚪ OFF DUTY'}
                      </span>
                    </div>

                    <div style={{ marginTop: '0.75rem', fontSize: '0.84rem', color: '#334155' }}>
                      <div style={{ fontWeight: 700, color: '#1e3a8a' }}>{doc.specialization}</div>
                      <div style={{ fontSize: '0.76rem', color: '#15803d', fontWeight: 700, marginTop: '2px' }}>
                        ✓ APMC Council Reg: {doc.registrationNumber}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '4px' }}>
                        🏥 {doc.assignedHospital}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '2px' }}>
                        🗓️ {doc.opdSchedule}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      borderTop: '1px solid #f1f5f9',
                      paddingTop: '0.75rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <button
                      type="button"
                      className="workflow-secondary-button"
                      style={{
                        fontSize: '0.78rem',
                        padding: '0.4rem 0.8rem',
                        flex: 1,
                        background: statusBg,
                        color: statusColor,
                        border: `1px solid ${statusColor}60`,
                        fontWeight: 700,
                      }}
                      onClick={() => toggleDoctorStatus(doc.id)}
                    >
                      ↻ Toggle Status ({doc.status === 'ON_DUTY' ? 'Set Circuit' : doc.status === 'CIRCUIT_VISIT' ? 'Set Off Duty' : 'Set On Duty'})
                    </button>

                    <a
                      href={`tel:${doc.contactPhone}`}
                      style={{
                        padding: '0.4rem 0.75rem',
                        borderRadius: '8px',
                        background: '#f8fafc',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: '#0f172a',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      📞 Call
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="workflow-table" style={{ width: '100%', minWidth: '700px' }}>
              <thead>
                <tr>
                  <th>Doctor / Specialist</th>
                  <th>Specialization &amp; Registration</th>
                  <th>OPD Schedule</th>
                  <th>Duty Status</th>
                  <th>Fee</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {doctors.map((doc) => (
                  <tr key={doc.id}>
                    <td>
                      <strong>{doc.name}</strong>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                        {doc.qualifications}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: '#1e3a8a' }}>{doc.specialization}</span>
                      <div style={{ fontSize: '0.75rem', color: '#15803d', fontWeight: 700 }}>
                        ✓ Council Reg: {doc.registrationNumber}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.84rem' }}>
                      <strong>{doc.assignedHospital}</strong>
                      <div style={{ color: '#475569' }}>{doc.opdSchedule}</div>
                    </td>
                    <td>
                      <span
                        className={`workflow-status ${
                          doc.status === 'ON_DUTY'
                            ? 'status-good'
                            : doc.status === 'CIRCUIT_VISIT'
                              ? 'status-waiting'
                              : 'status-closed'
                        }`}
                      >
                        {doc.status === 'ON_DUTY'
                          ? '🟢 ON DUTY'
                          : doc.status === 'CIRCUIT_VISIT'
                            ? '🚐 3-PHC CIRCUIT'
                            : '⚪ OFF DUTY'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.82rem', fontWeight: 700, color: '#15803d' }}>
                      {doc.consultationFee}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="workflow-secondary-button"
                        style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                        onClick={() => toggleDoctorStatus(doc.id)}
                      >
                        ↻ Toggle Status
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Doctor Modal */}
      {showAddModal && (
        <div className="telemedicine-modal-backdrop" role="dialog" aria-modal="true">
          <form
            className="workflow-card figma-card-morph"
            style={{ maxWidth: '520px', width: '100%', padding: '24px' }}
            onSubmit={handleAddDoctor}
          >
            <div className="workflow-card-heading">
              <div>
                <span className="section-kicker">CREDENTIAL VERIFICATION</span>
                <h3>Add Doctor to Hospital Roster</h3>
              </div>
              <button
                type="button"
                className="workflow-secondary-button"
                onClick={() => setShowAddModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="workflow-form-grid" style={{ marginTop: '1rem' }}>
              <label>
                Full Name (e.g. Dr. K. Rama Rao)
                <input
                  required
                  type="text"
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  placeholder="Dr. Full Name"
                />
              </label>
              <label>
                Qualifications
                <input
                  required
                  type="text"
                  value={newDocQual}
                  onChange={(e) => setNewDocQual(e.target.value)}
                  placeholder="e.g. MDS (Oral Oncology) / BDS"
                />
              </label>
              <label>
                Specialization
                <select
                  value={newDocSpec}
                  onChange={(e) => setNewDocSpec(e.target.value)}
                >
                  <option value="Oral Oncology">Oral Oncology</option>
                  <option value="Oral & Maxillofacial Surgery">Oral &amp; Maxillofacial Surgery</option>
                  <option value="Oral Medicine & Radiology">Oral Medicine &amp; Radiology</option>
                  <option value="Histopathology & Biopsy">Histopathology &amp; Biopsy</option>
                  <option value="General Dental Surgery">General Dental Surgery</option>
                  <option value="Primary Healthcare & Triage">Primary Healthcare &amp; Triage</option>
                </select>
              </label>
              <label>
                State Medical/Dental Council Reg #
                <input
                  required
                  type="text"
                  value={newDocReg}
                  onChange={(e) => setNewDocReg(e.target.value)}
                  placeholder="e.g. AP-DENT-5521"
                />
              </label>
              <label>
                Contact Phone
                <input
                  type="tel"
                  value={newDocPhone}
                  onChange={(e) => setNewDocPhone(e.target.value)}
                  placeholder="+91 94942 XXXXX"
                />
              </label>
              <label>
                Weekly OPD Schedule
                <input
                  type="text"
                  value={newDocSchedule}
                  onChange={(e) => setNewDocSchedule(e.target.value)}
                  placeholder="e.g. Mon, Wed, Fri (9 AM - 1 PM)"
                />
              </label>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '1.2rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="workflow-secondary-button"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </button>
              <button type="submit" className="workflow-button">
                ✓ Verify Credentials &amp; Add Doctor
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  )
}

/* ============================================================================
   SECTION 6: NEARBY HOSPITAL & DOCTOR DISCOVERY STUDIO (PDF § 4)
   ============================================================================ */
export interface HospitalFacilityItem {
  id: string
  name: string
  category: 'DISTRICT_HOSPITAL' | 'AREA_HOSPITAL' | 'CHC' | 'PHC'
  mandal: string
  distanceKm: number
  leadDoctor: string
  specialization: string
  facilities: string[]
  consultationFee: string
  contactPhone: string
  availableToday: boolean
  urgentTriageAvailable: boolean
  address: string
}

const NEARBY_FACILITIES: HospitalFacilityItem[] = [
  {
    id: 'hosp-01',
    name: 'District Hospital Paderu (జిల్లా ఆసుపత్రి పాడేరు)',
    category: 'DISTRICT_HOSPITAL',
    mandal: 'Paderu',
    distanceKm: 0,
    leadDoctor: 'Dr. V. Anitha Rao, MDS (Oral Oncology)',
    specialization: 'Oral Oncology, Biopsy & Telemedicine Hub',
    facilities: ['100 Beds', 'Biopsy Suite', 'Telemedicine Room', '24x7 Oral Emergency', 'Drone Hub'],
    consultationFee: 'Free (Govt / Aarogyasri)',
    contactPhone: '+91 891 254 8899',
    availableToday: true,
    urgentTriageAvailable: true,
    address: 'Near ITDA Administrative Complex, Paderu Division, ASR District',
  },
  {
    id: 'hosp-02',
    name: 'PHC G. Madugula Clinical Hub (ప్రాథమిక ఆరోగ్య కేంద్రం)',
    category: 'PHC',
    mandal: 'G. Madugula',
    distanceKm: 28,
    leadDoctor: 'Dr. A. Ramesh, MBBS & Dr. V. Anitha Rao, MDS (Weekly Circuit)',
    specialization: 'Primary Oral Screening & Biopsy Stabilization',
    facilities: ['Oral Camera Pod', 'Teleconsultation Terminal', 'Emergency Oxygen', '108 Feeder'],
    consultationFee: 'Free (Govt / Aarogyasri)',
    contactPhone: '+91 891 254 8812',
    availableToday: true,
    urgentTriageAvailable: true,
    address: 'Main Road, G. Madugula Tribal Mandal, ASR District',
  },
  {
    id: 'hosp-03',
    name: 'CHC Chintapalli Tribal Hospital (సామాజిక ఆరోగ్య కేంద్రం)',
    category: 'CHC',
    mandal: 'Chintapalli',
    distanceKm: 42,
    leadDoctor: 'Dr. S. Haritha, BDS (Dental Surgeon)',
    specialization: 'Preventive Dentistry & Tobacco De-addiction',
    facilities: ['30 Beds', 'Dental X-Ray', 'Minor OT', 'Mobile Dental Unit Hub'],
    consultationFee: 'Free (Govt / Aarogyasri)',
    contactPhone: '+91 891 254 8834',
    availableToday: true,
    urgentTriageAvailable: false,
    address: 'Near YTC Training Center, Chintapalli Mandal',
  },
  {
    id: 'hosp-04',
    name: 'Area Hospital Araku Valley (ఏరియా ఆసుపత్రి అరకు)',
    category: 'AREA_HOSPITAL',
    mandal: 'Araku Valley',
    distanceKm: 54,
    leadDoctor: 'Dr. V. Prasad, MDS (Oral & Maxillofacial Surgeon)',
    specialization: 'Oral Surgery, Trauma Care & Biopsy',
    facilities: ['50 Beds', 'Full Surgical OT', 'Digital X-Ray', 'Tele-Pathology Link'],
    consultationFee: 'Free (Govt / Aarogyasri)',
    contactPhone: '+91 891 254 8856',
    availableToday: true,
    urgentTriageAvailable: true,
    address: 'Valley View Road, Araku Mandal, ASR District',
  },
  {
    id: 'hosp-05',
    name: 'PHC Hukumpeta Telemedicine Node',
    category: 'PHC',
    mandal: 'Hukumpeta',
    distanceKm: 22,
    leadDoctor: 'Medical Officer on Duty / Specialist Wednesday Circuit',
    specialization: 'High-Risk OPMD Surveillance & Biopsy Referrals',
    facilities: ['Telemedicine Node', 'Vital Staining Kit', 'Ambulance Standby'],
    consultationFee: 'Free (Govt / Aarogyasri)',
    contactPhone: '+91 891 254 8878',
    availableToday: false,
    urgentTriageAvailable: true,
    address: 'PHC Junction, Hukumpeta Tribal Mandal',
  },
]

function makeAppointmentToken(baseId: string) {
  return `APT-2026-${baseId.toUpperCase().slice(-4)}`
}

export function HospitalAndDoctorDiscovery({
  user,
  onBookUrgent,
}: {
  user: AuthUser
  onBookUrgent?: (facility: HospitalFacilityItem) => void
}) {
  const [facilities] = useState<HospitalFacilityItem[]>(NEARBY_FACILITIES)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMandal, setSelectedMandal] = useState('ALL')
  const [selectedSpec, setSelectedSpec] = useState('ALL')
  const [onlyAvailableToday, setOnlyAvailableToday] = useState(false)
  const [viewMode, setViewMode] = useState<'LIST' | 'MAP'>('LIST')
  const [bookedNotice, setBookedNotice] = useState('')

  const mandalOptions = ['ALL', 'Paderu', 'G. Madugula', 'Chintapalli', 'Araku Valley', 'Hukumpeta']

  const filtered = facilities.filter((f) => {
    const matchesSearch =
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.leadDoctor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.mandal.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.specialization.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesMandal = selectedMandal === 'ALL' || f.mandal === selectedMandal
    const matchesSpec =
      selectedSpec === 'ALL' ||
      f.specialization.toLowerCase().includes(selectedSpec.toLowerCase())
    const matchesAvail = !onlyAvailableToday || f.availableToday
    return matchesSearch && matchesMandal && matchesSpec && matchesAvail
  })

  const handleBook = (f: HospitalFacilityItem, isUrgent = false) => {
    const token = makeAppointmentToken(f.id)
    if (isUrgent && onBookUrgent) {
      onBookUrgent(f)
    }
    const message = isUrgent
      ? `🚨 URGENT CONSULTATION CONFIRMED: Token #${token} at ${f.name} with ${f.leadDoctor} for ${user.fullName}. Priority triage dispatched.`
      : `✓ APPOINTMENT CONFIRMED: Token #${token} booked at ${f.name} with ${f.leadDoctor} for ${user.fullName}. Consultation is 100% Free under Aarogyasri scheme.`

    setBookedNotice(message)
    pushRealtimeNotification(
      {
        title: isUrgent ? '🚨 Urgent Consultation Priority Confirmed' : '📅 Free OPD Consultation Booked',
        message,
        category: 'APPOINTMENT',
      },
      user,
    )
  }

  return (
    <section className="workflow-card aggregate-workspace">
      <div className="workflow-card-heading">
        <div>
          <span className="section-kicker">DISCOVERY STUDIO · PDF § 4</span>
          <h2>🗺️ Nearby Hospital &amp; Specialist Discovery (ఆసుపత్రులు &amp; వైద్యుల వివరాలు)</h2>
          <p>
            Find accredited government hospitals, primary health centers (PHCs), verified oral cancer specialists, and telemedicine nodes across Alluri Sitharama Raju District.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className={`workflow-secondary-button ${viewMode === 'LIST' ? 'selected' : ''}`}
            onClick={() => setViewMode('LIST')}
          >
            📋 List View
          </button>
          <button
            type="button"
            className={`workflow-secondary-button ${viewMode === 'MAP' ? 'selected' : ''}`}
            onClick={() => setViewMode('MAP')}
          >
            🗺️ Tribal Map View
          </button>
        </div>
      </div>

      {bookedNotice && (
        <div className="workflow-notice" role="status" style={{ margin: '1rem 0' }}>
          <span>{bookedNotice}</span>
          <button type="button" onClick={() => setBookedNotice('')} aria-label="Dismiss">
            ×
          </button>
        </div>
      )}

      {/* Interactive Filters Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          padding: '14px',
          borderRadius: '16px',
          background: 'rgba(255, 255, 255, 0.95)',
          border: '1.5px solid rgba(37, 99, 235, 0.18)',
          margin: '1rem 0 1.4rem',
        }}
      >
        <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e3a8a' }}>
          🔍 Search Hospital or Doctor
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="e.g. Paderu, Anitha Rao, Biopsy..."
            style={{ marginTop: '4px', width: '100%', padding: '7px 10px', fontSize: '0.85rem' }}
          />
        </label>
        <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e3a8a' }}>
          📍 Filter by Tribal Mandal
          <select
            value={selectedMandal}
            onChange={(e) => setSelectedMandal(e.target.value)}
            style={{ marginTop: '4px', width: '100%', padding: '7px 10px', fontSize: '0.85rem' }}
          >
            {mandalOptions.map((m) => (
              <option key={m} value={m}>
                {m === 'ALL' ? 'All Tribal Mandals (అన్ని మండలాలు)' : m}
              </option>
            ))}
          </select>
        </label>
        <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e3a8a' }}>
          🩺 Specialization
          <select
            value={selectedSpec}
            onChange={(e) => setSelectedSpec(e.target.value)}
            style={{ marginTop: '4px', width: '100%', padding: '7px 10px', fontSize: '0.85rem' }}
          >
            <option value="ALL">All Clinical Specializations</option>
            <option value="Oral Oncology">Oral Oncology &amp; Cancer Triage</option>
            <option value="Biopsy">Biopsy &amp; Histopathology</option>
            <option value="Preventive">Preventive Dentistry</option>
          </select>
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '18px' }}>
          <input
            type="checkbox"
            id="availCheck"
            checked={onlyAvailableToday}
            onChange={(e) => setOnlyAvailableToday(e.target.checked)}
          />
          <label htmlFor="availCheck" style={{ fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}>
            🟢 Available Today Only
          </label>
        </div>
      </div>

      {/* Map View Mode */}
      {viewMode === 'MAP' && (
        <div
          style={{
            position: 'relative',
            height: '340px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)',
            border: '2px solid rgba(37, 99, 235, 0.25)',
            marginBottom: '1.5rem',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '16px',
          }}
        >
          <div style={{ background: 'rgba(255,255,255,0.92)', padding: '6px 14px', borderRadius: '999px', alignSelf: 'flex-start', fontSize: '0.82rem', fontWeight: 700, color: '#1e3a8a', border: '1px solid rgba(37,99,235,0.3)' }}>
            📍 Live Geographic Node Map · Alluri Sitharama Raju Agency Division (Paderu)
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            {filtered.map((f) => (
              <div
                key={f.id}
                style={{
                  background: '#ffffff',
                  padding: '10px 14px',
                  borderRadius: '14px',
                  boxShadow: '0 8px 20px rgba(37,99,235,0.14)',
                  border: f.category === 'DISTRICT_HOSPITAL' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '1.2rem' }}>{f.category === 'DISTRICT_HOSPITAL' ? '🏥' : '🩺'}</div>
                <strong style={{ fontSize: '0.82rem', color: '#0f172a' }}>{f.name.split('(')[0]}</strong>
                <div style={{ fontSize: '0.74rem', color: '#64748b' }}>{f.distanceKm === 0 ? 'Paderu Center' : `${f.distanceKm} km away`}</div>
                <button
                  type="button"
                  className="workflow-button"
                  style={{ fontSize: '0.72rem', padding: '3px 8px', marginTop: '6px' }}
                  onClick={() => handleBook(f, false)}
                >
                  Book Free OPD
                </button>
              </div>
            ))}
          </div>
          <div style={{ fontSize: '0.76rem', color: '#475569', textAlign: 'center' }}>
            🛰️ Connected to Paderu Emergency Telemedicine Network &amp; 108 Ambulance GPS
          </div>
        </div>
      )}

      {/* Facilities Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.2rem',
        }}
      >
        {filtered.map((f) => (
          <article
            key={f.id}
            className="stat-card tilt-3d-card"
            style={{
              padding: '1.2rem',
              borderRadius: '20px',
              border:
                f.category === 'DISTRICT_HOSPITAL'
                  ? '2px solid rgba(37, 99, 235, 0.45)'
                  : '1.5px solid rgba(226, 232, 240, 0.9)',
              background: '#ffffff',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', gap: '8px' }}>
              <div>
                <span className="section-kicker">
                  {f.category.replace('_', ' ')} · {f.mandal} MANDAL
                </span>
                <h4 style={{ margin: '4px 0', fontSize: '1.05rem', color: '#0f172a' }}>{f.name}</h4>
              </div>
              <span
                className={`workflow-status ${f.availableToday ? 'status-good' : 'status-waiting'}`}
                style={{ fontSize: '0.72rem', whiteSpace: 'nowrap' }}
              >
                {f.availableToday ? '🟢 OPEN TODAY' : '⚪ NEXT SLOT'}
              </span>
            </div>

            <p style={{ fontSize: '0.84rem', color: '#1e3a8a', margin: '0.4rem 0', fontWeight: 600 }}>
              👨‍⚕️ <strong>Lead Specialist:</strong> {f.leadDoctor}
            </p>
            <p style={{ fontSize: '0.82rem', color: '#475569', margin: '0.2rem 0' }}>
              🔬 <strong>Focus:</strong> {f.specialization}
            </p>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.2rem 0' }}>
              📍 <strong>Location:</strong> {f.address} ({f.distanceKm === 0 ? 'Agency HQ' : `${f.distanceKm} km from HQ`})
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', margin: '0.6rem 0' }}>
              {f.facilities.map((fac) => (
                <span
                  key={fac}
                  style={{
                    fontSize: '0.72rem',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    background: '#eff6ff',
                    color: '#1d4ed8',
                    border: '1px solid rgba(37, 99, 235, 0.2)',
                  }}
                >
                  ✓ {fac}
                </span>
              ))}
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                paddingTop: '0.6rem',
                borderTop: '1px solid #f1f5f9',
                marginTop: 'auto',
                gap: '8px',
              }}
            >
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#15803d' }}>
                {f.consultationFee}
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                {f.urgentTriageAvailable && (
                  <button
                    type="button"
                    className="workflow-button"
                    style={{
                      background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                      borderColor: '#b91c1c',
                      fontSize: '0.76rem',
                      padding: '5px 10px',
                    }}
                    onClick={() => handleBook(f, true)}
                  >
                    🚨 Urgent
                  </button>
                )}
                <button
                  type="button"
                  className="workflow-button"
                  style={{ fontSize: '0.76rem', padding: '5px 12px' }}
                  onClick={() => handleBook(f, false)}
                >
                  ✦ Book Free OPD
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

/* ============================================================================
   SECTION 7: GLOBAL TOPBAR IN-APP NOTIFICATION CENTER BELL (PDF § 9)
   ============================================================================ */
export function NotificationCenterBell({
  user,
  onNavigate,
}: {
  user?: AuthUser | null
  onNavigate?: (page: string) => void
}) {
  const { notifications, unreadCount, markAllRead, clear } = useRealtimeNotifications(user)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedAlertForChat, setSelectedAlertForChat] = useState<NotificationAlertItem | null>(null)
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'bujji'; text: string }>>([])
  const [chatInput, setChatInput] = useState('')
  const [isSpeaking, setIsSpeaking] = useState(false)

  const openAlertChat = (n: NotificationAlertItem) => {
    setSelectedAlertForChat(n)
    setIsOpen(false)
    const initialGreeting =
      n.category === 'APPOINTMENT'
        ? `నమస్కారం! డాక్టర్ వి. అనిత రావు గారితో టెలిమెడిసిన్ కన్సల్టేషన్ లేదా ఆసుపత్రి అపాయింట్‌మెంట్ గురించి మీకు ఎలాంటి సందేహాలు ఉన్నా నన్ను అడగండి.`
        : n.category === 'SCREENING'
        ? `నమస్కారం! మీ నోటి స్క్రీనింగ్ ఫలితాలు మరియు తదుపరి బయాప్సీ వివరాల గురించి వివరించడానికి నేను సిద్ధంగా ఉన్నాను.`
        : n.category === 'DRONE'
        ? `నమస్కారం! మెడికల్ డ్రోన్ ద్వారా మందుల సరఫరా మరియు డెలివరీ వివరాలు తెలుసుకోవడానికి నన్ను అడగండి.`
        : `నమస్కారం! ఈ నోటిఫికేషన్: "${n.title}". దీని గురించి మీ సందేహాలను ఇక్కడ అడగవచ్చు.`

    setChatMessages([
      {
        sender: 'bujji',
        text: initialGreeting,
      },
    ])
    speakBujjiTeluguVoice(initialGreeting, 'TE')
  }

  const handleSendChat = (customText?: string) => {
    const textToSend = (customText || chatInput).trim()
    if (!textToSend || !selectedAlertForChat) return

    setChatMessages((prev) => [...prev, { sender: 'user', text: textToSend }])
    setChatInput('')

    let reply = ''
    if (textToSend.includes('వివరించు') || textToSend.includes('Explain') || textToSend.includes('అర్థం')) {
      reply = `ఈ అలర్ట్: "${selectedAlertForChat.title}". ${selectedAlertForChat.message}. ఇది మీ నోటి ఆరోగ్య భద్రత మరియు పర్యవేక్షణ కోసం వైద్య బృందం ద్వారా పంపబడింది.`
    } else if (textToSend.includes('జాగ్రత్తలు') || textToSend.includes('చేయాలి') || textToSend.includes('precautions')) {
      reply = `ముఖ్యమైన జాగ్రత్తలు: 1. గుట్కా, ఖైనీ, పొగాకు వాడకాన్ని పూర్తిగా నివారించండి. 2. రోజుకు రెండుసార్లు ఉప్పునీటితో లేదా సూచించిన మౌత్ వాష్‌తో పుక్కిలించండి. 3. కేటాయించిన సమయానికి టెలిమెడిసిన్ వీడియో కాల్ లేదా పీహెచ్‌సీకి హాజరవ్వండి.`
    } else if (textToSend.includes('మందులు') || textToSend.includes('డ్రోన్') || textToSend.includes('medicine')) {
      reply = `మీకు కేటాయించిన మందులు (ట్రయామ్సినోలోన్ ఆయింట్‌మెంట్ మరియు యాంటీఆక్సిడెంట్ క్యాప్సూల్స్) త్వరలోనే సమీప పీహెచ్‌సీ ద్వారా మీకు అందుతాయి.`
    } else {
      reply = `మీ సందేహం నమోదు చేయబడింది. డాక్టర్ వి. అనిత రావు గారు మరియు స్థానిక ఆశా కార్యకర్త మీకు తగిన వైద్య సహాయం అందిస్తారు.`
    }

    setTimeout(() => {
      setChatMessages((prev) => [...prev, { sender: 'bujji', text: reply }])
      setIsSpeaking(true)
      speakBujjiTeluguVoice(reply, 'TE')
      setTimeout(() => setIsSpeaking(false), 3500)
    }, 350)
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        className="workflow-secondary-button"
        style={{
          position: 'relative',
          padding: '8px 12px',
          borderRadius: '999px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
        }}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={`Notification Center, ${unreadCount} unread alerts`}
      >
        <span style={{ fontSize: '1.05rem' }}>🔔</span>
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              background: '#ef4444',
              color: '#ffffff',
              fontSize: '0.68rem',
              fontWeight: 800,
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #ffffff',
              boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)',
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="figma-card-morph"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: 'min(380px, 90vw)',
            maxHeight: '440px',
            overflowY: 'auto',
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            border: '1.5px solid rgba(37, 99, 235, 0.3)',
            boxShadow: '0 24px 48px -12px rgba(15, 23, 42, 0.28)',
            zIndex: 9990,
            padding: '16px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingBottom: '10px',
              borderBottom: '1px solid #e2e8f0',
              marginBottom: '10px',
            }}
          >
            <div>
              <span className="section-kicker" style={{ fontSize: '0.7rem' }}>
                ALERTS &amp; PROTOCOL ENGINE
              </span>
              <h4 style={{ margin: 0, fontSize: '0.96rem', color: '#0f172a' }}>
                Notifications ({unreadCount} New)
              </h4>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                style={{ fontSize: '0.72rem', background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontWeight: 700 }}
                onClick={markAllRead}
              >
                Read All
              </button>
              <button
                type="button"
                style={{ fontSize: '0.72rem', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontWeight: 600 }}
                onClick={() => setIsOpen(false)}
              >
                ✕
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {notifications.length === 0 ? (
              <p style={{ fontSize: '0.82rem', color: '#64748b', textAlign: 'center', margin: '20px 0' }}>
                No active notifications.
              </p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => openAlertChat(n)}
                  style={{
                    padding: '9px 12px',
                    borderRadius: '12px',
                    background: n.unread ? 'rgba(239, 246, 255, 0.85)' : '#f8fafc',
                    border: n.unread ? '1px solid rgba(37, 99, 235, 0.28)' : '1px solid #e2e8f0',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#2563eb'
                    e.currentTarget.style.transform = 'translateY(-1px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = n.unread ? 'rgba(37, 99, 235, 0.28)' : '#e2e8f0'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                    <strong style={{ fontSize: '0.82rem', color: '#0f172a' }}>{n.title}</strong>
                    <span style={{ fontSize: '0.68rem', color: n.unread ? '#2563eb' : '#64748b', fontWeight: n.unread ? 700 : 500 }}>
                      {n.timestamp}
                    </span>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#334155', lineHeight: 1.4 }}>
                    {n.message}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', paddingTop: '4px', borderTop: '1px dashed #e2e8f0' }}>
                    <span style={{ fontSize: '0.68rem', color: '#2563eb', fontWeight: 700 }}>
                      💬 Chat with BUJJI AI →
                    </span>
                    <span style={{ fontSize: '0.65rem', background: '#dbeafe', color: '#1e40af', padding: '1px 5px', borderRadius: '4px', fontWeight: 600 }}>
                      {n.category}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div style={{ textAlign: 'center', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
              <button
                type="button"
                style={{ fontSize: '0.72rem', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                onClick={clear}
              >
                Clear Notification History
              </button>
            </div>
          )}
        </div>
      )}

      {/* Bujji AI Interactive Alert Chat Modal */}
      {selectedAlertForChat && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(2, 6, 23, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              padding: '24px',
              maxWidth: '540px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              border: '2px solid #2563eb',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span className="section-kicker" style={{ fontSize: '0.72rem', color: '#2563eb' }}>
                  BUJJI AI · ALERT INTERACTION ASSISTANT
                </span>
                <h3 style={{ margin: '3px 0 0', fontSize: '1.05rem', color: '#0f172a' }}>
                  {selectedAlertForChat.title}
                </h3>
                <small style={{ color: '#64748b' }}>🕒 {selectedAlertForChat.timestamp}</small>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAlertForChat(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.85rem', color: '#334155', lineHeight: 1.5 }}>
              {selectedAlertForChat.message}
            </div>

            {/* Quick question chips */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[
                'ఈ అలర్ట్ వివరాలు వివరించు (Explain)',
                'నేను ఏమి జాగ్రత్తలు తీసుకోవాలి?',
                'మందులు ఎప్పుడు అందుతాయి?',
              ].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleSendChat(chip)}
                  style={{
                    fontSize: '0.72rem',
                    padding: '5px 10px',
                    borderRadius: '8px',
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    color: '#1d4ed8',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Chat History Box */}
            <div
              style={{
                background: '#f1f5f9',
                borderRadius: '12px',
                padding: '12px',
                maxHeight: '190px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontSize: '0.82rem',
              }}
            >
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  style={{
                    alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    background: msg.sender === 'user' ? '#2563eb' : '#ffffff',
                    color: msg.sender === 'user' ? '#ffffff' : '#0f172a',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                    lineHeight: 1.4,
                  }}
                >
                  {msg.sender === 'bujji' && (
                    <div style={{ fontSize: '0.70rem', fontWeight: 800, color: '#f59e0b', marginBottom: '2px' }}>
                      🤖 BUJJI AI {isSpeaking ? '🔊 మాట్లాడటం...' : ''}
                    </div>
                  )}
                  {msg.text}
                </div>
              ))}
            </div>

            {/* Chat Input Field */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSendChat()
              }}
              style={{ display: 'flex', gap: '8px' }}
            >
              <input
                type="text"
                placeholder="బుజ్జిని అడగండి... / Ask Bujji AI about this alert..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.82rem',
                }}
              />
              <button
                type="submit"
                style={{
                  padding: '9px 16px',
                  borderRadius: '10px',
                  background: '#2563eb',
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                }}
              >
                Send
              </button>
            </form>

            {/* Bottom Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', gap: '8px' }}>
              <button
                type="button"
                onClick={() => {
                  if (onNavigate) {
                    const cat = selectedAlertForChat.category
                    setSelectedAlertForChat(null)
                    if (cat === 'APPOINTMENT') onNavigate('appointments')
                    else if (cat === 'SCREENING') onNavigate('screening')
                    else if (cat === 'DRONE') onNavigate('prescriptions')
                    else if (cat === 'GRIEVANCE') onNavigate('grievance')
                    else onNavigate('notifications')
                  }
                }}
                style={{
                  background: '#f0fdf4',
                  border: '1px solid #86efac',
                  color: '#15803d',
                  padding: '7px 12px',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                ✦ Open Clinical Page →
              </button>

              <button
                type="button"
                onClick={() => setSelectedAlertForChat(null)}
                style={{
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  color: '#475569',
                  padding: '7px 14px',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


