import { useEffect, useState } from 'react'

export type FeatureMottoKey =
  | 'AI_SCREENING'
  | 'SPECIALIST_REFERRAL'
  | 'TELEMEDICINE'
  | 'BIOPSY_DIAGNOSTICS'
  | 'CARE_TIMELINE'

export interface FeatureMottoDefinition {
  key: FeatureMottoKey
  badge: string
  teluguQuote: string
  englishQuote: string
  fullText: string
  frequencies: [number, number, number]
}

const FEATURE_MOTTOS: Record<FeatureMottoKey, FeatureMottoDefinition> = {
  AI_SCREENING: {
    key: 'AI_SCREENING',
    badge: 'AI-ASSISTED ORAL SCREENING',
    teluguQuote: 'సాంకేతికతతో నిశిత పరిశీలన',
    englishQuote: 'Artificial Intelligence illuminating early mucosal changes.',
    fullText:
      'సాంకేతికతతో నిశిత పరిశీలన — Artificial Intelligence illuminating early mucosal changes.',
    frequencies: [523.25, 659.25, 783.99],
  },
  SPECIALIST_REFERRAL: {
    key: 'SPECIALIST_REFERRAL',
    badge: 'SPECIALIST REFERRAL & HOSPITAL DISCOVERY',
    teluguQuote: 'సరైన సమయంలో నిపుణుల సేవ',
    englishQuote: 'Connecting remote villages to trusted hospital specialists.',
    fullText:
      'సరైన సమయంలో నిపుణుల సేవ — Connecting remote villages to trusted hospital specialists.',
    frequencies: [440, 554.37, 659.25],
  },
  TELEMEDICINE: {
    key: 'TELEMEDICINE',
    badge: 'TELEMEDICINE VIDEO CONSULTATION',
    teluguQuote: 'దూరాన్ని చెరిపేసే దృశ్య సంప్రదింపు',
    englishQuote: 'Distance is no barrier to compassionate medical care.',
    fullText:
      'దూరాన్ని చెరిపేసే దృశ్య సంప్రదింపు — Distance is no barrier to compassionate medical care.',
    frequencies: [493.88, 622.25, 739.99],
  },
  BIOPSY_DIAGNOSTICS: {
    key: 'BIOPSY_DIAGNOSTICS',
    badge: 'BIOPSY & HISTOPATHOLOGY DIAGNOSTICS',
    teluguQuote: 'నిర్ధారణే చికిత్సకు పునాది',
    englishQuote: 'Accurate histopathology paving the path to recovery.',
    fullText:
      'నిర్ధారణే చికిత్సకు పునాది — Accurate histopathology paving the path to recovery.',
    frequencies: [587.33, 739.99, 880],
  },
  CARE_TIMELINE: {
    key: 'CARE_TIMELINE',
    badge: 'LONGITUDINAL CARE TIMELINE',
    teluguQuote: 'ప్రతి అడుగు పర్యవేక్షణ',
    englishQuote: "Every patient's journey tracked with uncompromised dignity.",
    fullText:
      "ప్రతి అడుగు పర్యవేక్షణ — Every patient's journey tracked with uncompromised dignity.",
    frequencies: [523.25, 698.46, 880],
  },
}

const ORAL_HEALTH_CURE_QUOTATIONS = [
  'ముందస్తు గుర్తింపుతో నోటి క్యాన్సర్ను 100% నయం చేయవచ్చు — Early detection ensures complete cure.',
  'పొగాకు, గుట్కా మానుదాం — సంపూర్ణ ఆరోగ్యాన్ని కాపాడుకుందాం — Say no to tobacco, choose radiant health.',
  'నోటి పూతలు 2 వారాల కంటే ఎక్కువ ఉంటే నిర్లక్ష్యం వద్దు — Never ignore persistent mouth ulcers beyond 14 days.',
  'గ్రామీణ ప్రాంతాలకు సాంకేతికత రక్షణ — Transforming tribal healthcare with timely diagnosis.',
] as const

