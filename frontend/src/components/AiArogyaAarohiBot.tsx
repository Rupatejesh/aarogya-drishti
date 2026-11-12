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
  Info,
  Mic,
  MicOff,
  Send,
  RotateCcw,
  CheckCircle2,
  Radio
} from 'lucide-react';
import { Language } from '../i18n/translations.ts';

interface AiArogyaAarohiBotProps {
  lang: Language;
  onLanguageChange?: (lang: Language) => void;
}

interface SpeechResponse {
  title: string;
  en: string;
  te: string;
  hi: string;
}

interface QuickChip {
  id: string;
  query: string;
  labelTe: string;
  labelEn: string;
  labelHi: string;
}

export const AiArogyaAarohiBot: React.FC<AiArogyaAarohiBotProps> = ({
  lang,
  onLanguageChange
}) => {
  // Positioning & State
  const [position, setPosition] = useState<{ x: number; y: number }>({
    x: typeof window !== 'undefined' ? Math.max(20, window.innerWidth - 380) : 800,
    y: typeof window !== 'undefined' ? Math.max(20, window.innerHeight - 440) : 400
  });
  const [isMinimized, setIsMinimized] = useState(false);
  const [isInspectorActive, setIsInspectorActive] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isDoingWindWheel, setIsDoingWindWheel] = useState(false);
  const [soundMuted, setSoundMuted] = useState(false);
  const [activeTtsEngine, setActiveTtsEngine] = useState<'bhashini' | 'webspeech'>('bhashini');

  // Interactive Question Input & Speech Recognition State
  const [queryInput, setQueryInput] = useState('');
  const [isListening, setIsListening] = useState(false);

  // Inspector Highlight Overlay
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const [inspectedElementTitle, setInspectedElementTitle] = useState<string>('');

  // Speech bubble content
  const [currentSpeech, setCurrentSpeech] = useState<SpeechResponse>({
    title: 'AI Aarohi Robot Doctor Assistant',
    en: "Namaste! I am AI Aarohi Bot, your female robot doctor assistant. Type any question below or click the microphone to talk with me in Telugu, English, or Hindi!",
    te: "నమస్కారం! నేను ఏఐ ఆరోహి బోట్, మీ రోబో డాక్టర్ సహాయకురాలిని. కింద ఏదైనా ప్రశ్న టైప్ చేయండి లేదా మైక్ క్లిక్ చేసి నాతో తెలుగు, ఇంగ్లీష్ లేదా హిందీలో మాట్లాడండి!",
    hi: "नमस्ते! मैं एआई आरोही बॉट हूँ, आपकी महिला रोबोट डॉक्टर सहायक। नीचे कोई भी प्रश्न टाइप करें या माइक पर क्लिक करके मुझसे तेलुगु, अंग्रेजी या हिंदी में बात करें!"
  });

  const botRef = useRef<HTMLDivElement>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef<string>('');

  // Initialize SpeechSynthesis on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
    return () => {
      stopVoice();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  // Window resize bounds handler
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => ({
        x: Math.max(20, Math.min(prev.x, window.innerWidth - 380)),
        y: Math.max(20, Math.min(prev.y, window.innerHeight - 380))
      }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Stop Voice speech synthesis & audio elements immediately
  const stopVoice = () => {
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.src = '';
      } catch (e) {
        // ignore
      }
      audioRef.current = null;
    }
    if (synthRef.current) {
      try {
        synthRef.current.cancel();
      } catch (e) {
        // ignore
      }
    }
    setIsSpeaking(false);
  };

  /**
   * Dual Speech Output Engine:
   * 1. Bhashini Neural Indian TTS Audio Player (Native fluent te-IN, hi-IN, en-IN)
   * 2. Web Speech API (window.speechSynthesis)
   */
  const speakAloud = (speechObj: SpeechResponse, forceLang?: Language) => {
    if (soundMuted) return;

    const targetLang = forceLang || lang;
    const rawText = speechObj[targetLang] || speechObj.en;
    // Clean text: strip markdown, emoji, and formatting artifacts
    const textToSpeak = rawText
      .replace(/[#*`_~\[\]()•📍❓🤸‍♀️⏹️🎙️🔊\n]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!textToSpeak) return;

    stopVoice();
    setIsSpeaking(true);

    // Language code mapping
    const langCode = targetLang === 'te' ? 'te' : targetLang === 'hi' ? 'hi' : 'en-IN';
    const truncatedText = textToSpeak.slice(0, 190);

    // 1. Primary Bhashini / Indian Neural Voice Endpoint
    const directNeuralUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${langCode}&q=${encodeURIComponent(truncatedText)}`;
    const backendProxyUrl = `/api/v1/tts/synthesize?lang=${targetLang}&text=${encodeURIComponent(truncatedText)}`;

    // Helper: Web Speech API fallback
    const fallbackToWebSpeech = () => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        setIsSpeaking(false);
        return;
      }

      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        const voices = window.speechSynthesis.getVoices();

        let targetVoice = null;
        if (targetLang === 'te') {
          targetVoice = voices.find((v) => v.lang.includes('te') || v.lang.includes('Telugu'));
        } else if (targetLang === 'hi') {
          targetVoice = voices.find((v) => v.lang.includes('hi') || v.lang.includes('Hindi'));
        } else {
          targetVoice = voices.find(
            (v) =>
              (v.lang.includes('en-IN') || v.lang.includes('en-GB') || v.lang.includes('en')) &&
              (v.name.toLowerCase().includes('female') ||
                v.name.toLowerCase().includes('zira') ||
                v.name.toLowerCase().includes('google'))
          );
        }

        if (targetVoice) {
          utterance.voice = targetVoice;
        }

        utterance.lang = targetLang === 'te' ? 'te-IN' : targetLang === 'hi' ? 'hi-IN' : 'en-IN';
        utterance.pitch = 1.15;
        utterance.rate = 0.95;

        utterance.onstart = () => {
          setIsSpeaking(true);
          setActiveTtsEngine('webspeech');
        };
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('[Web Speech Error]', err);
        setIsSpeaking(false);
      }
    };

    // Helper: Play with HTML5 Audio element
    const tryPlayAudioUrl = (url: string, onFail: () => void) => {
      try {
        const audio = new Audio();
        audio.src = url;
        audioRef.current = audio;

        audio.onplay = () => {
          setIsSpeaking(true);
          setActiveTtsEngine('bhashini');
        };

        audio.onended = () => {
          setIsSpeaking(false);
          audioRef.current = null;
        };

        audio.onerror = () => {
          audioRef.current = null;
          onFail();
        };

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((e) => {
            console.warn('[Audio play catch, falling back]', e);
            audioRef.current = null;
            onFail();
          });
        }
      } catch (e) {
        console.warn('[Audio creation exception, falling back]', e);
        onFail();
      }
    };

    // Stream sequence: Direct Neural -> Backend Proxy -> Web Speech API
    tryPlayAudioUrl(directNeuralUrl, () => {
      tryPlayAudioUrl(backendProxyUrl, () => {
        fallbackToWebSpeech();
      });
    });
  };

  /**
   * Comprehensive Dynamic i18n Clinical Knowledgebase
   */
  const getClinicalResponse = (query: string, currentLang: Language): SpeechResponse => {
    const q = query.toLowerCase().trim();

    // 1. Leukoplakia / White Patch / Patch / Ulcer
    if (
      q.includes('leukoplakia') ||
      q.includes('white patch') ||
      q.includes('patch') ||
      q.includes('ల్యూకోప్లాకియా') ||
      q.includes('తెల్లటి') ||
      q.includes('మచ్చ') ||
      q.includes('పుండు') ||
      q.includes('ल्यूकोप्लाकिया') ||
      q.includes('सफेद धब्बा') ||
      q.includes('छाला')
    ) {
      return {
        title: currentLang === 'te' ? 'ల్యూకోప్లాకియా & నోటి మచ్చల వివరాలు' : currentLang === 'hi' ? 'ल्यूकोप्लाकिया व मुख धब्बे' : 'Oral Leukoplakia Advisory',
        te: "ల్యూకోప్లాకియా అనేది నోటి లోపలి బుగ్గలు, నాలుక లేదా అంగిలిపై వచ్చే తెల్లటి మచ్చ. ఇది గీకినా పోదు. 2 నుండి 3 వారాలకు మించి మానకపోతే ఇది నోటి క్యాన్సర్‌కు పూర్వ సంకేతం కావచ్చు. అల్లూరి జిల్లా ఏరియా ఆసుపత్రి పాడేరు లేదా సి.హెచ్.సి జి.మాడుగులలో 4మి.మీ పంచ్ బయాప్సీ చేయించుకోవాలని సూచించడమైనది.",
        en: "Oral Leukoplakia is a persistent, non-scrapable white patch in the oral cavity. If present for over 2-3 weeks, it is a clinically significant precancerous lesion. An immediate 4mm diagnostic punch biopsy at Area Hospital Paderu or CHC G. Madugula is strongly recommended.",
        hi: "ल्यूकोप्लाकिया मुंह के भीतर सफेद धब्बे को कहते हैं जो 2-3 हफ्तों में ठीक नहीं होता। यह कैंसर का शुरुआती लक्षण हो सकता है। पाडेरू एरिया अस्पताल या सीएचसी में 4 मिमी पंच बायोप्सी जांच अवश्य करवाएं।"
      };
    }

    // 2. Adda Poga / Reverse Smoking / Tobacco / Chutta
    if (
      q.includes('adda poga') ||
      q.includes('reverse smoking') ||
      q.includes('smoking') ||
      q.includes('chutta') ||
      q.includes('tobacco') ||
      q.includes('khaini') ||
      q.includes('gutkha') ||
      q.includes('అడ్డాపొగ') ||
      q.includes('చుట్ట') ||
      q.includes('పొగాకు') ||
      q.includes('ఖైనీ') ||
      q.includes('గుట్కా') ||
      q.includes('రివర్స్ స్మోకింగ్') ||
      q.includes('अड्डा पोगा') ||
      q.includes('उलटा धूम्रपान') ||
      q.includes('तंबाकू') ||
      q.includes('गुटखा') ||
      q.includes('चट्टा')
    ) {
      return {
        title: currentLang === 'te' ? 'అడ్డాపొగ (రివర్స్ స్మోకింగ్) ప్రమాదాలు' : currentLang === 'hi' ? 'उलटा धूम्रपान (अड्डा पोगा) के खतरे' : 'Adda Poga (Reverse Smoking) Risks',
        te: "అడ్డాపొగ (రివర్స్ స్మోకింగ్) అనేది చుట్ట వెలిగించిన కొనను నోటి లోపల పెట్టుకుని తాగే ప్రమాదకర అలవాటు. దీని వల్ల నోటి లోపల 58 డిగ్రీలకు పైగా తీవ్ర వేడి పుట్టి అంగిలి కణజాలం తీవ్రంగా కాలిపోతుంది. దీనివల్ల సాధారణం కంటే అంగిలి క్యాన్సర్ వచ్చే ముప్పు 14 రెట్లు ఎక్కువ! మా అలవాటు మాన్పు కౌన్సెలింగ్ ద్వారా దీనిని వెంటనే ఆపండి.",
        en: "Adda Poga (Reverse Smoking) involves keeping the burning end of indigenous cigars inside the mouth. Heat exceeds 58°C, causing severe thermal and chemical injury to the palatal mucosa, raising palatal cancer risk by 14x. Habit cessation counseling is immediately advised.",
        hi: "अड्डा पोगा (उलटा धूम्रपान) में जलती हुई चट्टा को मुंह के भीतर रखकर पिया जाता है। इससे 58 डिग्री से अधिक गर्मी पैदा होती है जिससे तालु जलने लगता है और कैंसर का खतरा 14 गुना बढ़ जाता है। इसे तुरंत छोड़ें।"
      };
    }

    // 3. Biopsy / 4mm Punch / Painless
    if (
      q.includes('biopsy') ||
      q.includes('punch') ||
      q.includes('4mm') ||
      q.includes('pain') ||
      q.includes('బయాప్సీ') ||
      q.includes('పంచ్') ||
      q.includes('నొప్పి') ||
      q.includes('సూది') ||
      q.includes('बायोप्सी') ||
      q.includes('दर्द') ||
      q.includes('जांच')
    ) {
      return {
        title: currentLang === 'te' ? '4మి.మీ పంచ్ బయాప్సీ పరీక్ష వివరణ' : currentLang === 'hi' ? '4 मिमी पंच बायोप्सी जानकारी' : '4mm Punch Biopsy Procedure',
        te: "బయాప్సీ అనేది ఎలాంటి నొప్పి లేని సులభమైన 5 నిమిషాల సురక్షితమైన పరీక్ష! స్థానిక మత్తుమందు (లోకల్ అనెస్తీషియా) ఇచ్చి, ఒక చిన్న 4మి.మీ కణజాలాన్ని సేకరించి మైక్రోస్కోప్ ద్వారా పరిశీలిస్తారు. దీని ద్వారా వ్యాధిని తొలి దశలోనే గుర్తించి 100% నయం చేయవచ్చు. బయాప్సీ గురించి ఎవరూ భయపడవద్దు.",
        en: "A 4mm diagnostic punch biopsy is a painless, safe 5-minute procedure performed under gentle local anesthesia. A tiny tissue core is excised and examined histologically to detect early dysplasia before malignancy develops. Early detection ensures 100% curability.",
        hi: "4 मिमी पंच बायोप्सी एक पूरी तरह दर्द रहित और सुरक्षित 5 मिनट की जांच है। हल्का सुन्न करके ऊतक की जांच की जाती है जिससे प्रारंभिक अवस्था में ही रोग का पता लगाकर पूर्ण इलाज किया जा सकता है।"
      };
    }

    // 4. Appointment / Booking / Slot
    if (
      q.includes('appointment') ||
      q.includes('book') ||
      q.includes('slot') ||
      q.includes('అపాయింట్‌మెంట్') ||
      q.includes('బుకింగ్') ||
      q.includes('స్లాట్') ||
      q.includes('తేదీ') ||
      q.includes('సమయం') ||
      q.includes('अपॉइंटमेंट') ||
      q.includes('बुकिंग') ||
      q.includes('समय')
    ) {
      return {
        title: currentLang === 'te' ? 'డాక్టర్ అపాయింట్‌మెంట్ బుకింగ్ మార్గదర్శి' : currentLang === 'hi' ? 'डॉक्टर अपॉइंटमेंट बुकिंग' : 'Doctor Appointment Booking Guide',
        te: "డాక్టర్ అపాయింట్‌మెంట్ తీసుకోవడానికి: 'బుక్ డాక్టర్' బటన్ క్లిక్ చేసి, జనరల్ చెకప్ లేదా బయాప్సీ ఎంచుకోండి. మీ మండలం (పాడేరు, అరకు, చింతపల్లి మొదలైనవి), డాక్టర్ మరియు అందుబాటులో ఉన్న సమయం ఎంచుకోండి. మీ డ్యాష్‌బోర్డ్‌లో డాక్టర్ ఆమోదించిన గ్రీన్ కార్డు కనిపిస్తుంది.",
        en: "To book a doctor appointment: Click 'Book Doctor', select General Consultation or Biopsy, choose your nearest Mandal health facility, doctor, and convenient time slot. You will receive an approved live status card with date and time.",
        hi: "अपॉइंटमेंट बुक करने के लिए: 'बुक डॉक्टर' पर क्लिक करें, सामान्य परामर्श या बायोप्सी चुनें, अपना नजदीकी स्वास्थ्य केंद्र, डॉक्टर और समय चुनें। स्वीकृति का लाइव कार्ड आपके डैशबोर्ड पर दिखेगा।"
      };
    }

    // 5. Video Call / WebRTC / Telemedicine
    if (
      q.includes('video') ||
      q.includes('call') ||
      q.includes('webrtc') ||
      q.includes('telemedicine') ||
      q.includes('వీడియో') ||
      q.includes('కాల్') ||
      q.includes('టెలిమెడిసిన్') ||
      q.includes('సంప్రదింపులు') ||
      q.includes('ఫోన్') ||
      q.includes('वीडियो') ||
      q.includes('कॉल') ||
      q.includes('टेलीमेडिसिन')
    ) {
      return {
        title: currentLang === 'te' ? 'లైవ్ వెబ్‌ఆర్‌టిసి వీడియో సంప్రదింపులు' : currentLang === 'hi' ? 'लाइव वीडियो परामर्श' : 'Live WebRTC Tele-Consultation',
        te: "లైవ్ వీడియో కాల్ కోసం: 'లైవ్ వీడియో కాల్' లేదా 'కన్సల్టేషన్ ప్రారంభించు' బటన్ నొక్కండి. సురక్షితమైన వెబ్‌ఆర్‌టిసి సాంకేతికత ద్వారా పాడేరు జిల్లా ఆంకాలజిస్ట్ డాక్టర్ స్వప్నా దేవి లేదా డాక్టర్ అనిల్ కుమార్‌తో ముఖాముఖి మాట్లాడవచ్చు. మీ కెమెరా, మైక్రోఫోన్ ఆన్ చేసి మాట్లాడండి.",
        en: "To launch a live video call: Click 'Live Video Call' to enter our peer-to-peer encrypted WebRTC room. You can consult live with Dr. Swapna Devi, MDS or Dr. Anil Kumar, MS with real-time video, audio, and clinical prescription notes.",
        hi: "लाइव वीडियो परामर्श के लिए 'लाइव वीडियो कॉल' पर क्लिक करें। वेबआरटीसी द्वारा कैंसर विशेषज्ञ डॉक्टरों से सीधे लाइव वीडियो और ऑडियो द्वारा परामर्श प्राप्त करें।"
      };
    }

    // 6. 11 Mandals / Hospitals / Clinics / Paderu / Araku
    if (
      q.includes('mandal') ||
      q.includes('11') ||
      q.includes('hospital') ||
      q.includes('clinic') ||
      q.includes('paderu') ||
      q.includes('araku') ||
      q.includes('chintapalli') ||
      q.includes('మండల') ||
      q.includes('ఆసుపత్రి') ||
      q.includes('పాడేరు') ||
      q.includes('అరకు') ||
      q.includes('చింతపల్లి') ||
      q.includes('11 मंडल') ||
      q.includes('अस्पताल') ||
      q.includes('पाडेरू') ||
      q.includes('अरकु')
    ) {
      return {
        title: currentLang === 'te' ? 'అల్లూరి జిల్లా 11 మండలాల ఆసుపత్రుల నెట్‌వర్క్' : currentLang === 'hi' ? '11 मंडल अस्पताल नेटवर्क' : '11 Mandals Onco-Care Network',
        te: "అల్లూరి సీతారామరాజు జిల్లాలోని 11 మండలాలు: పాడేరు, అరకు లోయ, చింతపల్లి, జి.మాడుగుల, అనంతగిరి, డుంబ్రిగుడ, హుకుంపేట, కొయ్యూరు, జి.కె.వీధి, ముంచంగిపుట్టు మరియు పెదబయలు. ఏరియా ఆసుపత్రి పాడేరు ప్రధాన కేంద్రంగా అన్ని పి.హెచ్.సిలలో స్క్రీనింగ్ మరియు బయాప్సీ అందుబాటులో ఉన్నాయి.",
        en: "Our onco-network spans all 11 Mandals: Paderu, Araku Valley, Chintapalli, G. Madugula, Ananthagiri, Dumbriguda, Hukumpeta, Koyyuru, G.K. Veedhi, Munchingiputtu, and Pedabayalu, anchored by Area Hospital Paderu as the District Oncology Hub.",
        hi: "हमारा नेटवर्क अल्लूरी जिले के सभी 11 मंडलों में फैला है: पाडेरू, अरकु, चिंतापल्ली, जी.माडुगुला, अनंतगिरि, डुम्ब्रिगुडा, हुकुंपेटा, कोइयुरू, जीके वीधि, मुंचिंगपुट्टू और पेदाबायालु। पाडेरू अस्पताल मुख्य केंद्र है।"
      };
    }

    // 7. Emergency 108 / 104 SOS
    if (
      q.includes('108') ||
      q.includes('104') ||
      q.includes('sos') ||
      q.includes('emergency') ||
      q.includes('ambulance') ||
      q.includes('అత్యవసర') ||
      q.includes('అంబులెన్స్') ||
      q.includes('సహాయం') ||
      q.includes('ఆపద') ||
      q.includes('आपातकालीन') ||
      q.includes('एम्बुलेंस') ||
      q.includes('सहायता')
    ) {
      return {
        title: currentLang === 'te' ? 'గిరిజన అత్యవసర సేవలు (108 / 104)' : currentLang === 'hi' ? 'जनजातीय आपातकालीन सेवा (108/104)' : 'Tribal Emergency SOS (108/104)',
        te: "గిరిజన అత్యవసర సమయాల్లో తక్షణ సహాయం కోసం 108 అంబులెన్స్ మరియు 104 ఉచిత వైద్య సలహా హెల్ప్‌లైన్‌ను సంప్రదించండి. హెడర్‌లోని ఎరుపు రంగు 'గిరిజన అత్యవసర 108/104' బటన్ నొక్కడం ద్వారా నేరుగా కాల్ చేయవచ్చు.",
        en: "In any medical emergency, call 108 for immediate 4WD ambulance dispatch across agency terrain or 104 for round-the-clock medical advice. You can also tap the red Emergency SOS button in the top navigation bar.",
        hi: "चिकित्सीय आपात स्थिति में 108 एम्बुलेंस और 104 स्वास्थ्य सलाह हेल्पलाइन 24 घंटे उपलब्ध हैं। शीर्ष बार में लाल इमरजेंसी बटन दबाकर सीधे संपर्क करें।"
      };
    }

    // 8. Health Card / UIDN / Golden Card / QR
    if (
      q.includes('card') ||
      q.includes('uidn') ||
      q.includes('golden') ||
      q.includes('qr') ||
      q.includes('కార్డు') ||
      q.includes('గోల్డెన్ కార్డ్') ||
      q.includes('యుఐడిఎన్') ||
      q.includes('कार्ड') ||
      q.includes('गोल्डन कार्ड') ||
      q.includes('यूआईडीएन')
    ) {
      return {
        title: currentLang === 'te' ? 'ఆరోగ్య దృష్టి గోల్డెన్ హెల్త్ కార్డ్' : currentLang === 'hi' ? 'आरोग्य दृष्टि गोल्डन कार्ड' : 'Aarogya Drishti Golden Card',
        te: "ఆరోగ్య దృష్టి గోల్డెన్ హెల్త్ కార్డులో మీ గిరిజన గుర్తింపు సంఖ్య (UIDN), బ్లడ్ గ్రూప్, బయోమార్కర్ రిస్క్ మరియు క్యూఆర్ కోడ్ ఉంటాయి. మీ డ్యాష్‌బోర్డ్ నుండి కార్డును 1-క్లిక్‌తో డౌన్‌లోడ్ లేదా ప్రింట్ చేసుకోవచ్చు.",
        en: "The Aarogya Drishti Golden Health Card contains your official tribal UIDN, blood group, onco-biomarker score, and QR code for rapid hospital check-in with 1-click download and PDF printing.",
        hi: "आरोग्य दृष्टि डिजिटल कार्ड में आपका यूआईडीएन, रक्त समूह, बायोमार्कर रेटिंग और त्वरित जांच हेतु क्यूआर कोड शामिल है जिसे आप आसानी से डाउनलोड और प्रिंट कर सकते हैं।"
      };
    }

    // 9. Gymnastic Wind Wheel / Flip / Trick
    if (
      q.includes('wind wheel') ||
      q.includes('gymnastic') ||
      q.includes('wheel') ||
      q.includes('trick') ||
      q.includes('గాలి చక్రం') ||
      q.includes('జిమ్నాస్టిక్') ||
      q.includes('విన్యాసం') ||
      q.includes('పవన్ చక్ర') ||
      q.includes('करतब') ||
      q.includes('जिम्नास्टिक')
    ) {
      return {
        title: currentLang === 'te' ? 'ఏఐ ఆరోహి జిమ్నాస్టిక్ గాలి చక్రం' : currentLang === 'hi' ? 'आरोही जिम्नास्टिक पवन चक्र' : 'Aarohi Gymnastic Wind-Wheel',
        te: "చూడండి నా ఉల్లాసభరితమైన జిమ్నాస్టిక్ గాలి చక్రం (విండ్-వీల్) విన్యాసం! 11 మండలాల ప్రజల ఆరోగ్యం, ఉల్లాసం మరియు నవ్వుల కోసం నేను ఎల్లప్పుడూ సిద్ధంగా ఉంటాను!",
        en: "Watch my energetic gymnastic wind-wheel acrobatic flip! Keeping healthcare vibrant, positive, and engaging across all 11 Mandals of ITDA Paderu!",
        hi: "देखिए मेरा फुर्तीला पवन चक्र (विंड-व्हील) जिम्नास्टिक करतब! सभी 11 मंडलों में स्वास्थ्य और ऊर्जा का संचार!"
      };
    }

    // 10. Who are you / Aarohi / Identity / Doctor
    if (
      q.includes('who are you') ||
      q.includes('aarohi') ||
      q.includes('name') ||
      q.includes('bot') ||
      q.includes('నువ్వు ఎవరు') ||
      q.includes('ఎవరు') ||
      q.includes('పేరు') ||
      q.includes('ఆరోహి') ||
      q.includes('तुम कौन हो') ||
      q.includes('नाम') ||
      q.includes('आरोही')
    ) {
      return {
        title: currentLang === 'te' ? 'ఏఐ ఆరోహి బోట్ పరిచయం' : currentLang === 'hi' ? 'एआई आरोही बॉट परिचय' : 'Meet AI Aarohi Bot',
        te: "నమస్కారం! నేను ఏఐ ఆరోహి బోట్, అల్లూరి జిల్లా గిరిజనుల కోసం రూపొందించబడిన రోబో డాక్టర్ సహాయకురాలిని. నోటి క్యాన్సర్ ప్రాథమిక గుర్తింపు, అడ్డాపొగ మాన్పు, బయాప్సీ మరియు డాక్టర్ సంప్రదింపులపై నేను మీకు తెలుగు, ఇంగ్లీష్, హిందీలలో మార్గదర్శనం చేస్తాను.",
        en: "Namaste! I am AI Aarohi Bot, your friendly female robot doctor assistant for ITDA Paderu. I provide real-time clinical guidance on oral cancer, reverse smoking cessation, biopsies, and appointments in Telugu, English, and Hindi.",
        hi: "नमस्ते! मैं एआई आरोही बॉट हूँ, आपकी महिला रोबोट डॉक्टर सहायक। मैं अल्लूरी जिले के नागरिकों को मुख कैंसर, तंबाकू मुक्ति और स्वास्थ्य सेवाओं पर तेलुगु, हिंदी और अंग्रेजी में मार्गदर्शन प्रदान करती हूँ।"
      };
    }

    // 11. Greetings (Hi / Hello / Namaste)
    if (
      q.includes('hi') ||
      q.includes('hello') ||
      q.includes('namaste') ||
      q.includes('నమస్కారం') ||
      q.includes('హలో') ||
      q.includes('नमस्ते') ||
      q.includes('हाय')
    ) {
      return {
        title: currentLang === 'te' ? 'నమస్కారం! నేను మీకు ఎలా సహాయపడగలను?' : currentLang === 'hi' ? 'नमस्ते! मैं कैसे सहायता कर सकती हूँ?' : 'Namaste! How may I assist you?',
        te: "నమస్కారం! నేను ఏఐ ఆరోహి బోట్. మీకు నోటి ఆరోగ్యం, ల్యూకోప్లాకియా పరీక్ష, అడ్డాపొగ అలవాటు మాన్పు లేదా డాక్టర్ అపాయింట్‌మెంట్లలో ఏ సహాయం కావాలన్నా నన్ను అడగండి!",
        en: "Namaste! I am AI Aarohi Bot. Feel free to ask me anything about oral cancer screening, white patches, reverse smoking cessation, or booking an appointment!",
        hi: "नमस्ते! मैं एआई आरोही बॉट हूँ। मुख स्वास्थ्य, सफेद धब्बों की जांच, तंबाकू मुक्ति या डॉक्टर अपॉइंटमेंट पर मुझसे कुछ भी पूछें!"
      };
    }

    // 12. General Clinical Fallback
    return {
      title: currentLang === 'te' ? 'ఆరోగ్య దృష్టి క్లినికల్ మార్గదర్శి' : currentLang === 'hi' ? 'आरोग्य दृष्टि क्लिनिकल सलाह' : 'Aarogya Drishti Clinical Advisory',
      te: `మీరు అడిగిన '${query}' సమాచారం పరిశీలించబడింది. నోటిలో ఏవైనా మచ్చలు లేదా ఇబ్బందులు ఉంటే లైవ్ ఏఐ నోటి కెమెరా ద్వారా ఫోటో తీసి పరిశీలించండి లేదా మా నిపుణులైన వైద్యులతో లైవ్ వీడియో కాల్ ద్వారా సంప్రదించండి.`,
      en: `Regarding your query on '${query}': For clinical symptoms or guidance, use our Multimodal AI Oral Scanner to take an oral photograph, or book a live WebRTC tele-consultation with our onco-specialists.`,
      hi: `'${query}' के संबंध में: किसी भी लक्षण या सलाह हेतु हमारे एआई ओरल स्कैनर से फोटो लेकर जांच करें अथवा कैंसर विशेषज्ञ से लाइव वीडियो परामर्श प्राप्त करें।`
    };
  };

  // Submit a question to Aarohi Bot
  const handleAsk = (queryText: string) => {
    const clean = queryText.trim();
    if (!clean) return;

    const response = getClinicalResponse(clean, lang);
    setInspectedElementTitle(response.title);
    setCurrentSpeech(response);
    setQueryInput('');

    // If query was wind wheel, animate it too!
    if (
      clean.toLowerCase().includes('wind wheel') ||
      clean.includes('గాలి చక్రం') ||
      clean.includes('पवन चक्र')
    ) {
      triggerGymnasticWindWheel(false);
    }

    // Audible speech output via Bhashini Neural TTS / Web Speech API
    speakAloud(response);
  };

  // Speech-to-Text Microphone Engine
  const toggleListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        lang === 'te'
          ? 'ఈ బ్రౌజర్‌లో వాయిస్ రికగ్నిషన్ సపోర్ట్ లేదు. దయచేసి గూగుల్ క్రోమ్ ఉపయోగించండి.'
          : lang === 'hi'
          ? 'इस ब्राउज़र में वॉइस रिकग्निशन समर्थित नहीं है। कृपया गूगल क्रोम का उपयोग करें।'
          : 'Speech Recognition is not supported on this browser. Please use Google Chrome.'
      );
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.lang = lang === 'te' ? 'te-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN';
      transcriptRef.current = '';

      recognition.onstart = () => {
        setIsListening(true);
        setQueryInput('');
      };

      recognition.onresult = (event: any) => {
        let current = '';
        for (let i = 0; i < event.results.length; i++) {
          current += event.results[i][0].transcript;
        }
        transcriptRef.current = current;
        setQueryInput(current);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition notice:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        const finalTranscript = transcriptRef.current.trim();
        if (finalTranscript) {
          handleAsk(finalTranscript);
        }
      };

      recognition.start();
    } catch (err) {
      console.warn('Recognition start exception:', err);
      setIsListening(false);
    }
  };

  // Gymnastic Wind-Wheel Trigger
  const triggerGymnasticWindWheel = (shouldSpeak = true) => {
    if (isDoingWindWheel) return;
    setIsDoingWindWheel(true);

    if (shouldSpeak) {
      const speech: SpeechResponse = {
        title: lang === 'te' ? 'జిమ్నాస్టిక్ గాలి చక్రం' : lang === 'hi' ? 'जिम्नास्टिक पवन चक्र' : 'Gymnastic Wind-Wheel',
        en: "Watch my gymnastic acrobatic wind-wheel! Keeping healthcare vibrant and energetic for all 11 Mandals!",
        te: "చూడండి నా జిమ్నాస్టిక్ గాలి చక్రం విన్యాసం! 11 మండలాల ప్రజల ఆరోగ్యం మరియు ఉల్లాసం కోసం!",
        hi: "देखिए मेरा जिम्नास्टिक पवन चक्र करतब! सभी 11 मंडलों के स्वास्थ्य और ऊर्जा के लिए!"
      };
      setInspectedElementTitle(speech.title);
      setCurrentSpeech(speech);
      speakAloud(speech);
    }

    setTimeout(() => {
      setIsDoingWindWheel(false);
    }, 1300);
  };

  // Clinical explanations database for interactive element inspector
  const getClinicalExplanation = (target: HTMLElement): SpeechResponse => {
    const text = (
      target.innerText ||
      target.getAttribute('aria-label') ||
      target.getAttribute('title') ||
      ''
    ).toLowerCase();

    // 1. Live Telemedicine Video Call
    if (
      text.includes('video') ||
      text.includes('telemedicine') ||
      text.includes('call') ||
      text.includes('కాల్') ||
      text.includes('సంప్రదింపులు') ||
      text.includes('कॉल')
    ) {
      return {
        title: 'WebRTC Telemedicine Video Room',
        en: 'Encrypted WebRTC P2P tele-oncology consultation connecting tribal patients directly with Dr. Swapna Devi or Dr. Anil Kumar with low-latency audio/video.',
        te: 'గిరిజన రోగులు మరియు క్యాన్సర్ వైద్యుల మధ్య సురక్షితమైన లైవ్ వెబ్‌ఆర్‌టిసి వీడియో సంప్రదింపుల సదుపాయం.',
        hi: 'सुरक्षित वेबआरटीसी वीडियो परामर्श कक्ष, जो मरीजों को सीधे कैंसर विशेषज्ञ डॉक्टरों से जोड़ता है।'
      };
    }

    // 2. AI Mouth Screening / Camera
    if (
      text.includes('photo') ||
      text.includes('camera') ||
      text.includes('screen') ||
      text.includes('నోటి') ||
      text.includes('కెమెరా') ||
      text.includes('ముఖ') ||
      text.includes('फोटो')
    ) {
      return {
        title: 'Multimodal Gemini AI Oral Scanner',
        en: 'Clinical onco-imaging reticle designed to detect early Leukoplakia, Erythroplakia, and submucous fibrosis caused by Adda Poga (reverse smoking) and tobacco chewing.',
        te: 'అడ్డాపొగ, ఖైనీ అలవాట్ల వల్ల వచ్చే ల్యూకోప్లాకియా వంటి నోటి క్యాన్సర్ ప్రాథమిక లక్షణాలను గుర్తించే మల్టీమోడల్ ఏఐ స్కానర్.',
        hi: 'रिवर्स स्मोकिंग और तंबाकू से होने वाले ल्यूकोप्लाकिया व मुख घावों की प्रारंभिक जांच करने वाला एआई स्कैनर।'
      };
    }

    // 3. Golden Health Card
    if (
      text.includes('card') ||
      text.includes('golden') ||
      text.includes('కార్డ్') ||
      text.includes('కార్డు') ||
      text.includes('कार्ड')
    ) {
      return {
        title: 'Aarogya Drishti Golden Health Card',
        en: 'Unified tribal digital health card containing patient UIDN, emergency contacts, biomarker risk ratings, and instant QR/Barcode access for doctors.',
        te: 'రోగి ప్రత్యేక యూఐడీఎన్, బయోమార్కర్ వివరాలు మరియు అత్యవసర ఆరోగ్య సమాచారంతో కూడిన గోల్డెన్ డిజిటల్ కార్డు.',
        hi: 'मरीज का विशिष्ट यूआईडीएन, बायोमार्कर रेटिंग और आपातकालीन स्वास्थ्य विवरण युक्त डिजिटल गोल्डन हेल्थ कार्ड।'
      };
    }

    // 4. Habit Cessation Tracker
    if (
      text.includes('habit') ||
      text.includes('cessation') ||
      text.includes('smoking') ||
      text.includes('పొగాకు') ||
      text.includes('అలవాటు') ||
      text.includes('आदत')
    ) {
      return {
        title: 'Habit Cessation Tracker (Adda Poga)',
        en: 'Behavioral addiction tracker monitoring tobacco-free days, oral mucosal healing progress, and craving reduction strategies tailored for agency mandals.',
        te: 'అడ్డాపొగ మరియు పొగాకు అలవాట్లను మానిపించడానికి, నోటి కణజాలం కోలుకోవడాన్ని ట్రాక్ చేసే సహాయక వ్యవస్థ.',
        hi: 'तंबाकू एवं रिवर्स स्मोकिंग मुक्ति ट्रैकर जो मरीजों के व्यसन मुक्ति दिनों व घाव सुधार की निगरानी करता है।'
      };
    }

    // 5. Book Appointment
    if (
      text.includes('appointment') ||
      text.includes('book') ||
      text.includes('అపాయింట్‌మెంట్') ||
      text.includes('अपॉइंटमेंट')
    ) {
      return {
        title: 'Doctor Appointment Booking Engine',
        en: 'Schedule online video tele-consultations or in-person OPD hospital visits at any of the 11 Mandals health centres with selected specialists.',
        te: '11 మండలాల ఆసుపత్రుల వద్ద లేదా ఆన్‌లైన్ ద్వారా మీకు కావలసిన వైద్యుని అపాయింట్‌మెంట్ బుక్ చేసుకునే సదుపాయం.',
        hi: '11 मंडलों के अस्पतालों में प्रत्यक्ष या ऑनलाइन वीडियो परामर्श हेतु विशेषज्ञ डॉक्टर की अपॉइंटमेंट बुक करें।'
      };
    }

    // 6. Emergency 108/104 SOS
    if (
      text.includes('sos') ||
      text.includes('emergency') ||
      text.includes('108') ||
      text.includes('104') ||
      text.includes('అత్యవసర') ||
      text.includes('आपात')
    ) {
      return {
        title: 'Tribal Emergency SOS (108 / 104)',
        en: 'Direct emergency hotline dispatching 108 four-wheel-drive tribal ambulances and connecting to 104 medical advice helplines across agency terrains.',
        te: 'అత్యవసర పరిస్థితుల్లో 108 అంబులెన్స్ మరియు 104 వైద్య సలహా కోసం తక్షణ కాలింగ్ సదుపాయం.',
        hi: 'आपात स्थिति में 108 एम्बुलेंस और 104 स्वास्थ्य सलाह हेतु तत्काल सहायता हॉटलाइन।'
      };
    }

    // 7. 11 Mandals / Hospitals Directory
    if (
      text.includes('mandal') ||
      text.includes('hospital') ||
      text.includes('11') ||
      text.includes('మండల') ||
      text.includes('ఆసుపత్రి') ||
      text.includes('अस्पताल')
    ) {
      return {
        title: '11 Mandals Healthcare Command Grid',
        en: 'Administrative registry tracking CHCs, PHCs, Area Hospitals, biopsy punch tools, and medical officers across all 11 ITDA Paderu mandals.',
        te: 'పాడేరు, అరకు, చింతపల్లి సహా అల్లూరి జిల్లాలోని 11 మండలాల ఆసుపత్రులు మరియు బయాప్సీ సేవల నెట్‌వర్క్.',
        hi: 'पाडेरू, अरकु, चिंतापल्ली सहित सभी 11 मंडलों के अस्पतालों व बायोप्सी सुविधाओं का नेटवर्क।'
      };
    }

    // 8. Doctor / Admin Workspace & Credentials
    if (
      text.includes('doctor') ||
      text.includes('admin') ||
      text.includes('credentials') ||
      text.includes('డాక్టర్') ||
      text.includes('అడ్మిన్') ||
      text.includes('डॉक्टर')
    ) {
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
      const targetX = Math.max(20, Math.min(window.innerWidth - 380, rect.right + 20));
      const targetY = Math.max(20, Math.min(window.innerHeight - 380, rect.top - 20));
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

  // Quick Suggestion Prompt Chips
  const promptChips: QuickChip[] = [
    {
      id: 'leukoplakia',
      query: 'ల్యూకోప్లాకియా అంటే ఏమిటి?',
      labelTe: '❓ ల్యూకోప్లాకియా అంటే ఏమిటి?',
      labelEn: '❓ What is Leukoplakia?',
      labelHi: '❓ ल्यूकोप्लाकिया क्या है?'
    },
    {
      id: 'addapoga',
      query: 'అడ్డాపొగ ఎలా మానాలి?',
      labelTe: '❓ అడ్డాపొగ ప్రమాదాలు & మాన్పు',
      labelEn: '❓ Adda Poga (Reverse Smoking) Risks',
      labelHi: '❓ उलटा धूम्रपान के खतरे'
    },
    {
      id: 'biopsy',
      query: 'బయాప్సీ పరీక్ష నొప్పిగా ఉంటుందా?',
      labelTe: '❓ 4మి.మీ బయాప్సీ నొప్పిగా ఉంటుందా?',
      labelEn: '❓ Is 4mm biopsy painful?',
      labelHi: '❓ क्या बायोप्सी दर्दनाक है?'
    },
    {
      id: 'appointment',
      query: 'డాక్టర్ అపాయింట్‌మెంట్ ఎలా బుక్ చేయాలి?',
      labelTe: '❓ అపాయింట్‌మెంట్ బుకింగ్',
      labelEn: '❓ Book Doctor Appointment',
      labelHi: '❓ अपॉइंटमेंट कैसे लें?'
    },
    {
      id: 'mandals',
      query: '11 మండలాల ఆసుపత్రులు ఎక్కడ ఉన్నాయి?',
      labelTe: '❓ 11 మండలాల ఆసుపత్రులు',
      labelEn: '❓ 11 Mandals Hospitals',
      labelHi: '❓ 11 मंडल अस्पताल सूची'
    },
    {
      id: 'emergency',
      query: '108 అత్యవసర సేవలు',
      labelTe: '❓ 108 అత్యవసర సేవలు',
      labelEn: '❓ 108 Emergency SOS',
      labelHi: '❓ 108 आपातकालीन सेवा'
    }
  ];

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
            <span>
              {lang === 'te'
                ? 'ఆరోహి ఇన్‌స్పెక్టర్ • క్లిక్ చేసి వివరణ వినండి'
                : lang === 'hi'
                ? 'आरोही इंस्पेक्टर • क्लिक करके विवरण सुनें'
                : 'Aarohi Inspector • Click to Explain'}
            </span>
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
          {/* A. Speech & Interactive Communication Bubble */}
          {!isMinimized && (
            <div className="mb-2 max-w-[350px] sm:max-w-[400px] w-full bg-white/95 backdrop-blur-md rounded-2xl p-3.5 border-2 border-[#088395] shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-2">
              {/* Bubble Header */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-extrabold text-xs text-[#0A4D68] tracking-wide">
                    {lang === 'te'
                      ? 'ఏఐ ఆరోహి బోట్ (AI Aarohi)'
                      : lang === 'hi'
                      ? 'एआई आरोही बॉट (AI Aarohi)'
                      : 'AI AAROHI BOT (ఏఐ ఆరోహి)'}
                  </span>
                  <span className="text-[9px] bg-cyan-100 text-[#088395] font-bold px-1.5 py-0.5 rounded border border-cyan-300">
                    Bhashini Neural TTS
                  </span>
                </div>

                <div className="flex items-center space-x-1">
                  {/* Language switch pills inside Aarohi Bot */}
                  {onLanguageChange && (
                    <div className="flex items-center bg-slate-100 rounded-lg p-0.5 text-[9px] font-bold">
                      <button
                        onClick={() => onLanguageChange('en')}
                        className={`px-1.5 py-0.5 rounded ${
                          lang === 'en' ? 'bg-[#0A4D68] text-white' : 'text-slate-600'
                        }`}
                      >
                        EN
                      </button>
                      <button
                        onClick={() => onLanguageChange('te')}
                        className={`px-1.5 py-0.5 rounded ${
                          lang === 'te' ? 'bg-[#0A4D68] text-white' : 'text-slate-600'
                        }`}
                      >
                        తె
                      </button>
                      <button
                        onClick={() => onLanguageChange('hi')}
                        className={`px-1.5 py-0.5 rounded ${
                          lang === 'hi' ? 'bg-[#0A4D68] text-white' : 'text-slate-600'
                        }`}
                      >
                        हि
                      </button>
                    </div>
                  )}

                  {/* Close / minimize bubble */}
                  <button
                    onClick={() => setIsMinimized(true)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors"
                    title="Minimize Aarohi"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Inspected Element or Topic Title */}
              {inspectedElementTitle && (
                <div className="text-[10px] font-extrabold text-[#088395] bg-cyan-50 px-2 py-0.5 rounded mb-1.5 inline-flex items-center space-x-1 border border-cyan-200">
                  <span>📍</span>
                  <span>{inspectedElementTitle}</span>
                </div>
              )}

              {/* Spoken Clinical Response Text */}
              <div className="max-h-36 overflow-y-auto pr-1">
                <p className="text-xs text-slate-800 font-medium leading-relaxed">
                  {currentSpeech[lang] || currentSpeech.en}
                </p>
              </div>

              {/* Quick Clinical Suggestion Chips */}
              <div className="mt-2.5 pt-2 border-t border-slate-100">
                <div className="text-[9px] font-bold text-slate-400 mb-1 flex items-center justify-between">
                  <span>
                    {lang === 'te'
                      ? 'త్వరిత ప్రశ్నలు (ఒక్క క్లిక్‌తో అడగండి):'
                      : lang === 'hi'
                      ? 'त्वरित प्रश्न (एक क्लिक में पूछें):'
                      : 'Quick Prompts (Tap to ask):'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                  {promptChips.map((chip) => (
                    <button
                      key={chip.id}
                      onClick={() =>
                        handleAsk(
                          lang === 'te'
                            ? chip.labelTe.replace('❓ ', '')
                            : lang === 'hi'
                            ? chip.labelHi.replace('❓ ', '')
                            : chip.labelEn.replace('❓ ', '')
                        )
                      }
                      className="text-[10px] bg-slate-50 hover:bg-cyan-50 hover:text-[#088395] hover:border-[#088395] text-slate-700 px-2 py-0.5 rounded-full border border-slate-200 transition-all font-medium text-left truncate max-w-full"
                    >
                      {lang === 'te'
                        ? chip.labelTe
                        : lang === 'hi'
                        ? chip.labelHi
                        : chip.labelEn}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Input Form with Microphone Button */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAsk(queryInput);
                }}
                className="mt-2.5 flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl p-1 focus-within:border-[#088395] focus-within:bg-white transition-all shadow-inner"
              >
                {/* Microphone Button (Speech-to-Text) */}
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`p-1.5 rounded-lg transition-all flex items-center justify-center ${
                    isListening
                      ? 'bg-red-500 text-white animate-pulse ring-2 ring-red-400 shadow-md'
                      : 'bg-white text-slate-600 hover:text-[#088395] border border-slate-200 shadow-sm'
                  }`}
                  title={
                    isListening
                      ? lang === 'te'
                        ? 'వినడం ఆపు'
                        : lang === 'hi'
                        ? 'सुनना रोकें'
                        : 'Stop listening'
                      : lang === 'te'
                      ? 'మైక్ ద్వారా అడగండి (te-IN)'
                      : lang === 'hi'
                      ? 'माइक से पूछें (hi-IN)'
                      : 'Speak to Aarohi (en-IN)'
                  }
                >
                  {isListening ? (
                    <Mic className="w-3.5 h-3.5 animate-bounce" />
                  ) : (
                    <Mic className="w-3.5 h-3.5" />
                  )}
                </button>

                {/* Question Input Field */}
                <input
                  type="text"
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                  placeholder={
                    isListening
                      ? lang === 'te'
                        ? 'ఆరోహి వింటోంది... మాట్లాడండి...'
                        : lang === 'hi'
                        ? 'आरोही सुन रही है... बोलिए...'
                        : 'Listening... please speak...'
                      : lang === 'te'
                      ? 'ఏఐ ఆరోహిని ఏదైనా అడగండి...'
                      : lang === 'hi'
                      ? 'एआई आरोही से कुछ भी पूछें...'
                      : 'Ask AI Aarohi anything...'
                  }
                  className="flex-1 bg-transparent border-none text-xs text-slate-800 placeholder-slate-400 focus:outline-none px-1"
                />

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={!queryInput.trim()}
                  className={`p-1.5 rounded-lg transition-all ${
                    queryInput.trim()
                      ? 'bg-[#088395] hover:bg-[#0A4D68] text-white shadow-sm'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                  title="Send Question"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>

              {/* Speaking Voice Indicator & Controls */}
              <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-1 text-[10px]">
                {/* Voice Status Pill */}
                <div className="flex items-center space-x-1.5 text-slate-500 font-semibold">
                  {isSpeaking ? (
                    <>
                      <span className="flex space-x-0.5 items-end h-3">
                        <span className="w-0.5 bg-[#088395] animate-[bounce_0.6s_infinite_100ms] h-3 rounded-full" />
                        <span className="w-0.5 bg-cyan-400 animate-[bounce_0.6s_infinite_300ms] h-2 rounded-full" />
                        <span className="w-0.5 bg-[#D97706] animate-[bounce_0.6s_infinite_200ms] h-3.5 rounded-full" />
                      </span>
                      <span className="text-[#088395] font-bold">
                        {lang === 'te'
                          ? 'మాట్లాడుతోంది...'
                          : lang === 'hi'
                          ? 'बोल रहा है...'
                          : 'Speaking...'}
                      </span>
                    </>
                  ) : (
                    <span className="text-slate-400 flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>
                        {lang === 'te'
                          ? 'వాయిస్ సిద్ధం'
                          : lang === 'hi'
                          ? 'आवाज तैयार'
                          : 'Voice ready'}
                      </span>
                    </span>
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
                      <span>
                        {lang === 'te'
                          ? 'వాయిస్ ఆపు ⏹️'
                          : lang === 'hi'
                          ? 'आवाज रोकें ⏹️'
                          : 'Stop Voice ⏹️'}
                      </span>
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
                      soundMuted
                        ? 'text-red-500 bg-red-50'
                        : 'text-slate-400 hover:text-slate-700'
                    }`}
                    title={soundMuted ? 'Unmute voice' : 'Mute voice'}
                  >
                    {soundMuted ? (
                      <VolumeX className="w-3.5 h-3.5" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5" />
                    )}
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
              <span>
                {isInspectorActive
                  ? lang === 'te'
                    ? 'పరిశీలిస్తోంది...'
                    : lang === 'hi'
                    ? 'जांच जारी...'
                    : 'Inspecting...'
                  : lang === 'te'
                  ? 'పాయింట్ & వివరణ'
                  : lang === 'hi'
                  ? 'पॉइंट व व्याख्या'
                  : 'Point & Explain'}
              </span>
            </button>

            {/* GYMNASTIC WIND-WHEEL BUTTON (COMPULSORY FEATURE) */}
            <button
              onClick={() => triggerGymnasticWindWheel(true)}
              className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold flex items-center space-x-1 shadow transition-all hover:scale-105 active:scale-95 cursor-pointer"
              title="Aarohi Bot performs a full gymnastic wind-wheel flip!"
            >
              <Zap className="w-3 h-3 fill-current text-slate-950" />
              <span>
                {lang === 'te'
                  ? '🤸‍♀️ గాలి చక్రం'
                  : lang === 'hi'
                  ? '🤸‍♀️ पवन चक्र'
                  : '🤸‍♀️ Wind Wheel'}
              </span>
            </button>

            {/* Stop Voice button in quick bar if speaking */}
            {isSpeaking && (
              <button
                onClick={stopVoice}
                className="px-2 py-0.5 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold flex items-center space-x-1"
                title="Stop Voice Output"
              >
                <Square className="w-2.5 h-2.5 fill-current" />
                <span>{lang === 'te' ? 'ఆపు' : lang === 'hi' ? 'रोकें' : 'Stop'}</span>
              </button>
            )}
          </div>

          {/* C. FEMALE ROBOT DOCTOR AVATAR (AI AAROHI BOT) */}
          <div
            onClick={() => {
              if (isMinimized) {
                setIsMinimized(false);
              } else {
                triggerGymnasticWindWheel(true);
              }
            }}
            className={`relative cursor-pointer group transition-transform duration-300 hover:scale-105 active:scale-95 ${
              isDoingWindWheel ? 'animate-dr-wind-wheel' : ''
            }`}
            title="Click AI Aarohi Bot to open chat or see her wind-wheel cartwheel!"
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
                  <rect
                    x="173"
                    y="108"
                    width="2.5"
                    height="9"
                    rx="1.2"
                    fill="#67E8F9"
                    stroke="#088395"
                    strokeWidth="0.8"
                  />
                  <rect
                    x="177"
                    y="106"
                    width="2.5"
                    height="11"
                    rx="1.2"
                    fill="#67E8F9"
                    stroke="#088395"
                    strokeWidth="0.8"
                  />
                  <rect
                    x="181"
                    y="109"
                    width="2.5"
                    height="8"
                    rx="1.2"
                    fill="#67E8F9"
                    stroke="#088395"
                    strokeWidth="0.8"
                  />
                </g>

                {/* --- 3. ROBOTIC HEAD & NODDING ANIMATION (@keyframes drHeadNod) --- */}
                <g id="drHead" className="animate-dr-head-nod">
                  {/* Right Telemetry Antenna with pulsating LED Tip */}
                  <g id="antenna">
                    <line
                      x1="140"
                      y1="65"
                      x2="162"
                      y2="40"
                      stroke="#0A4D68"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
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
                  <rect
                    x="42"
                    y="70"
                    width="8"
                    height="24"
                    rx="4"
                    fill="#0A4D68"
                    stroke="#088395"
                    strokeWidth="1"
                  />
                  {/* Right Head Fin node */}
                  <rect
                    x="150"
                    y="70"
                    width="8"
                    height="24"
                    rx="4"
                    fill="#0A4D68"
                    stroke="#088395"
                    strokeWidth="1"
                  />

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
                  <circle
                    cx="100"
                    cy="57"
                    r="4.5"
                    fill="#D97706"
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                  />

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
                      <path
                        d="M 72 82 Q 74 76 71 73"
                        stroke="#67E8F9"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                      />
                      <path
                        d="M 78 80 Q 80 74 78 71"
                        stroke="#67E8F9"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                      />
                      <path
                        d="M 84 81 Q 87 75 88 72"
                        stroke="#67E8F9"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                      />

                      {/* Cyan LED circular iris */}
                      <circle
                        cx="80"
                        cy="92"
                        r="10"
                        fill="url(#cyanLedEye)"
                        filter="url(#glowCyan)"
                      />
                      {/* Pupil catchlight reflection */}
                      <circle cx="77" cy="89" r="3" fill="#FFFFFF" opacity="0.9" />
                      <circle cx="83" cy="95" r="1.5" fill="#FFFFFF" opacity="0.7" />
                    </g>

                    {/* RIGHT EYE */}
                    <g id="rightEye">
                      {/* Eyelashes */}
                      <path
                        d="M 116 81 Q 113 75 112 72"
                        stroke="#67E8F9"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                      />
                      <path
                        d="M 122 80 Q 120 74 122 71"
                        stroke="#67E8F9"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                      />
                      <path
                        d="M 128 82 Q 126 76 129 73"
                        stroke="#67E8F9"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                      />

                      {/* Cyan LED circular iris */}
                      <circle
                        cx="120"
                        cy="92"
                        r="10"
                        fill="url(#cyanLedEye)"
                        filter="url(#glowCyan)"
                      />
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
              <span>{lang === 'te' ? 'ఆరోహి ఏఐ' : lang === 'hi' ? 'आरोही एआई' : 'Aarohi AI'}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AiArogyaAarohiBot;
