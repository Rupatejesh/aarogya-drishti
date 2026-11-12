import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Volume2,
  VolumeX,
  Square,
  Compass,
  Play,
  Languages,
  X,
  MessageCircle,
  HelpCircle,
  Activity,
  Stethoscope,
  Smile,
  Zap,
  Info
} from 'lucide-react';
import { Language } from '../i18n/translations.ts';

interface AiArogyaAarohiBotProps {
  lang: Language;
  onLanguageChange?: (lang: Language) => void;
}

export const AiArogyaAarohiBot: React.FC<AiArogyaAarohiBotProps> = ({
  lang,
  onLanguageChange
}) => {
  // Positioning & State
  const [position, setPosition] = useState<{ x: number; y: number }>({
    x: window.innerWidth - 340,
    y: window.innerHeight - 380
  });
  const [isMinimized, setIsMinimized] = useState(false);
  const [isInspectorActive, setIsInspectorActive] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isDoingWindWheel, setIsDoingWindWheel] = useState(false);
  const [soundMuted, setSoundMuted] = useState(false);

  // Inspector Highlight Overlay
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const [inspectedElementTitle, setInspectedElementTitle] = useState<string>('');

  // Speech bubble content
  const [currentSpeech, setCurrentSpeech] = useState<{
    en: string;
    te: string;
    hi: string;
  }>({
    en: "Namaste! I am AI Aarohi Bot, your female robot doctor assistant. Click 'Point & Explain' to inspect any medical tool, or click 'Wind Wheel' for my gymnastic trick!",
    te: "నమస్కారం! నేను ఏఐ ఆరోహి బోట్, మీ రోబో డాక్టర్ సహాయకురాలిని. ఏదైనా అంశాన్ని తెలుసుకోవడానికి 'పాయింట్ & వివరణ' క్లిక్ చేయండి లేదా నా 'గాలి చక్రం' జిమ్నాస్టిక్ చూడండి!",
    hi: "नमस्ते! मैं एआई आरोही बॉट हूँ, आपकी महिला रोबोट डॉक्टर सहायक। किसी भी मेडिकल टूल की जानकारी के लिए 'पॉइंट व व्याख्या' पर क्लिक करें या मेरा 'पवन चक्र' देखें!"
  });

  const botRef = useRef<HTMLDivElement>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  // Window resize bounds handler
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => ({
        x: Math.min(prev.x, window.innerWidth - 320),
        y: Math.min(prev.y, window.innerHeight - 320)
      }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Stop Voice speech synthesis
  const stopVoice = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setIsSpeaking(false);
  };

  // Speak aloud via Web Speech API
  const speakAloud = (textObj: { en: string; te: string; hi: string }) => {
    if (soundMuted || !synthRef.current) return;

    synthRef.current.cancel();

    const textToSpeak = textObj[lang] || textObj.en;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);

    // Pick appropriate voice
    const voices = synthRef.current.getVoices();
    let targetVoice = null;

    if (lang === 'te') {
      targetVoice = voices.find((v) => v.lang.includes('te') || v.lang.includes('Telugu'));
    } else if (lang === 'hi') {
      targetVoice = voices.find((v) => v.lang.includes('hi') || v.lang.includes('Hindi'));
    } else {
      targetVoice = voices.find(
        (v) => (v.lang.includes('en-IN') || v.lang.includes('en-GB') || v.lang.includes('en')) &&
          (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('zira') || v.name.toLowerCase().includes('google'))
      );
    }

    if (targetVoice) {
      utterance.voice = targetVoice;
    }

    // Set cheerful, friendly female doctor pitch & speed
    utterance.pitch = 1.15;
    utterance.rate = 0.95;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthRef.current.speak(utterance);
  };

  // Gymnastic Wind-Wheel Trigger
  const triggerGymnasticWindWheel = () => {
    if (isDoingWindWheel) return;
    setIsDoingWindWheel(true);

    const speech = {
      en: "Watch my gymnastic acrobatic wind-wheel! Keeping healthcare vibrant and energetic for all 11 Mandals!",
      te: "చూడండి నా జిమ్నాస్టిక్ గాలి చక్రం విన్యాసం! 11 మండలాల ప్రజల ఆరోగ్యం మరియు ఉల్లాసం కోసం!",
      hi: "देखिए मेरा जिम्नास्टिक पवन चक्र करतब! सभी 11 मंडलों के स्वास्थ्य और ऊर्जा के लिए!"
    };
    setCurrentSpeech(speech);
    speakAloud(speech);

    setTimeout(() => {
      setIsDoingWindWheel(false);
    }, 1300);
  };

  // Clinical explanations database for interactive element inspector
  const getClinicalExplanation = (target: HTMLElement) => {
    const text = (target.innerText || target.getAttribute('aria-label') || target.getAttribute('title') || '').toLowerCase();
    const tag = target.tagName.toLowerCase();

    // 1. Live Telemedicine Video Call
    if (text.includes('video') || text.includes('telemedicine') || text.includes('call') || text.includes('కాల్') || text.includes('సంప్రదింపులు')) {
      return {
        title: 'WebRTC Telemedicine Video Room',
        en: 'Encrypted WebRTC P2P tele-oncology consultation connecting tribal patients directly with Dr. Swapna Devi or Dr. Anil Kumar with low-latency audio/video.',
        te: 'గిరిజన రోగులు మరియు క్యాన్సర్ వైద్యుల మధ్య సురక్షితమైన లైవ్ వెబ్‌ఆర్‌టిసి వీడియో సంప్రదింపుల సదుపాయం.',
        hi: 'सुरक्षित वेबआरटीसी वीडियो परामर्श कक्ष, जो मरीजों को सीधे कैंसर विशेषज्ञ डॉक्टरों से जोड़ता है।'
      };
    }

    // 2. AI Mouth Screening / Camera
    if (text.includes('photo') || text.includes('camera') || text.includes('screen') || text.includes('నోటి') || text.includes('కెమెరా') || text.includes('ముఖ')) {
      return {
        title: 'Multimodal Gemini AI Oral Scanner',
        en: 'Clinical onco-imaging reticle designed to detect early Leukoplakia, Erythroplakia, and submucous fibrosis caused by Adda Poga (reverse smoking) and tobacco chewing.',
        te: 'అడ్డాపొగ, ఖైనీ అలవాట్ల వల్ల వచ్చే ల్యూకోప్లాకియా వంటి నోటి క్యాన్సర్ ప్రాథమిక లక్షణాలను గుర్తించే మల్టీమోడల్ ఏఐ స్కానర్.',
        hi: 'रिवर्स स्मोकिंग और तंबाकू से होने वाले ल्यूकोप्लाकिया व मुख घावों की प्रारंभिक जांच करने वाला एआई स्कैनर।'
      };
    }

    // 3. Golden Health Card
    if (text.includes('card') || text.includes('golden') || text.includes('కార్డ్') || text.includes('కార్డు') || text.includes('कार्ड')) {
      return {
        title: 'Aarogya Drishti Golden Health Card',
        en: 'Unified tribal digital health card containing patient UIDN, emergency contacts, biomarker risk ratings, and instant QR/Barcode access for doctors.',
        te: 'రోగి ప్రత్యేక యూఐడీఎన్, బయోమార్కర్ వివరాలు మరియు అత్యవసర ఆరోగ్య సమాచారంతో కూడిన గోల్డెన్ డిజిటల్ కార్డు.',
        hi: 'मरीज का विशिष्ट यूआईडीएन, बायोमार्कर रेटिंग और आपातकालीन स्वास्थ्य विवरण युक्त डिजिटल गोल्डन हेल्थ कार्ड।'
      };
    }

    // 4. Habit Cessation Tracker
    if (text.includes('habit') || text.includes('cessation') || text.includes('smoking') || text.includes('పొగాకు') || text.includes('అలవాటు') || text.includes('आदत')) {
      return {
        title: 'Habit Cessation Tracker (Adda Poga)',
        en: 'Behavioral addiction tracker monitoring tobacco-free days, oral mucosal healing progress, and craving reduction strategies tailored for agency mandals.',
        te: 'అడ్డాపొగ మరియు పొగాకు అలవాట్లను మానిపించడానికి, నోటి కణజాలం కోలుకోవడాన్ని ట్రాక్ చేసే సహాయక వ్యవస్థ.',
        hi: 'तंबाकू एवं रिवर्स स्मोकिंग मुक्ति ट्रैकर जो मरीजों के व्यसन मुक्ति दिनों व घाव सुधार की निगरानी करता है।'
      };
    }

    // 5. Book Appointment
    if (text.includes('appointment') || text.includes('book') || text.includes('అపాయింట్‌మెంట్') || text.includes('अपॉइंटमेंट')) {
      return {
        title: 'Doctor Appointment Booking Engine',
        en: 'Schedule online video tele-consultations or in-person OPD hospital visits at any of the 11 Mandals health centres with selected specialists.',
        te: '11 మండలాల ఆసుపత్రుల వద్ద లేదా ఆన్‌లైన్ ద్వారా మీకు కావలసిన వైద్యుని అపాయింట్‌మెంట్ బుక్ చేసుకునే సదుపాయం.',
        hi: '11 मंडलों के अस्पतालों में प्रत्यक्ष या ऑनलाइन वीडियो परामर्श हेतु विशेषज्ञ डॉक्टर की अपॉइंटमेंट बुक करें।'
      };
    }

    // 6. Emergency 108/104 SOS
    if (text.includes('sos') || text.includes('emergency') || text.includes('108') || text.includes('104') || text.includes('అత్యవసర') || text.includes('आपात')) {
      return {
        title: 'Tribal Emergency SOS (108 / 104)',
        en: 'Direct emergency hotline dispatching 108 four-wheel-drive tribal ambulances and connecting to 104 medical advice helplines across agency terrains.',
        te: 'అత్యవసర పరిస్థితుల్లో 108 అంబులెన్స్ మరియు 104 వైద్య సలహా కోసం తక్షణ కాలింగ్ సదుపాయం.',
        hi: 'आपात स्थिति में 108 एम्बुलेंस और 104 स्वास्थ्य सलाह हेतु तत्काल सहायता हॉटलाइन।'
      };
    }

    // 7. 11 Mandals / Hospitals Directory
    if (text.includes('mandal') || text.includes('hospital') || text.includes('11') || text.includes('మండల') || text.includes('ఆసుపత్రి') || text.includes('अस्पताल')) {
      return {
        title: '11 Mandals Healthcare Command Grid',
        en: 'Administrative registry tracking CHCs, PHCs, Area Hospitals, biopsy punch tools, and medical officers across all 11 ITDA Paderu mandals.',
        te: 'పాడేరు, అరకు, చింతపల్లి సహా అల్లూరి జిల్లాలోని 11 మండలాల ఆసుపత్రులు మరియు బయాప్సీ సేవల నెట్‌వర్క్.',
        hi: 'पाडेरू, अरकु, चिंतापल्ली सहित सभी 11 मंडलों के अस्पतालों व बायोप्सी सुविधाओं का नेटवर्क।'
      };
    }

    // 8. Doctor / Admin Workspace & Credentials
    if (text.includes('doctor') || text.includes('admin') || text.includes('credentials') || text.includes('డాక్టర్') || text.includes('అడ్మిన్') || text.includes('डॉक्टर')) {
      return {
        title: 'Verified Medical Officer Registry',
        en: 'Secure portal for doctors to review incoming triage cases, prescribe oral mucosal medicines, order 4mm punch biopsies, and update active duty status.',
        te: 'వైద్యులు రోగుల వివరాలు పరిశీలించి, మందుల ప్రిస్క్రిప్షన్ మరియు బయాప్సీ ఆదేశాలు జారీ చేసే క్లినికల్ వర్క్‌స్పేస్.',
        hi: 'डॉक्टरों हेतु क्लिनिकल कार्यक्षेत्र जहां वे मरीजों की जांच कर दवाइयां व बायोप्सी लिख सकते हैं।'
      };
    }

    // General fallback
    const title = target.getAttribute('title') || target.tagName.toUpperCase();
    return {
      title: `Clinical UI Element: ${title}`,
      en: `This interactive control assists you with ${text.slice(0, 50) || 'clinical navigation'} within the Aarogya Drishti oncology network.`,
      te: `ఈ బటన్ లేదా భాగం ఆరోగ్య దృష్టి పోర్టల్‌లో ముఖ్యమైన వైద్య సేవలను అందిస్తుంది.`,
      hi: `यह विकल्प आरोग्य दृष्टि नेटवर्क में महत्वपूर्ण स्वास्थ्य सेवाएं संचालित करता है।`
    };
  };

  // Global Inspector Click & Hover Listener
  useEffect(() => {
    if (!isInspectorActive) {
      setHighlightRect(null);
      return;
    }

    const handlePointerMove = (e: MouseEvent) => {
      const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
      if (!el || botRef.current?.contains(el)) return;

      const rect = el.getBoundingClientRect();
      setHighlightRect(rect);
    };

    const handleClick = (e: MouseEvent) => {
      const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
      if (!el || botRef.current?.contains(el)) return;

      e.preventDefault();
      e.stopPropagation();

      const rect = el.getBoundingClientRect();
      setHighlightRect(rect);

      // Glide Aarohi Bot smoothly next to the inspected element
      const targetX = Math.max(20, Math.min(window.innerWidth - 340, rect.right + 20));
      const targetY = Math.max(20, Math.min(window.innerHeight - 340, rect.top - 20));
      setPosition({ x: targetX, y: targetY });

      // Retrieve clinical explanation
      const explanation = getClinicalExplanation(el);
      setInspectedElementTitle(explanation.title);
      setCurrentSpeech(explanation);
      speakAloud(explanation);
    };

    document.addEventListener('mousemove', handlePointerMove);
    document.addEventListener('click', handleClick, true);

    return () => {
      document.removeEventListener('mousemove', handlePointerMove);
      document.removeEventListener('click', handleClick, true);
    };
  }, [isInspectorActive, lang, soundMuted]);

  return (
    <>
      {/* 1. Element Inspector Glowing Reticle Overlay */}
      {isInspectorActive && highlightRect && (
        <div
          className="fixed pointer-events-none z-50 transition-all duration-150 rounded-xl border-2 border-cyan-400 bg-cyan-400/10 shadow-[0_0_20px_rgba(103,232,249,0.6)]"
          style={{
            top: `${highlightRect.top - 4}px`,
            left: `${highlightRect.left - 4}px`,
            width: `${highlightRect.width + 8}px`,
            height: `${highlightRect.height + 8}px`
          }}
        >
          <span className="absolute -top-6 left-0 bg-slate-900 text-cyan-300 font-mono text-[10px] font-bold px-2 py-0.5 rounded shadow border border-cyan-500/50 flex items-center space-x-1">
            <Sparkles className="w-2.5 h-2.5 animate-spin" />
            <span>Aarohi Inspector • Click to Explain</span>
          </span>
        </div>
      )}

      {/* 2. Floating AI Aarohi Bot Container */}
      <div
        ref={botRef}
        className="fixed z-50 transition-transform duration-500 ease-out select-none print:hidden"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`
        }}
      >
        <div className="relative flex flex-col items-end">
          {/* A. Speech Bubble */}
          {!isMinimized && (
            <div className="mb-2 max-w-[320px] w-80 bg-white/95 backdrop-blur-md rounded-2xl p-3.5 border-2 border-[#088395] shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-2">
              {/* Bubble Header */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <span className="font-extrabold text-xs text-[#0A4D68] tracking-wide">
                    AI AAROHI BOT (ఏఐ ఆరోహి)
                  </span>
                  <span className="text-[9px] bg-amber-100 text-[#D97706] font-bold px-1.5 py-0.2 rounded border border-amber-300">
                    MD-AI
                  </span>
                </div>

                <div className="flex items-center space-x-1">
                  {/* Language switch pills inside Aarohi Bot */}
                  {onLanguageChange && (
                    <div className="flex items-center bg-slate-100 rounded-lg p-0.5 text-[9px] font-bold">
                      <button
                        onClick={() => onLanguageChange('en')}
                        className={`px-1.5 py-0.5 rounded ${lang === 'en' ? 'bg-[#0A4D68] text-white' : 'text-slate-600'}`}
                      >
                        EN
                      </button>
                      <button
                        onClick={() => onLanguageChange('te')}
                        className={`px-1.5 py-0.5 rounded ${lang === 'te' ? 'bg-[#0A4D68] text-white' : 'text-slate-600'}`}
                      >
                        తె
                      </button>
                      <button
                        onClick={() => onLanguageChange('hi')}
                        className={`px-1.5 py-0.5 rounded ${lang === 'hi' ? 'bg-[#0A4D68] text-white' : 'text-slate-600'}`}
                      >
                        हि
                      </button>
                    </div>
                  )}

                  {/* Close bubble */}
                  <button
                    onClick={() => setIsMinimized(true)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors"
                    title="Minimize Aarohi"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Element Title when inspected */}
              {inspectedElementTitle && (
                <div className="text-[10px] font-extrabold text-[#088395] bg-cyan-50 px-2 py-0.5 rounded mb-1.5 inline-block">
                  📍 {inspectedElementTitle}
                </div>
              )}

              {/* Explanatory Message in current language */}
              <p className="text-xs text-slate-800 font-medium leading-relaxed">
                {currentSpeech[lang] || currentSpeech.en}
              </p>

              {/* Speaking Voice Indicator & Controls */}
              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between gap-1 text-[10px]">
                {/* Voice Status Pill */}
                <div className="flex items-center space-x-1.5 text-slate-500 font-semibold">
                  {isSpeaking ? (
                    <>
                      <span className="flex space-x-0.5 items-end h-3">
                        <span className="w-0.5 bg-[#088395] animate-[bounce_0.6s_infinite_100ms] h-3 rounded-full" />
                        <span className="w-0.5 bg-cyan-400 animate-[bounce_0.6s_infinite_300ms] h-2 rounded-full" />
                        <span className="w-0.5 bg-[#D97706] animate-[bounce_0.6s_infinite_200ms] h-3.5 rounded-full" />
                      </span>
                      <span className="text-[#088395] font-bold">Speaking...</span>
                    </>
                  ) : (
                    <span className="text-slate-400">Voice ready</span>
                  )}
                </div>

                <div className="flex items-center space-x-1">
                  {/* STOP VOICE BUTTON (COMPULSORY FEATURE) */}
                  {isSpeaking && (
                    <button
                      onClick={stopVoice}
                      className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-lg shadow-sm flex items-center space-x-1 transition-all animate-pulse"
                      title="Stop speaking immediately"
                    >
                      <Square className="w-2.5 h-2.5 fill-current" />
                      <span>Stop Voice ⏹️</span>
                    </button>
                  )}

                  {/* Re-play voice if not speaking */}
                  {!isSpeaking && (
                    <button
                      onClick={() => speakAloud(currentSpeech)}
                      className="p-1 text-slate-600 hover:text-[#088395] hover:bg-slate-100 rounded-md transition-colors"
                      title="Speak explanation aloud"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Sound Mute Toggle */}
                  <button
                    onClick={() => {
                      if (isSpeaking) stopVoice();
                      setSoundMuted(!soundMuted);
                    }}
                    className={`p-1 rounded-md transition-colors ${
                      soundMuted ? 'text-red-500 bg-red-50' : 'text-slate-400 hover:text-slate-700'
                    }`}
                    title={soundMuted ? 'Unmute voice' : 'Mute voice'}
                  >
                    {soundMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* B. Action Quick Bar above Robot */}
          <div className="flex items-center space-x-1.5 mb-1.5 bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-full border border-slate-700 shadow-lg text-[10px] text-white">
            {/* Inspector Toggle */}
            <button
              onClick={() => setIsInspectorActive(!isInspectorActive)}
              className={`px-2 py-0.5 rounded-full font-bold transition-all flex items-center space-x-1 ${
                isInspectorActive
                  ? 'bg-cyan-500 text-slate-950 shadow-md animate-pulse'
                  : 'bg-slate-800 text-cyan-200 hover:bg-slate-700'
              }`}
              title="Click any UI element to see its clinical explanation"
            >
              <Compass className="w-3 h-3" />
              <span>{isInspectorActive ? 'Inspecting...' : 'Point & Explain'}</span>
            </button>

            {/* GYMNASTIC WIND-WHEEL BUTTON (COMPULSORY FEATURE) */}
            <button
              onClick={triggerGymnasticWindWheel}
              className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold flex items-center space-x-1 shadow transition-all hover:scale-105 active:scale-95 cursor-pointer"
              title="Aarohi Bot performs a full gymnastic wind-wheel flip!"
            >
              <Zap className="w-3 h-3 fill-current text-slate-950" />
              <span>🤸‍♀️ Wind Wheel</span>
            </button>

            {/* Stop Voice button in quick bar if speaking */}
            {isSpeaking && (
              <button
                onClick={stopVoice}
                className="px-2 py-0.5 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold flex items-center space-x-1"
                title="Stop Voice Output"
              >
                <Square className="w-2.5 h-2.5 fill-current" />
                <span>Stop</span>
              </button>
            )}
          </div>

          {/* C. FEMALE ROBOT DOCTOR AVATAR (AI AAROHI BOT) */}
          <div
            onClick={() => {
              if (isMinimized) {
                setIsMinimized(false);
              } else {
                triggerGymnasticWindWheel();
              }
            }}
            className={`relative cursor-pointer group transition-transform duration-300 hover:scale-105 active:scale-95 ${
              isDoingWindWheel ? 'animate-dr-wind-wheel' : ''
            }`}
            title="Click AI Aarohi Bot to see her wind-wheel cartwheel!"
          >
            {/* Glowing Aura Ring */}
            <div className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-cyan-400 via-[#088395] to-[#D97706] opacity-75 blur-sm group-hover:opacity-100 transition-opacity animate-pulse" />

            {/* Robot SVG Masterpiece */}
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-b from-slate-100 to-slate-200 border-2 border-white shadow-2xl flex items-center justify-center overflow-hidden">
              <svg
                viewBox="0 0 200 200"
                className="w-full h-full"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  {/* Gradients matching #0A4D68, #088395, #991B1B, #D97706 */}
                  <linearGradient id="headShell" x1="0" y1="0" x2="0" y2="100%">
                    <stop offset="0%" stopColor="#FFFFFF" />
                    <stop offset="60%" stopColor="#F1F5F9" />
                    <stop offset="100%" stopColor="#E2E8F0" />
                  </linearGradient>

                  <linearGradient id="darkVisor" x1="0" y1="0" x2="0" y2="100%">
                    <stop offset="0%" stopColor="#0F172A" />
                    <stop offset="100%" stopColor="#020617" />
                  </linearGradient>

                  <radialGradient id="cyanLedEye" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#A5F3FC" />
                    <stop offset="40%" stopColor="#67E8F9" />
                    <stop offset="85%" stopColor="#088395" />
                    <stop offset="100%" stopColor="#0A4D68" />
                  </radialGradient>

                  <linearGradient id="doctorApron" x1="0" y1="0" x2="0" y2="100%">
                    <stop offset="0%" stopColor="#FFFFFF" />
                    <stop offset="100%" stopColor="#F8FAFC" />
                  </linearGradient>

                  <linearGradient id="stethoscopeCol" x1="0" y1="0" x2="100%" y2="0">
                    <stop offset="0%" stopColor="#0A4D68" />
                    <stop offset="50%" stopColor="#088395" />
                    <stop offset="100%" stopColor="#0A4D68" />
                  </linearGradient>

                  <filter id="glowCyan" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* --- 1. CLINICAL DOCTOR APRON & SHOULDERS --- */}
                <g id="drApron">
                  {/* Shoulders */}
                  <path
                    d="M 40 160 Q 100 145 160 160 L 175 200 L 25 200 Z"
                    fill="url(#doctorApron)"
                    stroke="#CBD5E1"
                    strokeWidth="2"
                  />
                  {/* Apron V-Neck Lapels (#0A4D68 & #088395 borders) */}
                  <path
                    d="M 68 155 L 100 195 L 132 155 Z"
                    fill="#0A4D68"
                    stroke="#088395"
                    strokeWidth="2"
                  />
                  {/* Red Cross / Caduceus Badge on left apron chest (#991B1B) */}
                  <circle cx="62" cy="180" r="8" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
                  <rect x="60" y="174" width="4" height="12" rx="1" fill="#991B1B" />
                  <rect x="56" y="178" width="12" height="4" rx="1" fill="#991B1B" />

                  {/* Stethoscope draped around neck */}
                  <path
                    d="M 75 152 Q 100 185 125 152"
                    stroke="url(#stethoscopeCol)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                  {/* Stethoscope Chest Bell with cyan LED sensor */}
                  <circle cx="100" cy="186" r="6" fill="#088395" stroke="#FFFFFF" strokeWidth="1.5" />
                  <circle cx="100" cy="186" r="3" fill="#67E8F9" filter="url(#glowCyan)" />
                </g>

                {/* --- 2. CONTINUOUS WAVING MECHANICAL RIGHT HAND (@keyframes drHandWave) --- */}
                <g id="drWavingHand" className="animate-dr-hand-wave">
                  {/* Forearm & Wrist */}
                  <path
                    d="M 155 170 Q 170 145 175 125"
                    stroke="#FFFFFF"
                    strokeWidth="7"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 155 170 Q 170 145 175 125"
                    stroke="#088395"
                    strokeWidth="2"
                    strokeLinecap="round"
                    fill="none"
                  />
                  {/* Cute robotic hand palm */}
                  <circle cx="177" cy="122" r="7" fill="#FFFFFF" stroke="#0A4D68" strokeWidth="2" />
                  {/* Waving robotic fingers */}
                  <rect x="173" y="108" width="2.5" height="9" rx="1.2" fill="#67E8F9" stroke="#088395" strokeWidth="0.8" />
                  <rect x="177" y="106" width="2.5" height="11" rx="1.2" fill="#67E8F9" stroke="#088395" strokeWidth="0.8" />
                  <rect x="181" y="109" width="2.5" height="8" rx="1.2" fill="#67E8F9" stroke="#088395" strokeWidth="0.8" />
                </g>

                {/* --- 3. ROBOTIC HEAD & NODDING ANIMATION (@keyframes drHeadNod) --- */}
                <g id="drHead" className="animate-dr-head-nod">
                  {/* Right Telemetry Antenna with pulsating LED Tip */}
                  <g id="antenna">
                    <line x1="140" y1="65" x2="162" y2="40" stroke="#0A4D68" strokeWidth="2.5" strokeLinecap="round" />
                    <circle
                      cx="163"
                      cy="39"
                      r="5.5"
                      fill="#D97706"
                      className="animate-dr-antenna-pulse"
                      filter="url(#glowCyan)"
                    />
                    <circle cx="163" cy="39" r="2.5" fill="#67E8F9" />
                  </g>

                  {/* Left Head Fin node */}
                  <rect x="42" y="70" width="8" height="24" rx="4" fill="#0A4D68" stroke="#088395" strokeWidth="1" />
                  {/* Right Head Fin node */}
                  <rect x="150" y="70" width="8" height="24" rx="4" fill="#0A4D68" stroke="#088395" strokeWidth="1" />

                  {/* Sleek White Robotic Head Shell */}
                  <path
                    d="M 50 85 C 50 48, 150 48, 150 85 C 150 125, 130 148, 100 148 C 70 148, 50 125, 50 85 Z"
                    fill="url(#headShell)"
                    stroke="#0A4D68"
                    strokeWidth="3"
                  />

                  {/* Feminine Head Forehead Tiara Band (#0A4D68 & #088395) */}
                  <path
                    d="M 58 64 Q 100 52 142 64"
                    stroke="#088395"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <circle cx="100" cy="57" r="4.5" fill="#D97706" stroke="#FFFFFF" strokeWidth="1.5" />

                  {/* Glossy Dark Visor (#0F172A) */}
                  <path
                    d="M 58 82 C 58 72, 142 72, 142 82 C 142 114, 130 128, 100 128 C 70 128, 58 114, 58 82 Z"
                    fill="url(#darkVisor)"
                    stroke="#088395"
                    strokeWidth="2"
                  />

                  {/* Visor Specular Glass Reflection Arc */}
                  <path
                    d="M 66 79 Q 100 74 134 79"
                    stroke="#FFFFFF"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    opacity="0.35"
                    fill="none"
                  />

                  {/* --- GLOWING CYAN LED EYES WITH FEMININE EYELASHES --- */}
                  <g id="eyes" className="animate-dr-eye-blink">
                    {/* LEFT EYE */}
                    <g id="leftEye">
                      {/* Eyelashes */}
                      <path d="M 72 82 Q 74 76 71 73" stroke="#67E8F9" strokeWidth="1.6" strokeLinecap="round" />
                      <path d="M 78 80 Q 80 74 78 71" stroke="#67E8F9" strokeWidth="1.6" strokeLinecap="round" />
                      <path d="M 84 81 Q 87 75 88 72" stroke="#67E8F9" strokeWidth="1.6" strokeLinecap="round" />

                      {/* Cyan LED circular iris */}
                      <circle cx="80" cy="92" r="10" fill="url(#cyanLedEye)" filter="url(#glowCyan)" />
                      {/* Pupil catchlight reflection */}
                      <circle cx="77" cy="89" r="3" fill="#FFFFFF" opacity="0.9" />
                      <circle cx="83" cy="95" r="1.5" fill="#FFFFFF" opacity="0.7" />
                    </g>

                    {/* RIGHT EYE */}
                    <g id="rightEye">
                      {/* Eyelashes */}
                      <path d="M 116 81 Q 113 75 112 72" stroke="#67E8F9" strokeWidth="1.6" strokeLinecap="round" />
                      <path d="M 122 80 Q 120 74 122 71" stroke="#67E8F9" strokeWidth="1.6" strokeLinecap="round" />
                      <path d="M 128 82 Q 126 76 129 73" stroke="#67E8F9" strokeWidth="1.6" strokeLinecap="round" />

                      {/* Cyan LED circular iris */}
                      <circle cx="120" cy="92" r="10" fill="url(#cyanLedEye)" filter="url(#glowCyan)" />
                      {/* Pupil catchlight reflection */}
                      <circle cx="117" cy="89" r="3" fill="#FFFFFF" opacity="0.9" />
                      <circle cx="123" cy="95" r="1.5" fill="#FFFFFF" opacity="0.7" />
                    </g>
                  </g>

                  {/* GLOWING SMILING MOUTH ARC (#67E8F9) */}
                  <path
                    d="M 88 114 Q 100 124 112 114"
                    stroke="#67E8F9"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    fill="none"
                    filter="url(#glowCyan)"
                  />
                  {/* Subtle cute cheek blush LEDs */}
                  <ellipse cx="68" cy="106" rx="4" ry="2" fill="#D97706" opacity="0.4" />
                  <ellipse cx="132" cy="106" rx="4" ry="2" fill="#D97706" opacity="0.4" />
                </g>
              </svg>
            </div>

            {/* Online Status Pill Badge */}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-slate-900/90 text-cyan-300 font-extrabold text-[9px] px-2 py-0.5 rounded-full border border-cyan-400/50 shadow flex items-center space-x-1 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>Aarohi AI</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AiArogyaAarohiBot;

