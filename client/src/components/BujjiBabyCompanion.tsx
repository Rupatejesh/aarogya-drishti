import { useState, useEffect, useRef } from 'react'

export interface BujjiBabyCompanionProps {
  language?: 'te' | 'en' | 'hi'
  onOpenScreening?: () => void
  onOpenTelemedicine?: () => void
}

export function BujjiBabyCompanion({
  language = 'te',
  onOpenScreening,
  onOpenTelemedicine,
}: BujjiBabyCompanionProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [eyeBlink, setEyeBlink] = useState(false)
  const [isWaving, setIsWaving] = useState(false)
  const [activeTip, setActiveTip] = useState(0)

  const blinkTimerRef = useRef<number | null>(null)

  const BUJJI_TIPS = [
    {
      te: 'నమస్కారం! నేను బుజ్జిని! నోటి లోపల ఫోటో తీసేటప్పుడు లైట్ సరిగ్గా ఉండేలా చూసుకోండి!',
      en: 'Hello! I am Bujji! Make sure oral illumination is bright and clear when taking photos!',
      hi: 'नमस्ते! मैं बुज्जी हूँ! मुंह की फोटो लेते समय अच्छी रोशनी का ध्यान रखें!',
    },
    {
      te: 'నోటిలో 14 రోజుల కంటే ఎక్కువ తెల్ల మచ్చ ఉంటే వెంటనే స్క్రీనింగ్ చేయించుకోండి!',
      en: 'If you have a white mouth patch for more than 14 days, get screened immediately!',
      hi: 'अगर मुंह में 14 दिनों से सफेद धब्बा है तो तुरंत जांच कराएं!',
    },
    {
      te: 'పాడేరు డిస్ట్రిక్ట్ హాస్పిటల్ డాక్టర్ గారితో ఉచితంగా వీడియో కాల్ మాట్లాడవచ్చు!',
      en: 'You can connect for free with District Hospital Paderu specialist doctors via video call!',
      hi: 'पाडेरू जिला अस्पताल के विशेषज्ञ डॉक्टरों से मुफ्त वीडियो कॉल करें!',
    },
    {
      te: 'పొగాకు, గుట్కా మానుకుంటే నోటి క్యాన్సర్ ప్రమాదాన్ని పూర్తిగా నివారించవచ్చు!',
      en: 'Quitting tobacco and gutkha completely eliminates the risk of oral cancer!',
      hi: 'तंबाकू और गुटखा छोड़ने से ओरल कैंसर के खतरे से पूरी तरह बचा जा सकता है!',
    },
  ]

  // Blinking cycle
  useEffect(() => {
    const triggerBlink = () => {
      setEyeBlink(true)
      window.setTimeout(() => setEyeBlink(false), 150)
      blinkTimerRef.current = window.setTimeout(triggerBlink, Math.random() * 3000 + 2000)
    }
    blinkTimerRef.current = window.setTimeout(triggerBlink, 2000)
    return () => {
      if (blinkTimerRef.current) window.clearTimeout(blinkTimerRef.current)
    }
  }, [])

  const speakTip = (index: number) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()

    const tip = BUJJI_TIPS[index]
    const text = language === 'hi' ? tip.hi : language === 'en' ? tip.en : tip.te
    const utterance = new SpeechSynthesisUtterance(text)

    utterance.lang = language === 'te' ? 'te-IN' : language === 'hi' ? 'hi-IN' : 'en-IN'
    utterance.pitch = 1.3
    utterance.rate = 0.95

    const voices = window.speechSynthesis.getVoices()
    const matchedVoice = voices.find(
      (v) =>
        v.lang.toLowerCase() === utterance.lang.toLowerCase() ||
        (language === 'te' && (v.lang.includes('te') || v.name.toLowerCase().includes('telugu'))) ||
        (language === 'hi' && (v.lang.includes('hi') || v.name.toLowerCase().includes('hindi'))),
    )
    if (matchedVoice) utterance.voice = matchedVoice

    utterance.onstart = () => {
      setIsSpeaking(true)
      setIsWaving(true)
    }
    utterance.onend = () => {
      setIsSpeaking(false)
      setIsWaving(false)
    }
    utterance.onerror = () => {
      setIsSpeaking(false)
      setIsWaving(false)
    }

    window.speechSynthesis.speak(utterance)
  }

  const handleMascotClick = () => {
    setIsWaving(true)
    window.setTimeout(() => setIsWaving(false), 800)
    const nextTip = (activeTip + 1) % BUJJI_TIPS.length
    setActiveTip(nextTip)
    setIsOpen(true)
    speakTip(nextTip)
  }

  return (
    <>
      {/* Floating Animated Mascot */}
      <div
        style={{
          position: 'fixed',
          bottom: '88px',
          right: '24px',
          zIndex: 9980,
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          animation: 'floatBujji 3s ease-in-out infinite',
          transition: 'transform 0.2s',
        }}
        onClick={handleMascotClick}
        role="button"
        tabIndex={0}
        aria-label="Bujji Baby Mascot"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') handleMascotClick()
        }}
      >
        {/* Glow Aura */}
        <div
          style={{
            position: 'absolute',
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(251, 191, 36, 0.4) 0%, rgba(245, 158, 11, 0) 70%)',
            animation: 'pulse 2s infinite',
            zIndex: -1,
          }}
        />

        {/* Cute Mascot SVG */}
        <svg
          width="54"
          height="54"
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            filter: 'drop-shadow(0 4px 10px rgba(217, 119, 6, 0.35))',
            transform: isWaving ? 'rotate(8deg) scale(1.08)' : 'none',
            transition: 'transform 0.2s ease',
          }}
        >
          {/* Head */}
          <circle cx="32" cy="30" r="24" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="2.5" />

          {/* Hair Bun / Cap */}
          <ellipse cx="32" cy="10" rx="10" ry="6" fill="#F59E0B" />
          <circle cx="32" cy="7" r="4" fill="#D97706" />

          {/* Stethoscope around neck */}
          <path
            d="M 18 36 C 18 48 46 48 46 36"
            stroke="#0284C7"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="32" cy="46" r="3.5" fill="#38BDF8" stroke="#0284C7" strokeWidth="1.5" />

          {/* Eyes (Blinking) */}
          {eyeBlink ? (
            <>
              <line x1="22" y1="26" x2="28" y2="26" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="36" y1="26" x2="42" y2="26" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" />
            </>
          ) : (
            <>
              <ellipse cx="25" cy="25" rx="3.5" ry="4.5" fill="#1E293B" />
              <circle cx="26" cy="23.5" r="1.3" fill="#FFFFFF" />
              <ellipse cx="39" cy="25" rx="3.5" ry="4.5" fill="#1E293B" />
              <circle cx="40" cy="23.5" r="1.3" fill="#FFFFFF" />
            </>
          )}

          {/* Cheerful Rosy Cheeks */}
          <circle cx="20" cy="31" r="3" fill="#FCA5A5" opacity="0.65" />
          <circle cx="44" cy="31" r="3" fill="#FCA5A5" opacity="0.65" />

          {/* Smile / Mouth Speaking */}
          {isSpeaking ? (
            <path
              d="M 27 33 Q 32 40 37 33 Z"
              fill="#DC2626"
              stroke="#B91C1C"
              strokeWidth="1"
            />
          ) : (
            <path
              d="M 27 32 Q 32 37 37 32"
              stroke="#B91C1C"
              strokeWidth="2.2"
              strokeLinecap="round"
              fill="none"
            />
          )}

          {/* Waving Hand */}
          <ellipse
            cx={isWaving ? '50' : '46'}
            cy={isWaving ? '24' : '36'}
            rx="4"
            ry="4"
            fill="#FEF3C7"
            stroke="#F59E0B"
            strokeWidth="2"
          />
        </svg>

        <span
          style={{
            fontSize: '0.68rem',
            fontWeight: 800,
            background: '#ffffff',
            color: '#b45309',
            border: '1px solid #f59e0b',
            borderRadius: '999px',
            padding: '1px 6px',
            marginTop: '-2px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
            whiteSpace: 'nowrap',
          }}
        >
          🤖 బుజ్జి (Bujji)
        </span>
      </div>

      {/* Speech Bubble / Mini Guidance Modal */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '160px',
            right: '24px',
            width: '310px',
            background: '#ffffff',
            border: '2px solid #f59e0b',
            borderRadius: '18px',
            padding: '14px 16px',
            boxShadow: '0 16px 36px rgba(217, 119, 6, 0.25)',
            zIndex: 9985,
            animation: 'fadeInUp 0.2s ease-out',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '1rem' }}>🤖</span>
              <strong style={{ fontSize: '0.88rem', color: '#92400e' }}>
                బుజ్జి మార్గదర్శనం (Bujji Voice Advice)
              </strong>
            </div>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                  window.speechSynthesis.cancel()
                }
                setIsSpeaking(false)
                setIsOpen(false)
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                fontSize: '1.2rem',
                cursor: 'pointer',
              }}
            >
              ×
            </button>
          </div>

          <p style={{ margin: '0 0 10px 0', fontSize: '0.84rem', color: '#1e293b', lineHeight: 1.45 }}>
            {language === 'hi'
              ? BUJJI_TIPS[activeTip].hi
              : language === 'en'
                ? BUJJI_TIPS[activeTip].en
                : BUJJI_TIPS[activeTip].te}
          </p>

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => speakTip(activeTip)}
              style={{
                background: '#fef3c7',
                border: '1px solid #f59e0b',
                color: '#92400e',
                borderRadius: '8px',
                padding: '4px 8px',
                fontSize: '0.74rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              🔊 మళ్లీ వినండి (Replay)
            </button>
            {onOpenScreening && (
              <button
                type="button"
                onClick={onOpenScreening}
                style={{
                  background: '#0284c7',
                  border: 'none',
                  color: '#ffffff',
                  borderRadius: '8px',
                  padding: '4px 8px',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                📸 స్క్రీనింగ్ (Screening)
              </button>
            )}
            {onOpenTelemedicine && (
              <button
                type="button"
                onClick={onOpenTelemedicine}
                style={{
                  background: '#15803d',
                  border: 'none',
                  color: '#ffffff',
                  borderRadius: '8px',
                  padding: '4px 8px',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                📹 డాక్టర్ కాల్ (Video Call)
              </button>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default BujjiBabyCompanion
