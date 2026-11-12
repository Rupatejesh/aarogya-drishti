import React, { useState } from 'react'
import { OralCavityHdVisual } from './OralCavityHdVisual'
import { speakBujjiTeluguVoice } from '../utils/bujjiVoiceEngine'

export interface OdontogramFinding {
  id: string
  siteType: 'TOOTH' | 'MUCOSA'
  code: string // e.g. "18" or "RIGHT_BUCCAL"
  locationLabel: string
  condition: 'LEUKOPLAKIA' | 'ERYTHROPLAKIA' | 'OSMF' | 'INDURATED_ULCER' | 'NORMAL'
  severity: 'MILD' | 'MODERATE' | 'SEVERE' | 'MALIGNANT_SUSPECT'
  notes: string
  timestamp: string
}

interface SpecialistDashboardProps {
  patientName?: string
  patientId?: string
  onOrderBiopsy?: () => void
  onOpenTelemedicine?: () => void
}

const CONDITION_CONFIG: Record<
  OdontogramFinding['condition'],
  { label: string; icon: string; color: string; bg: string; border: string; desc: string }
> = {
  LEUKOPLAKIA: {
    label: 'Leukoplakia (White Plaque)',
    icon: '⚪',
    color: '#1e293b',
    bg: '#f8fafc',
    border: '#94a3b8',
    desc: 'Non-scrapable homogeneous or speckled hyperkeratotic plaque. High-risk OPMD.',
  },
  ERYTHROPLAKIA: {
    label: 'Erythroplakia (Red Patch)',
    icon: '🔴',
    color: '#b91c1c',
    bg: '#fef2f2',
    border: '#f87171',
    desc: 'Fiery red velvety patch with marked epithelial dysplasia. Severe cancer risk.',
  },
  OSMF: {
    label: 'OSMF (Oral Submucous Fibrosis)',
    icon: '🟠',
    color: '#c2410c',
    bg: '#fff7ed',
    border: '#fb923c',
    desc: 'Vertical fibrous bands, mucosal blanching, restricted mouth opening (<25mm).',
  },
  INDURATED_ULCER: {
    label: 'Indurated Ulcer (OSCC Suspect)',
    icon: '🟣',
    color: '#6b21a8',
    bg: '#faf5ff',
    border: '#c084fc',
    desc: 'Non-healing ulcer with raised, everted edges and deep induration. Immediate biopsy.',
  },
  NORMAL: {
    label: 'Normal (Healthy Mucosa)',
    icon: '🟢',
    color: '#15803d',
    bg: '#f0fdf4',
    border: '#86efac',
    desc: 'Pink, moist, pliable mucosa without keratosis or submucosal tethering.',
  },
}

const MUCOSAL_REGIONS = [
  { id: 'RIGHT_BUCCAL', label: 'Right Buccal Mucosa (కుడి లోపలి చెంప)', tip: 'Common gutkha pouch site' },
  { id: 'LEFT_BUCCAL', label: 'Left Buccal Mucosa (ఎడమ లోపలి చెంప)', tip: 'Check elasticity and blanching' },
  { id: 'LATERAL_TONGUE', label: 'Lateral Tongue (నాలుక అంచు)', tip: 'High malignancy predilection site' },
  { id: 'PALATE', label: 'Hard & Soft Palate (అంగిలి)', tip: 'Reverse chutta smoking changes' },
  { id: 'FLOOR_OF_MOUTH', label: 'Floor of Mouth (నోటి అడుగు భాగం)', tip: 'High vascular absorption zone' },
  { id: 'LABIAL_MUCOSA', label: 'Labial Mucosa & Retromolar (పెదవి & దవడ)', tip: 'Check sulcus depth' },
]

export interface LongitudinalCaseRecord {
  id: string
  patientUidn: string
  patientName: string
  ageGender: string
  villageMandal: string
  originatingPhc: string
  diagnosis: string
  category: 'LEUKOPLAKIA' | 'OSMF' | 'ERYTHROPLAKIA' | 'BIOPSY'
  icd10: string
  geminiAiScore: string
  biopsyReport: string
  treatmentProtocol: string
  followUpStatus: string
  baselineDate: string
  followUpDate: string
  baselineLesionSize: string
  followUpLesionSize: string
  regressionPercent: string
  trismusImprovement: string
  baselineImageDescription: string
  followUpImageDescription: string
}

export const LONGITUDINAL_SPECIALIST_CASES: LongitudinalCaseRecord[] = [
  {
    id: 'CASE-ASR-2026-01',
    patientUidn: 'UIDN-ASR-GMAD-2026-0842',
    patientName: 'Killo Somanna',
    ageGender: '46Y Male',
    villageMandal: 'G. Madugula (ITDA Sector)',
    originatingPhc: 'PHC G. Madugula',
    diagnosis: 'Stage II Homogeneous Leukoplakia (OPMD)',
    category: 'LEUKOPLAKIA',
    icd10: 'K13.21',
    geminiAiScore: '94.2% Confidence (HIGH_RISK)',
    biopsyReport: 'Punch Biopsy: Mild Dysplasia with Hyperkeratosis. Tamper-evident SHA-256 Provenance verified.',
    treatmentProtocol: 'Triamcinolone Acetonide 0.1% Orabase Paste (BID) + Lycopene 10mg + Vit A & E Capsules (OD) x 30 Days. Strict habit cessation.',
    followUpStatus: 'Week 4 Review Complete · Marked Lesion Shrinkage',
    baselineDate: '10 Nov 2026',
    followUpDate: '08 Dec 2026',
    baselineLesionSize: '3.2 cm × 1.4 cm',
    followUpLesionSize: '1.4 cm × 0.6 cm',
    regressionPercent: '-56.2% Plaque Reduction',
    trismusImprovement: '+9 mm Mouth Opening Gain (24mm → 33mm)',
    baselineImageDescription: 'Thick non-scrapable chalky white plaque on right buccal mucosa with erythematous periphery adjacent to molars 46-48.',
    followUpImageDescription: 'Significant thinning of hyperkeratotic plaque, re-epithelialization of mucosal margins, softened buccal pliability.',
  },
  {
    id: 'CASE-ASR-2026-02',
    patientUidn: 'UIDN-ASR-KOYY-2026-8921',
    patientName: 'D. Rambabu',
    ageGender: '52Y Male',
    villageMandal: 'Koyyuru Agency',
    originatingPhc: 'PHC Koyyuru',
    diagnosis: 'Oral Submucous Fibrosis (OSMF Grade III)',
    category: 'OSMF',
    icd10: 'K13.5',
    geminiAiScore: '91.8% Confidence (HIGH_RISK)',
    biopsyReport: 'Incisional Biopsy: Dense hyalinized subepithelial collagen bands, chronic inflammatory infiltrate.',
    treatmentProtocol: 'Intralesional Dexamethasone (4mg) + Hyaluronidase (1500 IU) biweekly x 4 weeks + Oral Curcumin 500mg. Physiotherapy jaw exercise spatula wedge.',
    followUpStatus: 'Week 3 Review · Inter-Incisal Distance Improved',
    baselineDate: '02 Nov 2026',
    followUpDate: '23 Nov 2026',
    baselineLesionSize: 'Bilateral vertical fibrous blanching',
    followUpLesionSize: 'Fibrous bands softening; mucosa pinker',
    regressionPercent: '-42.0% Blanching Relief',
    trismusImprovement: '+11 mm Mouth Opening Gain (18mm → 29mm)',
    baselineImageDescription: 'Severe marble-white blanching of bilateral buccal mucosa and soft palate with severe restriction of jaw mobility.',
    followUpImageDescription: 'Marked softening of fibrous bands, improved mucosal vascularity, patient able to insert 3 fingers comfortably.',
  },
  {
    id: 'CASE-ASR-2026-03',
    patientUidn: 'UIDN-ASR-CHIN-2026-4412',
    patientName: 'P. Appala Swamy',
    ageGender: '49Y Male',
    villageMandal: 'Chintapalli High Plateau',
    originatingPhc: 'CHC Chintapalli',
    diagnosis: 'Erythroplakia of Lateral Border of Tongue',
    category: 'ERYTHROPLAKIA',
    icd10: 'K13.22',
    geminiAiScore: '96.5% Confidence (MALIGNANT_SUSPECT)',
    biopsyReport: 'Punch Biopsy: Moderate to Severe Epithelial Dysplasia with nuclear pleomorphism. Surgical margin clearance advised.',
    treatmentProtocol: 'Wide Local Excision with 5mm clear margin performed at DH Paderu Oral Oncology Theater. Topical antiseptic rinse.',
    followUpStatus: 'Post-Surgical Healing Well · Surveillance Recall 3 Months',
    baselineDate: '18 Oct 2026',
    followUpDate: '15 Nov 2026',
    baselineLesionSize: '1.8 cm × 1.1 cm',
    followUpLesionSize: 'Clear Granulating Surgical Scar',
    regressionPercent: '100% Excision Clearance',
    trismusImprovement: 'Normal tongue mobility restored',
    baselineImageDescription: 'Fiery red velvety depapillated patch with well-demarcated irregular borders on left lateral tongue border.',
    followUpImageDescription: 'Well-healed surgical excision site with healthy pink secondary epithelialization and no recurrence.',
  },
  {
    id: 'CASE-ASR-2026-04',
    patientUidn: 'UIDN-ASR-ARAK-2026-9104',
    patientName: 'G. Lakshmi',
    ageGender: '41Y Female',
    villageMandal: 'Araku Valley Sector',
    originatingPhc: 'Area Hospital Araku Valley',
    diagnosis: 'Speckled Leukoplakia (Erythroleukoplakia) - Palate',
    category: 'BIOPSY',
    icd10: 'K13.29',
    geminiAiScore: '89.4% Confidence (HIGH_RISK)',
    biopsyReport: 'Biopsy Result: Focal In-Situ Dysplasia adjacent to reverse smoking palatal changes.',
    treatmentProtocol: 'Reverse Chutta smoking cessation counseling + Antioxidant therapy + Laser ablation scheduled.',
    followUpStatus: 'Scheduled for Laser Ablation at DH Paderu',
    baselineDate: '28 Oct 2026',
    followUpDate: '25 Nov 2026',
    baselineLesionSize: '2.4 cm × 1.6 cm',
    followUpLesionSize: 'Erythematous halo reduced to 1.8 cm',
    regressionPercent: '-25.0% Halo Reduction',
    trismusImprovement: 'Palatal glandular swelling subsided',
    baselineImageDescription: 'Mixed red and white nodular cobblestone appearance across hard palate with inflamed minor salivary gland ducts.',
    followUpImageDescription: 'Reduction in active palatal erythema following cessation of reverse smoking habit.',
  },
]

