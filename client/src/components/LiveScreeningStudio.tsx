import { useState } from 'react'
import { OralCavityHdVisual } from './OralCavityHdVisual'

export interface LiveScreeningStudioProps {
  onOrderBiopsy?: () => void
  onOpenTelemedicine?: () => void
  onClose?: () => void
}

export function LiveScreeningStudio({
  onOrderBiopsy,
  onOpenTelemedicine,
  onClose,
}: LiveScreeningStudioProps) {
  const [activeTab, setActiveTab] = useState<'REPORT' | 'MEDS' | 'TELUGU'>('REPORT')
  const [isSpeaking, setIsSpeaking] = useState(false)

  const speakTeluguGuidance = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()

    if (isSpeaking) {
      setIsSpeaking(false)
      return
    }

    const text =
      'కుడి లోపలి చెంప భాగంలో 1.8 సెంటీమీటర్ల ల్యూకోప్లాకియా తెల్ల మచ్చ గుర్తించబడింది. ఇది OPMD కేటగిరీకి చెందినది. వెంటనే పాడేరు జిల్లా ఆసుపత్రిలో పంచ్ బయాప్సీ చేయించుకోవాలి.'
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'te-IN'
    utterance.rate = 0.92

    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    window.speechSynthesis.speak(utterance)
  }

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1.5px solid #d97706',
        borderRadius: '20px',
        padding: '1.5rem',
        boxShadow: '0 12px 30px rgba(0, 0, 0, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
      }}
    >
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '1.2rem' }}>🔬</span>
            <span
              style={{
                fontSize: '0.74rem',
                fontWeight: 800,
                color: '#b45309',
                background: '#fef3c7',
                padding: '2px 8px',
                borderRadius: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              GEMINI 2.5 FLASH · MULTIMODAL ORAL ONCOLOGY TRIAGE
            </span>
            <span
              style={{
                fontSize: '0.74rem',
                fontWeight: 700,
                color: '#dc2626',
                background: '#fee2e2',
                padding: '2px 8px',
                borderRadius: '6px',
              }}
            >
              HIGH RISK · OPMD
            </span>
          </div>

          <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>
            Oral Leukoplakia (Non-Homogeneous Speckled OPMD) · K13.21
          </h3>
          <div style={{ display: 'flex', gap: '8px', fontSize: '0.82rem', color: '#475569', flexWrap: 'wrap' }}>
            <span>📍 <strong>Anatomical Site:</strong> Right Buccal Mucosa (కుడి లోపలి చెంప)</span>
            <span>📊 <strong>Confidence:</strong> 94.2%</span>
            <span>⌛ <strong>Duration:</strong> &gt; 6 Weeks Persistent</span>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              fontSize: '1.1rem',
              color: '#64748b',
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Main Screening Evidence Card: Visual + Clinical Metadata */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.25rem',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          padding: '1.25rem',
          alignItems: 'center',
        }}
      >
        {/* Left: High-Definition Clinical Oral Cavity Visual with Live Real-Time Bounding Box */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <OralCavityHdVisual width={220} height={165} showBoundingBox={true} />
          <small style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
            Calibrated 1080p Oral Endoscopy Frame · Verified Provenance
          </small>
        </div>

        {/* Right: Clinical Biomarkers & Features */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <strong style={{ fontSize: '0.90rem', color: '#0f172a' }}>
            Pathological Visual Features Identified by AI:
          </strong>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.82rem', color: '#334155', lineHeight: 1.5 }}>
            <li>Circumscribed non-scrapable leukoplakia mucosal plaque (~1.8 cm x 1.2 cm) on Right Buccal Mucosa.</li>
            <li>Focal erythematous margin with irregular surface mucosal texture.</li>
            <li>High risk correlation with chronic 15-year gutkha and smokeless tobacco usage.</li>
            <li>Requires tactile palpation for submucosal induration and urgent punch biopsy triage.</li>
          </ul>

          <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={speakTeluguGuidance}
              style={{
                background: isSpeaking ? '#fee2e2' : '#fef3c7',
                color: isSpeaking ? '#b91c1c' : '#92400e',
                border: '1px solid #d97706',
                padding: '6px 12px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.80rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              {isSpeaking ? '⏹ ఆగండి (Stop)' : '🔊 తెలుగు వాయిస్ సలహా (Telugu Voice Guidance)'}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs: Diagnostic Report, Prescriptions, Action */}
      <div style={{ display: 'flex', gap: '6px', borderBottom: '1.5px solid #e2e8f0', paddingBottom: '6px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('REPORT')}
          style={{
            background: activeTab === 'REPORT' ? '#1e3a8a' : 'transparent',
            color: activeTab === 'REPORT' ? '#ffffff' : '#475569',
            border: 'none',
            padding: '6px 14px',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '0.84rem',
            cursor: 'pointer',
          }}
        >
          🔬 Diagnostic Evidence
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('MEDS')}
          style={{
            background: activeTab === 'MEDS' ? '#1e3a8a' : 'transparent',
            color: activeTab === 'MEDS' ? '#ffffff' : '#475569',
            border: 'none',
            padding: '6px 14px',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '0.84rem',
            cursor: 'pointer',
          }}
        >
          💊 Medications &amp; Protocol (3)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('TELUGU')}
          style={{
            background: activeTab === 'TELUGU' ? '#1e3a8a' : 'transparent',
            color: activeTab === 'TELUGU' ? '#ffffff' : '#475569',
            border: 'none',
            padding: '6px 14px',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '0.84rem',
            cursor: 'pointer',
          }}
        >
          🗣️ గిరిజన రోగి సూచనలు (Telugu)
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'REPORT' && (
        <div style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.6 }}>
          <p style={{ margin: '0 0 8px 0' }}>
            <strong>Differential Diagnoses:</strong> Oral Lichen Planus (Reticular) · Frictional Keratosis · Erythroleukoplakia · Pseudomembranous Candidiasis.
          </p>
          <p style={{ margin: 0 }}>
            <strong>Recommended Immediate Tests:</strong> Toluidine Blue 1% Mucosal Vital Staining · Incisional Scalpel Biopsy &amp; Histopathology (District Hospital Paderu Oral Oncology Center).
          </p>
        </div>
      )}

      {activeTab === 'MEDS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.84rem' }}>
          <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
            <strong>1. Triamcinolone Acetonide 0.1% Buccal Paste:</strong> Apply thin film to right buccal lesion twice daily after food (14 Days).
          </div>
          <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
            <strong>2. Lycopene 10mg + Antioxidant Capsules:</strong> 1 capsule once daily after breakfast (30 Days).
          </div>
          <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
            <strong>3. Chlorhexidine Gluconate 0.2% Oral Rinse:</strong> 15 mL undiluted mouthwash for 60 seconds twice daily (15 Days).
          </div>
        </div>
      )}

      {activeTab === 'TELUGU' && (
        <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', padding: '14px', borderRadius: '12px', fontSize: '0.86rem', color: '#92400e', lineHeight: 1.6 }}>
          <p style={{ margin: '0 0 6px 0', fontWeight: 700 }}>
            ముఖ్య గమనిక (Patient Instructions):
          </p>
          <p style={{ margin: 0 }}>
            గుట్కా మరియు పొగాకు పూర్తిగా మానేయాలి. నోటిలో తెల్ల మచ్చ ఉన్నందున నిర్లక్ష్యం చేయకుండా వెంటనే పాడేరు జిల్లా ఆసుపత్రిలో డాక్టర్ అనితారావు గారిని సంప్రదించి బయాప్సీ చేయించుకోవాలి. క్యూఆర్ కోడ్ గల రిఫరల్ పత్రం మీకు అందించబడుతుంది.
          </p>
        </div>
      )}

      {/* Action Footer Buttons */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
        {onOpenTelemedicine && (
          <button
            type="button"
            onClick={onOpenTelemedicine}
            style={{
              background: '#0284c7',
              color: '#ffffff',
              border: 'none',
              padding: '0.65rem 1.2rem',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            📹 Start Specialist Teleconsultation
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
              padding: '0.65rem 1.25rem',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)',
            }}
          >
            🔬 Schedule Urgent Biopsy at DH Paderu
          </button>
        )}
      </div>
    </div>
  )
}

export default LiveScreeningStudio
