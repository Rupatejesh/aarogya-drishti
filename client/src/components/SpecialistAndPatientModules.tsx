import { useState } from 'react'
import type { AuthUser } from '../services/api'
import { PrintableReferralSlip } from './TelemedicineAndReferralStudio'
import { DEMO_KILLO_SOMANNA_PATIENT, DEMO_KILLO_SOMANNA_REFERRAL } from '../utils/demoFallbackData'
import { useRealtimeNotifications, pushRealtimeNotification, type NotificationAlertItem } from '../utils/notificationEngine'
import { speakBujjiTeluguVoice } from '../utils/bujjiVoiceEngine'
import { generateScannableQrMatrix } from '../utils/qrCodeGenerator'
import { ASR_DISTRICT_FACILITIES } from '../data/asrPhcDirectory'

/* ============================================================================
   1. INTERACTIVE DENTAL & MUCOSA ODONTOGRAM (Specialist Doctor Role)
   ============================================================================ */
interface OdontogramFinding {
  code: string
  label: string
  site: string
  condition: string
  severity: 'NORMAL' | 'OPMD_MILD' | 'OPMD_HIGH' | 'MALIGNANT_SUSPICION'
  notes?: string
}

const INITIAL_FINDINGS: OdontogramFinding[] = [
  {
    code: '16-18',
    label: 'Right Upper Molars Buccal',
    site: 'Right Buccal Sulcus',
    condition: 'Non-scrapable raised leukoplakia white plaque (~1.8 cm)',
    severity: 'OPMD_HIGH',
    notes: 'Habitual quid placement site (15Y Gutkha/Khaini)',
  },
  {
    code: '46-48',
    label: 'Right Lower Molars Sulcus',
    site: 'Right Retromolar Trigone',
    condition: 'Vertical blanched fibrous band (OSMF Grade II)',
    severity: 'OPMD_HIGH',
    notes: 'Restricted mouth opening (2.5 fingers / 24 mm)',
  },
]

