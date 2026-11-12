import { useState, useEffect, useRef } from 'react'
import type React from 'react'
import {
  BUJJI_QUICK_SPEECH_TOPICS,
  getTopicSpeechText,
  speakBujjiTeluguVoice,
  getNaturalGreeting,
  isGreetingIntent,
  evaluateOralSymptom,
  type BujjiLanguage,
  type QuickSpeechTopic,
} from '../utils/bujjiVoiceEngine'

export interface BujjiVoiceAssistantProps {
  currentLanguage?: string
}

export function BujjiVoiceAssistant({
  currentLanguage = 'te',
}: BujjiVoiceAssistantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [manualLanguage, setManualLanguage] = useState<BujjiLanguage | null>(null)
  const [activeTopic, setActiveTopic] = useState<QuickSpeechTopic>(
    BUJJI_QUICK_SPEECH_TOPICS[0]
  )
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [customQuery, setCustomQuery] = useState('')
  const [customReply, setCustomReply] = useState<string | null>(null)
  const [eyeBlink, setEyeBlink] = useState(false)
  const blinkTimerRef = useRef<number | null>(null)

  // Derived active language: strict Telugu First Priority
  const activeLanguage: BujjiLanguage =
    manualLanguage ??
    (currentLanguage === 'hi' ? 'HI' : currentLanguage === 'en' ? 'EN' : 'TE')

  const speakText = (text: string, lang = activeLanguage) => {
    speakBujjiTeluguVoice(
      text,
      lang,
      () => setIsSpeaking(true),
      () => setIsSpeaking(false)
    )
  }

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    setIsSpeaking(false)
  }

  // Blinking animation cycle for Bujji mascot
  useEffect(() => {
    const triggerBlink = () => {
      setEyeBlink(true)
      window.setTimeout(() => setEyeBlink(false), 150)
      const nextDelay = Math.floor(Math.random() * 2800) + 1800
      blinkTimerRef.current = window.setTimeout(triggerBlink, nextDelay)
    }
    blinkTimerRef.current = window.setTimeout(triggerBlink, 2000)
    return () => {
      if (blinkTimerRef.current) window.clearTimeout(blinkTimerRef.current)
    }
  }, [])

  // External trigger listener (e.g. from Help & Support view or Header)
  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true)
      const greeting = getNaturalGreeting(activeLanguage)
      setCustomReply(greeting)
      speakBujjiTeluguVoice(
        greeting,
        activeLanguage,
        () => setIsSpeaking(true),
        () => setIsSpeaking(false)
      )
    }
    window.addEventListener('aarogya:open-bujji', handleOpen)
    window.addEventListener('aarogya:open-sammakka', handleOpen)
    return () => {
      window.removeEventListener('aarogya:open-bujji', handleOpen)
      window.removeEventListener('aarogya:open-sammakka', handleOpen)
    }
  }, [activeLanguage])

  const handleSelectTopic = (topic: QuickSpeechTopic) => {
    setActiveTopic(topic)
    setCustomReply(null)
    const textToSpeak = getTopicSpeechText(topic, activeLanguage)
    speakText(textToSpeak, activeLanguage)
  }

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customQuery.trim()) return

    const q = customQuery.trim().toLowerCase()

    // 1. Natural Greeting Intent Check ("Hi", "Hello", "నమస్తే", "హలో", "नमस्ते")
    if (isGreetingIntent(q)) {
      const greeting = getNaturalGreeting(activeLanguage)
      setCustomReply(greeting)
      setCustomQuery('')
      speakText(greeting, activeLanguage)
      return
    }

    // 2. Clinical Symptom & Public Health Evaluation
    const isSymptomRelated =
      q.includes('పుండు') ||
      q.includes('ulcer') ||
      q.includes('మంట') ||
      q.includes('burning') ||
      q.includes('మచ్చ') ||
      q.includes('patch') ||
      q.includes('నోరు') ||
      q.includes('jaw') ||
      q.includes('దంత') ||
      q.includes('tooth') ||
      q.includes('bleeding') ||
      q.includes('గుట్కా') ||
      q.includes('పొగాకు') ||
      q.includes('tobacco') ||
      q.includes('छाले') ||
      q.includes('जलन') ||
      q.includes('धब्बा')

    if (isSymptomRelated) {
      const evaluation = evaluateOralSymptom(q, activeLanguage)
      setCustomReply(evaluation.replyText)
      setCustomQuery('')
      speakText(evaluation.replyText, activeLanguage)
      return
    }

    // 3. Fallback Topic Matching
    let matched = BUJJI_QUICK_SPEECH_TOPICS.find(
      (item) =>
        item.labelTe.toLowerCase().includes(q) ||
        item.subLabelEn.toLowerCase().includes(q) ||
        item.id.includes(q)
    )

    if (!matched) {
      if (
        q.includes('క్యాన్సర్') ||
        q.includes('లక్షణాలు') ||
        q.includes('cancer') ||
        q.includes('symptom')
      ) {
        matched = BUJJI_QUICK_SPEECH_TOPICS[1]
      } else if (
        q.includes('యాప్') ||
        q.includes('వాడాలి') ||
        q.includes('app') ||
        q.includes('guide')
      ) {
        matched = BUJJI_QUICK_SPEECH_TOPICS[4]
      } else if (
        q.includes('డాక్టర్') ||
        q.includes('వీడియో') ||
        q.includes('కాల్') ||
        q.includes('doctor') ||
        q.includes('video')
      ) {
        matched = BUJJI_QUICK_SPEECH_TOPICS[5]
      } else if (
        q.includes('డ్రోన్') ||
        q.includes('క్యాంప్') ||
        q.includes('drone') ||
        q.includes('camp')
      ) {
        matched = BUJJI_QUICK_SPEECH_TOPICS[6]
      } else {
        matched = BUJJI_QUICK_SPEECH_TOPICS[0]
      }
    }

    setActiveTopic(matched)
    const reply = getTopicSpeechText(matched, activeLanguage)
    setCustomReply(reply)
    setCustomQuery('')
    speakText(reply, activeLanguage)
  }

  // Cute Animated BUJJI AI Mascot Avatar
  const renderBujjiAvatar = (size = 46) => (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        position: 'relative',
        borderRadius: '50%',
        background:
          'radial-gradient(circle at 35% 30%, #fffbeb 0%, #fef3c7 40%, #f59e0b 80%, #d97706 100%)',
        border: '2px solid #ffffff',
        boxShadow:
          '0 4px 14px rgba(217, 119, 6, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.8)',
        overflow: 'hidden',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: '100%' }}
      >
        {/* Antenna / Glowing Sensor */}
        <circle cx="32" cy="7" r="3.5" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
        <line x1="32" y1="10" x2="32" y2="16" stroke="#d97706" strokeWidth="2" strokeLinecap="round" />

        {/* Doctor Stethoscope Collar */}
        <path
          d="M 18 42 C 18 52 46 52 46 42"
          stroke="#0284c7"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="32" cy="50" r="3" fill="#38bdf8" stroke="#0284c7" strokeWidth="1.5" />

        {/* Expressive Eyes */}
        {eyeBlink ? (
          <>
            <line x1="22" y1="28" x2="28" y2="28" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="36" y1="28" x2="42" y2="28" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
          </>
        ) : (
          <>
            <ellipse cx="25" cy="27" rx="3.5" ry="4.5" fill="#0f172a" />
            <circle cx="26" cy="25" r="1.3" fill="#ffffff" />
            <ellipse cx="39" cy="27" rx="3.5" ry="4.5" fill="#0f172a" />
            <circle cx="40" cy="25" r="1.3" fill="#ffffff" />
          </>
        )}

        {/* Cheerful Cheeks */}
        <circle cx="20" cy="33" r="3" fill="#fca5a5" opacity="0.75" />
        <circle cx="44" cy="33" r="3" fill="#fca5a5" opacity="0.75" />

        {/* Synchronized Mouth Speaking */}
        {isSpeaking ? (
          <path
            d="M 27 35 Q 32 43 37 35 Z"
            fill="#dc2626"
            stroke="#b91c1c"
            strokeWidth="1.2"
          />
        ) : (
          <path
            d="M 27 34 Q 32 39 37 34"
            stroke="#b91c1c"
            strokeWidth="2.2"
            strokeLinecap="round"
            fill="none"
          />
        )}
      </svg>
    </div>
  )

  return (
    <>
      {/* Persistent Floating Badge in Bottom-Right Corner */}
      {!isOpen && (
        <aside
          aria-label="BUJJI AI Voice Assistant"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9990,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 18px 8px 10px',
            borderRadius: '999px',
            background:
              'linear-gradient(135deg, #ffffff 0%, #fffbeb 50%, #fef3c7 100%)',
            border: '2px solid #f59e0b',
            boxShadow:
              '0 12px 30px rgba(217, 119, 6, 0.35), 0 4px 10px rgba(0, 0, 0, 0.08)',
            cursor: 'pointer',
            transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s',
          }}
          onClick={() => {
            setIsOpen(true)
            const greeting = getNaturalGreeting(activeLanguage)
            setCustomReply(greeting)
            speakText(greeting, activeLanguage)
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              setIsOpen(true)
              const greeting = getNaturalGreeting(activeLanguage)
              setCustomReply(greeting)
              speakText(greeting, activeLanguage)
            }
          }}
        >
          {renderBujjiAvatar(44)}

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#92400e' }}>
                ✦ BUJJI AI
              </span>
              <span
                style={{
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  background: '#d97706',
                  color: '#ffffff',
                  padding: '2px 6px',
                  borderRadius: '999px',
                  letterSpacing: '0.04em',
                }}
              >
                LIVE VOICE
              </span>
            </div>
            <small
              style={{
                fontSize: '0.74rem',
                color: '#b45309',
                fontWeight: 700,
                whiteSpace: 'nowrap',
              }}
            >
              ✦ BUJJI AI · వాయిస్ అసిస్టెంట్ &amp; నోటి ఆరోగ్య రక్షక్ (TE / EN / HI)
            </small>
          </div>
        </aside>
      )}

      {/* Expanded BUJJI AI Interactive Voice Modal */}
      {isOpen && (
        <aside
          role="dialog"
          aria-label="BUJJI AI Voice Assistant"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '440px',
            maxWidth: 'calc(100vw - 32px)',
            maxHeight: '660px',
            height: 'calc(100vh - 110px)',
            background: '#ffffff',
            borderRadius: '24px',
            boxShadow:
              '0 25px 60px -15px rgba(217, 119, 6, 0.45), 0 0 0 1.5px rgba(245, 158, 11, 0.35)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 9999,
            animation: 'fadeInUp 0.25s ease-out',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px 20px',
              background:
                'linear-gradient(135deg, #b45309 0%, #d97706 50%, #f59e0b 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 4px 14px rgba(180, 83, 9, 0.25)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {renderBujjiAvatar(48)}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>
                    BUJJI AI · వాయిస్ అసిస్టెంట్
                  </h3>
                  {isSpeaking && (
                    <span
                      style={{
                        background: '#ffffff',
                        color: '#b45309',
                        fontSize: '0.62rem',
                        fontWeight: 800,
                        padding: '2px 7px',
                        borderRadius: '999px',
                        animation: 'pulse 1s infinite',
                      }}
                    >
                      🗣️ మాట్లాడటం...
                    </span>
                  )}
                </div>
                <small
                  style={{
                    fontSize: '0.74rem',
                    color: '#fef3c7',
                    display: 'block',
                    marginTop: '2px',
                    fontWeight: 600,
                  }}
                >
                  నోటి ఆరోగ్య రక్షక్ · Oral Cancer Companion (ITDA Paderu)
                </small>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                stopSpeaking()
                setIsOpen(false)
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.25)',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                color: '#ffffff',
                fontSize: '1.2rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
              }}
              aria-label="Close BUJJI Assistant"
            >
              ✕
            </button>
          </div>

          {/* Multilingual Voice Hierarchy Selector */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              background: '#fef3c7',
              padding: '6px',
              borderBottom: '1px solid #fde68a',
              gap: '4px',
            }}
          >
            <button
              type="button"
              onClick={() => {
                setManualLanguage('TE')
                speakText(getTopicSpeechText(activeTopic, 'TE'), 'TE')
              }}
              style={{
                padding: '6px 8px',
                background: activeLanguage === 'TE' ? '#ffffff' : 'transparent',
                color: activeLanguage === 'TE' ? '#b45309' : '#78350f',
                border: activeLanguage === 'TE' ? '1.5px solid #d97706' : '1px solid transparent',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '0.80rem',
                cursor: 'pointer',
                boxShadow: activeLanguage === 'TE' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              🇮🇳 తెలుగు (1st)
            </button>
            <button
              type="button"
              onClick={() => {
                setManualLanguage('EN')
                speakText(getTopicSpeechText(activeTopic, 'EN'), 'EN')
              }}
              style={{
                padding: '6px 8px',
                background: activeLanguage === 'EN' ? '#ffffff' : 'transparent',
                color: activeLanguage === 'EN' ? '#b45309' : '#78350f',
                border: activeLanguage === 'EN' ? '1.5px solid #d97706' : '1px solid transparent',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '0.80rem',
                cursor: 'pointer',
                boxShadow: activeLanguage === 'EN' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              🇬🇧 English (2nd)
            </button>
            <button
              type="button"
              onClick={() => {
                setManualLanguage('HI')
                speakText(getTopicSpeechText(activeTopic, 'HI'), 'HI')
              }}
              style={{
                padding: '6px 8px',
                background: activeLanguage === 'HI' ? '#ffffff' : 'transparent',
                color: activeLanguage === 'HI' ? '#b45309' : '#78350f',
                border: activeLanguage === 'HI' ? '1.5px solid #d97706' : '1px solid transparent',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '0.80rem',
                cursor: 'pointer',
                boxShadow: activeLanguage === 'HI' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              🇮🇳 हिन्दी (3rd)
            </button>
          </div>

          {/* Scrollable Main Interactive Body */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              background: '#fafafa',
            }}
          >
            {/* Active Speech Box */}
            <div
              style={{
                background: '#ffffff',
                border: '1.5px solid #fbbf24',
                borderRadius: '16px',
                padding: '14px 16px',
                boxShadow: '0 4px 12px rgba(217, 119, 6, 0.08)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.3rem' }}>{activeTopic.icon}</span>
                  <strong style={{ fontSize: '0.92rem', color: '#92400e' }}>
                    {activeLanguage === 'HI'
                      ? activeTopic.subLabelEn
                      : activeLanguage === 'EN'
                        ? activeTopic.subLabelEn
                        : activeTopic.labelTe}
                  </strong>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() =>
                      speakText(
                        customReply ||
                          getTopicSpeechText(activeTopic, activeLanguage)
                      )
                    }
                    style={{
                      background: '#fef3c7',
                      border: '1px solid #f59e0b',
                      color: '#92400e',
                      borderRadius: '8px',
                      padding: '4px 8px',
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                    title="Replay Voice"
                  >
                    🔊 {isSpeaking ? 'వింటోంది...' : 'వినండి (Play)'}
                  </button>
                  {isSpeaking && (
                    <button
                      type="button"
                      onClick={stopSpeaking}
                      style={{
                        background: '#fee2e2',
                        border: '1px solid #f87171',
                        color: '#b91c1c',
                        borderRadius: '8px',
                        padding: '4px 8px',
                        fontSize: '0.74rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      ⏹ ఆపండి
                    </button>
                  )}
                </div>
              </div>

              <p
                style={{
                  margin: 0,
                  fontSize: '0.88rem',
                  lineHeight: 1.55,
                  color: '#1e293b',
                  fontWeight: 500,
                }}
              >
                {customReply || getTopicSpeechText(activeTopic, activeLanguage)}
              </p>
            </div>

            {/* Interactive Symptom Guidance & Awareness Workflow */}
            <div style={{ background: '#fef3c7', padding: '12px', borderRadius: '14px', border: '1px solid #fde68a' }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: '#92400e',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '8px',
                }}
              >
                🩺 నోటి లక్షణాల తనిఖీ (Interactive Symptom Check):
              </span>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {[
                  {
                    key: 'ulcer',
                    query: 'నోటిలో తగ్గని పుండు (Persistent ulcer > 14 days)',
                    label: '🔍 పుండు (>14 రోజులు)',
                  },
                  {
                    key: 'burning',
                    query: 'కారం తింటే నోరు మంటగా ఉంది (Burning sensation)',
                    label: '🌶️ కారం తింటే మంట',
                  },
                  {
                    key: 'patch',
                    query: 'నోటిలో తెల్ల లేదా ఎర్ర మచ్చ (White / Red patch)',
                    label: '⚪ తెల్ల/ఎర్ర మచ్చ',
                  },
                  {
                    key: 'jaw',
                    query: 'నోరు తెరవడం కష్టంగా ఉంది (Restricted jaw opening)',
                    label: '🤐 నోరు తెరవలేకపోవడం',
                  },
                  {
                    key: 'tooth',
                    query: 'పంటి నొప్పి మరియు చిగుళ్ళ సమస్య (Toothache)',
                    label: '🦷 పంటి నొప్పి',
                  },
                ].map((sym) => (
                  <button
                    key={sym.key}
                    type="button"
                    onClick={() => {
                      const evaluation = evaluateOralSymptom(sym.query, activeLanguage)
                      setCustomReply(evaluation.replyText)
                      speakText(evaluation.replyText, activeLanguage)
                    }}
                    style={{
                      fontSize: '0.74rem',
                      padding: '5px 10px',
                      borderRadius: '8px',
                      background: '#ffffff',
                      border: '1.2px solid #d97706',
                      color: '#92400e',
                      cursor: 'pointer',
                      fontWeight: 700,
                    }}
                  >
                    {sym.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Speech Topic Chips Header */}
            <div>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#b45309',
                  display: 'block',
                  marginBottom: '8px',
                }}
              >
                ✦ తక్షణ వాయిస్ అంశాలు (Quick Voice Topics):
              </span>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {BUJJI_QUICK_SPEECH_TOPICS.map((topic) => {
                  const isSelected = activeTopic.id === topic.id
                  return (
                    <button
                      key={topic.id}
                      type="button"
                      onClick={() => handleSelectTopic(topic)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 12px',
                        borderRadius: '12px',
                        background: isSelected ? '#fffbeb' : '#ffffff',
                        border: isSelected ? '2px solid #d97706' : '1px solid #e2e8f0',
                        cursor: 'pointer',
                        textAlign: 'left',
                        boxShadow: isSelected
                          ? '0 4px 10px rgba(217, 119, 6, 0.12)'
                          : '0 1px 3px rgba(0,0,0,0.03)',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span style={{ fontSize: '1.2rem' }}>{topic.icon}</span>
                      <div style={{ flex: 1 }}>
                        <strong
                          style={{
                            fontSize: '0.82rem',
                            color: isSelected ? '#92400e' : '#1e293b',
                            display: 'block',
                          }}
                        >
                          {topic.labelTe}
                        </strong>
                        <small style={{ fontSize: '0.70rem', color: '#64748b' }}>
                          {topic.subLabelEn}
                        </small>
                      </div>
                      <span
                        style={{
                          fontSize: '0.80rem',
                          color: isSelected ? '#d97706' : '#cbd5e1',
                        }}
                      >
                        🔊
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Custom Question Form */}
            <form onSubmit={handleCustomSubmit} style={{ marginTop: 'auto' }}>
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  background: '#ffffff',
                  border: '1.5px solid #d97706',
                  borderRadius: '12px',
                  padding: '4px 6px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                }}
              >
                <input
                  type="text"
                  value={customQuery}
                  onChange={(e) => setCustomQuery(e.target.value)}
                  placeholder="BUJJI AI ని అడగండి (e.g. క్యాన్సర్, గుట్కా, డాక్టర్)..."
                  style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    padding: '8px 10px',
                    fontSize: '0.84rem',
                    color: '#0f172a',
                  }}
                />
                <button
                  type="submit"
                  style={{
                    background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 14px',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                  }}
                >
                  🔊 అడగండి
                </button>
              </div>
            </form>
          </div>
        </aside>
      )}
    </>
  )
}

export default BujjiVoiceAssistant