function playFeatureChime(frequencies: [number, number, number]) {
  if (typeof window === 'undefined') return
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext
  if (!AudioCtx) return
  try {
    const ctx = new AudioCtx()
    const now = ctx.currentTime
    frequencies.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now + idx * 0.09)
      gain.gain.setValueAtTime(0.0001, now + idx * 0.09)
      gain.gain.exponentialRampToValueAtTime(0.045, now + idx * 0.09 + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.09 + 0.55)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now + idx * 0.09)
      osc.stop(now + idx * 0.09 + 0.6)
    })
  } catch {
    // Ignore audio context autoplay restrictions
  }
}

export function OralHealthAwarenessTicker() {
  const repeatedItems = [
    ...ORAL_HEALTH_CURE_QUOTATIONS,
    ...ORAL_HEALTH_CURE_QUOTATIONS,
  ]

  return (
    <div
      className="oral-awareness-ticker"
      role="region"
      aria-label="Oral Health Cure Awareness Quotations"
    >
      <div className="oral-awareness-ticker-badge">
        <span className="oral-awareness-spark" aria-hidden="true">
          ✦
        </span>
        <span>ORAL CARE AWARENESS</span>
      </div>
      <div className="oral-awareness-marquee-viewport">
        <div className="oral-awareness-marquee-track">
          {repeatedItems.map((quote, index) => (
            <span className="oral-awareness-item" key={`${index}-${quote.slice(0, 12)}`}>
              <span className="oral-awareness-dot" aria-hidden="true">
                ●
              </span>
              {quote}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function FeatureQuotationCard({
  motto,
  onComplete,
}: {
  motto: FeatureMottoDefinition
  onComplete: () => void
}) {
  const [typedChars, setTypedChars] = useState(0)

  useEffect(() => {
    playFeatureChime(motto.frequencies)

    const totalLen = motto.fullText.length
    const stepMs = Math.max(12, Math.floor(1100 / Math.max(1, totalLen)))
    const typingInterval = window.setInterval(() => {
      setTypedChars((current) => {
        if (current >= totalLen) {
          window.clearInterval(typingInterval)
          return totalLen
        }
        return current + 2
      })
    }, stepMs)

    const closeTimer = window.setTimeout(() => {
      onComplete()
    }, 1350)

    return () => {
      window.clearInterval(typingInterval)
      window.clearTimeout(closeTimer)
    }
  }, [motto, onComplete])

  return (
    <div
      className="feature-motto-overlay"
      role="status"
      aria-live="polite"
      onClick={onComplete}
      style={{
        pointerEvents: 'none',
        alignItems: 'flex-start',
        paddingTop: '1rem',
        background: 'transparent',
        backdropFilter: 'none',
      }}
    >
      <div
        className="feature-motto-card"
        style={{
          pointerEvents: 'auto',
          padding: '0.85rem 1.4rem',
          maxWidth: '680px',
          borderRadius: '20px',
        }}
      >
        <div className="feature-motto-ring" aria-hidden="true" />
        <span className="feature-motto-badge">✦ {motto.badge}</span>
        <h2 className="feature-motto-telugu" style={{ fontSize: '1.15rem', margin: '0.25rem 0' }}>
          {motto.teluguQuote}
        </h2>
        <p className="feature-motto-typing" style={{ fontSize: '0.88rem', minHeight: '1.4em' }}>
          {motto.fullText.slice(0, typedChars)}
          <span className="feature-motto-cursor" aria-hidden="true">
            |
          </span>
        </p>
      </div>
    </div>
  )
}

export function FeatureQuotationReveal({
  featureKey,
  onComplete,
}: {
  featureKey: FeatureMottoKey | null
  onComplete: () => void
}) {
  const motto = featureKey ? FEATURE_MOTTOS[featureKey] : null
  if (!motto) return null

  return (
    <FeatureQuotationCard
      key={motto.key}
      motto={motto}
      onComplete={onComplete}
    />
  )
}