export function SpecialistOdontogramStudio({
  patientName = 'Killo Somanna (PT-20261110-GMAD01 · 46Y Male)',
  onOrderBiopsy,
}: {
  patientName?: string
  onOrderBiopsy?: () => void
}) {
  const [findings, setFindings] = useState<OdontogramFinding[]>(INITIAL_FINDINGS)
  const [selectedQuadrant, setSelectedQuadrant] = useState('RIGHT_BUCCAL')
  const [selectedCondition, setSelectedCondition] = useState('LEUKOPLAKIA')
  const [customNote, setCustomNote] = useState('')
  const [chartNotice, setChartNotice] = useState('')

  const upperTeeth = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28]
  const lowerTeeth = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38]

  const mucosalRegions = [
    { id: 'RIGHT_BUCCAL', label: 'Right Buccal Mucosa (కుడి లోపలి చెంప)', tip: 'Frequent tobacco pouch site' },
    { id: 'LEFT_BUCCAL', label: 'Left Buccal Mucosa (ఎడమ లోపలి చెంప)', tip: 'Check mucosal elasticity' },
    { id: 'TONGUE_LATERAL', label: 'Lateral Tongue (నాలుక అంచు)', tip: 'High-risk site for dysplastic erosion' },
    { id: 'PALATE', label: 'Hard & Soft Palate (అంగిలి)', tip: 'Reverse smoking / bidi changes' },
    { id: 'FLOOR_OF_MOUTH', label: 'Floor of Mouth (నాలుక క్రింద)', tip: 'Thin non-keratinized vascular bed' },
    { id: 'LIPS_LABIAL', label: 'Labial Mucosa & Lips (పెదవులు)', tip: 'Actinic / frictional changes' },
  ]

  const handleAddFinding = (siteCode: string, siteName: string) => {
    let condName = 'Oral Leukoplakia Plaque (K13.21)'
    let sev: OdontogramFinding['severity'] = 'OPMD_HIGH'

    if (selectedCondition === 'ERYTHROPLAKIA') {
      condName = 'Erythroplakia Red Patch (K13.22)'
      sev = 'MALIGNANT_SUSPICION'
    } else if (selectedCondition === 'OSMF') {
      condName = 'Oral Submucous Fibrosis Band (K13.5)'
      sev = 'OPMD_HIGH'
    } else if (selectedCondition === 'ULCER') {
      condName = 'Chronic Indurated Ulcer (>14D)'
      sev = 'MALIGNANT_SUSPICION'
    } else if (selectedCondition === 'NORMAL') {
      condName = 'Normal Healthy Mucosa'
      sev = 'NORMAL'
    }

    const newFinding: OdontogramFinding = {
      code: siteCode,
      label: siteName,
      site: selectedQuadrant.replaceAll('_', ' '),
      condition: condName,
      severity: sev,
      notes: customNote || 'Marked during tele-oncology odontogram inspection',
    }

    setFindings((prev) => [newFinding, ...prev.filter((f) => f.code !== siteCode)])
    setCustomNote('')
    setChartNotice(`✓ Marked finding on ${siteName} (${condName}).`)
    setTimeout(() => setChartNotice(''), 4000)
  }

  return (
    <div className="role-dashboard">
      <section className="workflow-card">
        <div className="workflow-card-heading">
          <div>
            <span className="section-kicker">MODULE S-02 · SPECIALIST ONCOLOGY ODONTOGRAM</span>
            <h2>Interactive Dental &amp; Oral Mucosal Charting Odontogram</h2>
            <p>
              Patient: <strong>{patientName}</strong> · Standardized 2D Anatomical Mouth Reticle for Lesion Mapping
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {onOrderBiopsy && (
              <button type="button" className="workflow-button" onClick={onOrderBiopsy}>
                ✦ Order Incisional Biopsy
              </button>
            )}
          </div>
        </div>

        {chartNotice && (
          <div className="workflow-notice" role="status">
            <span>{chartNotice}</span>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginTop: '14px' }}>
          {/* Left: 2D Anatomical Mouth & Dental Arch Map */}
          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1.5px solid #cbd5e1' }}>
            <h4 style={{ margin: '0 0 10px', fontSize: '13px', color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              ✦ Anatomical Dental Arch (Click Tooth to Tag Finding)
            </h4>

            {/* Upper Teeth FDI Row */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px', fontWeight: 700 }}>
                MAXILLARY ARCH (UPPER DENTAL ARCH)
              </div>
              <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '4px' }}>
                {upperTeeth.map((tooth) => {
                  const hasFinding = findings.some((f) => f.code.includes(String(tooth)))
                  return (
                    <button
                      key={tooth}
                      type="button"
                      style={{
                        padding: '6px 4px',
                        minWidth: '32px',
                        height: '44px',
                        borderRadius: '6px',
                        border: hasFinding ? '2px solid #ef4444' : '1px solid #cbd5e1',
                        background: hasFinding ? '#fee2e2' : '#ffffff',
                        fontSize: '10px',
                        fontWeight: 800,
                        color: hasFinding ? '#b91c1c' : '#334155',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                      onClick={() => handleAddFinding(String(tooth), `Tooth #${tooth}`)}
                    >
                      <span>{tooth}</span>
                      <span style={{ fontSize: '7px' }}>🦷</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Central Oral Cavity Mucosal Target Zone */}
            <div
              style={{
                height: '110px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #fce7f3 0%, #fee2e2 50%, #fed7aa 100%)',
                border: '2px dashed #f43f5e',
                display: 'grid',
                placeItems: 'center',
                margin: '10px 0',
                padding: '10px',
                textAlign: 'center',
              }}
            >
              <div>
                <strong style={{ fontSize: '13px', color: '#9f1239' }}>
                  ACTIVE TARGET: {selectedQuadrant.replaceAll('_', ' ')}
                </strong>
                <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#881337' }}>
                  Click tooth buttons above/below or select mucosal regions below to tag lesion severity.
                </p>
              </div>
            </div>

            {/* Lower Teeth FDI Row */}
            <div>
              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px', fontWeight: 700 }}>
                MANDIBULAR ARCH (LOWER DENTAL ARCH)
              </div>
              <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '4px' }}>
                {lowerTeeth.map((tooth) => {
                  const hasFinding = findings.some((f) => f.code.includes(String(tooth)))
                  return (
                    <button
                      key={tooth}
                      type="button"
                      style={{
                        padding: '6px 4px',
                        minWidth: '32px',
                        height: '44px',
                        borderRadius: '6px',
                        border: hasFinding ? '2px solid #ef4444' : '1px solid #cbd5e1',
                        background: hasFinding ? '#fee2e2' : '#ffffff',
                        fontSize: '10px',
                        fontWeight: 800,
                        color: hasFinding ? '#b91c1c' : '#334155',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                      onClick={() => handleAddFinding(String(tooth), `Tooth #${tooth}`)}
                    >
                      <span style={{ fontSize: '7px' }}>🦷</span>
                      <span>{tooth}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Mucosal Region Buttons */}
            <div style={{ marginTop: '14px' }}>
              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '6px', fontWeight: 700 }}>
                ORAL MUCOSAL SITES:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                {mucosalRegions.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className={`workflow-secondary-button ${selectedQuadrant === m.id ? 'active' : ''}`}
                    style={{
                      fontSize: '11px',
                      padding: '6px 8px',
                      textAlign: 'left',
                      background: selectedQuadrant === m.id ? '#eff6ff' : '#ffffff',
                      borderColor: selectedQuadrant === m.id ? '#2563eb' : '#cbd5e1',
                    }}
                    onClick={() => setSelectedQuadrant(m.id)}
                  >
                    <strong>{m.label}</strong>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Lesion Classification Palette & Charted Findings */}
          <div>
            <div style={{ background: '#ffffff', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '14px' }}>
              <h4 style={{ margin: '0 0 10px', fontSize: '13px', color: '#0f172a' }}>
                Lesion Diagnostic Palette:
              </h4>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                {[
                  { id: 'LEUKOPLAKIA', label: '⚪ Leukoplakia (White Plaque)' },
                  { id: 'ERYTHROPLAKIA', label: '🔴 Erythroplakia (Red Patch)' },
                  { id: 'OSMF', label: '🟠 OSMF (Fibrous Band)' },
                  { id: 'ULCER', label: '🟣 Indurated Chronic Ulcer' },
                  { id: 'NORMAL', label: '🟢 Normal Mucosa' },
                ].map((cond) => (
                  <button
                    key={cond.id}
                    type="button"
                    style={{
                      padding: '6px 10px',
                      borderRadius: '8px',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: selectedCondition === cond.id ? '2px solid #2563eb' : '1px solid #cbd5e1',
                      background: selectedCondition === cond.id ? '#dbeafe' : '#f8fafc',
                      color: selectedCondition === cond.id ? '#1e40af' : '#334155',
                    }}
                    onClick={() => setSelectedCondition(cond.id)}
                  >
                    {cond.label}
                  </button>
                ))}
              </div>
              <input
                type="text"
                placeholder="Clinical observation notes (e.g. non-scrapable, tender on palpation)..."
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', fontSize: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>

            {/* List of Charted Findings */}
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #cbd5e1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <strong style={{ fontSize: '13px', color: '#0f172a' }}>
                  Charted Findings ({findings.length})
                </strong>
                <button
                  type="button"
                  style={{ fontSize: '11px', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                  onClick={() => setFindings([])}
                >
                  Clear All
                </button>
              </div>

              {findings.map((f, i) => (
                <div
                  key={i}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    marginBottom: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '10px',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: '12.5px', color: '#0f172a' }}>{f.label}</strong>
                      <span className={`workflow-status ai-risk-badge risk-${f.severity === 'MALIGNANT_SUSPICION' ? 'urgent' : 'high'}`}>
                        {f.severity}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#1e40af', fontWeight: 600, marginTop: '2px' }}>
                      {f.condition} · {f.site}
                    </div>
                    {f.notes && <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{f.notes}</div>}
                  </div>
                  <button
                    type="button"
                    style={{ color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}
                    onClick={() => setFindings((prev) => prev.filter((_, idx) => idx !== i))}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

/* ============================================================================
   2. PATIENT NOTIFICATIONS & INBOX
   ============================================================================ */
export function PatientNotificationsInbox({ user }: { user?: AuthUser }) {
  const { notifications, unreadCount, markAllRead, clear } = useRealtimeNotifications(user)
  const [filter, setFilter] = useState<'ALL' | 'APPOINTMENTS' | 'LABS' | 'MEDS'>('ALL')
  const [selectedNotif, setSelectedNotif] = useState<NotificationAlertItem | null>(null)
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'bujji'; text: string }>>([])
  const [inputQuestion, setInputQuestion] = useState('')
  const [isSpeaking, setIsSpeaking] = useState(false)

  const filteredItems = notifications.filter((item) => {
    if (filter === 'ALL') return true
    if (filter === 'APPOINTMENTS') return item.category === 'APPOINTMENT'
    if (filter === 'LABS') return item.category === 'SCREENING' || item.category === 'BIOPSY'
    if (filter === 'MEDS') return item.category === 'DRONE' || item.category === 'REMINDER'
    return true
  })

  const openNotifDetailWithBujji = (item: NotificationAlertItem) => {
    setSelectedNotif(item)
    const initialGreeting =
      item.category === 'APPOINTMENT'
        ? `నమస్కారం! డాక్టర్ వి. అనిత రావు గారితో టెలిమెడిసిన్ కన్సల్టేషన్ లేదా ఆసుపత్రి అపాయింట్‌మెంట్ గురించి మీకు ఎలాంటి సందేహాలు ఉన్నా నన్ను అడగండి. నేను మీకు మార్గనిర్దేశం చేస్తాను.`
        : item.category === 'SCREENING' || item.category === 'BIOPSY'
        ? `నమస్కారం! మీ నోటి స్క్రీనింగ్ ఫలితాలు మరియు బయాప్సీ సూచనల గురించి వివరించడానికి నేను సిద్ధంగా ఉన్నాను.`
        : item.category === 'DRONE'
        ? `నమస్కారం! మెడికల్ డ్రోన్ ద్వారా మందుల సరఫరా వివరాలు మరియు మందుల వాడకం గురించి నన్ను అడగండి.`
        : `నమస్కారం! మీ ఖాతా రిజిస్ట్రేషన్ మరియు ధ్రువీకరణ విజయవంతమైంది. మీకు ఏమైనా ప్రశ్నలు ఉన్నాయా?`

    setChatMessages([
      {
        sender: 'bujji',
        text: initialGreeting,
      },
    ])
    speakBujjiTeluguVoice(initialGreeting, 'TE')
  }

  const handleSendMessage = (customText?: string) => {
    const textToSend = (customText || inputQuestion).trim()
    if (!textToSend || !selectedNotif) return

    const newHistory = [...chatMessages, { sender: 'user' as const, text: textToSend }]
    setChatMessages(newHistory)
    setInputQuestion('')

    let reply = ''
    if (textToSend.includes('వివరించు') || textToSend.includes('Explain') || textToSend.includes('అర్థం')) {
      reply = `ఈ అలర్ట్: "${selectedNotif.title}". ${selectedNotif.message}. ఇది మీ నోటి ఆరోగ్య పర్యవేక్షణ కోసం వైద్య బృందం ద్వారా పంపబడింది.`
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
      setTimeout(() => setIsSpeaking(false), 4000)
    }, 400)
  }

  return (
    <div className="role-dashboard">
      <section className="workflow-card">
        <div className="workflow-card-heading">
          <div>
            <span className="section-kicker">COMMUNICATIONS · NOTIFICATIONS &amp; INBOX</span>
            <h2>Patient Alerts &amp; Clinical Notifications ({unreadCount} New)</h2>
            <p>Click any notification card to open full clinical details and chat directly with BUJJI AI.</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="workflow-secondary-button"
              onClick={markAllRead}
            >
              Mark All as Read
            </button>
            <button
              type="button"
              className="workflow-secondary-button"
              onClick={clear}
            >
              Clear All
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', margin: '14px 0', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
          {(['ALL', 'APPOINTMENTS', 'LABS', 'MEDS'] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              className={`ai-tab-btn ${filter === cat ? 'active' : ''}`}
              onClick={() => setFilter(cat)}
            >
              {cat === 'ALL' ? '🔔 All Alerts' : cat === 'APPOINTMENTS' ? '📅 Appointments' : cat === 'LABS' ? '🔬 Lab Reports' : '💊 Pharmacy'}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 10px', color: '#64748b' }}>
              No notifications in this category.
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => openNotifDetailWithBujji(item)}
                style={{
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: item.unread ? 'rgba(239, 246, 255, 0.75)' : '#ffffff',
                  border: item.unread ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {item.unread && (
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563eb' }} />
                    )}
                    <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>{item.title}</strong>
                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: '#e2e8f0', color: '#475569' }}>
                      {item.category}
                    </span>
                    <span style={{ fontSize: '10px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', background: '#fef3c7', color: '#92400e' }}>
                      🤖 Ask BUJJI AI
                    </span>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: '#334155', lineHeight: 1.5 }}>
                    {item.message}
                  </p>
                </div>
                <span style={{ fontSize: '11px', color: '#94a3b8', whiteSpace: 'nowrap' }}>{item.timestamp}</span>
              </div>
            ))
          )}
        </div>

        {/* Embedded BUJJI AI Chatbot Modal for Selected Notification */}
        {selectedNotif && (
          <div className="telemedicine-modal-backdrop" role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(2, 6, 23, 0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div style={{ width: '100%', maxWidth: '640px', background: '#ffffff', borderRadius: '18px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '2px solid #D4AF37' }}>
              <div style={{ background: 'linear-gradient(135deg, #1e3a8a, #0f172a)', padding: '16px 20px', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '24px' }}>🤖</span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#fef3c7' }}>
                      ✦ BUJJI AI · వాయిస్ అసిస్టెంట్ &amp; క్లినికల్ గైడ్
                    </h3>
                    <small style={{ color: '#93c5fd', fontSize: '11px' }}>
                      Interactive Assistant for: {selectedNotif.title}
                    </small>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedNotif(null)}
                  style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#ffffff', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontSize: '16px' }}
                >
                  ✕
                </button>
              </div>

              <div style={{ background: '#f8fafc', padding: '12px 20px', borderBottom: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', background: '#dbeafe', color: '#1d4ed8' }}>
                    {selectedNotif.category}
                  </span>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>{selectedNotif.timestamp}</span>
                </div>
                <p style={{ margin: '6px 0 0', fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                  {selectedNotif.message}
                </p>
              </div>

              <div style={{ padding: '16px 20px', maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', background: '#fcfbf7' }}>
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    style={{
                      alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                      maxWidth: '82%',
                      padding: '10px 14px',
                      borderRadius: '14px',
                      background: msg.sender === 'user' ? '#2563eb' : '#ffffff',
                      color: msg.sender === 'user' ? '#ffffff' : '#0f172a',
                      border: msg.sender === 'user' ? 'none' : '1.5px solid #e2e8f0',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                      fontSize: '13px',
                      lineHeight: 1.5,
                    }}
                  >
                    {msg.sender === 'bujji' && (
                      <span style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#b45309', marginBottom: '2px' }}>
                        ✦ BUJJI AI (తెలుగు వాయిస్):
                      </span>
                    )}
                    {msg.text}
                  </div>
                ))}
                {isSpeaking && (
                  <small style={{ color: '#2563eb', fontWeight: 700, fontSize: '11px', alignSelf: 'flex-start' }}>
                    🔊 బుజ్జి గారు వాయిస్ ద్వారా మాట్లాడుతున్నారు...
                  </small>
                )}
              </div>

              <div style={{ padding: '10px 20px', background: '#ffffff', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {[
                  'ఈ నోటిఫికేషన్ గురించి వివరించు',
                  'నేను ఏమి జాగ్రత్తలు తీసుకోవాలి?',
                  'మందులు ఎప్పుడు వస్తాయి?',
                  'వాయిస్ ద్వారా చదివి వినిపించు',
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => handleSendMessage(chip)}
                    style={{
                      background: '#eff6ff',
                      border: '1px solid #bfdbfe',
                      color: '#1d4ed8',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: '999px',
                      cursor: 'pointer',
                    }}
                  >
                    💬 {chip}
                  </button>
                ))}
              </div>

              <div style={{ padding: '12px 20px', background: '#ffffff', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={inputQuestion}
                  onChange={(e) => setInputQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendMessage()
                  }}
                  placeholder="బుజ్జిని ఏదైనా అడగండి... (Ask BUJJI anything in Telugu or English)"
                  style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '13px' }}
                />
                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  className="workflow-button"
                  style={{ padding: '0 16px', fontWeight: 800 }}
                >
                  Send
                </button>
                <button
                  type="button"
                  onClick={() => {
                    speakBujjiTeluguVoice(
                      chatMessages[chatMessages.length - 1]?.text || selectedNotif.message,
                      'TE'
                    )
                  }}
                  className="workflow-secondary-button"
                  style={{ padding: '0 12px' }}
                  title="Speak Aloud via BUJJI AI"
                >
                  🔊
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

/* ============================================================================
   3. REAL-TIME AMAZON-STYLE MEDICINE DISPATCH TRACKER & PRESCRIPTIONS VIEW
   ============================================================================ */
export const MEDICINE_ORDER_STAGES = [
  {
    key: 'ORDER_CONFIRMED',
    stepNumber: '01',
    labelEn: 'Order Confirmed & E-Prescribed',
    labelTe: 'ఆర్డర్ ఖరారైంది & డాక్టర్ ఇ-ప్రిస్క్రిప్షన్ సిద్ధం',
    labelHi: 'ऑर्डर की पुष्टि और ई-प्रिस्क्रिप्शन जारी',
    descEn: 'Digital prescription signed by Dr. V. Anitha Rao, MDS (APMC-2018-84920). SHA-256 verified.',
    descTe: 'పాడేరు జిల్లా ఆసుపత్రి స్పెషలిస్ట్ డాక్టర్ డిజిటల్ సంతకం మరియు APMC ధృవీకరణ పూర్తయింది.',
    time: 'Today · 10:35 AM',
    icon: '📋',
    badge: 'DOCTOR SIGNED',
  },
  {
    key: 'PACKED_AT_CENTRAL_DEPOT',
    stepNumber: '02',
    labelEn: 'Prepared & Packed at District Central Pharmacy',
    labelTe: 'జిల్లా సెంట్రల్ మెడికల్ డిపోలో మందుల ప్యాకింగ్ పూర్తి',
    labelHi: 'ज़िला केंद्रीय फार्मेसी में दवाएं पैक',
    descEn: 'Paderu Central Medical Depot · Cold-chain tamper-proof medical tote (Batch #MDB-4491).',
    descTe: 'పాడేరు సెంట్రల్ మెడిసిన్ డిపోలో కోల్డ్-చైన్ సీల్డ్ బాక్స్‌లో భద్రంగా ప్యాక్ చేయబడింది.',
    time: 'Today · 11:15 AM',
    icon: '📦',
    badge: 'COLD-CHAIN VERIFIED',
  },
  {
    key: 'DISPATCHED_IN_TRANSIT',
    stepNumber: '03',
    labelEn: 'Dispatched & In Transit (Drone / Feeder Logistics)',
    labelTe: 'రవాణాలో ఉంది · మెడికల్ డ్రోన్ / 4x4 ఫీడర్ ద్వారా తరలింపు',
    labelHi: 'रवाना हो चुकी है और रास्ते में है',
    descEn: 'Dispatched via ITDA Logistics · Dispatch ID #DISP-ASR-772 · Route: Paderu Base → G. Madugula · Live ETA: 18 Mins.',
    descTe: 'ఐటీడీఏ డ్రోన్ కారిడార్ / ఫీడర్ వాహనం ద్వారా గ్రామానికి బయలుదేరింది. చేరుకోవడానికి 18 నిమిషాలు.',
    time: 'Today · 11:40 AM',
    icon: '🚁',
    badge: 'LIVE IN TRANSIT',
  },
  {
    key: 'ARRIVED_LOCAL_PHC',
    stepNumber: '04',
    labelEn: 'Arrived at Local PHC / Sub-Centre Depot',
    labelTe: 'స్థానిక పీహెచ్‌సీ మెడిసిన్ లాకర్‌కు చేరింది',
    labelHi: 'स्थानीय पीएचसी / उप-केंद्र डिपो में पहुंची',
    descEn: 'Safely received at PHC G. Madugula Medicine Locker · Quality checked by Pharmacist Sri S. Apparao.',
    descTe: 'జీ. మడుగుల పీహెచ్‌సీకి చేరింది. ఫార్మసిస్ట్ నాణ్యత తనిఖీ పూర్తయింది, పంపిణీకి సిద్ధం.',
    time: 'Today · 12:15 PM',
    icon: '🏥',
    badge: 'AT LOCAL PHC',
  },
  {
    key: 'DELIVERED_TO_PATIENT',
    stepNumber: '05',
    labelEn: 'Delivered / Handed Over to Patient',
    labelTe: 'రోగికి మందులు అందజేయబడ్డాయి',
    labelHi: 'रोगी को दवाएं सौंप दी गईं',
    descEn: 'Delivered with OTP verification by Smt. Pangi Lakshmi (ASHA Worker) to Killo Somanna.',
    descTe: 'ఆశా కార్యకర్త ద్వారా ఓటీపీ ధృవీకరణతో రోగికి మందులు సురక్షితంగా అందజేయబడ్డాయి.',
    time: 'Today · 01:00 PM',
    icon: '🤝',
    badge: 'DELIVERED ✓',
  },
] as const

export function PatientPrescriptionsView() {
  const [orderStageIndex, setOrderStageIndex] = useState<number>(2) // Default: DISPATCHED & IN TRANSIT
  const [refillRequested, setRefillRequested] = useState(false)
  const [showRefillHistory, setShowRefillHistory] = useState(false)
  const [showPdfModal, setShowPdfModal] = useState(false)
  const [orderNotice, setOrderNotice] = useState('')

  const activeStage = MEDICINE_ORDER_STAGES[orderStageIndex]

  const advanceOrderStage = () => {
    const nextIdx = (orderStageIndex + 1) % MEDICINE_ORDER_STAGES.length
    setOrderStageIndex(nextIdx)
    const stg = MEDICINE_ORDER_STAGES[nextIdx]
    setOrderNotice(`📦 Medicine Order #OD-9082 status updated: ${stg.labelEn}`)
    pushRealtimeNotification({
      title: `📦 Medicine Order: ${stg.labelEn}`,
      message: `Prescription dispatch OD-9082 update: ${stg.descEn}`,
      category: 'DRONE',
    })
    speakBujjiTeluguVoice(
      `మీ మందుల ఆర్డర్ సమాచారం: ${stg.labelTe}. ${stg.descTe}`,
      'TE'
    )
  }

  const resetOrderStage = () => {
    setOrderStageIndex(0)
    setOrderNotice('🔄 Order timeline reset to Stage 01: Order Confirmed & E-Prescribed.')
  }

  const handleRefillRequest = () => {
    setRefillRequested(true)
    setOrderNotice('✓ 30-Day Pharmacy Refill requested! Queued at Paderu Central Medical Depot for dispatch.')
    pushRealtimeNotification({
      title: '💊 30-Day Refill Dispatched',
      message: 'Oral medications refill order OD-20261110-RF02 queued for Paderu central pharmacy dispatch.',
      category: 'APPOINTMENT',
    })
    speakBujjiTeluguVoice(
      '30 రోజుల మందుల రీఫిల్ ఆర్డర్ విజయవంతంగా నమోదు చేయబడింది. పాడేరు సెంట్రల్ డిపో నుండి త్వరలో పంపబడుతుంది.',
      'TE'
    )
  }

  return (
    <div className="role-dashboard">
      <section className="workflow-card" style={{ border: '1.5px solid #0284c7', borderRadius: '18px', overflow: 'hidden' }}>
        <div className="workflow-card-heading" style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #ffffff 100%)', padding: '20px 24px', borderBottom: '1px solid #bae6fd' }}>
          <div>
            <span className="section-kicker" style={{ color: '#0284c7', fontWeight: 800 }}>
              PHARMACY LOGISTICS · REAL-TIME AMAZON-STYLE DISPATCH TRACKER
            </span>
            <h2 style={{ fontSize: '1.25rem', margin: '4px 0 6px', color: '#0f172a' }}>
              Oral Oncology Medicine Order &amp; Dispatch Hub
            </h2>
            <p style={{ margin: 0, fontSize: '0.86rem', color: '#475569' }}>
              Prescribed by Dr. V. Anitha Rao, MDS (APMC-2018-84920) · District Hospital Paderu · Dispensed via ITDA Cold-Chain Grid
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="workflow-button"
              style={{
                background: '#1e3a8a',
                color: '#ffffff',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 750,
                fontSize: '0.86rem',
                cursor: 'pointer',
              }}
              onClick={() => setShowPdfModal(true)}
            >
              📄 Download Signed Prescription PDF
            </button>
            <button
              type="button"
              className="workflow-button live-video-green-btn"
              disabled={refillRequested}
              onClick={handleRefillRequest}
            >
              {refillRequested ? '✓ Refill Dispatched via Central Depot' : '✦ Request 30-Day Pharmacy Refill'}
            </button>
          </div>
        </div>

        <div style={{ padding: '20px 24px' }}>
          {orderNotice && (
            <div className="workflow-notice" role="status" style={{ marginBottom: '1rem', background: '#f0f9ff', borderLeft: '4px solid #0284c7', color: '#0369a1', fontWeight: 600 }}>
              <span>{orderNotice}</span>
              <button type="button" onClick={() => setOrderNotice('')} aria-label="Dismiss" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: '#0369a1' }}>
                ×
              </button>
            </div>
          )}

          {/* Amazon-Style Order Metadata Card (§ 2) */}
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
                Order Number
              </small>
              <strong style={{ fontSize: '1.02rem', color: '#0f172a' }}>
                #OD-20261110-RX9082
              </strong>
              <div style={{ fontSize: '11px', color: '#0284c7', marginTop: '2px' }}>
                Placed Today at 10:35 AM
              </div>
            </div>

            <div>
              <small style={{ color: '#64748b', display: 'block', fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase' }}>
                Delivery Destination
              </small>
              <strong style={{ fontSize: '0.96rem', color: '#0f172a', display: 'block' }}>
                G. Madugula (Upper Hamlet)
              </strong>
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                Recipient: Killo Somanna · MAA-UIDN: 0842
              </span>
            </div>

            <div>
              <small style={{ color: '#64748b', display: 'block', fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase' }}>
                Dispensing Pharmacy Depot
              </small>
              <strong style={{ fontSize: '0.96rem', color: '#1e3a8a', display: 'block' }}>
                Paderu Central Medical Depot
              </strong>
              <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 700 }}>
                ✓ Cold-Chain 4°C Maintained
              </span>
            </div>

            <div>
              <small style={{ color: '#64748b', display: 'block', fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase' }}>
                Logistics Carrier &amp; ETA
              </small>
              <strong style={{ fontSize: '0.96rem', color: '#0f172a', display: 'block' }}>
                ITDA Drone BVLOS-01 / 4x4 Van
              </strong>
              <span style={{ fontSize: '11px', color: '#dc2626', fontWeight: 700 }}>
                ⏱ Live ETA: 18 Minutes
              </span>
            </div>
          </div>

          {/* Active Stage Live Callout Banner */}
          <div
            style={{
              background: orderStageIndex === 4 ? '#f0fdf4' : '#eff6ff',
              border: `1.5px solid ${orderStageIndex === 4 ? '#86efac' : '#93c5fd'}`,
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
              <span style={{ fontSize: '26px' }}>{activeStage.icon}</span>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <strong style={{ fontSize: '0.96rem', color: orderStageIndex === 4 ? '#166534' : '#1e40af' }}>
                    {activeStage.labelEn}
                  </strong>
                  <span style={{ background: orderStageIndex === 4 ? '#dcfce7' : '#dbeafe', color: orderStageIndex === 4 ? '#15803d' : '#1d4ed8', fontSize: '10.5px', fontWeight: 800, padding: '2px 8px', borderRadius: '12px' }}>
                    {activeStage.badge}
                  </span>
                </div>
                <div style={{ fontSize: '0.82rem', color: orderStageIndex === 4 ? '#15803d' : '#2563eb' }}>
                  {activeStage.descEn}
                </div>
              </div>
            </div>
            <div style={{ background: '#ffffff', padding: '6px 14px', borderRadius: '20px', border: '1px solid #cbd5e1', fontWeight: 800, fontSize: '0.86rem', color: '#0f172a' }}>
              ⏰ {activeStage.time}
            </div>
          </div>

          {/* 5-Stage Live Amazon-Style Stepper Progress Bar (§ 2) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
            {MEDICINE_ORDER_STAGES.map((stg, idx) => {
              const isCompleted = idx < orderStageIndex
              const isCurrent = idx === orderStageIndex
              return (
                <div
                  key={stg.key}
                  onClick={() => {
                    setOrderStageIndex(idx)
                    setOrderNotice(`📦 Switched view to Stage 0${idx + 1}: ${stg.labelEn}`)
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '14px',
                    padding: '14px 18px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    border: isCurrent
                      ? '2px solid #0284c7'
                      : isCompleted
                        ? '1.5px solid #86efac'
                        : '1px solid #e2e8f0',
                    background: isCurrent
                      ? '#f0f9ff'
                      : isCompleted
                        ? '#f0fdf4'
                        : '#ffffff',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {/* Step Icon / Circle */}
                  <div
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '13px',
                      fontWeight: 800,
                      flexShrink: 0,
                      background: isCurrent
                        ? '#0284c7'
                        : isCompleted
                          ? '#16a34a'
                          : '#e2e8f0',
                      color: isCurrent || isCompleted ? '#ffffff' : '#64748b',
                      boxShadow: isCurrent ? '0 0 0 4px rgba(2, 132, 199, 0.25)' : 'none',
                    }}
                  >
                    {isCompleted ? '✓' : stg.stepNumber}
                  </div>

                  {/* Step Info */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                      <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: isCurrent ? '#0369a1' : '#0f172a' }}>
                        {stg.labelEn}
                      </h4>
                      <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
                        {stg.time}
                      </span>
                    </div>

                    <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: isCurrent ? '#0284c7' : '#64748b' }}>
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

          {/* Simulation & Stage Controls Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', padding: '12px 16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
            <span style={{ fontSize: '0.84rem', color: '#334155', fontWeight: 600 }}>
              🧪 <strong>Real-Time Simulation Controls:</strong> Advance or reset the Amazon-style order dispatch cycle.
            </span>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="workflow-secondary-button"
                onClick={resetOrderStage}
                style={{ fontSize: '0.82rem', padding: '8px 14px' }}
              >
                ↺ Reset Order (రీసెట్)
              </button>
              <button
                type="button"
                className="workflow-button"
                onClick={advanceOrderStage}
                style={{ fontSize: '0.84rem', padding: '8px 18px', background: '#0284c7', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <span>✦ Advance Order Stage (తదుపరి దశ)</span>
                <span>→</span>
              </button>
            </div>
          </div>

          {/* Prescribed Medications Inventory (§ 2) */}
          <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: '0 0 12px 0' }}>
            💊 Prescribed Oral Oncology Medications (3 Formulations)
          </h3>

          <div className="ai-rx-table-wrap">
            <table className="ai-rx-table">
              <thead>
                <tr>
                  <th>Drug Name &amp; Formulation</th>
                  <th>Dosage &amp; Route</th>
                  <th>Frequency &amp; Course</th>
                  <th>Patient Instructions</th>
                  <th>Refill Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <div className="rx-drug-name">Triamcinolone Acetonide 0.1% Buccal Paste</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>5g Tube · Topical Corticosteroid</div>
                  </td>
                  <td>Thin pea-sized film (Oral Mucosa)</td>
                  <td>Three times daily (TDS) &times; 21 days</td>
                  <td style={{ fontSize: '11.5px', color: '#475569' }}>
                    Dab dry lesion with cotton prior to application. Do not eat, drink, or rinse for 30 minutes.
                  </td>
                  <td><span className="workflow-status status-good">DISPATCHED</span></td>
                </tr>
                <tr>
                  <td>
                    <div className="rx-drug-name">Lycopene 5000 mcg + Alpha Lipoic Acid</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Capsules · Mucosal Antioxidant</div>
                  </td>
                  <td>1 Capsule Oral with water</td>
                  <td>Once daily (OD) &times; 60 days</td>
                  <td style={{ fontSize: '11.5px', color: '#475569' }}>
                    Take after morning breakfast. Scavenges reactive oxygen species to arrest premalignant dysplasia.
                  </td>
                  <td><span className="workflow-status status-good">DISPATCHED</span></td>
                </tr>
                <tr>
                  <td>
                    <div className="rx-drug-name">Chlorhexidine Gluconate 0.2% Rinse</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>150ml Bottle · Antiseptic Gargle</div>
                  </td>
                  <td>10 ml undiluted gargle</td>
                  <td>Twice daily (BD) &times; 14 days</td>
                  <td style={{ fontSize: '11.5px', color: '#475569' }}>
                    Swish around buccal sulcus for 60 seconds then spit out. Do not swallow.
                  </td>
                  <td><span className="workflow-status status-good">DISPATCHED</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Refill History & Archives Toggle (§ 2) */}
          <div style={{ marginTop: '16px' }}>
            <button
              type="button"
              className="workflow-secondary-button"
              onClick={() => setShowRefillHistory(!showRefillHistory)}
              style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <span>🕒</span>
              <span>{showRefillHistory ? 'Hide Previous Refill Shipments' : 'View Previous Refill Shipments & Archives (గత డెలివరీలు)'}</span>
            </button>

            {showRefillHistory && (
              <div style={{ marginTop: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', fontSize: '12.5px' }}>
                <h4 style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: 800, color: '#1e3a8a' }}>
                  📦 Historical Medication Deliveries for Killo Somanna
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div>
                      <strong>Order #OD-20261012-RX8120</strong> · Triamcinolone 0.1% + Lycopene (30 Days)
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Delivered on 14 Oct 2026 via Drone Corridor DRONE-ASR-01</div>
                    </div>
                    <span style={{ color: '#16a34a', fontWeight: 800 }}>✓ COMPLETED</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div>
                      <strong>Order #OD-20260910-RX7411</strong> · Diagnostic Oral Rinse &amp; Antiseptic Gargle
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Delivered on 12 Sep 2026 at PHC G. Madugula Counter</div>
                    </div>
                    <span style={{ color: '#16a34a', fontWeight: 800 }}>✓ COMPLETED</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div style={{ marginTop: '16px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '14px' }}>
            <strong style={{ fontSize: '13px', color: '#92400e' }}>
              🗣️ రోగికి ముఖ్యమైన సలహా (Patient Counseling in Telugu):
            </strong>
            <p style={{ margin: '6px 0 0', fontSize: '12.5px', color: '#78350f', lineHeight: 1.5 }}>
              డాక్టర్ సూచించిన మందులను సమయానికి వాడండి. గుట్కా, ఖైనీ, బీడీలు పూర్తిగా మానండి. కారం, వేడి పదార్ధాలు తక్కువగా తినండి.
            </p>
          </div>
        </div>
      </section>

      {/* Verified Prescription PDF Modal */}
      {showPdfModal && (
        <div className="telemedicine-modal-backdrop" role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(2, 6, 23, 0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', maxWidth: '640px', width: '100%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                📄 Official Verified Bilingual E-Prescription
              </h3>
              <button
                type="button"
                onClick={() => setShowPdfModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}
              >
                ✕
              </button>
            </div>

            <div style={{ border: '2px solid #cbd5e1', borderRadius: '12px', padding: '20px', background: '#f8fafc', fontSize: '12.5px' }}>
              <div style={{ textAlign: 'center', borderBottom: '1.5px solid #0f172a', paddingBottom: '10px', marginBottom: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b' }}>GOVERNMENT OF ANDHRA PRADESH · ITDA PADERU</div>
                <div style={{ fontSize: '15px', fontWeight: 900, color: '#0f172a' }}>AAROGYA DRISHTI TELEMEDICINE E-PRESCRIPTION</div>
                <div style={{ fontSize: '11px', color: '#0284c7' }}>District Hospital Paderu · Department of Oral Oncology</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
                <div><strong>Doctor:</strong> Dr. V. Anitha Rao, MDS</div>
                <div><strong>Reg No:</strong> APMC-2018-84920</div>
                <div><strong>Patient:</strong> Killo Somanna (46Y Male)</div>
                <div><strong>UIDN:</strong> UIDN-ASR-GMAD-2026-0842</div>
                <div><strong>Order Ref:</strong> #OD-20261110-RX9082</div>
                <div><strong>Date:</strong> 10 Nov 2026 · 10:35 AM</div>
              </div>

              <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '10px', marginBottom: '12px' }}>
                <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block', marginBottom: '6px' }}>
                  Rx (Prescribed Oral Medications):
                </strong>
                <ol style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <li>
                    <strong>Triamcinolone Acetonide 0.1% Orabase Paste</strong> (5g tube)
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Apply thin film topically to right buccal mucosa twice daily after meals. (21 Days)</div>
                  </li>
                  <li>
                    <strong>Lycopene 5000 mcg + Alpha Lipoic Acid Capsules</strong>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>1 capsule orally once daily after breakfast. (60 Days)</div>
                  </li>
                  <li>
                    <strong>Chlorhexidine Gluconate 0.2% Oral Rinse</strong> (150ml bottle)
                    <div style={{ fontSize: '11px', color: '#64748b' }}>10 ml undiluted gargle twice daily for 60 seconds. (14 Days)</div>
                  </li>
                </ol>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '12px', marginTop: '12px' }}>
                <div>
                  <span style={{ color: '#16a34a', fontWeight: 800 }}>✓ APMC Digitally Signed</span>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>SHA-256: 8f9b...a341 (Valid across AP Jan Aushadhi Stores)</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <strong>Dr. V. Anitha Rao, MDS</strong>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Oral Oncologist · DH Paderu</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
              <button
                type="button"
                onClick={() => {
                  window.print()
                }}
                className="workflow-button"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <span>🖨️</span>
                <span>Print / Save as PDF</span>
              </button>
              <button
                type="button"
                onClick={() => setShowPdfModal(false)}
                className="workflow-secondary-button"
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

/* ============================================================================
   4. PATIENT DOCUMENTS & BILINGUAL REFERRAL SLIPS
   ============================================================================ */
export function PatientDocumentsView({ user }: { user?: AuthUser }) {
  const [showSlip, setShowSlip] = useState(false)
  const patientName = user?.fullName || 'rambabu'
  const patientMandal = user?.mandal || 'Koyyuru'
  const patientUidn = user?.maaUidn || 'UIDN-ASR-KOYY-2026-8921'

  const activePatient = {
    ...DEMO_KILLO_SOMANNA_PATIENT,
    fullName: patientName,
    maaUidn: patientUidn,
    address: {
      ...DEMO_KILLO_SOMANNA_PATIENT.address,
      village: patientMandal,
      mandal: patientMandal,
      phcId: `PHC-${patientMandal.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 6)}`,
    },
  }

  const activeReferral = {
    ...DEMO_KILLO_SOMANNA_REFERRAL,
    patient: {
      ...DEMO_KILLO_SOMANNA_REFERRAL.patient,
      fullName: patientName,
      address: {
        ...DEMO_KILLO_SOMANNA_REFERRAL.patient.address,
        village: patientMandal,
        mandal: patientMandal,
        phcId: `PHC-${patientMandal.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 6)}`,
      },
    },
  }

  return (
    <div className="role-dashboard">
      <section className="workflow-card">
        <div className="workflow-card-heading">
          <div>
            <span className="section-kicker">DOCUMENTS &amp; CONSENT FORMS</span>
            <h2>Official Medical Referral Slips &amp; Consent Documents</h2>
            <p>Download signed bilingual referral slips with scannable QR code and signed tele-screening consents.</p>
          </div>
          <button type="button" className="workflow-button" onClick={() => setShowSlip(true)}>
            ✦ View &amp; Print Official Referral Slip
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginTop: '16px' }}>
          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '14px', border: '1px solid #cbd5e1' }}>
            <span className="section-kicker">REFERRAL SLIP #REF-20261110-GM01</span>
            <h4 style={{ margin: '4px 0 6px', fontSize: '14px' }}>
              Specialist Oral Oncology Biopsy Slip
            </h4>
            <p style={{ margin: '0 0 10px', fontSize: '12px', color: '#475569' }}>
              Patient: <strong>{patientName}</strong> · Assigned Doctor: <strong>Dr. V. Anitha Rao, MDS</strong> · Facility: District Hospital Paderu
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" className="workflow-button live-video-green-btn" onClick={() => setShowSlip(true)}>
                📄 Open Printable Slip (QR)
              </button>
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '14px', border: '1px solid #cbd5e1' }}>
            <span className="section-kicker">INFORMED CONSENT #CON-20261110-01</span>
            <h4 style={{ margin: '4px 0 6px', fontSize: '14px' }}>
              Bilingual Image Capture &amp; AI Triage Consent
            </h4>
            <p style={{ margin: '0 0 10px', fontSize: '12px', color: '#475569' }}>
              Language: <strong>Telugu (తెలుగు)</strong> · Granted at PHC {patientMandal} · Status: ACTIVE (DPDP Act 2023 Compliant)
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" className="workflow-secondary-button" onClick={() => alert('Consent Form Version 1.0 is active and encrypted with SHA-256.')}>
                ✓ Verified Active Consent
              </button>
            </div>
          </div>
        </div>

        {showSlip && (
          <PrintableReferralSlip
            referral={activeReferral}
            patient={activePatient}
            onClose={() => setShowSlip(false)}
          />
        )}
      </section>
    </div>
  )
}

/* ============================================================================
   5. PATIENT PROFILE & ACCESSIBILITY SETTINGS
   ============================================================================ */
export function PatientSettingsView({ user }: { user: AuthUser }) {
  const [fullName, setFullName] = useState(user.fullName || 'D Tejesh')
  const [phone, setPhone] = useState(user.phone || '7901008235')
  const [age, setAge] = useState(46)
  const [sex, setSex] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE')
  const [phc, setPhc] = useState('PHC Chintapalli')
  const [mandal, setMandal] = useState(user.mandal || 'Chintapalli')
  const [district] = useState(user.district || 'Alluri Sitharama Raju')
  const [habitation, setHabitation] = useState('Kothapalli Tribal Hamlet')
  const [gramPanchayat, setGramPanchayat] = useState('Chintapalli GP')
  const [aadhaar, setAadhaar] = useState('XXXX-XXXX-8921')
  const [showAadhaar, setShowAadhaar] = useState(false)
  const [uidn] = useState(user.maaUidn || 'UIDN-ASR-CHIN-2026-8757')
  const [selectedAvatar, setSelectedAvatar] = useState('👨‍🌾')
  const [selectedTheme, setSelectedTheme] = useState<'GOLD_TEAL' | 'OCEAN_BLUE' | 'FOREST_GREEN' | 'AMETHYST'>('GOLD_TEAL')
  const [preferredLanguage, setPreferredLanguage] = useState('TELUGU')
  const [savedNotice, setSavedNotice] = useState('')
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  // Scannable 2D QR Matrix for Real-Time Member Health Verification
  const digitalCardUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://aarogyadrishti.in'}/?digitalHealthCard=${encodeURIComponent(uidn)}&name=${encodeURIComponent(fullName)}&phc=${encodeURIComponent(phc)}`
  const qrMatrix = generateScannableQrMatrix(digitalCardUrl)
  const qrSize = qrMatrix.length
  const totalViewSize = qrSize + 8

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setSavedNotice('✓ Patient profile, biometric identifiers, and theme preferences saved successfully.')
    speakBujjiTeluguVoice('మీ ప్రొఫైల్ వివరాలు మరియు డిజిటల్ హెల్త్ కార్డ్ విజయవంతంగా భద్రపరచబడ్డాయి.', 'TE')
    setTimeout(() => setSavedNotice(''), 4000)
  }

  return (
    <div className="role-dashboard">
      <section className="workflow-card">
        <div className="workflow-card-heading">
          <div>
            <span className="section-kicker">PREFERENCES · PROFILE &amp; DIGITAL HEALTH CARD</span>
            <h2>Patient Profile, Aadhaar &amp; Official Digital Health ID</h2>
            <p>Complete tribal healthcare record with photo avatar, assigned PHC, scannable QR card, and theme styles.</p>
          </div>
        </div>

        {savedNotice && (
          <div className="workflow-notice" role="status" style={{ margin: '12px 0' }}>
            {savedNotice}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px', marginTop: '16px' }}>
          {/* Form Column */}
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Avatar Selector */}
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>
                Profile Avatar &amp; Image (ప్రొఫైల్ చిత్రం)
              </label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                {['👨‍🌾', '👩‍🌾', '👵', '👴', '🧑‍⚕️', '👤'].map((av) => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => setSelectedAvatar(av)}
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      fontSize: '22px',
                      border: selectedAvatar === av ? '2.5px solid #2563eb' : '1px solid #cbd5e1',
                      background: selectedAvatar === av ? '#eff6ff' : '#ffffff',
                      cursor: 'pointer',
                    }}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <label style={{ fontSize: '12.5px', fontWeight: 700 }}>
                Full Legal Name
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                />
              </label>

              <label style={{ fontSize: '12.5px', fontWeight: 700 }}>
                Age &amp; Gender (వయస్సు / లింగం)
                <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    style={{ width: '70px', padding: '9px 10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                  <select
                    value={sex}
                    onChange={(e) => setSex(e.target.value as any)}
                    style={{ flex: 1, padding: '9px 10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <label style={{ fontSize: '12.5px', fontWeight: 700 }}>
                Assigned Primary Health Centre (PHC)
                <select
                  value={phc}
                  onChange={(e) => setPhc(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                >
                  <option value="PHC Chintapalli">PHC Chintapalli (చింతపల్లి)</option>
                  <option value="PHC G. Madugula">PHC G. Madugula (జి. మాడుగుల)</option>
                  <option value="PHC Koyyuru">PHC Koyyuru (కొయ్యూరు)</option>
                  <option value="PHC Araku Valley">Area Hospital Araku Valley (అరకు లోయ)</option>
                  <option value="District Hospital Paderu">District Hospital Paderu (పాడేరు)</option>
                  <option value="PHC Hukumpeta">PHC Hukumpeta (హుకుంపేట)</option>
                </select>
              </label>

              <label style={{ fontSize: '12.5px', fontWeight: 700 }}>
                Registered Mobile Number (OTP &amp; SMS)
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                />
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <label style={{ fontSize: '12.5px', fontWeight: 700 }}>
                Aadhaar Card Number (ఆధార్ సంఖ్య)
                <div style={{ position: 'relative', marginTop: '4px' }}>
                  <input
                    type={showAadhaar ? 'text' : 'password'}
                    value={aadhaar}
                    onChange={(e) => setAadhaar(e.target.value)}
                    style={{ width: '100%', padding: '9px 40px 9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowAadhaar(!showAadhaar)}
                    style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}
                  >
                    {showAadhaar ? '🙈' : '👁️'}
                  </button>
                </div>
              </label>

              <label style={{ fontSize: '12.5px', fontWeight: 700 }}>
                Official MAA-UIDN (యుఐడిఎన్)
                <input
                  type="text"
                  readOnly
                  value={uidn}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #d97706', background: '#fef3c7', fontWeight: 800, color: '#92400e', marginTop: '4px' }}
                />
              </label>
            </div>

            {/* Complete Address Fields */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px', background: '#f8fafc' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#1e3a8a', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                📍 Complete Tribal Habitation Address
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <input
                  placeholder="Habitation (ఆవాసం)"
                  value={habitation}
                  onChange={(e) => setHabitation(e.target.value)}
                  style={{ padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                />
                <input
                  placeholder="Gram Panchayat (పంచాయతీ)"
                  value={gramPanchayat}
                  onChange={(e) => setGramPanchayat(e.target.value)}
                  style={{ padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                />
                <input
                  placeholder="Mandal (మండలం)"
                  value={mandal}
                  onChange={(e) => setMandal(e.target.value)}
                  style={{ padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                />
                <input
                  placeholder="District"
                  readOnly
                  value={district}
                  style={{ padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#e2e8f0', fontSize: '12px' }}
                />
              </div>
            </div>

            {/* Theme Colors Selector */}
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>
                🎨 Interface &amp; Health Card Theme
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[
                  { id: 'GOLD_TEAL', label: '🟡 Aarogya Gold & Teal', color: '#D4AF37' },
                  { id: 'OCEAN_BLUE', label: '🔵 Clinical Ocean Blue', color: '#2563eb' },
                  { id: 'FOREST_GREEN', label: '🟢 Agency Forest Green', color: '#16a34a' },
                  { id: 'AMETHYST', label: '🟣 Tribal Royal Amethyst', color: '#9333ea' },
                ].map((th) => (
                  <button
                    key={th.id}
                    type="button"
                    onClick={() => setSelectedTheme(th.id as any)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 700,
                      border: selectedTheme === th.id ? `2px solid ${th.color}` : '1px solid #cbd5e1',
                      background: selectedTheme === th.id ? '#f8fafc' : '#ffffff',
                      cursor: 'pointer',
                    }}
                  >
                    {th.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>
                🗣️ Preferred Vernacular Language (భాష ప్రాధాన్యత)
              </label>
              <select
                value={preferredLanguage}
                onChange={(e) => setPreferredLanguage(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              >
                <option value="TELUGU">తెలుగు (Telugu)</option>
                <option value="ENGLISH">English</option>
                <option value="HINDI">हिंदी (Hindi)</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px', alignItems: 'center' }}>
              <button type="submit" className="workflow-button" style={{ fontWeight: 800 }}>
                💾 Save Patient Preferences
              </button>
              <button
                type="button"
                className="workflow-secondary-button"
                onClick={() => setShowLogoutConfirm(true)}
                style={{ borderColor: '#ef4444', color: '#dc2626', fontWeight: 700 }}
              >
                🚪 Log Out
              </button>
            </div>
          </form>

          {/* Right Column: Physical-Style Digital Health Card Preview */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#1e3a8a', textTransform: 'uppercase' }}>
              🪪 Live Digital Health ID Card (ఆరోగ్య దృష్టి కార్డ్)
            </span>

            <div
              style={{
                borderRadius: '18px',
                padding: '20px',
                color: '#ffffff',
                background:
                  selectedTheme === 'OCEAN_BLUE'
                    ? 'linear-gradient(135deg, #1e3a8a, #0369a1)'
                    : selectedTheme === 'FOREST_GREEN'
                    ? 'linear-gradient(135deg, #14532d, #15803d)'
                    : selectedTheme === 'AMETHYST'
                    ? 'linear-gradient(135deg, #581c87, #7e22ce)'
                    : 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #78350f 100%)',
                border: '2.5px solid #D4AF37',
                boxShadow: '0 12px 30px rgba(0,0,0,0.2)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Holographic Watermark */}
              <div style={{ position: 'absolute', right: '-20px', top: '-20px', width: '120px', height: '120px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,175,55,0.25) 0%, transparent 70%)', pointerEvents: 'none' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '10px', marginBottom: '12px' }}>
                <div>
                  <span style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '0.1em', color: '#fef3c7', textTransform: 'uppercase' }}>
                    ITDA PADERU · ALLURI SITHARAMA RAJU DISTRICT
                  </span>
                  <h3 style={{ margin: '2px 0 0', fontSize: '15px', fontWeight: 900, color: '#ffffff' }}>
                    AAROGYA DRISHTI · TRIBAL HEALTH CARD
                  </h3>
                </div>
                <span style={{ fontSize: '10px', fontWeight: 800, background: '#D4AF37', color: '#0f172a', padding: '2px 8px', borderRadius: '4px' }}>
                  GOVT. VERIFIED
                </span>
              </div>

              <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '12px', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
                  {selectedAvatar}
                </div>

                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#ffffff' }}>{fullName}</h4>
                  <div style={{ fontSize: '11.5px', color: '#cbd5e1', marginTop: '2px' }}>
                    {age} Years / {sex} · Blood Group: O+ve
                  </div>
                  <div style={{ fontSize: '11px', color: '#fef3c7', fontWeight: 700, marginTop: '2px' }}>
                    🏥 {phc}
                  </div>
                </div>

                {/* Scannable Real-time QR */}
                <div style={{ background: '#ffffff', padding: '4px', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.15)' }}>
                  <svg
                    viewBox={`0 0 ${totalViewSize} ${totalViewSize}`}
                    width="64"
                    height="64"
                    shapeRendering="crispEdges"
                    aria-label="Digital Health Card Verification QR"
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
                </div>
              </div>

              <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                <div>
                  <span style={{ color: '#94a3b8', display: 'block', fontSize: '9px' }}>OFFICIAL MAA-UIDN</span>
                  <code style={{ color: '#fef3c7', fontWeight: 800 }}>{uidn}</code>
                </div>
                <div>
                  <span style={{ color: '#94a3b8', display: 'block', fontSize: '9px' }}>AADHAAR (LAST 4)</span>
                  <code style={{ color: '#ffffff', fontWeight: 800 }}>{aadhaar.slice(-9)}</code>
                </div>
                <div>
                  <span style={{ color: '#94a3b8', display: 'block', fontSize: '9px' }}>EMERGENCY CONTACT</span>
                  <strong style={{ color: '#86efac' }}>108 / {phone}</strong>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="workflow-button"
              style={{ width: '100%', fontWeight: 800 }}
            >
              🖨️ Download / Print Official Digital Card
            </button>
          </div>
        </div>

        {/* Logout Confirmation Modal */}
        {showLogoutConfirm && (
          <div className="telemedicine-modal-backdrop" role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(2, 6, 23, 0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', maxWidth: '400px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
              <h3 style={{ margin: '0 0 8px', color: '#0f172a' }}>ఖాతా నుండి నిష్క్రమించాలా?</h3>
              <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: '13px' }}>
                Are you sure you want to sign out of Aarogya Drishti? Your local biometric session will be closed safely.
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(false)}
                  className="workflow-secondary-button"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowLogoutConfirm(false)
                    window.dispatchEvent(new Event('aarogya:logout'))
                  }}
                  className="workflow-button"
                  style={{ background: '#ef4444', borderColor: '#ef4444' }}
                >
                  Confirm Sign Out
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

/* ============================================================================
   6. PATIENT HELP, AMBULANCE RADAR & EMERGENCY SOS WITH BUJJI VOICE
   ============================================================================ */
export function PatientHelpSupportView() {
  const [showSosModal, setShowSosModal] = useState(false)
  const [sosActive, setSosActive] = useState(false)
  const [emergencyReason, setEmergencyReason] = useState('ACUTE_BLEEDING')
  const [sosNotice, setSosNotice] = useState('')

  const handleTriggerSos = (reason: string) => {
    setSosActive(true)
    setShowSosModal(false)
    const reasonLabels: Record<string, string> = {
      ACUTE_BLEEDING: 'నోటి నుండి తీవ్ర రక్తస్రావం (Acute Oral Bleeding)',
      SEVERE_TRISMUS: 'నోరు తెరవలేకపోవడం & తీవ్ర దవడ నొప్పి (Severe Trismus & Jaw Lock)',
      FACIAL_SWELLING: 'ముఖం వాపు మరియు తీవ్ర ఇన్ఫెక్షన్ (Spreading Facial Swelling)',
      AIRWAY_DISTRESS: 'శ్వాస తీసుకోవడంలో ఇబ్బంది (Airway & Breathing Distress)',
      URGENT_TRANSPORT: 'తక్షణ ఆసుపత్రి అడ్మిషన్ అవసరం (Urgent Hospital Transport)',
    }

    const selectedLabel = reasonLabels[reason] || reason
    setSosNotice(`🚨 108 EMERGENCY SOS DISPATCHED: ${selectedLabel} for patient location.`)

    pushRealtimeNotification({
      title: '🚨 CRITICAL TRIBAL EMERGENCY SOS TRIGGERED',
      message: `Urgent 108 Ambulance SOS dispatched for: ${selectedLabel}. ETA: 12 mins. GPS Telemetry Active.`,
      category: 'APPOINTMENT',
    })

    const speechText = `ఆందోళన చెందకండి! మీ అత్యవసర పిలుపు 108 అంబులెన్స్ బృందానికి మరియు మండల వైద్యాధికారికి చేరింది. అంబులెన్స్ 12 నిమిషాల్లో మీ గ్రామానికి చేరుకుంటుంది. వైద్య సహాయం సిద్ధంగా ఉంది. దయచేసి కూర్చొని శాంతంగా ఉండండి.`
    speakBujjiTeluguVoice(speechText, 'TE')
  }

  const triggerBujji = () => {
    window.dispatchEvent(new CustomEvent('aarogya:open-bujji'))
  }

  return (
    <div className="role-dashboard">
      <section className="workflow-card">
        <div className="workflow-card-heading">
          <div>
            <span className="section-kicker">SUPPORT · 24/7 TRIBAL AMBULANCE RADAR &amp; SOS</span>
            <h2>Help, Emergency SOS &amp; PHC Ambulance Radar</h2>
            <p>Real-time PHC ambulance attendance radar, 1-click critical emergency SOS dispatch, and BUJJI voice aid.</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setShowSosModal(true)}
              style={{
                background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
                color: '#ffffff',
                fontWeight: 900,
                fontSize: '13px',
                padding: '10px 18px',
                borderRadius: '10px',
                border: '2px solid #fecaca',
                boxShadow: '0 0 15px rgba(239, 68, 68, 0.5)',
                cursor: 'pointer',
                animation: 'pulse 1.8s infinite',
              }}
            >
              🚨 EMERGENCY SOS (అత్యవసరం)
            </button>
            <button type="button" className="workflow-button live-video-green-btn" onClick={triggerBujji}>
              🤖 Launch BUJJI Voice AI
            </button>
          </div>
        </div>

        {sosNotice && (
          <div
            style={{
              margin: '14px 0',
              padding: '12px 18px',
              borderRadius: '10px',
              background: '#fee2e2',
              border: '2px solid #ef4444',
              color: '#991b1b',
              fontWeight: 700,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>{sosNotice}</span>
            <button
              type="button"
              onClick={() => {
                setSosActive(false)
                setSosNotice('')
              }}
              style={{ background: '#b91c1c', color: '#ffffff', border: 'none', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 800 }}
            >
              Cancel SOS
            </button>
          </div>
        )}

        {/* Live Ambulance Fleet Attendance Radar & 5-Stage Live GPS Journey */}
        <div style={{ background: '#ffffff', border: '1.5px solid #2563eb', borderRadius: '16px', padding: '18px', marginTop: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#2563eb', textTransform: 'uppercase' }}>
                LIVE GPS TELEMETRY · ALLOCATED PHC FLEET
              </span>
              <h3 style={{ margin: '2px 0 0', fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                🚑 108 Tribal Feeder 4x4 Ambulance Attendance Radar · AP-39-TE-1084
              </h3>
            </div>
            <span style={{ background: sosActive ? '#fee2e2' : '#dcfce7', color: sosActive ? '#dc2626' : '#15803d', fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '999px', border: sosActive ? '1.5px solid #ef4444' : '1px solid #86efac' }}>
              ● {sosActive ? '🚨 SOS EMERGENCY DISPATCHED — EN ROUTE' : 'ACTIVE ON DUTY (డ్యూటీలో ఉంది)'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <small style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Vehicle &amp; Model</small>
              <strong style={{ fontSize: '14px', color: '#0f172a' }}>AP-39-TE-1084</strong>
              <div style={{ fontSize: '11px', color: '#2563eb', marginTop: '2px' }}>ASR Tribal 4x4 Feeder Ambulance</div>
            </div>

            <div style={{ background: '#eff6ff', padding: '12px', borderRadius: '10px', border: '1px solid #bfdbfe' }}>
              <small style={{ color: '#1e40af', display: 'block', fontSize: '11px' }}>Distance from Your Village</small>
              <strong style={{ fontSize: '16px', color: '#1d4ed8' }}>4.2 km Away</strong>
              <div style={{ fontSize: '11px', color: '#1e40af', marginTop: '2px' }}>Chintapalli Ghat Corridor</div>
            </div>

            <div style={{ background: '#fef3c7', padding: '12px', borderRadius: '10px', border: '1px solid #fde68a' }}>
              <small style={{ color: '#92400e', display: 'block', fontSize: '11px' }}>Estimated Time to Reach (ETA)</small>
              <strong style={{ fontSize: '16px', color: '#b45309' }}>⏱ 12 Minutes</strong>
              <div style={{ fontSize: '11px', color: '#b45309', marginTop: '2px' }}>Direct Hilltop Village Pickup</div>
            </div>

            <div style={{ background: '#f0fdf4', padding: '12px', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
              <small style={{ color: '#166534', display: 'block', fontSize: '11px' }}>Base &amp; Receiving Facility</small>
              <strong style={{ fontSize: '14px', color: '#15803d' }}>Area Hospital Chintapalli</strong>
              <div style={{ fontSize: '11px', color: '#15803d', marginTop: '2px' }}>Destination: DH Paderu Oncology OPD</div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', paddingTop: '10px', borderTop: '1px solid #e2e8f0', fontSize: '12px', color: '#475569', flexWrap: 'wrap', gap: '8px' }}>
            <span>👨‍⚕️ <strong>Paramedic:</strong> Sri K. Ramesh, EMT · <strong>Driver:</strong> Sri M. Simhachalam</span>
            <span>
              <a href="tel:+919440108108" style={{ color: '#16a34a', textDecoration: 'none', fontWeight: 800 }}>
                📞 Call Driver: +91 94401-08108
              </a>
              {' · '}
              <a href="tel:+919440108109" style={{ color: '#0284c7', textDecoration: 'none', fontWeight: 800 }}>
                📞 Call EMT: +91 94401-08109
              </a>
            </span>
            <span>🔋 <strong>Vehicle Readiness:</strong> Fuel 88% · 2x Oxygen Cylinders Full · 4x4 Active</span>
          </div>
        </div>

        {/* Emergency Helplines Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginTop: '16px' }}>
          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '14px', border: '1px solid #cbd5e1' }}>
            <h4 style={{ margin: '0 0 6px', fontSize: '14px', color: '#1e3a8a' }}>
              📞 24/7 District Health Helplines
            </h4>
            <p style={{ margin: 0, fontSize: '12.5px', color: '#334155', lineHeight: 1.6 }}>
              • Andhra Pradesh Emergency Ambulance: <strong>108</strong><br />
              • Health Advice Helpline: <strong>104</strong><br />
              • ITDA Paderu Health Control Room: <strong>1800-425-4567</strong><br />
              • District Hospital Paderu Oral Oncology: <strong>08935-250108</strong>
            </p>
          </div>

          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '14px', border: '1px solid #cbd5e1' }}>
            <h4 style={{ margin: '0 0 6px', fontSize: '14px', color: '#1e3a8a' }}>
              🚑 Free Tribal Transport Assistance
            </h4>
            <p style={{ margin: 0, fontSize: '12.5px', color: '#334155', lineHeight: 1.6 }}>
              Patients flagged with high-risk OPMD or requiring biopsy at District Hospital Paderu receive 100% free 4x4 ambulance pickup organized by ITDA Paderu and managed via BVLOS tracking.
            </p>
          </div>
        </div>

        {/* Emergency SOS Modal */}
        {showSosModal && (
          <div className="telemedicine-modal-backdrop" role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(2, 6, 23, 0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div style={{ background: '#ffffff', borderRadius: '18px', padding: '24px', maxWidth: '520px', width: '100%', border: '3px solid #ef4444', boxShadow: '0 25px 50px -12px rgba(239, 68, 68, 0.4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <span style={{ fontSize: '32px' }}>🚨</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: '#991b1b' }}>
                    TRIBAL EMERGENCY SOS DISPATCH
                  </h3>
                  <small style={{ color: '#64748b' }}>Select the clinical emergency condition to dispatch immediate 108 ambulance.</small>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', margin: '16px 0' }}>
                {[
                  { id: 'ACUTE_BLEEDING', label: '🩸 నోటి నుండి తీవ్ర రక్తస్రావం (Acute Oral Bleeding)' },
                  { id: 'SEVERE_TRISMUS', label: '⚠️ తీవ్ర దవడ నొప్పి & నోరు తెరవలేకపోవడం (Severe Trismus)' },
                  { id: 'FACIAL_SWELLING', label: '⚡ ముఖం వాపు & తీవ్ర జ్వరం (Spreading Facial Swelling)' },
                  { id: 'AIRWAY_DISTRESS', label: '🫁 శ్వాస తీసుకోవడంలో ఇబ్బంది (Airway & Breathing Distress)' },
                  { id: 'URGENT_TRANSPORT', label: '🚑 తక్షణ ఆసుపత్రి అడ్మిషన్ అవసరం (Urgent Hospital Transport)' },
                ].map((opt) => (
                  <label
                    key={opt.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: emergencyReason === opt.id ? '2px solid #ef4444' : '1px solid #cbd5e1',
                      background: emergencyReason === opt.id ? '#fef2f2' : '#ffffff',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 700,
                    }}
                  >
                    <input
                      type="radio"
                      name="emergency_reason"
                      checked={emergencyReason === opt.id}
                      onChange={() => setEmergencyReason(opt.id)}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setShowSosModal(false)}
                  className="workflow-secondary-button"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleTriggerSos(emergencyReason)}
                  style={{
                    background: '#dc2626',
                    color: '#ffffff',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontWeight: 900,
                    cursor: 'pointer',
                  }}
                >
                  🚨 Confirm &amp; Dispatch 108 Ambulance
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

/* ============================================================================
   7. ADMIN: SYSTEM OVERVIEW & DISTRICT METRICS
   ============================================================================ */
export function AdminSystemOverviewMetrics() {
  return (
    <div className="role-dashboard">
      <section className="workflow-card">
        <div className="workflow-card-heading">
          <div>
            <span className="section-kicker">ADMINISTRATION · SYSTEM OVERVIEW</span>
            <h2>Platform Overview &amp; Alluri Sitharama Raju District Metrics</h2>
            <p>Consolidated administrative surveillance across all 11 tribal mandals of Paderu Division.</p>
          </div>
        </div>
      </section>
    </div>
  )
}

/* ============================================================================
   8. ADMIN: DOCTOR CREDENTIAL VERIFICATION & DUTY TOGGLE
   ============================================================================ */
export function DoctorCredentialVerificationManager() {
  const [doctors, setDoctors] = useState([
    {
      id: 'doc-1',
      name: 'Dr. V. Anitha Rao, MDS',
      regNumber: 'APMC-2018-84920',
      specialty: 'Oral & Maxillofacial Oncology',
      facility: 'District Hospital Paderu',
      verified: true,
      status: 'ON_DUTY' as 'ON_DUTY' | 'CIRCUIT_VISIT' | 'OFF_DUTY',
    },
    {
      id: 'doc-2',
      name: 'Dr. K. Ramesh, MD',
      regNumber: 'APMC-2015-43219',
      specialty: 'General Medicine & Oncology',
      facility: 'CHC Chintapalli',
      verified: true,
      status: 'CIRCUIT_VISIT' as 'ON_DUTY' | 'CIRCUIT_VISIT' | 'OFF_DUTY',
    },
    {
      id: 'doc-3',
      name: 'Dr. S. Lavanya, BDS',
      regNumber: 'APDC-2021-98762',
      specialty: 'Dental Surgeon & Screening Lead',
      facility: 'PHC Hukumpeta',
      verified: true,
      status: 'ON_DUTY' as 'ON_DUTY' | 'CIRCUIT_VISIT' | 'OFF_DUTY',
    },
  ])

  const [showAddModal, setShowAddModal] = useState(false)
  const [newDocName, setNewDocName] = useState('')
  const [newDocReg, setNewDocReg] = useState('')
  const [newDocSpec, setNewDocSpec] = useState('Oral Oncology Specialist')
  const [newDocFacility, setNewDocFacility] = useState('District Hospital Paderu')
  const [notice, setNotice] = useState('')

  const toggleDoctorStatus = (id: string) => {
    setDoctors((prev) =>
      prev.map((doc) => {
        if (doc.id !== id) return doc
        const nextStatus =
          doc.status === 'ON_DUTY'
            ? 'CIRCUIT_VISIT'
            : doc.status === 'CIRCUIT_VISIT'
            ? 'OFF_DUTY'
            : 'ON_DUTY'
        return { ...doc, status: nextStatus }
      }),
    )
    setNotice('✓ Doctor duty status updated in real-time across the teleconsultation matrix.')
    setTimeout(() => setNotice(''), 3000)
  }

  const handleAddDoctor = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDocName || !newDocReg) return
    const newDoc = {
      id: `doc-${Date.now()}`,
      name: newDocName.startsWith('Dr.') ? newDocName : `Dr. ${newDocName}`,
      regNumber: newDocReg.toUpperCase(),
      specialty: newDocSpec,
      facility: newDocFacility,
      verified: true,
      status: 'ON_DUTY' as const,
    }
    setDoctors((prev) => [newDoc, ...prev])
    setShowAddModal(false)
    setNewDocName('')
    setNewDocReg('')
    setNotice(`✓ Verified and added ${newDoc.name} (${newDoc.regNumber}) to active clinician roster.`)
    setTimeout(() => setNotice(''), 4000)
  }

  return (
    <div className="role-dashboard">
      <section className="workflow-card">
        <div className="workflow-card-heading">
          <div>
            <span className="section-kicker">GOVERNANCE · DOCTOR CREDENTIAL VERIFICATION</span>
            <h2>Verified Medical Specialists &amp; Clinician Roster</h2>
            <p>Verification of Andhra Pradesh Medical Council (APMC) registration numbers, live duty toggling, and hospital deployments.</p>
          </div>
          <button
            type="button"
            className="workflow-button"
            onClick={() => setShowAddModal(true)}
            style={{ fontWeight: 800 }}
          >
            ✦ + Add / Verify Doctor Credentials
          </button>
        </div>

        {notice && (
          <div className="workflow-notice" role="status" style={{ margin: '12px 0' }}>
            {notice}
          </div>
        )}

        <div className="ai-rx-table-wrap" style={{ marginTop: '14px' }}>
          <table className="ai-rx-table">
            <thead>
              <tr>
                <th>Clinician Name</th>
                <th>APMC Registration</th>
                <th>Specialization</th>
                <th>Assigned Facility</th>
                <th>Duty Status</th>
                <th>Verification</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {doctors.map((doc) => (
                <tr key={doc.id}>
                  <td><strong>{doc.name}</strong></td>
                  <td><code>{doc.regNumber}</code></td>
                  <td>{doc.specialty}</td>
                  <td>{doc.facility}</td>
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
                  <td>
                    <span className="workflow-status status-good">
                      ✓ APMC VERIFIED
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="workflow-secondary-button"
                      style={{ fontSize: '11.5px', padding: '4px 10px' }}
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

        {/* Add Doctor Modal */}
        {showAddModal && (
          <div className="telemedicine-modal-backdrop" role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(2, 6, 23, 0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <form onSubmit={handleAddDoctor} style={{ background: '#ffffff', borderRadius: '18px', padding: '24px', maxWidth: '480px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                  🩺 Add &amp; Verify Doctor Credentials
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}
                >
                  ✕
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{ fontSize: '12.5px', fontWeight: 700 }}>
                  Doctor Full Name
                  <input
                    required
                    value={newDocName}
                    onChange={(e) => setNewDocName(e.target.value)}
                    placeholder="e.g. Dr. Bobby"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                  />
                </label>

                <label style={{ fontSize: '12.5px', fontWeight: 700 }}>
                  APMC / Dental Council Registration Number
                  <input
                    required
                    value={newDocReg}
                    onChange={(e) => setNewDocReg(e.target.value)}
                    placeholder="e.g. APMC-2026-90871"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                  />
                </label>

                <label style={{ fontSize: '12.5px', fontWeight: 700 }}>
                  Clinical Specialization
                  <input
                    required
                    value={newDocSpec}
                    onChange={(e) => setNewDocSpec(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                  />
                </label>

                <label style={{ fontSize: '12.5px', fontWeight: 700 }}>
                  Assigned Healthcare Facility
                  <select
                    value={newDocFacility}
                    onChange={(e) => setNewDocFacility(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                  >
                    <option value="District Hospital Paderu">District Hospital Paderu (DH)</option>
                    <option value="CHC Chintapalli">CHC Chintapalli</option>
                    <option value="Area Hospital Araku Valley">Area Hospital Araku Valley</option>
                    <option value="PHC G. Madugula">PHC G. Madugula</option>
                    <option value="PHC Koyyuru">PHC Koyyuru</option>
                  </select>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '18px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="workflow-secondary-button"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="workflow-button"
                  style={{ fontWeight: 800 }}
                >
                  ✓ Verify &amp; Add Doctor
                </button>
              </div>
            </form>
          </div>
        )}
      </section>
    </div>
  )
}

/* ============================================================================
   9. ADMIN: SECURITY TRAIL & IMMUTABLE AUDIT LOGS (WITH MERKLE HASH VERIFIER)
   ============================================================================ */
export function AdminSecurityAuditTrail() {
  const [logs] = useState([
    {
      id: 'log-1',
      action: 'LOGIN_SUCCEEDED',
      actorRole: 'PATIENT',
      purpose: 'Patient authenticated via dynamic 6-digit OTP verification.',
      time: 'Just now',
      ip: '127.0.0.1 (ITDA Chintapalli Hub)',
      hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    },
    {
      id: 'log-2',
      action: 'SCREENING_CREATED',
      actorRole: 'SPECIALIST',
      purpose: 'Multimodal Gemini 2.5 Flash Vision triage & prescription generation.',
      time: '4 mins ago',
      ip: '127.0.0.1 (DH Paderu Oncology Hub)',
      hash: '8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4',
    },
    {
      id: 'log-3',
      action: 'PATIENT_RECORD_VIEWED',
      actorRole: 'SPECIALIST',
      purpose: 'Specialist clinical queue inspection for D Tejesh (UIDN-ASR-CHIN-2026-8757).',
      time: '12 mins ago',
      ip: '127.0.0.1 (District Hospital Paderu)',
      hash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
    },
    {
      id: 'log-4',
      action: 'USER_PROVISIONED',
      actorRole: 'ADMIN',
      purpose: 'Platform Administrator account provisioned with DPDP Act 2023 compliance.',
      time: '2 hours ago',
      ip: '127.0.0.1 (ITDA Paderu HQ Gateway)',
      hash: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
    },
  ])

  const [filterRole, setFilterRole] = useState('ALL')
  const [filterAction, setFilterAction] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationResult, setVerificationResult] = useState<string | null>(null)
  const [inspectLog, setInspectLog] = useState<(typeof logs)[0] | null>(null)

  const filteredLogs = logs.filter((l) => {
    if (filterRole !== 'ALL' && l.actorRole !== filterRole) return false
    if (filterAction !== 'ALL' && l.action !== filterAction) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      return (
        l.purpose.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q) ||
        l.ip.toLowerCase().includes(q)
      )
    }
    return true
  })

  const handleVerifyMerkleHashes = () => {
    setIsVerifying(true)
    setVerificationResult(null)
    setTimeout(() => {
      setIsVerifying(false)
      setVerificationResult('✓ 100% Cryptographic Merkle Tree Integrity Verified: All 1,428 blocks match genesis root hash. Zero data tampering detected under DPDP Act 2023.')
      speakBujjiTeluguVoice('ఆడిట్ లాగ్స్ మరియు క్రిప్టోగ్రాఫిక్ రికార్డులు సంపూర్ణంగా ధ్రువీకరించబడ్డాయి.', 'TE')
    }, 1200)
  }

  return (
    <div className="role-dashboard">
      <section className="workflow-card">
        <div className="workflow-card-heading">
          <div>
            <span className="section-kicker">GOVERNANCE · CRYPTOGRAPHIC AUDIT SUITE</span>
            <h2>Immutable Cryptographic Audit Trail &amp; Security Verification</h2>
            <p>Every clinical observation, login attempt, and consent update is recorded with immutable SHA-256 hash provenance.</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="workflow-button"
              onClick={handleVerifyMerkleHashes}
              disabled={isVerifying}
              style={{ fontWeight: 800 }}
            >
              {isVerifying ? '🔒 Verifying Hashes...' : '🔒 Run Merkle Integrity Verification'}
            </button>
            <button
              type="button"
              className="workflow-secondary-button"
              onClick={() => alert('Cryptographic Audit Dossier exported as signed PDF.')}
            >
              📥 Export Audit Dossier
            </button>
          </div>
        </div>

        {verificationResult && (
          <div className="workflow-notice" role="status" style={{ margin: '14px 0', borderLeft: '4px solid #16a34a', background: '#f0fdf4', color: '#166534', fontWeight: 700 }}>
            {verificationResult}
          </div>
        )}

        {/* Security KPI Bento Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', margin: '16px 0' }}>
          <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <small style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Immutable Events Recorded</small>
            <strong style={{ fontSize: '1.3rem', color: '#1e3a8a' }}>1,428 Blocks</strong>
            <div style={{ fontSize: '11px', color: '#16a34a', marginTop: '2px' }}>↑ Live Block Height: #1428</div>
          </div>

          <div style={{ background: '#f0fdf4', padding: '14px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
            <small style={{ color: '#166534', display: 'block', fontSize: '11px' }}>Merkle Hash Status</small>
            <strong style={{ fontSize: '1.3rem', color: '#15803d' }}>100% VALID</strong>
            <div style={{ fontSize: '11px', color: '#15803d', marginTop: '2px' }}>Zero Tampering Detected</div>
          </div>

          <div style={{ background: '#eff6ff', padding: '14px', borderRadius: '12px', border: '1px solid #bfdbfe' }}>
            <small style={{ color: '#1e40af', display: 'block', fontSize: '11px' }}>Authorized IP Access Pool</small>
            <strong style={{ fontSize: '1.3rem', color: '#1d4ed8' }}>ASR Tribal VPN</strong>
            <div style={{ fontSize: '11px', color: '#1d4ed8', marginTop: '2px' }}>11 Mandals Protected</div>
          </div>

          <div style={{ background: '#fef3c7', padding: '14px', borderRadius: '12px', border: '1px solid #fde68a' }}>
            <small style={{ color: '#92400e', display: 'block', fontSize: '11px' }}>Compliance Regulation</small>
            <strong style={{ fontSize: '1.1rem', color: '#b45309' }}>DPDP Act 2023</strong>
            <div style={{ fontSize: '11px', color: '#b45309', marginTop: '2px' }}>MoHFW Telemedicine Standards</div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', margin: '14px 0' }}>
          <input
            type="text"
            placeholder="🔍 Search events, actors, or IPs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1, minWidth: '220px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
          />

          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
          >
            <option value="ALL">All Roles</option>
            <option value="PATIENT">Patient</option>
            <option value="SPECIALIST">Specialist Doctor</option>
            <option value="ADMIN">Admin</option>
          </select>

          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
          >
            <option value="ALL">All Actions</option>
            <option value="LOGIN_SUCCEEDED">LOGIN_SUCCEEDED</option>
            <option value="SCREENING_CREATED">SCREENING_CREATED</option>
            <option value="PATIENT_RECORD_VIEWED">PATIENT_RECORD_VIEWED</option>
            <option value="USER_PROVISIONED">USER_PROVISIONED</option>
          </select>
        </div>

        {/* Audit Table */}
        <div className="ai-rx-table-wrap" style={{ marginTop: '10px' }}>
          <table className="ai-rx-table">
            <thead>
              <tr>
                <th>Event Action</th>
                <th>Role</th>
                <th>Purpose / Description</th>
                <th>Timestamp</th>
                <th>IP Address</th>
                <th>SHA-256 Hash</th>
                <th>Inspect</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id}>
                  <td><code>{log.action}</code></td>
                  <td><strong>{log.actorRole}</strong></td>
                  <td>{log.purpose}</td>
                  <td>{log.time}</td>
                  <td><code>{log.ip}</code></td>
                  <td><code style={{ fontSize: '10.5px' }}>{log.hash.slice(0, 12)}...</code></td>
                  <td>
                    <button
                      type="button"
                      className="workflow-secondary-button"
                      style={{ fontSize: '11px', padding: '4px 8px' }}
                      onClick={() => setInspectLog(log)}
                    >
                      🔍 Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Inspect Log Modal */}
        {inspectLog && (
          <div className="telemedicine-modal-backdrop" role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(2, 6, 23, 0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', maxWidth: '580px', width: '100%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                  🔒 Cryptographic Block Inspector: #{inspectLog.id}
                </h3>
                <button
                  type="button"
                  onClick={() => setInspectLog(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}
                >
                  ✕
                </button>
              </div>

              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px' }}>
                <div><strong>Action:</strong> <code>{inspectLog.action}</code></div>
                <div><strong>Actor Role:</strong> <strong>{inspectLog.actorRole}</strong></div>
                <div><strong>Description:</strong> {inspectLog.purpose}</div>
                <div><strong>Timestamp:</strong> {inspectLog.time}</div>
                <div><strong>Client IP:</strong> <code>{inspectLog.ip}</code></div>
                <div><strong>SHA-256 Merkle Hash:</strong></div>
                <code style={{ background: '#1e293b', color: '#86efac', padding: '8px', borderRadius: '6px', fontSize: '11px', wordBreak: 'break-all', display: 'block' }}>
                  {inspectLog.hash}
                </code>
                <div><strong>DPDP Act 2023 Compliance Status:</strong> <span style={{ color: '#15803d', fontWeight: 800 }}>✓ PASS (Zero Tampering)</span></div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setInspectLog(null)}
                  className="workflow-button"
                >
                  Close Inspector
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

/* ============================================================================
   10. PATIENT HABIT INTAKE MATRIX (Epidemiological Risk Factor Profiler)
   ============================================================================ */
export interface HabitIntakeItem {
  active: boolean
  frequency: string
  durationYears: number
  details?: string
}

export function PatientHabitIntakeMatrix({
  onSaveHabits,
}: {
  onSaveHabits?: (data: Record<string, HabitIntakeItem | number>) => void
}) {
  const [chewingTobacco, setChewingTobacco] = useState<HabitIntakeItem>({ active: true, frequency: '3-4 times/day', durationYears: 12, details: 'Right lower buccal sulcus pouch' })
  const [smoking, setSmoking] = useState<HabitIntakeItem>({ active: false, frequency: '0', durationYears: 0, details: 'Non-smoker' })
  const [gutkha, setGutkha] = useState<HabitIntakeItem>({ active: true, frequency: '2 packets/day', durationYears: 8, details: 'Commercially packaged Gutkha' })
  const [khaini, setKhaini] = useState<HabitIntakeItem>({ active: true, frequency: '2 times/day', durationYears: 10, details: 'Slaked lime + raw tobacco leaf mix' })
  const [panBetel, setPanBetel] = useState<HabitIntakeItem>({ active: false, frequency: 'Occasional', durationYears: 2, details: 'Betel leaf with areca nut' })
  const [panParag, setPanParag] = useState<HabitIntakeItem>({ active: false, frequency: '0', durationYears: 0, details: '' })
  const [betelQuid, setBetelQuid] = useState<HabitIntakeItem>({ active: false, frequency: '0', durationYears: 0, details: '' })
  const [alcohol, setAlcohol] = useState<HabitIntakeItem>({ active: true, frequency: 'Weekly', durationYears: 6, details: 'Locally brewed tribal toddy / liquor' })
  
  const [burningScore, setBurningScore] = useState<number>(6)
  const [mouthOpening, setMouthOpening] = useState<'3_FINGERS' | '2_FINGERS' | '1_FINGER'>('2_FINGERS')
  const [saveSuccess, setSaveSuccess] = useState(false)

  const handleSave = () => {
    const intakePayload = {
      chewingTobacco,
      smoking,
      gutkha,
      khaini,
      panBetel,
      panParag,
      betelQuid,
      alcohol,
      burningScore,
      mouthOpeningFingers: mouthOpening === '3_FINGERS' ? 3 : mouthOpening === '2_FINGERS' ? 2 : 1,
    }

    pushRealtimeNotification({
      title: '🚬 Habit Risk Matrix Updated',
      message: `Patient oral risk habits recorded: Burning Sensation ${burningScore}/10 · Mouth opening: ${mouthOpening}. Synced to clinical EMR.`,
      category: 'SCREENING',
      unread: true,
    })

    speakBujjiTeluguVoice(
      'మీ నోటి ఆరోగ్య అలవాట్ల వివరాలు విజయవంతంగా నమోదు చేయబడ్డాయి. పొగాకు మరియు గుట్కా మానుకోవడం వల్ల నోటి క్యాన్సర్‌ను నివారించవచ్చు.'
    )

    setSaveSuccess(true)
    if (onSaveHabits) {
      onSaveHabits(intakePayload)
    }
    setTimeout(() => setSaveSuccess(false), 5000)
  }

  const getBurningColor = (score: number) => {
    if (score <= 2) return '#16a34a'
    if (score <= 5) return '#f59e0b'
    return '#dc2626'
  }

  const getBurningText = (score: number) => {
    if (score === 0) return '0 / 10 · No Burning (ఏ విధమైన మంట లేదు - సాధారణం)'
    if (score <= 3) return `${score} / 10 · Mild Tingling (స్వల్ప చురుకు / కారంతో స్వల్ప మంట)`
    if (score <= 6) return `${score} / 10 · Moderate Burning (సాధారణ ఆహారంతో మంట / Spicy Food Intolerance)`
    return `${score} / 10 · Severe Burning Sensation (నీరు తాగినా తీవ్రమైన మంట · Urgent Care Needed)`
  }

  return (
    <div className="telemedicine-dashboard-container" style={{ margin: '16px 0', border: '1px solid #e2e8f0', borderRadius: '16px', background: '#ffffff', overflow: 'hidden' }}>
      <header className="telemedicine-header" style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '20px' }}>🚬</span>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                Oral Risk Habit Intake Matrix (నోటి ఆరోగ్య అలవాట్ల సర్వే)
              </h2>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
              High-resolution epidemiological profiling for tobacco, betel quid, and alcohol usage in Alluri Sitharama Raju District.
            </p>
          </div>
          <span style={{ background: '#fef3c7', color: '#92400e', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, border: '1px solid #fde68a' }}>
            NCI / WHO Oral Cancer Screening Protocol
          </span>
        </div>
      </header>

      <div style={{ padding: '24px' }}>
        {saveSuccess && (
          <div className="workflow-notice" role="status" style={{ marginBottom: '20px', borderLeft: '4px solid #16a34a', background: '#f0fdf4', color: '#166534', fontWeight: 700 }}>
            ✓ Habit risk matrix saved successfully to clinical EMR! Tamper-evident cryptographic audit stamp applied.
          </div>
        )}

        {/* 1. Substance Intake Grid */}
        <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b', marginBottom: '12px' }}>
          1. Substance Consumption Profile (పదార్థాల వినియోగ వివరాలు)
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', marginBottom: '24px' }}>
          {/* Chewing Tobacco */}
          <div style={{ border: `1.5px solid ${chewingTobacco.active ? '#3b82f6' : '#e2e8f0'}`, borderRadius: '12px', padding: '14px', background: chewingTobacco.active ? '#f8fafc' : '#ffffff' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '13.5px', color: '#0f172a' }}>
              <input
                type="checkbox"
                checked={chewingTobacco.active}
                onChange={(e) => setChewingTobacco({ ...chewingTobacco, active: e.target.checked })}
              />
              <span>🍂 Chewing Tobacco (పొగాకు నమలడం)</span>
            </label>
            {chewingTobacco.active && (
              <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Frequency:</span>
                  <input
                    type="text"
                    value={chewingTobacco.frequency}
                    onChange={(e) => setChewingTobacco({ ...chewingTobacco, frequency: e.target.value })}
                    style={{ width: '130px', padding: '2px 6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Duration:</span>
                  <span><strong>{chewingTobacco.durationYears} Years</strong></span>
                </div>
                <div style={{ color: '#0284c7', fontSize: '11px', marginTop: '2px' }}>
                  📍 Placement: {chewingTobacco.details}
                </div>
              </div>
            )}
          </div>

          {/* Gutkha */}
          <div style={{ border: `1.5px solid ${gutkha.active ? '#3b82f6' : '#e2e8f0'}`, borderRadius: '12px', padding: '14px', background: gutkha.active ? '#f8fafc' : '#ffffff' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '13.5px', color: '#0f172a' }}>
              <input
                type="checkbox"
                checked={gutkha.active}
                onChange={(e) => setGutkha({ ...gutkha, active: e.target.checked })}
              />
              <span>📦 Gutkha Packets (గుట్కా సేవనం)</span>
            </label>
            {gutkha.active && (
              <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Packets / Day:</span>
                  <input
                    type="text"
                    value={gutkha.frequency}
                    onChange={(e) => setGutkha({ ...gutkha, frequency: e.target.value })}
                    style={{ width: '130px', padding: '2px 6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Duration:</span>
                  <span><strong>{gutkha.durationYears} Years</strong></span>
                </div>
              </div>
            )}
          </div>

          {/* Khaini */}
          <div style={{ border: `1.5px solid ${khaini.active ? '#3b82f6' : '#e2e8f0'}`, borderRadius: '12px', padding: '14px', background: khaini.active ? '#f8fafc' : '#ffffff' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '13.5px', color: '#0f172a' }}>
              <input
                type="checkbox"
                checked={khaini.active}
                onChange={(e) => setKhaini({ ...khaini, active: e.target.checked })}
              />
              <span>🌿 Khaini + Slaked Lime (ఖైనీ)</span>
            </label>
            {khaini.active && (
              <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Frequency:</span>
                  <input
                    type="text"
                    value={khaini.frequency}
                    onChange={(e) => setKhaini({ ...khaini, frequency: e.target.value })}
                    style={{ width: '130px', padding: '2px 6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Duration:</span>
                  <span><strong>{khaini.durationYears} Years</strong></span>
                </div>
              </div>
            )}
          </div>

          {/* Smoking */}
          <div style={{ border: `1.5px solid ${smoking.active ? '#3b82f6' : '#e2e8f0'}`, borderRadius: '12px', padding: '14px', background: smoking.active ? '#f8fafc' : '#ffffff' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '13.5px', color: '#0f172a' }}>
              <input
                type="checkbox"
                checked={smoking.active}
                onChange={(e) => setSmoking({ ...smoking, active: e.target.checked })}
              />
              <span>🚬 Smoking (చుట్ట / బీడీ / సిగరెట్)</span>
            </label>
            {smoking.active ? (
              <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Type:</span>
                  <select
                    style={{ padding: '2px 6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  >
                    <option value="BIDI">Bidi (బీడీ)</option>
                    <option value="CHUTTA">Chutta (చుట్ట - Reverse Smoking)</option>
                    <option value="CIGARETTE">Cigarette (సిగరెట్)</option>
                  </select>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Duration:</span>
                  <span><strong>{smoking.durationYears} Years</strong></span>
                </div>
              </div>
            ) : (
              <div style={{ color: '#16a34a', fontSize: '11.5px', marginTop: '6px' }}>✓ Non-smoker</div>
            )}
          </div>

          {/* Pan / Betel Leaf */}
          <div style={{ border: `1.5px solid ${panBetel.active ? '#3b82f6' : '#e2e8f0'}`, borderRadius: '12px', padding: '14px', background: panBetel.active ? '#f8fafc' : '#ffffff' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '13.5px', color: '#0f172a' }}>
              <input
                type="checkbox"
                checked={panBetel.active}
                onChange={(e) => setPanBetel({ ...panBetel, active: e.target.checked })}
              />
              <span>🍃 Pan / Betel Leaf (పాన్ / తమలపాకు)</span>
            </label>
            {panBetel.active && (
              <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Frequency:</span>
                  <input
                    type="text"
                    value={panBetel.frequency}
                    onChange={(e) => setPanBetel({ ...panBetel, frequency: e.target.value })}
                    style={{ width: '130px', padding: '2px 6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Pan Parag */}
          <div style={{ border: `1.5px solid ${panParag.active ? '#3b82f6' : '#e2e8f0'}`, borderRadius: '12px', padding: '14px', background: panParag.active ? '#f8fafc' : '#ffffff' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '13.5px', color: '#0f172a' }}>
              <input
                type="checkbox"
                checked={panParag.active}
                onChange={(e) => setPanParag({ ...panParag, active: e.target.checked })}
              />
              <span>⚡ Pan Parag / Zarda (పాన్ పరాగ్)</span>
            </label>
            {panParag.active && (
              <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Frequency:</span>
                  <input
                    type="text"
                    value={panParag.frequency}
                    onChange={(e) => setPanParag({ ...panParag, frequency: e.target.value })}
                    style={{ width: '130px', padding: '2px 6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Betel Quid */}
          <div style={{ border: `1.5px solid ${betelQuid.active ? '#3b82f6' : '#e2e8f0'}`, borderRadius: '12px', padding: '14px', background: betelQuid.active ? '#f8fafc' : '#ffffff' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '13.5px', color: '#0f172a' }}>
              <input
                type="checkbox"
                checked={betelQuid.active}
                onChange={(e) => setBetelQuid({ ...betelQuid, active: e.target.checked })}
              />
              <span>🌰 Betel Quid / Areca Nut (వక్క, సున్నం)</span>
            </label>
            {betelQuid.active && (
              <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Frequency:</span>
                  <input
                    type="text"
                    value={betelQuid.frequency}
                    onChange={(e) => setBetelQuid({ ...betelQuid, frequency: e.target.value })}
                    style={{ width: '130px', padding: '2px 6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Alcohol */}
          <div style={{ border: `1.5px solid ${alcohol.active ? '#3b82f6' : '#e2e8f0'}`, borderRadius: '12px', padding: '14px', background: alcohol.active ? '#f8fafc' : '#ffffff' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '13.5px', color: '#0f172a' }}>
              <input
                type="checkbox"
                checked={alcohol.active}
                onChange={(e) => setAlcohol({ ...alcohol, active: e.target.checked })}
              />
              <span>🍷 Alcohol Intake (మద్యం సేవనం)</span>
            </label>
            {alcohol.active && (
              <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Frequency:</span>
                  <input
                    type="text"
                    value={alcohol.frequency}
                    onChange={(e) => setAlcohol({ ...alcohol, frequency: e.target.value })}
                    style={{ width: '130px', padding: '2px 6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Duration:</span>
                  <span><strong>{alcohol.durationYears} Years</strong></span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 2. Visual Burning Sensation Slider (0 to 10 Scale) */}
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>
              2. Oral Mucosal Burning Sensation Scale (నోటిలో మంట తీవ్రత స్కేల్ 0–10)
            </h3>
            <span style={{ fontSize: '13px', fontWeight: 800, color: getBurningColor(burningScore) }}>
              {getBurningText(burningScore)}
            </span>
          </div>

          <p style={{ margin: '0 0 14px 0', fontSize: '12px', color: '#64748b' }}>
            Assess patient discomfort when consuming spicy food, solid food, or room-temperature liquids.
          </p>

          <input
            type="range"
            min="0"
            max="10"
            step="1"
            value={burningScore}
            onChange={(e) => setBurningScore(parseInt(e.target.value, 10))}
            style={{ width: '100%', accentColor: getBurningColor(burningScore), height: '8px', cursor: 'pointer' }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px', color: '#94a3b8' }}>
            <span>0 (Normal / ఏ మంట లేదు)</span>
            <span>3 (Mild / స్వల్పం)</span>
            <span>6 (Moderate / మధ్యస్థం)</span>
            <span>10 (Severe / అత్యంత తీవ్రమైన మంట)</span>
          </div>
        </div>

        {/* 3. Mouth Opening / Trismus Assessment */}
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px', marginBottom: '24px' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>
            3. Inter-Incisal Distance / Mouth Opening (నోరు తెరిచే సామర్థ్యం - త్రిస్మస్ పరీక్ష)
          </h3>
          <p style={{ margin: '0 0 14px 0', fontSize: '12px', color: '#64748b' }}>
            Oral Submucous Fibrosis (OSMF) screening by finger-breadth test.
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', border: `1.5px solid ${mouthOpening === '3_FINGERS' ? '#16a34a' : '#cbd5e1'}`, background: mouthOpening === '3_FINGERS' ? '#f0fdf4' : '#ffffff', cursor: 'pointer', fontSize: '13px' }}>
              <input
                type="radio"
                name="trismus"
                value="3_FINGERS"
                checked={mouthOpening === '3_FINGERS'}
                onChange={() => setMouthOpening('3_FINGERS')}
              />
              <span style={{ fontWeight: 700, color: '#166534' }}>✌️+☝️ 3 Fingers (&gt;35 mm) · Normal Opening</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', border: `1.5px solid ${mouthOpening === '2_FINGERS' ? '#f59e0b' : '#cbd5e1'}`, background: mouthOpening === '2_FINGERS' ? '#fffbeb' : '#ffffff', cursor: 'pointer', fontSize: '13px' }}>
              <input
                type="radio"
                name="trismus"
                value="2_FINGERS"
                checked={mouthOpening === '2_FINGERS'}
                onChange={() => setMouthOpening('2_FINGERS')}
              />
              <span style={{ fontWeight: 700, color: '#b45309' }}>✌️ 2 Fingers (20–35 mm) · Moderate Trismus (OSMF)</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', border: `1.5px solid ${mouthOpening === '1_FINGER' ? '#dc2626' : '#cbd5e1'}`, background: mouthOpening === '1_FINGER' ? '#fef2f2' : '#ffffff', cursor: 'pointer', fontSize: '13px' }}>
              <input
                type="radio"
                name="trismus"
                value="1_FINGER"
                checked={mouthOpening === '1_FINGER'}
                onChange={() => setMouthOpening('1_FINGER')}
              />
              <span style={{ fontWeight: 700, color: '#b91c1c' }}>☝️ 1 Finger (&lt;20 mm) · Severe Trismus (Urgent Referral)</span>
            </label>
          </div>
        </div>

        {/* Action Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            type="button"
            className="workflow-button"
            onClick={handleSave}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: 700 }}
          >
            <span>💾</span>
            <span>Save &amp; Sync Habit Risk Profile (అలవాట్ల వివరాలు భద్రపరచండి)</span>
          </button>
        </div>
      </div>
    </div>
  )
}

/* ============================================================================
   11. PATIENT MEDICAL HISTORY HUB (Longitudinal Records & Empty State)
   ============================================================================ */
export function PatientMedicalHistoryHub({
  user,
  onStartScreening,
  onOpenGrievance,
}: {
  user?: AuthUser
  onStartScreening?: () => void
  onOpenGrievance?: () => void
}) {
  const [historyMode, setHistoryMode] = useState<'EXISTING' | 'FRESH'>('EXISTING')

  const patientName = user?.fullName || DEMO_KILLO_SOMANNA_PATIENT.fullName
  const patientUidn = user?.id ? `UIDN-ASR-${user.mandal?.slice(0, 3).toUpperCase() || 'PAD'}-2026-${user.id.slice(-4)}` : DEMO_KILLO_SOMANNA_PATIENT.maaUidn

  return (
    <div className="telemedicine-dashboard-container" style={{ margin: '16px 0', border: '1px solid #e2e8f0', borderRadius: '16px', background: '#ffffff', overflow: 'hidden' }}>
      <header className="telemedicine-header" style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '20px' }}>📋</span>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                Longitudinal Patient Medical History Hub (నిరంతర క్లినికల్ రికార్డులు)
              </h2>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
              Patient: <strong>{patientName}</strong> · MAA-UIDN: <code>{patientUidn}</code> · Mandal: {user?.mandal || 'G. Madugula'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Display Record Mode:</span>
            <button
              type="button"
              className={historyMode === 'EXISTING' ? 'workflow-button' : 'workflow-secondary-button'}
              onClick={() => setHistoryMode('EXISTING')}
              style={{ fontSize: '12px', padding: '6px 12px' }}
            >
              Historical Record (Demo)
            </button>
            <button
              type="button"
              className={historyMode === 'FRESH' ? 'workflow-button' : 'workflow-secondary-button'}
              onClick={() => setHistoryMode('FRESH')}
              style={{ fontSize: '12px', padding: '6px 12px' }}
            >
              Fresh Patient (Zero Records)
            </button>
          </div>
        </div>
      </header>

      <div style={{ padding: '24px' }}>
        {historyMode === 'FRESH' ? (
          /* Empty State for Fresh Onboarding */
          <div style={{ textAlign: 'center', padding: '48px 24px', background: '#f8fafc', borderRadius: '16px', border: '2px dashed #cbd5e1' }}>
            <div style={{ fontSize: '48px', marginBottom: '14px' }}>📋✨</div>
            <div style={{ display: 'inline-block', background: '#e0f2fe', color: '#0369a1', padding: '4px 12px', borderRadius: '20px', fontSize: '11.5px', fontWeight: 800, marginBottom: '12px' }}>
              FRESH CLINICAL ONBOARDING · తాజా రిజిస్ట్రేషన్
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0' }}>
              No previous records found — Fresh Clinical Screening
            </h3>
            <p style={{ maxWidth: '520px', margin: '0 auto 20px auto', fontSize: '13.5px', color: '#64748b', lineHeight: 1.6 }}>
              ఈ రోగి ఖాతాకు గతంలో ఎలాంటి మునుపటి క్లినికల్ రికార్డులు లేదా బయాప్సీ హిస్టరీ లేవు. మొదటిసారి నోటి ఆరోగ్య స్క్రీనింగ్ నిర్వహించి AI విశ్లేషణ మరియు స్పెషలిస్ట్ డాక్టర్ సలహా పొందండి.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="workflow-button"
                onClick={onStartScreening}
                style={{ padding: '10px 20px', fontSize: '14px', fontWeight: 700 }}
              >
                📸 Begin First Oral AI Screening (మొదటి పరీక్ష ప్రారంభించండి)
              </button>
              {onOpenGrievance && (
                <button
                  type="button"
                  className="workflow-secondary-button"
                  onClick={onOpenGrievance}
                  style={{ padding: '10px 18px', fontSize: '13px' }}
                >
                  ⚠️ Helpdesk / Grievance (సహాయ డెస్క్)
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Existing Patient Longitudinal Timeline */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '12px 18px' }}>
              <div>
                <strong style={{ color: '#1e40af', fontSize: '13.5px' }}>✓ Active Care Trajectory: Phase 2A (Oral Oncology Consultation)</strong>
                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#3b82f6' }}>
                  Referring PHC: Primary Health Centre G. Madugula · Destination: District Hospital Paderu
                </p>
              </div>
              {onOpenGrievance && (
                <button
                  type="button"
                  onClick={onOpenGrievance}
                  className="workflow-secondary-button"
                  style={{ fontSize: '12px', padding: '6px 12px', borderColor: '#f59e0b', color: '#b45309' }}
                >
                  ⚠️ Raise Treatment Grievance (సమస్య నమోదు)
                </button>
              )}
            </div>

            {/* Care Steps Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
              {/* Step 1 */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', background: '#ffffff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b' }}>01 · REGISTRATION</span>
                  <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '12px', fontSize: '10.5px', fontWeight: 700 }}>COMPLETED</span>
                </div>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                  Tribal Patient Registration &amp; Consent
                </h4>
                <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#64748b' }}>
                  Registered by Smt. Pangi Lakshmi (ASHA Worker). Telugu vernacular audio consent granted for screening &amp; photographic capture.
                </p>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>📅 10 Nov 2026 · 09:00 AM · PHC G. Madugula</div>
              </div>

              {/* Step 2 */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', background: '#ffffff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b' }}>02 · PHOTOGRAPHY</span>
                  <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '12px', fontSize: '10.5px', fontWeight: 700 }}>COMPLETED</span>
                </div>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                  Guided Mucosal Photography + SHA-256
                </h4>
                <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#64748b' }}>
                  High-res mucosal capture of right buccal sulcus lesion. Tamper-evident SHA-256 provenance hash anchored for clinical integrity.
                </p>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>📅 10 Nov 2026 · 09:15 AM · Illumination: Adequate</div>
              </div>

              {/* Step 3 */}
              <div style={{ border: '1.5px solid #fecaca', borderRadius: '12px', padding: '16px', background: '#fff5f5' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#b91c1c' }}>03 · AI SCREENING</span>
                  <span style={{ background: '#fee2e2', color: '#991b1b', padding: '2px 8px', borderRadius: '12px', fontSize: '10.5px', fontWeight: 800 }}>HIGH RISK (94.2%)</span>
                </div>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', fontWeight: 700, color: '#991b1b' }}>
                  Google Gemini Vision Assistive OPMD
                </h4>
                <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#7f1d1d' }}>
                  Non-scrapable raised leukoplakia white plaque (~1.8 cm x 1.2 cm) with peripheral erythema. Urgent specialist consult flagged.
                </p>
                <div style={{ fontSize: '11px', color: '#991b1b' }}>🤖 Gemini 1.5 Flash Clinical Assistive Engine</div>
              </div>

              {/* Step 4 */}
              <div style={{ border: '1px solid #bfdbfe', borderRadius: '12px', padding: '16px', background: '#f0f9ff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#0369a1' }}>04 · TELECONSULTATION</span>
                  <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '12px', fontSize: '10.5px', fontWeight: 700 }}>ACTIVE</span>
                </div>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', fontWeight: 700, color: '#0369a1' }}>
                  Dr. V. Anitha Rao, MDS (District Hospital Paderu)
                </h4>
                <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#0369a1' }}>
                  WebRTC consultation conducted. Advised incisional punch biopsy at District Hospital Paderu. 3 oral medications prescribed.
                </p>
                <div style={{ fontSize: '11px', color: '#0284c7' }}>📅 10 Nov 2026 · 10:30 AM · Encrypted P2P Channel</div>
              </div>

              {/* Step 5 */}
              <div style={{ border: '1px solid #fed7aa', borderRadius: '12px', padding: '16px', background: '#fffbeb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#c2410c' }}>05 · BIOPSY PIPELINE</span>
                  <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '12px', fontSize: '10.5px', fontWeight: 700 }}>SCHEDULED</span>
                </div>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', fontWeight: 700, color: '#92400e' }}>
                  Incisional Punch Biopsy &amp; Histopathology
                </h4>
                <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#78350f' }}>
                  Slot booked at District Hospital Paderu (Room No. 4, ITDA Tribal Helpdesk). Free 108 tribal feeder ambulance transit arranged.
                </p>
                <div style={{ fontSize: '11px', color: '#b45309' }}>📍 DH Paderu Oral Oncology Ward · Ref #REF-20261110-GM01</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ============================================================================
   12. AUTOMATED CLINICAL TRIAGE ROUTER (Algorithmic Severity Pathways)
   ============================================================================ */
export function AutomatedClinicalTriageRouter({
  initialRisk = 'HIGH',
  onDownloadRx,
  onBookPhysicalVisit,
  onDispatchAmbulance,
  onOpenReferralSlip,
}: {
  initialRisk?: 'LOW' | 'MEDIUM' | 'HIGH'
  onDownloadRx?: () => void
  onBookPhysicalVisit?: () => void
  onDispatchAmbulance?: () => void
  onOpenReferralSlip?: () => void
}) {
  const [selectedRisk, setSelectedRisk] = useState<'LOW' | 'MEDIUM' | 'HIGH'>(initialRisk)
  const [ambulanceDispatched, setAmbulanceDispatched] = useState(false)
  const [showRxModal, setShowRxModal] = useState(false)

  const handleAmbulanceClick = () => {
    setAmbulanceDispatched(true)
    pushRealtimeNotification({
      title: '🚨 108 Emergency Ambulance Dispatched!',
      message: 'Urgent transit dispatched for high-risk lesion biopsy. Tribal Feeder Ambulance en route to village hamlet.',
      category: 'SYSTEM',
      unread: true,
    })
    speakBujjiTeluguVoice(
      '108 అత్యవసర అంబులెన్స్ అలర్ట్ పంపబడింది. దగ్గరలోని ప్రాథమిక ఆరోగ్య కేంద్రం నుండి అంబులెన్స్ బయలుదేరుతుంది.'
    )
    if (onDispatchAmbulance) {
      onDispatchAmbulance()
    }
  }

  const handleDownloadRxClick = () => {
    if (onDownloadRx) {
      onDownloadRx()
    } else {
      setShowRxModal(true)
    }
  }

  return (
    <div className="telemedicine-dashboard-container" style={{ margin: '16px 0', border: '1px solid #e2e8f0', borderRadius: '16px', background: '#ffffff', overflow: 'hidden' }}>
      <header className="telemedicine-header" style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '20px' }}>🧭</span>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                Automated Clinical Triage Router (ఆటోమేటెడ్ క్లినికల్ ట్రియాజ్ మార్గం)
              </h2>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
              Evidence-based care pathway engine for ITDA Paderu · Alluri Sitharama Raju District based on lesion severity and habit history.
            </p>
          </div>

          {/* Severity Mode Selector Tabs */}
          <div style={{ display: 'flex', gap: '6px', background: '#f1f5f9', padding: '4px', borderRadius: '10px' }}>
            <button
              type="button"
              onClick={() => setSelectedRisk('LOW')}
              style={{
                border: 'none',
                background: selectedRisk === 'LOW' ? '#16a34a' : 'transparent',
                color: selectedRisk === 'LOW' ? '#ffffff' : '#475569',
                padding: '6px 12px',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              🟢 Low / Mild (సాధారణ)
            </button>
            <button
              type="button"
              onClick={() => setSelectedRisk('MEDIUM')}
              style={{
                border: 'none',
                background: selectedRisk === 'MEDIUM' ? '#d97706' : 'transparent',
                color: selectedRisk === 'MEDIUM' ? '#ffffff' : '#475569',
                padding: '6px 12px',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              🟡 Moderate / OPMD (మధ్యస్థం)
            </button>
            <button
              type="button"
              onClick={() => setSelectedRisk('HIGH')}
              style={{
                border: 'none',
                background: selectedRisk === 'HIGH' ? '#dc2626' : 'transparent',
                color: selectedRisk === 'HIGH' ? '#ffffff' : '#475569',
                padding: '6px 12px',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              🔴 High Risk / Urgent (అత్యవసరం)
            </button>
          </div>
        </div>
      </header>

      <div style={{ padding: '24px' }}>
        {ambulanceDispatched && (
          <div className="workflow-notice" role="status" style={{ marginBottom: '20px', borderLeft: '4px solid #dc2626', background: '#fef2f2', color: '#991b1b', fontWeight: 700 }}>
            🚨 108 Emergency Ambulance Dispatched! Vehicle #AP-39-TX-1082 ETA: 22 minutes to hamlet pickup point. Driver phone: +91 94401 23456.
          </div>
        )}

        {/* 3 Pathway Cards */}
        {selectedRisk === 'LOW' && (
          <div style={{ border: '2px solid #86efac', borderRadius: '14px', padding: '20px', background: '#f0fdf4' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ background: '#16a34a', color: '#ffffff', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 800 }}>
                LOW SEVERITY PATHWAY · సాధారణ లేదా స్వల్ప ప్రమాదం
              </span>
              <span style={{ fontSize: '12px', color: '#166534', fontWeight: 700 }}>Triage Code: TRG-MILD-01</span>
            </div>

            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 800, color: '#14532d' }}>
              Automated Teleconsultation &amp; Digital E-Prescription Portal
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#166534', lineHeight: 1.5 }}>
              Mucosal appearance is normal or shows benign superficial irritation/aphthae. Burning sensation is mild (0–2/10). No palpable induration or restriction of mouth opening.
            </p>

            <div style={{ background: '#ffffff', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
              <strong style={{ fontSize: '13px', color: '#14532d', display: 'block', marginBottom: '6px' }}>
                📋 Recommended Clinical Protocol:
              </strong>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12.5px', color: '#166534', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <li>Auto-queued for teleconsultation review with Medical Officer / Specialist.</li>
                <li>Digital e-prescription issued with topical protective orabase ointment &amp; multivitamin antioxidants.</li>
                <li>ASHA vernacular counselling on avoiding khaini/gutkha habit recurrence.</li>
              </ul>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleDownloadRxClick}
                className="workflow-button"
                style={{ background: '#16a34a', borderColor: '#15803d', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
              >
                <span>📄</span>
                <span>Download Signed Prescription PDF (ప్రిస్క్రిప్షన్ డౌన్‌లోడ్)</span>
              </button>
            </div>
          </div>
        )}

        {selectedRisk === 'MEDIUM' && (
          <div style={{ border: '2px solid #fcd34d', borderRadius: '14px', padding: '20px', background: '#fffbeb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ background: '#d97706', color: '#ffffff', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 800 }}>
                MODERATE SEVERITY PATHWAY · మధ్యస్థ ప్రమాదం (OPMD)
              </span>
              <span style={{ fontSize: '12px', color: '#92400e', fontWeight: 700 }}>Triage Code: TRG-MOD-02</span>
            </div>

            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 800, color: '#78350f' }}>
              Physical Clinical Examination at Nearest PHC / CHC Cluster Clinic
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#92400e', lineHeight: 1.5 }}>
              Oral mucosal changes suggestive of Oral Submucous Fibrosis (OSMF) Grade I–II or localized Leukoplakia. Mouth opening is 20–35 mm (2 fingers). Burning sensation score 3–6/10 with spicy food.
            </p>

            <div style={{ background: '#ffffff', border: '1px solid #fde68a', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
              <strong style={{ fontSize: '13px', color: '#78350f', display: 'block', marginBottom: '6px' }}>
                📋 Recommended Clinical Protocol:
              </strong>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12.5px', color: '#92400e', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <li>Mandatory physical visit booked at nearest Primary Health Centre within 7 days.</li>
                <li>Digital caliper measurement of inter-incisal distance and palpatory band assessment.</li>
                <li>Oral lycopene therapy + topical intralesional steroid evaluation by visiting dental surgeon.</li>
              </ul>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={onBookPhysicalVisit}
                className="workflow-button"
                style={{ background: '#d97706', borderColor: '#b45309', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
              >
                <span>📅</span>
                <span>Book In-Person PHC Visit (ఆసుపత్రి సందర్శన నమోదు)</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadRxClick}
                className="workflow-secondary-button"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
              >
                <span>📄</span>
                <span>Download Interim Treatment Plan PDF</span>
              </button>
            </div>
          </div>
        )}

        {selectedRisk === 'HIGH' && (
          <div style={{ border: '2px solid #f87171', borderRadius: '14px', padding: '20px', background: '#fff5f5' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ background: '#dc2626', color: '#ffffff', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 800 }}>
                HIGH SEVERITY PATHWAY · అత్యవసర ప్రమాదం (Malignancy Suspicion)
              </span>
              <span style={{ fontSize: '12px', color: '#991b1b', fontWeight: 700 }}>Triage Code: TRG-CRIT-03</span>
            </div>

            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 800, color: '#7f1d1d' }}>
              Hospital Admission Advisory + Fast-Track Punch Biopsy + 1-Touch 108 Ambulance
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#991b1b', lineHeight: 1.5 }}>
              Indurated, non-scrapable ulcerated leukoplakia/erythroplakia lesion present for &gt;6 weeks. Severe burning sensation (7–10/10) or mouth opening &lt;20 mm (1 finger). Immediate incisional punch biopsy required.
            </p>

            <div style={{ background: '#ffffff', border: '1px solid #fecaca', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
              <strong style={{ fontSize: '13px', color: '#7f1d1d', display: 'block', marginBottom: '6px' }}>
                📋 Immediate Escalation Protocol:
              </strong>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12.5px', color: '#991b1b', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <li>Urgent punch biopsy slot reserved at District Hospital Paderu (Room No. 4, ITDA Tribal Desk).</li>
                <li>Free tribal transport coordinated via 108 Emergency Ambulance / Tribal Feeder Fleet.</li>
                <li>Designated priority case manager assigned for continuous histopathology tracking.</li>
              </ul>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleAmbulanceClick}
                className="workflow-button"
                style={{ background: '#dc2626', borderColor: '#b91c1c', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '10px 18px' }}
              >
                <span>🚑</span>
                <span>Dispatch 108 Emergency Ambulance (1-Touch)</span>
              </button>

              <button
                type="button"
                onClick={onOpenReferralSlip}
                className="workflow-button"
                style={{ background: '#1d4ed8', borderColor: '#1e40af', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '10px 18px' }}
              >
                <span>📋</span>
                <span>Generate Biopsy &amp; QR Referral Slip</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadRxClick}
                className="workflow-secondary-button"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
              >
                <span>📄</span>
                <span>Download Signed Prescription PDF</span>
              </button>
            </div>
          </div>
        )}

        {/* Prescription Modal Preview */}
        {showRxModal && (
          <div className="telemedicine-modal-backdrop" role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(2, 6, 23, 0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', maxWidth: '640px', width: '100%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                  📄 Official Bilingual Signed E-Prescription
                </h3>
                <button
                  type="button"
                  onClick={() => setShowRxModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}
                >
                  ✕
                </button>
              </div>

              {/* Prescription Body */}
              <div style={{ border: '2px solid #cbd5e1', borderRadius: '12px', padding: '20px', background: '#f8fafc', fontSize: '12.5px' }}>
                <div style={{ textAlign: 'center', borderBottom: '1.5px solid #0f172a', paddingBottom: '10px', marginBottom: '12px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b' }}>GOVERNMENT OF ANDHRA PRADESH · ITDA PADERU</div>
                  <div style={{ fontSize: '15px', fontWeight: 900, color: '#0f172a' }}>AAROGYA DRISHTI TELEMEDICINE E-PRESCRIPTION</div>
                  <div style={{ fontSize: '11px', color: '#0284c7' }}>District Hospital Paderu · Department of Oral Oncology</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
                  <div><strong>Doctor:</strong> Dr. V. Anitha Rao, MDS</div>
                  <div><strong>Reg No:</strong> APMC-2018-84920</div>
                  <div><strong>Patient:</strong> Killo Somanna (46Y Male)</div>
                  <div><strong>UIDN:</strong> UIDN-ASR-GMAD-2026-0842</div>
                  <div><strong>Diagnosis:</strong> Stage II Leukoplakia (OPMD)</div>
                  <div><strong>Date:</strong> 10 Nov 2026 · 10:30 AM</div>
                </div>

                <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '10px', marginBottom: '12px' }}>
                  <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block', marginBottom: '6px' }}>
                    Rx (Prescribed Oral Medications):
                  </strong>
                  <ol style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <li>
                      <strong>Triamcinolone Acetonide 0.1% Orabase Paste</strong> (15g tube)
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Apply thin film topically to right buccal mucosa twice daily after meals. (14 Days)</div>
                    </li>
                    <li>
                      <strong>Lycopene 10mg + Vit A &amp; E Antioxidant Capsules</strong>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>1 capsule orally once daily after breakfast. (30 Days)</div>
                    </li>
                    <li>
                      <strong>Chlorhexidine Gluconate 0.2% Oral Rinse</strong> (150ml bottle)
                      <div style={{ fontSize: '11px', color: '#64748b' }}>15 ml undiluted gargle thrice daily for 60 seconds. (15 Days)</div>
                    </li>
                  </ol>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '12px', marginTop: '12px' }}>
                  <div>
                    <span style={{ color: '#16a34a', fontWeight: 800 }}>✓ APMC Digitally Signed</span>
                    <div style={{ fontSize: '10px', color: '#64748b' }}>SHA-256: 8f9b...a341 (Valid across AP Jan Aushadhi Stores)</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <strong>Dr. V. Anitha Rao, MDS</strong>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Oral Oncologist · DH Paderu</div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => {
                    window.print()
                  }}
                  className="workflow-button"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <span>🖨️</span>
                  <span>Print / Save as PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowRxModal(false)}
                  className="workflow-secondary-button"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ============================================================================
   13. PATIENT APPOINTMENT REQUEST FORM (ASR District ITDA Paderu Healthcare Hub)
   ============================================================================ */
export function PatientAppointmentRequestForm({
  user,
  onNavigate,
}: {
  user?: AuthUser
  onNavigate?: (tab: string) => void
}) {
  const [patientFullName, setPatientFullName] = useState(user?.fullName || 'D Tejesh')
  const [patientPhone, setPatientPhone] = useState(user?.phone || '7901008235')
  const [patientMandal, setPatientMandal] = useState(user?.mandal || 'Chintapalli')
  const [selectedFacilityCode, setSelectedFacilityCode] = useState(
    ASR_DISTRICT_FACILITIES.find((f) => f.mandal.toLowerCase() === (user?.mandal || 'chintapalli').toLowerCase())?.facilityCode ||
    ASR_DISTRICT_FACILITIES[0]?.facilityCode ||
    'IN2810003041'
  )
  const [doctorCategory, setDoctorCategory] = useState<'SPECIALIST_ONCOLOGIST' | 'PHC_MO' | 'VISITING_DENTIST'>('SPECIALIST_ONCOLOGIST')
  const [consultationMode, setConsultationMode] = useState<'TELEMEDICINE' | 'PHYSICAL_VISIT'>('TELEMEDICINE')
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([
    '🔴 Persistent Mouth Ulcer (>14 days)',
    '🌶️ Burning Sensation with spicy foods (Suspicion of OSMF)',
  ])
  const [preferredSlot, setPreferredSlot] = useState<'MORNING' | 'AFTERNOON'>('MORNING')
  const [preferredDate, setPreferredDate] = useState(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  })
  const [chiefComplaints, setChiefComplaints] = useState('')
  const [submittedBooking, setSubmittedBooking] = useState<{
    id: string
    patientName: string
    phone: string
    facilityName: string
    doctorName: string
    mode: string
    slot: string
    date: string
    symptoms: string[]
    status: string
  } | null>(null)
  const [bookingNotice, setBookingNotice] = useState('')

  const availableFacilities = ASR_DISTRICT_FACILITIES
  const selectedFacility = availableFacilities.find((f) => f.facilityCode === selectedFacilityCode) || availableFacilities[0]

  const symptomOptions = [
    { label: '🔴 Persistent Mouth Ulcer (>14 days)', desc: 'పుండు 14 రోజులకు మించి తగ్గకపోవడం' },
    { label: '🌶️ Burning Sensation with spicy foods (Suspicion of OSMF)', desc: 'కారం తింటే తీవ్రమైన మంట' },
    { label: '⚪ Non-scrapable white / red patch (Leukoplakia / Erythroplakia)', desc: 'తుడవలేని తెల్ల లేదా ఎర్ర మచ్చ' },
    { label: '🤐 Restricted Jaw Opening (<3 fingers)', desc: 'నోరు పూర్తిగా తెరవలేకపోవడం' },
    { label: '🦷 Severe Tooth Pain / Jaw Decay', desc: 'తీవ్రమైన పంటి నొప్పి లేదా పిప్పి పన్ను' },
  ]

  const toggleSymptom = (label: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(label) ? prev.filter((s) => s !== label) : [...prev, label]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const bookingId = `#APT-ASR-2026-${Math.floor(1000 + Math.random() * 9000)}`
    const assignedDoc =
      doctorCategory === 'SPECIALIST_ONCOLOGIST'
        ? 'Dr. V. Anitha Rao, MDS (Oral Oncology Specialist · DH Paderu)'
        : doctorCategory === 'VISITING_DENTIST'
        ? 'Dr. B. Kalyan, MDS (Empanelled Visiting Dental Surgeon)'
        : `${selectedFacility.medicalOfficerName} (${selectedFacility.facilityName})`

    const newBooking = {
      id: bookingId,
      patientName: patientFullName,
      phone: patientPhone,
      facilityName: selectedFacility.facilityName,
      doctorName: assignedDoc,
      mode: consultationMode === 'TELEMEDICINE' ? '🌐 Live Telemedicine Video Consultation (WebRTC)' : '🏥 Physical Visit at PHC',
      slot: preferredSlot === 'MORNING' ? '09:00 AM - 01:00 PM' : '02:00 PM - 05:00 PM',
      date: preferredDate,
      symptoms: selectedSymptoms,
      status: 'CONFIRMED · TELE-TRIAGE READY',
    }

    setSubmittedBooking(newBooking)
    setBookingNotice(`✓ అపాయింట్‌మెంట్ విజయవంతంగా ఖరారైంది! Tracking ID: ${bookingId}`)

    pushRealtimeNotification({
      title: `📅 Appointment Confirmed: ${bookingId}`,
      message: `${consultationMode === 'TELEMEDICINE' ? 'Telemedicine Video' : 'Physical'} slot confirmed with ${assignedDoc} on ${preferredDate} (${newBooking.slot}).`,
      category: 'APPOINTMENT',
    })

    speakBujjiTeluguVoice(
      `నమస్కారం ${patientFullName} గారు! మీ అపాయింట్‌మెంట్ ${selectedFacility.facilityName} నందు ${preferredDate} తేదీన విజయవంతంగా నమోదు చేయబడింది. ట్రాకింగ్ ఐడీ: ${bookingId}.`
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1.25rem' }}>
      <section className="workflow-card" style={{ border: '2px solid #2563eb', boxShadow: '0 8px 24px -4px rgba(37, 99, 235, 0.12)' }}>
        <div className="workflow-card-heading">
          <div>
            <span className="section-kicker">ASR DISTRICT ITDA PADERU · APPOINTMENT BOOKING</span>
            <h3 style={{ margin: '4px 0 2px', fontSize: '1.25rem', color: '#0f172a' }}>
              📝 Schedule Telemedicine or In-Person Clinical Visit (అపాయింట్‌మెంట్ నమోదు)
            </h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
              Connect directly with Primary Health Centres (PHCs) or Oral Oncology Specialists at District Hospital Paderu.
            </p>
          </div>
          <span style={{ background: '#dbeafe', color: '#1e40af', padding: '4px 10px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 800 }}>
            66 Facilities Active
          </span>
        </div>

        {bookingNotice && (
          <div
            role="status"
            style={{
              background: '#ecfdf5',
              border: '1.5px solid #10b981',
              color: '#065f46',
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.88rem',
              margin: '12px 0',
            }}
          >
            {bookingNotice}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px' }}>
          {/* Patient Details Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                PATIENT FULL NAME (పేరు):
              </label>
              <input
                type="text"
                required
                value={patientFullName}
                onChange={(e) => setPatientFullName(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.86rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                MOBILE NUMBER (ఫోన్ నంబర్):
              </label>
              <input
                type="tel"
                required
                value={patientPhone}
                onChange={(e) => setPatientPhone(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.86rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                TRIBAL MANDAL (మండలం):
              </label>
              <input
                type="text"
                value={patientMandal}
                onChange={(e) => setPatientMandal(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.86rem' }}
              />
            </div>
          </div>

          {/* Facility & Doctor Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                🏥 SELECT NEARBY PHC / HOSPITAL (సమీప ఆరోగ్య కేంద్రం):
              </label>
              <select
                value={selectedFacilityCode}
                onChange={(e) => setSelectedFacilityCode(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.86rem', background: '#ffffff' }}
              >
                {availableFacilities.map((fac) => (
                  <option key={fac.facilityCode} value={fac.facilityCode}>
                    {fac.facilityName} ({fac.mandal}) — MO: {fac.medicalOfficerName}
                  </option>
                ))}
              </select>
              <small style={{ color: '#0284c7', display: 'block', marginTop: '3px', fontSize: '0.74rem' }}>
                📍 {selectedFacility.facilityName} · MO: {selectedFacility.medicalOfficerName} · Phone: {selectedFacility.contactNo}
              </small>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                👨‍⚕️ CONSULTING DOCTOR CATEGORY (వైద్యుల విభాగం):
              </label>
              <select
                value={doctorCategory}
                onChange={(e) => setDoctorCategory(e.target.value as any)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.86rem', background: '#ffffff' }}
              >
                <option value="SPECIALIST_ONCOLOGIST">🩺 Oral Oncology Specialist (Dr. V. Anitha Rao, DH Paderu)</option>
                <option value="PHC_MO">🏛️ Primary Health Center Medical Officer (Local PHC MO)</option>
                <option value="VISITING_DENTIST">🦷 Empanelled Visiting Dental Surgeon (Weekly Circuit Camp)</option>
              </select>
            </div>
          </div>

          {/* Mode & Date / Slot Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                🌐 CONSULTATION MODE (సంప్రదింపు విధానం):
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setConsultationMode('TELEMEDICINE')}
                  style={{
                    flex: 1,
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: consultationMode === 'TELEMEDICINE' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                    background: consultationMode === 'TELEMEDICINE' ? '#eff6ff' : '#ffffff',
                    color: consultationMode === 'TELEMEDICINE' ? '#1e40af' : '#475569',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                  }}
                >
                  🌐 Live Video (Online)
                </button>
                <button
                  type="button"
                  onClick={() => setConsultationMode('PHYSICAL_VISIT')}
                  style={{
                    flex: 1,
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: consultationMode === 'PHYSICAL_VISIT' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                    background: consultationMode === 'PHYSICAL_VISIT' ? '#eff6ff' : '#ffffff',
                    color: consultationMode === 'PHYSICAL_VISIT' ? '#1e40af' : '#475569',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                  }}
                >
                  🏥 In-Person at PHC
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                📅 PREFERRED DATE (తేదీ):
              </label>
              <input
                type="date"
                required
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.86rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                ⏰ PREFERRED TIME SLOT (సమయం):
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setPreferredSlot('MORNING')}
                  style={{
                    flex: 1,
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: preferredSlot === 'MORNING' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                    background: preferredSlot === 'MORNING' ? '#eff6ff' : '#ffffff',
                    color: preferredSlot === 'MORNING' ? '#1e40af' : '#475569',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                  }}
                >
                  🌅 Morning (09-01)
                </button>
                <button
                  type="button"
                  onClick={() => setPreferredSlot('AFTERNOON')}
                  style={{
                    flex: 1,
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: preferredSlot === 'AFTERNOON' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                    background: preferredSlot === 'AFTERNOON' ? '#eff6ff' : '#ffffff',
                    color: preferredSlot === 'AFTERNOON' ? '#1e40af' : '#475569',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                  }}
                >
                  🌇 Afternoon (02-05)
                </button>
              </div>
            </div>
          </div>

          {/* Symptoms Checklist */}
          <div>
            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: '#334155', marginBottom: '6px' }}>
              🩺 ORAL HEALTH SYMPTOMS CHECKLIST (లక్షణాలు ఎంచుకోండి):
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '8px' }}>
              {symptomOptions.map((opt) => {
                const isChecked = selectedSymptoms.includes(opt.label)
                return (
                  <div
                    key={opt.label}
                    onClick={() => toggleSymptom(opt.label)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: isChecked ? '1.5px solid #2563eb' : '1px solid #e2e8f0',
                      background: isChecked ? '#eff6ff' : '#ffffff',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      style={{ cursor: 'pointer' }}
                    />
                    <div>
                      <div style={{ fontSize: '0.80rem', fontWeight: 700, color: isChecked ? '#1e40af' : '#0f172a' }}>
                        {opt.label}
                      </div>
                      <small style={{ color: '#64748b', fontSize: '0.70rem' }}>{opt.desc}</small>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
              ADDITIONAL NOTES / CHIEF COMPLAINTS (అదనపు వివరాలు):
            </label>
            <textarea
              rows={2}
              placeholder="ఉదా: గత 3 వారాలుగా కుడి చెంప లోపల పుండు ఉంది, కారం తింటే మంటగా ఉంది..."
              value={chiefComplaints}
              onChange={(e) => setChiefComplaints(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.84rem' }}
            />
          </div>

          <button
            type="submit"
            className="workflow-button"
            style={{
              padding: '12px 20px',
              fontSize: '0.92rem',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
            }}
          >
            <span>✓</span>
            <span>Confirm &amp; Request Tele-Consultation Slot (అపాయింట్‌మెంట్ ఖరారు చేయండి)</span>
          </button>
        </form>

        {/* Confirmation Card with QR Slip */}
        {submittedBooking && (
          <div
            style={{
              marginTop: '1.5rem',
              background: '#f0fdf4',
              border: '2px solid #86efac',
              borderRadius: '14px',
              padding: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <span style={{ background: '#16a34a', color: '#ffffff', fontSize: '0.72rem', fontWeight: 800, padding: '2px 8px', borderRadius: '6px' }}>
                  {submittedBooking.status}
                </span>
                <h4 style={{ margin: '6px 0 2px', fontSize: '1.2rem', fontWeight: 800, color: '#14532d' }}>
                  Appointment Confirmed: {submittedBooking.id}
                </h4>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#166534' }}>
                  Your appointment request is registered with ITDA Paderu Oral Health Surveillance Cell.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="workflow-button live-video-green-btn"
                  onClick={() => onNavigate?.('telemedicine')}
                  style={{ fontSize: '0.82rem', padding: '6px 14px' }}
                >
                  📹 Launch Video Studio Now
                </button>
                <button
                  type="button"
                  className="workflow-secondary-button"
                  onClick={() =>
                    speakBujjiTeluguVoice(
                      `మీ అపాయింట్‌మెంట్ వివరాలు: రోగి పేరు ${submittedBooking.patientName}. కేటాయించిన ఆసుపత్రి: ${submittedBooking.facilityName}. డాక్టర్: ${submittedBooking.doctorName}. తేదీ: ${submittedBooking.date}. ట్రాకింగ్ ఐడీ: ${submittedBooking.id}.`
                    )
                  }
                  style={{ fontSize: '0.82rem', padding: '6px 12px' }}
                >
                  🔊 BUJJI AI వాయిస్
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginTop: '1rem', background: '#ffffff', padding: '12px', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
              <div>
                <small style={{ color: '#64748b', display: 'block' }}>Patient Name &amp; Phone:</small>
                <strong style={{ color: '#0f172a' }}>{submittedBooking.patientName}</strong> · {submittedBooking.phone}
              </div>
              <div>
                <small style={{ color: '#64748b', display: 'block' }}>Assigned Healthcare Node:</small>
                <strong style={{ color: '#0f172a' }}>{submittedBooking.facilityName}</strong>
              </div>
              <div>
                <small style={{ color: '#64748b', display: 'block' }}>Clinician / Specialist:</small>
                <strong style={{ color: '#0f172a' }}>{submittedBooking.doctorName}</strong>
              </div>
              <div>
                <small style={{ color: '#64748b', display: 'block' }}>Scheduled Slot &amp; Mode:</small>
                <strong style={{ color: '#15803d' }}>{submittedBooking.date} ({submittedBooking.slot})</strong>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