export const SpecialistDashboard: React.FC<SpecialistDashboardProps> = ({
  patientName = 'Killo Somanna',
  patientId = 'UIDN-ASR-GMAD-2026-0042',
  onOrderBiopsy,
  onOpenTelemedicine,
}) => {
  // Live React State Array for Charted Findings
  const [chartedFindings, setChartedFindings] = useState<OdontogramFinding[]>([
    {
      id: 'FINDING-01',
      siteType: 'MUCOSA',
      code: 'RIGHT_BUCCAL',
      locationLabel: 'Right Buccal Mucosa (కుడి లోపలి చెంప)',
      condition: 'LEUKOPLAKIA',
      severity: 'MODERATE',
      notes: '3.2 x 1.4 cm non-scrapable, homogeneous chalky white plaque adjacent to lower right molars.',
      timestamp: 'Today, 10:45 AM',
    },
    {
      id: 'FINDING-02',
      siteType: 'TOOTH',
      code: '47',
      locationLabel: 'Tooth 47 (Lower Right 2nd Molar)',
      condition: 'OSMF',
      severity: 'SEVERE',
      notes: 'Sharp lingual cusp causing mechanical irritation on adjacent fibrosed buccal mucosa.',
      timestamp: 'Today, 10:48 AM',
    },
  ])

  // Active selections
  const [selectedSiteType, setSelectedSiteType] = useState<'TOOTH' | 'MUCOSA'>('MUCOSA')
  const [selectedSiteCode, setSelectedSiteCode] = useState<string>('RIGHT_BUCCAL')
  const [selectedCondition, setSelectedCondition] = useState<OdontogramFinding['condition']>('LEUKOPLAKIA')
  const [selectedSeverity, setSelectedSeverity] = useState<OdontogramFinding['severity']>('MODERATE')
  const [inputNote, setInputNote] = useState<string>('')
  const [notice, setNotice] = useState<string>('')

  // Specialist Profile & Live Duty Status State
  const [dutyStatus, setDutyStatus] = useState<'ON_DUTY' | 'CIRCUIT_CAMP' | 'OFF_DUTY'>('ON_DUTY')
  const [queueStatus, setQueueStatus] = useState<'READY' | 'HOLD' | 'RE_ROUTED'>('READY')
  const [reRouteReason, setReRouteReason] = useState<string>('')
  const [showReRouteModal, setShowReRouteModal] = useState<boolean>(false)

  // Tab switch & Longitudinal Case Register States
  const [specialistTab, setSpecialistTab] = useState<'ODONTOGRAM' | 'CASE_HISTORY'>('ODONTOGRAM')
  const [selectedCaseId, setSelectedCaseId] = useState<string>('CASE-ASR-2026-01')
  const [caseCategoryFilter, setCaseCategoryFilter] = useState<'ALL' | 'LEUKOPLAKIA' | 'OSMF' | 'ERYTHROPLAKIA' | 'BIOPSY'>('ALL')
  const [comparisonMode, setComparisonMode] = useState<'SIDE_BY_SIDE' | 'SLIDER'>('SIDE_BY_SIDE')
  const [sliderPosition, setSliderPosition] = useState<number>(50)

  // Upper and Lower FDI notation arrays
  const upperRight = [18, 17, 16, 15, 14, 13, 12, 11]
  const upperLeft = [21, 22, 23, 24, 25, 26, 27, 28]
  const lowerRight = [48, 47, 46, 45, 44, 43, 42, 41]
  const lowerLeft = [31, 32, 33, 34, 35, 36, 37, 38]

  // Interactive 1-click tooth & mucosal live charting handler
  const handleSiteClick = (type: 'TOOTH' | 'MUCOSA', code: string) => {
    setSelectedSiteType(type)
    setSelectedSiteCode(code)

    const locLabel =
      type === 'TOOTH'
        ? `Tooth ${code} (FDI Quad ${code.charAt(0)})`
        : (MUCOSAL_REGIONS.find((m) => m.id === code)?.label || code)

    const existingIndex = chartedFindings.findIndex((f) => f.code === code)
    if (existingIndex >= 0) {
      const item = chartedFindings[existingIndex]
      setSelectedCondition(item.condition)
      setSelectedSeverity(item.severity)
      setNotice(`📍 Selected ${item.condition} finding at ${item.locationLabel}.`)
    } else {
      const newFinding: OdontogramFinding = {
        id: `FINDING-${type}-${code}-${chartedFindings.length + 1}`,
        siteType: type,
        code,
        locationLabel: locLabel,
        condition: selectedCondition,
        severity: selectedSeverity,
        notes: `Clinical examination at ${locLabel}. Identified ${CONDITION_CONFIG[selectedCondition].label} (${selectedSeverity}).`,
        timestamp: 'Just now',
      }
      setChartedFindings((prev) => [newFinding, ...prev])
      setNotice(`✓ Charted ${CONDITION_CONFIG[selectedCondition].label} at ${locLabel}!`)
    }
    setTimeout(() => setNotice(''), 3500)
  }

  // Add finding handler
  const handleAddFinding = () => {
    const locLabel =
      selectedSiteType === 'TOOTH'
        ? `Tooth ${selectedSiteCode} (FDI Quad ${selectedSiteCode.charAt(0)})`
        : (MUCOSAL_REGIONS.find((m) => m.id === selectedSiteCode)?.label || selectedSiteCode)

    const newFinding: OdontogramFinding = {
      id: `FINDING-${selectedSiteType}-${selectedSiteCode}-${chartedFindings.length + 1}`,
      siteType: selectedSiteType,
      code: selectedSiteCode,
      locationLabel: locLabel,
      condition: selectedCondition,
      severity: selectedSeverity,
      notes: inputNote.trim() || `Clinical charting for ${selectedCondition} at ${locLabel}.`,
      timestamp: 'Just now',
    }

    setChartedFindings((prev) => [newFinding, ...prev])
    setInputNote('')
    setNotice(`✓ Added ${CONDITION_CONFIG[selectedCondition].label} finding at ${locLabel}.`)
    setTimeout(() => setNotice(''), 4000)
  }

  // Remove single finding
  const handleRemoveFinding = (id: string) => {
    setChartedFindings((prev) => prev.filter((f) => f.id !== id))
    setNotice('Finding removed from odontogram chart.')
    setTimeout(() => setNotice(''), 3000)
  }

  // Clear all findings
  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all charted findings from this session?')) {
      setChartedFindings([])
      setNotice('All charted findings cleared.')
      setTimeout(() => setNotice(''), 3000)
    }
  }

  // Dynamically compiled consultation notes
  const compiledClinicalSummary = chartedFindings.length === 0
    ? 'No mucosal lesions or dental pathologies currently charted for this patient.'
    : `CLINICAL IMPRESSION & PATHOLOGY AUDIT (${chartedFindings.length} findings charted):\n` +
      chartedFindings
        .map(
          (f, idx) =>
            `${idx + 1}. [${f.condition}] at ${f.locationLabel} (${f.severity} severity) — ${f.notes}`,
        )
        .join('\n') +
      `\n\nRECOMMENDED INTERVENTION: ${
        chartedFindings.some((f) => f.condition === 'INDURATED_ULCER' || f.severity === 'MALIGNANT_SUSPECT')
          ? 'URGENT: Order immediate punch biopsy & histopathological examination at DH Paderu Oncology Center.'
          : chartedFindings.some((f) => f.condition === 'LEUKOPLAKIA' || f.condition === 'OSMF')
            ? 'HIGH-PRIORITY: Intralesional dexamethasone + hyaluronidase protocol with strict habit cessation and 14-day tele-follow-up.'
            : 'ROUTINE: 6-month surveillance recall with community ASHA oral hygiene monitoring.'
      }`

  // Check if a tooth or mucosal site has active findings
  const getSiteBadge = (code: string) => {
    const siteFindings = chartedFindings.filter((f) => f.code === code)
    if (siteFindings.length === 0) return null
    const topCondition = siteFindings[0].condition
    return CONDITION_CONFIG[topCondition].icon
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
      {/* 1. Specialist Doctor Comprehensive Profile Card & Live Duty Switch */}
      <div
        style={{
          background: '#ffffff',
          border: '1.5px solid #cbd5e1',
          borderRadius: '16px',
          padding: '1.25rem 1.5rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '1.4rem' }}>👨‍⚕️</span>
            <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.2rem', fontWeight: 800 }}>
              Dr. V. Anitha Rao, MDS (Age: 42Y)
            </h3>
            <span
              style={{
                background: '#dcfce7',
                color: '#15803d',
                fontSize: '0.72rem',
                padding: '2px 8px',
                borderRadius: '6px',
                fontWeight: 800,
                border: '1px solid #86efac',
              }}
            >
              APMC-2018-84920 · VERIFIED
            </span>
          </div>
          <div style={{ fontSize: '0.84rem', color: '#475569', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
            <span>🎓 <strong>Degrees:</strong> BDS, MDS (Oral &amp; Maxillofacial Oncology)</span>
            <span>🏛️ <strong>Alma Mater:</strong> Govt Dental College Hyderabad / AMC Visakhapatnam</span>
            <span>⏳ <strong>Experience:</strong> 14 Years</span>
            <span>🏥 <strong>Posting:</strong> District Hospital Paderu</span>
          </div>
        </div>

        {/* 3-State Live Duty Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f1f5f9', padding: '4px', borderRadius: '10px' }}>
          <button
            type="button"
            onClick={() => {
              setDutyStatus('ON_DUTY')
              setNotice('✓ Marked as On-Duty in District Hospital Paderu.')
              setTimeout(() => setNotice(''), 3000)
            }}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 800,
              fontSize: '0.78rem',
              cursor: 'pointer',
              background: dutyStatus === 'ON_DUTY' ? '#10b981' : 'transparent',
              color: dutyStatus === 'ON_DUTY' ? '#ffffff' : '#475569',
            }}
          >
            🟢 On-Duty (Hospital)
          </button>
          <button
            type="button"
            onClick={() => {
              setDutyStatus('CIRCUIT_CAMP')
              setNotice('✓ Marked as Circuit Duty (Field Screening Camp).')
              setTimeout(() => setNotice(''), 3000)
            }}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 800,
              fontSize: '0.78rem',
              cursor: 'pointer',
              background: dutyStatus === 'CIRCUIT_CAMP' ? '#f59e0b' : 'transparent',
              color: dutyStatus === 'CIRCUIT_CAMP' ? '#ffffff' : '#475569',
            }}
          >
            🚗 Circuit Camp
          </button>
          <button
            type="button"
            onClick={() => {
              setDutyStatus('OFF_DUTY')
              setNotice('✓ Marked as Off-Duty / On Leave.')
              setTimeout(() => setNotice(''), 3000)
            }}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 800,
              fontSize: '0.78rem',
              cursor: 'pointer',
              background: dutyStatus === 'OFF_DUTY' ? '#64748b' : 'transparent',
              color: dutyStatus === 'OFF_DUTY' ? '#ffffff' : '#475569',
            }}
          >
            ⚪ Off-Duty
          </button>
        </div>
      </div>

      {/* Specialist Workspace Mode Switcher */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setSpecialistTab('ODONTOGRAM')}
          style={{
            background: specialistTab === 'ODONTOGRAM' ? '#1e3a8a' : 'transparent',
            color: specialistTab === 'ODONTOGRAM' ? '#ffffff' : '#475569',
            border: 'none',
            padding: '0.6rem 1.2rem',
            borderRadius: '8px',
            fontWeight: 800,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          🦷 FDI Odontogram Charting &amp; Teleconsultation
        </button>
        <button
          type="button"
          onClick={() => setSpecialistTab('CASE_HISTORY')}
          style={{
            background: specialistTab === 'CASE_HISTORY' ? '#1e3a8a' : 'transparent',
            color: specialistTab === 'CASE_HISTORY' ? '#ffffff' : '#475569',
            border: 'none',
            padding: '0.6rem 1.2rem',
            borderRadius: '8px',
            fontWeight: 800,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          📜 Clinician Case History &amp; Credentials Hub ({LONGITUDINAL_SPECIALIST_CASES.length} Cases)
        </button>
      </div>

      {specialistTab === 'ODONTOGRAM' && (
        <>
          {/* 2. Incoming Teleconsultation Queue Triage Controls */}
      <div
        style={{
          background: '#f8fafc',
          border: '1.5px solid #e2e8f0',
          borderRadius: '12px',
          padding: '0.85rem 1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.1rem' }}>📥</span>
          <span style={{ fontSize: '0.86rem', fontWeight: 750, color: '#1e293b' }}>
            Incoming Tele-Triage Appointment: <strong>{patientName} ({patientId})</strong>
          </span>
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '6px',
              background: queueStatus === 'READY' ? '#ecfdf5' : queueStatus === 'HOLD' ? '#fef3c7' : '#fee2e2',
              color: queueStatus === 'READY' ? '#065f46' : queueStatus === 'HOLD' ? '#92400e' : '#991b1b',
            }}
          >
            QUEUE: {queueStatus}
          </span>
        </div>

        {/* Direct Tripartite Action Buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => {
              setQueueStatus('READY')
              if (onOpenTelemedicine) onOpenTelemedicine()
            }}
            style={{
              background: '#10b981',
              color: '#ffffff',
              border: 'none',
              padding: '0.45rem 0.9rem',
              borderRadius: '8px',
              fontWeight: 800,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            ✓ Accept
          </button>
          <button
            type="button"
            onClick={() => {
              setQueueStatus('HOLD')
              setNotice(`⏸️ Patient ${patientName} placed on hold in virtual waiting lounge.`)
              setTimeout(() => setNotice(''), 3500)
            }}
            style={{
              background: '#fef3c7',
              color: '#92400e',
              border: '1px solid #fde68a',
              padding: '0.45rem 0.9rem',
              borderRadius: '8px',
              fontWeight: 800,
              fontSize: '0.82rem',
              cursor: 'pointer',
            }}
          >
            ⏸️ Put on Hold / Pause
          </button>
          <button
            type="button"
            onClick={() => setShowReRouteModal(true)}
            style={{
              background: '#fee2e2',
              color: '#991b1b',
              border: '1px solid #fecaca',
              padding: '0.45rem 0.9rem',
              borderRadius: '8px',
              fontWeight: 800,
              fontSize: '0.82rem',
              cursor: 'pointer',
            }}
          >
            🔄 Reject / Re-route
          </button>
        </div>
      </div>

      {/* Re-Route Modal */}
      {showReRouteModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '1.75rem',
              maxWidth: '460px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            }}
          >
            <h4 style={{ margin: '0 0 0.5rem', color: '#0f172a', fontSize: '1.15rem', fontWeight: 800 }}>
              🔄 Re-route or Transfer Patient Consultation
            </h4>
            <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '0 0 1rem' }}>
              Specify clinical rationale for transferring or deferring this teleconsultation queue slot.
            </p>
            <textarea
              rows={3}
              value={reRouteReason}
              onChange={(e) => setReRouteReason(e.target.value)}
              placeholder="e.g. Case requires in-person incisional scalpel biopsy at DH Paderu surgical suite..."
              style={{
                width: '100%',
                padding: '0.6rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.85rem',
                marginBottom: '1rem',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setShowReRouteModal(false)}
                style={{
                  background: '#f1f5f9',
                  color: '#475569',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setQueueStatus('RE_ROUTED')
                  setShowReRouteModal(false)
                  setNotice(`✓ Patient ${patientName} re-routed to Tertiary Center. Rationale logged.`)
                  setTimeout(() => setNotice(''), 3500)
                }}
                style={{
                  background: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                Confirm Re-Route
              </button>
            </div>
          </div>
        </div>
      )}
      <div
        style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          border: '1.5px solid #d97706',
          borderRadius: '16px',
          padding: '1.5rem',
          boxShadow: '0 10px 25px -5px rgba(217, 119, 6, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '1.3rem' }}>🩺</span>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#b45309',
                background: '#fef3c7',
                padding: '2px 8px',
                borderRadius: '6px',
              }}
            >
              Specialist Diagnostic Odontogram
            </span>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#15803d',
                background: '#dcfce7',
                padding: '2px 8px',
                borderRadius: '6px',
              }}
            >
              ● Live Clinical Session
            </span>
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.25rem 0' }}>
            {patientName} · <span style={{ color: '#475569', fontSize: '1.1rem' }}>{patientId}</span>
          </h2>
          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.88rem', color: '#475569', flexWrap: 'wrap' }}>
            <span>📍 <strong>Mandal:</strong> G. Madugula (Paderu Division)</span>
            <span>🚬 <strong>Habit History:</strong> Smokeless Tobacco / Gutkha (15 yrs)</span>
            <span>📊 <strong>AI Primary Risk:</strong> 94.2% OPMD / Leukoplakia</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {onOpenTelemedicine && (
            <button
              type="button"
              onClick={onOpenTelemedicine}
              style={{
                background: '#0284c7',
                color: '#ffffff',
                border: 'none',
                padding: '0.65rem 1.1rem',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              📹 Live Teleconsultation
            </button>
          )}
          {onOrderBiopsy && (
            <button
              type="button"
              onClick={onOrderBiopsy}
              style={{
                background: 'linear-gradient(135deg, #b91c1c 0%, #dc2626 100%)',
                color: '#ffffff',
                border: 'none',
                padding: '0.65rem 1.1rem',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)',
              }}
            >
              🔬 Order Urgent Biopsy
            </button>
          )}
        </div>
      </div>

      {/* High-Definition Clinical Screening Report Card (ROI · Right Buccal Mucosa) */}
      <div
        style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #fffdfa 100%)',
          border: '1.5px solid #d97706',
          borderRadius: '16px',
          padding: '1.25rem 1.5rem',
          boxShadow: '0 8px 20px -4px rgba(217, 119, 6, 0.1)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1.5rem',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* High-Definition Clinical Oral Cavity Visual with Live Real-Time Bounding Box */}
          <OralCavityHdVisual width={220} height={165} showBoundingBox={true} />

          <div style={{ maxWidth: '580px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  background: '#fee2e2',
                  color: '#b91c1c',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  letterSpacing: '0.04em',
                }}
              >
                AI SCREENING ALERT: HIGH RISK
              </span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>
                Captured: 10 Nov 2026, 10:14 IST · Paderu Division
              </span>
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>
              Clinical Screening Report: ROI · Right Buccal Mucosa (కుడి లోపలి చెంప)
            </h3>
            <p style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: '#334155', lineHeight: 1.5 }}>
              Circumscribed non-scrapable hyperkeratotic leukoplakic plaque (~1.8 cm × 1.2 cm) with peripheral
              erythematous margins. Correlates with chronic 15-year gutkha pouching habit in right cheek sulcus.
              Incisional punch biopsy indicated at DH Paderu.
            </p>
            <div style={{ display: 'flex', gap: '12px', fontSize: '0.78rem', color: '#475569', flexWrap: 'wrap' }}>
              <span>🔍 <strong>Pathology:</strong> K13.21 Oral Leukoplakia</span>
              <span>⚡ <strong>Dysplasia Probability:</strong> 94.2%</span>
              <span>🔒 <strong>Integrity Hash:</strong> SHA-256 Verified</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {onOpenTelemedicine && (
            <button
              type="button"
              onClick={onOpenTelemedicine}
              style={{
                background: '#0284c7',
                color: '#ffffff',
                border: 'none',
                padding: '0.65rem 1.1rem',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              📹 Open Telemedicine
            </button>
          )}
          {onOrderBiopsy && (
            <button
              type="button"
              onClick={onOrderBiopsy}
              style={{
                background: 'linear-gradient(135deg, #b91c1c 0%, #dc2626 100%)',
                color: '#ffffff',
                border: 'none',
                padding: '0.65rem 1.1rem',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: '0 4px 10px rgba(220, 38, 38, 0.2)',
              }}
            >
              🔬 Fast-Track Biopsy Order
            </button>
          )}
        </div>
      </div>

      {notice && (
        <div
          role="status"
          style={{
            background: '#ecfdf5',
            border: '1.5px solid #10b981',
            color: '#065f46',
            padding: '0.75rem 1.25rem',
            borderRadius: '10px',
            fontWeight: 700,
            fontSize: '0.9rem',
          }}
        >
          {notice}
        </div>
      )}

      {/* Main Dual Grid: Left = Dental Arch & Mucosa, Right = Findings List & Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem' }}>
        {/* LEFT COLUMN: 2D FDI Odontogram & Mucosal Map */}
        <div
          style={{
            background: '#ffffff',
            border: '1.5px solid #e2e8f0',
            borderRadius: '16px',
            padding: '1.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                🦷 2D Interactive FDI Dental Arch (11–48)
              </h3>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>
                Standard FDI World Dental Federation Notation
              </span>
            </div>
            <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
              Click any tooth quadrant or mucosal zone to map lesions, dysplasia, or ulcerations.
            </p>
          </div>

          {/* Dental Arch - Upper Maxilla */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '12px',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 800, color: '#475569' }}>
              <span>QUADRANT 1 (Upper Right)</span>
              <span>MAXILLARY ARCH (పై దవడ)</span>
              <span>QUADRANT 2 (Upper Left)</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', flexWrap: 'wrap' }}>
              {upperRight.map((tooth) => {
                const isSelected = selectedSiteType === 'TOOTH' && selectedSiteCode === String(tooth)
                const badge = getSiteBadge(String(tooth))
                return (
                  <button
                    key={tooth}
                    type="button"
                    onClick={() => handleSiteClick('TOOTH', String(tooth))}
                    style={{
                      width: '38px',
                      height: '48px',
                      background: isSelected ? '#1e3a8a' : badge ? '#fef3c7' : '#ffffff',
                      color: isSelected ? '#ffffff' : '#1e293b',
                      border: isSelected ? '2px solid #3b82f6' : badge ? '2px solid #d97706' : '1px solid #cbd5e1',
                      borderRadius: '8px',
                      fontWeight: 800,
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '2px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span>{tooth}</span>
                    <span style={{ fontSize: '0.7rem' }}>{badge || '🦷'}</span>
                  </button>
                )
              })}
              <div style={{ width: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>|</div>
              {upperLeft.map((tooth) => {
                const isSelected = selectedSiteType === 'TOOTH' && selectedSiteCode === String(tooth)
                const badge = getSiteBadge(String(tooth))
                return (
                  <button
                    key={tooth}
                    type="button"
                    onClick={() => handleSiteClick('TOOTH', String(tooth))}
                    style={{
                      width: '38px',
                      height: '48px',
                      background: isSelected ? '#1e3a8a' : badge ? '#fef3c7' : '#ffffff',
                      color: isSelected ? '#ffffff' : '#1e293b',
                      border: isSelected ? '2px solid #3b82f6' : badge ? '2px solid #d97706' : '1px solid #cbd5e1',
                      borderRadius: '8px',
                      fontWeight: 800,
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '2px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span>{tooth}</span>
                    <span style={{ fontSize: '0.7rem' }}>{badge || '🦷'}</span>
                  </button>
                )
              })}
            </div>

            {/* Lower Mandible */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 800, color: '#475569', marginTop: '0.5rem' }}>
              <span>QUADRANT 4 (Lower Right)</span>
              <span>MANDIBULAR ARCH (క్రింది దవడ)</span>
              <span>QUADRANT 3 (Lower Left)</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', flexWrap: 'wrap' }}>
              {lowerRight.map((tooth) => {
                const isSelected = selectedSiteType === 'TOOTH' && selectedSiteCode === String(tooth)
                const badge = getSiteBadge(String(tooth))
                return (
                  <button
                    key={tooth}
                    type="button"
                    onClick={() => handleSiteClick('TOOTH', String(tooth))}
                    style={{
                      width: '38px',
                      height: '48px',
                      background: isSelected ? '#1e3a8a' : badge ? '#fef3c7' : '#ffffff',
                      color: isSelected ? '#ffffff' : '#1e293b',
                      border: isSelected ? '2px solid #3b82f6' : badge ? '2px solid #d97706' : '1px solid #cbd5e1',
                      borderRadius: '8px',
                      fontWeight: 800,
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '2px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span>{tooth}</span>
                    <span style={{ fontSize: '0.7rem' }}>{badge || '🦷'}</span>
                  </button>
                )
              })}
              <div style={{ width: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>|</div>
              {lowerLeft.map((tooth) => {
                const isSelected = selectedSiteType === 'TOOTH' && selectedSiteCode === String(tooth)
                const badge = getSiteBadge(String(tooth))
                return (
                  <button
                    key={tooth}
                    type="button"
                    onClick={() => handleSiteClick('TOOTH', String(tooth))}
                    style={{
                      width: '38px',
                      height: '48px',
                      background: isSelected ? '#1e3a8a' : badge ? '#fef3c7' : '#ffffff',
                      color: isSelected ? '#ffffff' : '#1e293b',
                      border: isSelected ? '2px solid #3b82f6' : badge ? '2px solid #d97706' : '1px solid #cbd5e1',
                      borderRadius: '8px',
                      fontWeight: 800,
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '2px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span>{tooth}</span>
                    <span style={{ fontSize: '0.7rem' }}>{badge || '🦷'}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Mucosal Region Buttons */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                👄 Mucosal Soft Tissue Regions
              </h4>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Select anatomical site</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem' }}>
              {MUCOSAL_REGIONS.map((region) => {
                const isSelected = selectedSiteType === 'MUCOSA' && selectedSiteCode === region.id
                const badge = getSiteBadge(region.id)
                return (
                  <button
                    key={region.id}
                    type="button"
                    onClick={() => handleSiteClick('MUCOSA', region.id)}
                    style={{
                      background: isSelected ? '#1e3a8a' : badge ? '#fffbeb' : '#f8fafc',
                      color: isSelected ? '#ffffff' : '#1e293b',
                      border: isSelected ? '2px solid #2563eb' : badge ? '1.5px solid #d97706' : '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '0.6rem 0.8rem',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '0.82rem' }}>{region.label.split('(')[0]}</strong>
                      <span>{badge || ''}</span>
                    </div>
                    <small style={{ fontSize: '0.7rem', color: isSelected ? '#cbd5e1' : '#64748b' }}>
                      {region.tip}
                    </small>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Classification Palette & Severity */}
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.6rem' }}>
              🎨 Diagnostic Lesion Palette &amp; Staging
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.5rem', marginBottom: '0.75rem' }}>
              {(Object.keys(CONDITION_CONFIG) as OdontogramFinding['condition'][]).map((condKey) => {
                const cfg = CONDITION_CONFIG[condKey]
                const isChosen = selectedCondition === condKey
                return (
                  <button
                    key={condKey}
                    type="button"
                    onClick={() => setSelectedCondition(condKey)}
                    style={{
                      background: isChosen ? cfg.bg : '#ffffff',
                      border: `2px solid ${isChosen ? cfg.border : '#e2e8f0'}`,
                      borderRadius: '10px',
                      padding: '0.5rem',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>{cfg.icon}</span>
                      <strong style={{ fontSize: '0.78rem', color: cfg.color }}>{condKey}</strong>
                    </div>
                    <small style={{ fontSize: '0.68rem', color: '#64748b', lineHeight: 1.2 }}>
                      {cfg.label.split('(')[1]?.replace(')', '') || condKey}
                    </small>
                  </button>
                )
              })}
            </div>

            {/* Severity and Custom Note */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                  Severity Staging
                </label>
                <select
                  value={selectedSeverity}
                  onChange={(e) => setSelectedSeverity(e.target.value as OdontogramFinding['severity'])}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                  }}
                >
                  <option value="MILD">🟢 Mild / Early Stage</option>
                  <option value="MODERATE">🟡 Moderate Dysplasia</option>
                  <option value="SEVERE">🟠 Severe / Advanced</option>
                  <option value="MALIGNANT_SUSPECT">🟣 Malignant Suspect (OSCC)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                  Clinical Finding Observation Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2x1 cm non-scrapable plaque, ulcerated margin..."
                  value={inputNote}
                  onChange={(e) => setInputNote(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.82rem',
                  }}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddFinding}
              style={{
                width: '100%',
                background: '#0f172a',
                color: '#ffffff',
                border: 'none',
                padding: '0.7rem',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}
            >
              ➕ Chart Finding at {selectedSiteType === 'TOOTH' ? `Tooth ${selectedSiteCode}` : selectedSiteCode}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Active Charted Findings & Synchronized Clinical Notes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Charted Findings Header and Clear All */}
          <div
            style={{
              background: '#ffffff',
              border: '1.5px solid #e2e8f0',
              borderRadius: '16px',
              padding: '1.5rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  📋 Charted Pathological Findings ({chartedFindings.length})
                </h3>
                <small style={{ color: '#64748b' }}>Real-time synchronization with patient EHR</small>
              </div>

              {chartedFindings.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  style={{
                    background: '#fee2e2',
                    color: '#991b1b',
                    border: '1px solid #f87171',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  🗑️ Clear All
                </button>
              )}
            </div>

            {/* Findings List */}
            {chartedFindings.length === 0 ? (
              <div
                style={{
                  background: '#f8fafc',
                  border: '1.5px dashed #cbd5e1',
                  borderRadius: '12px',
                  padding: '2.5rem',
                  textAlign: 'center',
                  color: '#64748b',
                }}
              >
                <div style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>🦷</div>
                <strong style={{ display: 'block', color: '#1e293b' }}>No Pathological Findings Charted Yet</strong>
                <small>Select a tooth or mucosal region on the left to map lesions.</small>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '380px', overflowY: 'auto' }}>
                {chartedFindings.map((finding) => {
                  const cfg = CONDITION_CONFIG[finding.condition]
                  return (
                    <div
                      key={finding.id}
                      style={{
                        background: cfg.bg,
                        border: `1.5px solid ${cfg.border}`,
                        borderRadius: '12px',
                        padding: '0.85rem 1rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: '0.75rem',
                        transition: 'transform 0.1s ease',
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '1rem' }}>{cfg.icon}</span>
                          <strong style={{ fontSize: '0.92rem', color: cfg.color }}>{finding.condition}</strong>
                          <span
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: 800,
                              background: '#ffffff',
                              color: cfg.color,
                              border: `1px solid ${cfg.border}`,
                              padding: '1px 6px',
                              borderRadius: '4px',
                            }}
                          >
                            {finding.severity}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>• {finding.timestamp}</span>
                        </div>

                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', marginBottom: '4px' }}>
                          📍 {finding.locationLabel}
                        </div>

                        <p style={{ margin: 0, fontSize: '0.82rem', color: '#334155', lineHeight: 1.4 }}>
                          {finding.notes}
                        </p>
                      </div>

                      {/* Remove single finding button (✕) */}
                      <button
                        type="button"
                        aria-label="Remove finding"
                        onClick={() => handleRemoveFinding(finding.id)}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #cbd5e1',
                          color: '#dc2626',
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontWeight: 800,
                          fontSize: '0.9rem',
                          flexShrink: 0,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Auto-updating Doctor Clinical Consultation Notes */}
          <div
            style={{
              background: '#ffffff',
              border: '1.5px solid #e2e8f0',
              borderRadius: '16px',
              padding: '1.5rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                📝 Synchronized Clinical Consultation Notes
              </h3>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  color: '#15803d',
                  background: '#dcfce7',
                  padding: '2px 8px',
                  borderRadius: '6px',
                }}
              >
                Auto-Compiling
              </span>
            </div>

            <textarea
              readOnly
              rows={6}
              value={compiledClinicalSummary}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '10px',
                border: '1.5px solid #cbd5e1',
                background: '#f8fafc',
                fontSize: '0.82rem',
                lineHeight: 1.5,
                color: '#1e293b',
                fontFamily: 'monospace',
                resize: 'none',
              }}
            />

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(compiledClinicalSummary)
                  setNotice('✓ Clinical consultation notes copied to clipboard.')
                  setTimeout(() => setNotice(''), 3000)
                }}
                style={{
                  background: '#f1f5f9',
                  color: '#1e293b',
                  border: '1px solid #cbd5e1',
                  padding: '0.5rem 0.9rem',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                }}
              >
                📋 Copy Notes
              </button>

              <button
                type="button"
                onClick={() => {
                  setNotice('✓ Odontogram chart synchronized to ASR District Health Registry.')
                  setTimeout(() => setNotice(''), 3500)
                }}
                style={{
                  background: '#1e3a8a',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                }}
              >
                💾 Save to EMR Registry
              </button>
            </div>
          </div>
        </div>
      </div>
      </>
      )}

      {specialistTab === 'CASE_HISTORY' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Clinician Verified Credentials Banner */}
          <div
            style={{
              background: '#ffffff',
              border: '1.5px solid #cbd5e1',
              borderRadius: '16px',
              padding: '1.5rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: '#15803d',
                    background: '#dcfce7',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    border: '1px solid #86efac',
                  }}
                >
                  APMC VERIFIED CLINICAL ONCOLOGIST CREDENTIALS
                </span>
                <h3 style={{ margin: '6px 0 2px', fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
                  📜 Clinician Longitudinal Case Register &amp; Treatment Outcomes Hub
                </h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                  Longitudinal photographic case log tracking pre-malignant lesions, biopsied oral tissues, and post-intervention regression trajectories across ITDA Paderu.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  speakBujjiTeluguVoice(
                    `డాక్టర్ వి. అనిత రావు గారి క్లినికల్ రికార్డులు: మొత్తం 4 హై-రిస్క్ కేసులు నమోదు చేయబడ్డాయి. కిల్లో సోమన్న గారి ల్యూకోప్లాకియా పరిమాణం 56 శాతం తగ్గింది. ట్రిస్మస్ నోరు తెరిచే సామర్థ్యం 9 మిల్లీమీటర్లు మెరుగైంది.`
                  )
                }
                style={{
                  background: '#f0fdf4',
                  border: '1.5px solid #86efac',
                  color: '#15803d',
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                🔊 BUJJI AI క్లినికల్ సమీక్ష (Audio)
              </button>
            </div>

            {/* Doctor Credentials Details Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginTop: '1.25rem' }}>
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <small style={{ color: '#64748b', display: 'block', fontSize: '0.72rem' }}>State Medical Registration:</small>
                <strong style={{ color: '#0f172a', fontSize: '0.90rem' }}>APMC-2018-84920</strong>
                <div style={{ color: '#15803d', fontSize: '0.70rem', fontWeight: 700 }}>✓ Verified Andhra Pradesh Council</div>
              </div>
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <small style={{ color: '#64748b', display: 'block', fontSize: '0.72rem' }}>Qualifications &amp; Degrees:</small>
                <strong style={{ color: '#0f172a', fontSize: '0.90rem' }}>BDS, MDS (Oral Oncology)</strong>
                <div style={{ color: '#64748b', fontSize: '0.70rem' }}>Govt Dental College / AMC Visakhapatnam</div>
              </div>
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <small style={{ color: '#64748b', display: 'block', fontSize: '0.72rem' }}>Experience &amp; Current Node:</small>
                <strong style={{ color: '#0f172a', fontSize: '0.90rem' }}>14 Years Clinical Oncology</strong>
                <div style={{ color: '#2563eb', fontSize: '0.70rem', fontWeight: 700 }}>District Hospital Paderu</div>
              </div>
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <small style={{ color: '#64748b', display: 'block', fontSize: '0.72rem' }}>Practice Classification:</small>
                <strong style={{ color: '#0f172a', fontSize: '0.90rem' }}>Government Public Service (₹0 Fee)</strong>
                <div style={{ color: '#0284c7', fontSize: '0.70rem', fontWeight: 700 }}>100% Free ITDA Tribal Welfare</div>
              </div>
            </div>
          </div>

          {/* Filter Bar & Case Selection Grid */}
          <div
            style={{
              background: '#ffffff',
              border: '1.5px solid #cbd5e1',
              borderRadius: '16px',
              padding: '1.25rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                📂 Longitudinal Patient Cohort Register
              </h4>
              {/* Category Filter Pills */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {(['ALL', 'LEUKOPLAKIA', 'OSMF', 'ERYTHROPLAKIA', 'BIOPSY'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCaseCategoryFilter(cat)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '999px',
                      border: caseCategoryFilter === cat ? '1.5px solid #1e3a8a' : '1px solid #cbd5e1',
                      background: caseCategoryFilter === cat ? '#1e3a8a' : '#f8fafc',
                      color: caseCategoryFilter === cat ? '#ffffff' : '#475569',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {cat === 'ALL'
                      ? `All Cases (${LONGITUDINAL_SPECIALIST_CASES.length})`
                      : cat === 'LEUKOPLAKIA'
                      ? 'Leukoplakia'
                      : cat === 'OSMF'
                      ? 'OSMF'
                      : cat === 'ERYTHROPLAKIA'
                      ? 'Erythroplakia'
                      : 'Biopsy Ordered'}
                  </button>
                ))}
              </div>
            </div>

            {/* Case List Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: '10px' }}>
              {LONGITUDINAL_SPECIALIST_CASES.filter(
                (c) => caseCategoryFilter === 'ALL' || c.category === caseCategoryFilter
              ).map((caseItem) => {
                const isSelected = selectedCaseId === caseItem.id
                return (
                  <div
                    key={caseItem.id}
                    onClick={() => setSelectedCaseId(caseItem.id)}
                    style={{
                      padding: '12px',
                      borderRadius: '12px',
                      border: isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0',
                      background: isSelected ? '#eff6ff' : '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                      <strong style={{ color: isSelected ? '#1d4ed8' : '#0f172a', fontSize: '0.90rem' }}>
                        {caseItem.patientName}
                      </strong>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background:
                            caseItem.category === 'ERYTHROPLAKIA'
                              ? '#fee2e2'
                              : caseItem.category === 'BIOPSY'
                              ? '#fef3c7'
                              : '#e0f2fe',
                          color:
                            caseItem.category === 'ERYTHROPLAKIA'
                              ? '#b91c1c'
                              : caseItem.category === 'BIOPSY'
                              ? '#b45309'
                              : '#0284c7',
                        }}
                      >
                        {caseItem.category}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                      {caseItem.patientUidn} · {caseItem.ageGender}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#0f172a', fontWeight: 600, marginTop: '4px' }}>
                      {caseItem.diagnosis}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', paddingTop: '6px', borderTop: '1px solid #e2e8f0', fontSize: '0.70rem' }}>
                      <span style={{ color: '#16a34a', fontWeight: 700 }}>{caseItem.regressionPercent}</span>
                      <span style={{ color: '#2563eb', fontWeight: 700 }}>Inspect Case →</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 3. Detailed Longitudinal Comparative Lesion Review Container */}
          {(() => {
            const activeCase =
              LONGITUDINAL_SPECIALIST_CASES.find((c) => c.id === selectedCaseId) ||
              LONGITUDINAL_SPECIALIST_CASES[0]
            return (
              <div
                style={{
                  background: '#ffffff',
                  border: '2px solid #2563eb',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  boxShadow: '0 8px 24px -4px rgba(37, 99, 235, 0.15)',
                }}
              >
                {/* Case Top Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      LONGITUDINAL COMPARATIVE OUTCOME REVIEW · {activeCase.id}
                    </span>
                    <h3 style={{ margin: '4px 0 2px', fontSize: '1.3rem', fontWeight: 800, color: '#0f172a' }}>
                      {activeCase.patientName} ({activeCase.ageGender}) · {activeCase.villageMandal}
                    </h3>
                    <div style={{ fontSize: '0.80rem', color: '#64748b' }}>
                      MAA-UIDN: <code>{activeCase.patientUidn}</code> · Originating Node: <strong>{activeCase.originatingPhc}</strong> · ICD-10: <strong>{activeCase.icd10}</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => setComparisonMode(comparisonMode === 'SIDE_BY_SIDE' ? 'SLIDER' : 'SIDE_BY_SIDE')}
                      style={{
                        background: '#eff6ff',
                        border: '1.5px solid #93c5fd',
                        color: '#1d4ed8',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {comparisonMode === 'SIDE_BY_SIDE' ? '🎚️ Switch to Slider Mode' : '🔲 Switch to Side-by-Side'}
                    </button>
                    {onOpenTelemedicine && (
                      <button
                        type="button"
                        className="workflow-button live-video-green-btn"
                        onClick={onOpenTelemedicine}
                        style={{ fontSize: '0.78rem', padding: '6px 12px' }}
                      >
                        📹 Teleconsultation
                      </button>
                    )}
                  </div>
                </div>

                {/* Comparative Lesion Canvas Display */}
                {comparisonMode === 'SIDE_BY_SIDE' ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', margin: '1.25rem 0' }}>
                    {/* Left: Baseline Lesion (Week 0) */}
                    <div style={{ background: '#fef2f2', border: '2px solid #fecaca', borderRadius: '14px', padding: '14px', position: 'relative' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ background: '#ef4444', color: '#ffffff', fontSize: '0.72rem', fontWeight: 800, padding: '2px 8px', borderRadius: '6px' }}>
                          BASELINE (WEEK 0 · {activeCase.baselineDate})
                        </span>
                        <strong style={{ fontSize: '0.80rem', color: '#991b1b' }}>Lesion: {activeCase.baselineLesionSize}</strong>
                      </div>

                      {/* Visual Graphic Representation */}
                      <div
                        style={{
                          height: '180px',
                          borderRadius: '10px',
                          background: 'linear-gradient(135deg, #7f1d1d 0%, #450a0a 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative',
                          overflow: 'hidden',
                          border: '2px solid #b91c1c',
                        }}
                      >
                        <div style={{ position: 'absolute', inset: 0, opacity: 0.25, background: 'radial-gradient(circle, #fca5a5 10%, transparent 60%)' }} />
                        <div
                          style={{
                            width: '130px',
                            height: '70px',
                            borderRadius: '50% 40% 60% 30%',
                            background: 'radial-gradient(ellipse, #ffffff 40%, #e2e8f0 75%, #f87171 100%)',
                            boxShadow: '0 0 16px rgba(255, 255, 255, 0.6), inset 0 0 8px rgba(185, 28, 28, 0.4)',
                            border: '2px dashed #dc2626',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#7f1d1d',
                            fontSize: '0.74rem',
                            fontWeight: 800,
                            textAlign: 'center',
                            padding: '4px',
                          }}
                        >
                          Chalky Plaque<br />{activeCase.baselineLesionSize}
                        </div>
                        <span style={{ position: 'absolute', bottom: '8px', left: '10px', fontSize: '0.70rem', color: '#fca5a5', fontWeight: 700 }}>
                          AI Score: {activeCase.geminiAiScore}
                        </span>
                      </div>

                      <div style={{ marginTop: '10px', fontSize: '0.78rem', color: '#7f1d1d', lineHeight: 1.4 }}>
                        <strong>Clinical Observation:</strong> {activeCase.baselineImageDescription}
                      </div>
                    </div>

                    {/* Right: 4-Week Follow-Up Review (Week 4) */}
                    <div style={{ background: '#f0fdf4', border: '2px solid #bbf7d0', borderRadius: '14px', padding: '14px', position: 'relative' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ background: '#16a34a', color: '#ffffff', fontSize: '0.72rem', fontWeight: 800, padding: '2px 8px', borderRadius: '6px' }}>
                          FOLLOW-UP (WEEK 4 · {activeCase.followUpDate})
                        </span>
                        <strong style={{ fontSize: '0.80rem', color: '#166534' }}>Residual: {activeCase.followUpLesionSize}</strong>
                      </div>

                      <div
                        style={{
                          height: '180px',
                          borderRadius: '10px',
                          background: 'linear-gradient(135deg, #14532d 0%, #052e16 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative',
                          overflow: 'hidden',
                          border: '2px solid #22c55e',
                        }}
                      >
                        <div style={{ position: 'absolute', inset: 0, opacity: 0.25, background: 'radial-gradient(circle, #86efac 10%, transparent 60%)' }} />
                        <div
                          style={{
                            width: '55px',
                            height: '30px',
                            borderRadius: '50%',
                            background: 'radial-gradient(ellipse, #f1f5f9 20%, #f472b6 60%, #15803d 100%)',
                            boxShadow: '0 0 12px rgba(134, 239, 172, 0.4)',
                            border: '1.5px solid #86efac',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#14532d',
                            fontSize: '0.66rem',
                            fontWeight: 800,
                            textAlign: 'center',
                          }}
                        >
                          Residual<br />1.4cm
                        </div>
                        <span style={{ position: 'absolute', bottom: '8px', left: '10px', fontSize: '0.70rem', color: '#86efac', fontWeight: 800 }}>
                          ✓ {activeCase.regressionPercent}
                        </span>
                      </div>

                      <div style={{ marginTop: '10px', fontSize: '0.78rem', color: '#14532d', lineHeight: 1.4 }}>
                        <strong>Outcome Verification:</strong> {activeCase.followUpImageDescription}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Interactive Slider Comparison Mode */
                  <div style={{ margin: '1.25rem 0', background: '#0f172a', borderRadius: '14px', padding: '16px', color: '#ffffff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.80rem', fontWeight: 700, marginBottom: '8px' }}>
                      <span style={{ color: '#f87171' }}>◀ Baseline (Week 0 · 10 Nov)</span>
                      <span style={{ color: '#94a3b8' }}>Split Position: {sliderPosition}%</span>
                      <span style={{ color: '#4ade80' }}>Follow-Up (Week 4 · 08 Dec) ▶</span>
                    </div>

                    <div style={{ position: 'relative', height: '200px', borderRadius: '12px', overflow: 'hidden', border: '2px solid #38bdf8' }}>
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '1.5rem' }}>🔴</div>
                          <strong>Baseline Lesion ({activeCase.baselineLesionSize})</strong>
                          <div style={{ fontSize: '0.75rem', color: '#fca5a5' }}>Thick raised plaque · AI: {activeCase.geminiAiScore}</div>
                        </div>
                      </div>

                      <div
                        style={{
                          position: 'absolute',
                          top: 0,
                          bottom: 0,
                          right: 0,
                          left: `${sliderPosition}%`,
                          background: 'linear-gradient(135deg, #14532d 0%, #166534 100%)',
                          borderLeft: '3px solid #ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                        }}
                      >
                        <div style={{ textAlign: 'center', minWidth: '220px' }}>
                          <div style={{ fontSize: '1.5rem' }}>🟢</div>
                          <strong>Follow-Up Healed ({activeCase.followUpLesionSize})</strong>
                          <div style={{ fontSize: '0.75rem', color: '#86efac' }}>56.2% Plaque Reduction · Normal Mucosa</div>
                        </div>
                      </div>
                    </div>

                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={sliderPosition}
                      onChange={(e) => setSliderPosition(Number(e.target.value))}
                      style={{ width: '100%', marginTop: '12px', cursor: 'ew-resize' }}
                    />
                  </div>
                )}

                {/* 4 Clinical Outcome Metric Gauges */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginTop: '1.25rem' }}>
                  <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '10px', padding: '12px' }}>
                    <small style={{ color: '#166534', display: 'block', fontSize: '0.72rem', fontWeight: 700 }}>PLAQUE REGRESSION</small>
                    <strong style={{ fontSize: '1.25rem', color: '#15803d' }}>{activeCase.regressionPercent}</strong>
                    <div style={{ fontSize: '0.70rem', color: '#16a34a', marginTop: '2px' }}>Confirmed on photography audit</div>
                  </div>

                  <div style={{ background: '#eff6ff', border: '1.5px solid #93c5fd', borderRadius: '10px', padding: '12px' }}>
                    <small style={{ color: '#1e40af', display: 'block', fontSize: '0.72rem', fontWeight: 700 }}>TRISMUS (JAW MOBILITY)</small>
                    <strong style={{ fontSize: '1.25rem', color: '#1d4ed8' }}>{activeCase.trismusImprovement}</strong>
                    <div style={{ fontSize: '0.70rem', color: '#2563eb', marginTop: '2px' }}>Patient able to eat solid food</div>
                  </div>

                  <div style={{ background: '#fef3c7', border: '1.5px solid #fde68a', borderRadius: '10px', padding: '12px' }}>
                    <small style={{ color: '#92400e', display: 'block', fontSize: '0.72rem', fontWeight: 700 }}>HISTOPATHOLOGY AUDIT</small>
                    <strong style={{ fontSize: '0.90rem', color: '#b45309' }}>Mild Dysplasia</strong>
                    <div style={{ fontSize: '0.70rem', color: '#78350f', marginTop: '2px' }}>Non-malignant · Margin clear</div>
                  </div>

                  <div style={{ background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '10px', padding: '12px' }}>
                    <small style={{ color: '#475569', display: 'block', fontSize: '0.72rem', fontWeight: 700 }}>HABIT ADHERENCE</small>
                    <strong style={{ fontSize: '1.25rem', color: '#0f172a' }}>100% Cessation</strong>
                    <div style={{ fontSize: '0.70rem', color: '#15803d', marginTop: '2px' }}>ASHA worker biweekly check</div>
                  </div>
                </div>

                {/* Treatment Regimen Summary Box */}
                <div style={{ marginTop: '1.25rem', padding: '12px 16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.82rem', color: '#334155' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
                    💊 Prescribed Longitudinal Regimen:
                  </div>
                  <div>{activeCase.treatmentProtocol}</div>
                  <div style={{ marginTop: '6px', color: '#0284c7', fontWeight: 700 }}>
                    🔬 Histopathology Biopsy Report: {activeCase.biopsyReport}
                  </div>
                </div>

                {/* Bottom Action Strip */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', paddingTop: '12px', borderTop: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() =>
                      speakBujjiTeluguVoice(
                        `${activeCase.patientName} గారి రోగ నిర్ధారణ: ${activeCase.diagnosis}. 4 వారాల చికిత్స తర్వాత ల్యూకోప్లాకియా పరిమాణం ${activeCase.baselineLesionSize} నుండి ${activeCase.followUpLesionSize} కి తగ్గింది. మొత్తం 56 శాతం తగ్గుదల నమోదైంది.`
                      )
                    }
                    className="workflow-secondary-button"
                    style={{ fontSize: '0.80rem' }}
                  >
                    🔊 BUJJI AI తెలుగు సమీక్ష
                  </button>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setNotice(`✓ Longitudinal follow-up report exported for ${activeCase.patientName}.`)
                        setTimeout(() => setNotice(''), 3500)
                      }}
                      className="workflow-secondary-button"
                      style={{ fontSize: '0.80rem' }}
                    >
                      📄 Export Clinical Dossier
                    </button>
                    {onOrderBiopsy && (
                      <button
                        type="button"
                        onClick={onOrderBiopsy}
                        className="workflow-button"
                        style={{ fontSize: '0.80rem' }}
                      >
                        🔬 Order Confirmatory Biopsy
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}

export default SpecialistDashboard
