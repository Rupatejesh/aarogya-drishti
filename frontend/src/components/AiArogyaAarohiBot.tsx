import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Volume2,
  VolumeX,
  Square,
  Compass,
  X,
  MessageCircle,
  HelpCircle,
  Mic,
  Send,
  RotateCcw,
  Zap,
  Bot,
  User,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { Language } from '../i18n/translations.ts';
import api from '../services/api.ts';

interface AiArogyaAarohiBotProps {
  lang: Language;
  onLanguageChange?: (lang: Language) => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  source?: 'gemini' | 'clinical_engine';
}

export const AiArogyaAarohiBot: React.FC<AiArogyaAarohiBotProps> = ({
  lang,
  onLanguageChange
}) => {
  // Positioning & State: Locked firmly to bottom-right corner
  const [isMinimized, setIsMinimized] = useState(false);
  const [isInspectorActive, setIsInspectorActive] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isDoingWindWheel, setIsDoingWindWheel] = useState(false);
  const [soundMuted, setSoundMuted] = useState(false);
  const [isThinking, setIsThinking] = useState(false);

  // Input & Speech-to-Text State
  const [queryInput, setQueryInput] = useState('');
  const [isListening, setIsListening] = useState(false);

  // Inspector Highlight Overlay
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const [inspectedElementTitle, setInspectedElementTitle] = useState<string>('');

  // Initial Greeting according to Language
  const getGreetingText = (currentLang: Language): string => {
    switch (currentLang) {
      case 'te':
        return 'నమస్కారం! నేను ఏఐ ఆరోహి (AI Aarohi), మీ రోబో డాక్టర్ సహాయకురాలిని. నోటి క్యాన్సర్, ల్యూకోప్లాకియా (తెల్లటి/ఎర్రటి మచ్చలు), అడ్డాపొగ అలవాటు మాన్పు, 4మి.మీ పంచ్ బయాప్సీ లేదా డాక్టర్ అపాయింట్‌మెంట్ల గురించి నన్ను ఏదైనా అడగండి! మాట్లాడటానికి మైక్ నొక్కండి.';
      case 'hi':
        return 'नमस्ते! मैं एआई आरोही हूँ, आपकी रोबोट डॉक्टर सहायक। मुख कैंसर, ल्यूकोप्लाकिया (सफेद/लाल धब्बे), अड्डा पोगा (उलटा धूम्रपान) मुक्ति, 4 मिमी पंच बायोप्सी या डॉक्टर अपॉइंटमेंट पर मुझसे कुछ भी पूछें! बोलने के लिए माइक का उपयोग करें।';
      default:
        return 'Namaste! I am AI Aarohi, your female robot doctor assistant for ITDA Paderu. Ask me anything about oral cancer screening, leukoplakia, Adda Poga cessation, 4mm punch biopsies, or booking appointments! Tap the mic to speak.';
    }
  };

  // Chat Conversation History
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'initial-greeting',
      role: 'assistant',
      text: getGreetingText(lang),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      source: 'clinical_engine'
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef<string>('');

  // Update greeting when language changes if only initial message exists
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id === 'initial-greeting') {
        return [
          {
            id: 'initial-greeting',
            role: 'assistant',
            text: getGreetingText(lang),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            source: 'clinical_engine'
          }
        ];
      }
      return prev;
    });
  }, [lang]);

  // Auto-scroll chat to latest message
  useEffect(() => {
    if (!isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isThinking, isMinimized]);

  // Initialize SpeechSynthesis on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
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

  // Stop all active voice output
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
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        // ignore
      }
    }
    setIsSpeaking(false);
  };

  /**
   * Sentence-Chunked Speech Synthesis Engine (Bhashini Neural + Web Speech API)
   * Chunks sentences so Chrome never cuts off audio mid-speech.
   */
  const speakAloud = (rawText: string, forceLang?: Language) => {
    if (soundMuted) return;

    const targetLang = forceLang || lang;
    const cleanText = rawText
      .replace(/[#*`_~\[\]()•📍❓🤸‍♀️⏹️🎙️🔊\n]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) return;

    stopVoice();
    setIsSpeaking(true);

    const langCode = targetLang === 'te' ? 'te-IN' : targetLang === 'hi' ? 'hi-IN' : 'en-IN';

    // 1. Try playing with Web Speech API with sentence chunking
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();

        const sentences = cleanText
          .split(/(?<=[.!?।])\s+/)
          .map((s) => s.trim())
          .filter((s) => s.length > 0);

        if (sentences.length === 0) {
          sentences.push(cleanText);
        }

        const voices = window.speechSynthesis.getVoices();
        let targetVoice: SpeechSynthesisVoice | undefined;

        if (targetLang === 'te') {
          targetVoice = voices.find((v) => v.lang.includes('te') || v.name.toLowerCase().includes('telugu'));
        } else if (targetLang === 'hi') {
          targetVoice = voices.find((v) => v.lang.includes('hi') || v.name.toLowerCase().includes('hindi'));
        } else {
          targetVoice = voices.find(
            (v) =>
              (v.lang.includes('en-IN') || v.lang.includes('en-GB') || v.lang.includes('en')) &&
              (v.name.toLowerCase().includes('female') ||
                v.name.toLowerCase().includes('zira') ||
                v.name.toLowerCase().includes('google'))
          );
        }

        // If Telugu voice is not installed in OS, fallback to Neural audio URL
        if (targetLang === 'te' && !targetVoice) {
          playNeuralAudio(cleanText.slice(0, 190), 'te', () => {
            setIsSpeaking(false);
          });
          return;
        }

        // Create utterance chain
        let idx = 0;
        const playNextSentence = () => {
          if (idx >= sentences.length) {
            setIsSpeaking(false);
            return;
          }

          const utterance = new SpeechSynthesisUtterance(sentences[idx]);
          utterance.lang = langCode;
          if (targetVoice) utterance.voice = targetVoice;
          utterance.rate = 0.95;
          utterance.pitch = 1.1;

          utterance.onend = () => {
            idx++;
            playNextSentence();
          };

          utterance.onerror = (e) => {
            console.warn('[TTS Utterance Error]', e);
            idx++;
            playNextSentence();
          };

          window.speechSynthesis.speak(utterance);
        };

        playNextSentence();
        return;
      } catch (err) {
        console.warn('[Web Speech API Exception]', err);
      }
    }

    // 2. Fallback to Google / Bhashini Audio Element
    playNeuralAudio(cleanText.slice(0, 190), targetLang === 'te' ? 'te' : targetLang === 'hi' ? 'hi' : 'en', () => {
      setIsSpeaking(false);
    });
  };

  const playNeuralAudio = (text: string, langCode: string, onEnd: () => void) => {
    try {
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${langCode}&q=${encodeURIComponent(
        text
      )}`;
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => {
        audioRef.current = null;
        onEnd();
      };

      audio.onerror = () => {
        audioRef.current = null;
        onEnd();
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((e) => {
          console.warn('[Audio Play error]', e);
          audioRef.current = null;
          onEnd();
        });
      }
    } catch (e) {
      onEnd();
    }
  };

  /**
   * Comprehensive Clinical Fallback Knowledgebase (Used when API is offline)
   */
  const getClinicalFallback = (query: string, currentLang: Language): string => {
    const q = query.toLowerCase().trim();

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
      if (currentLang === 'te') {
        return 'ల్యూకోప్లాకియా అనేది నోటి లోపలి బుగ్గలు, నాలుక లేదా అంగిలిపై వచ్చే తెల్లటి మచ్చ. ఇది గీకినా పోదు. 2 నుండి 3 వారాలకు మించి మానకపోతే ఇది నోటి క్యాన్సర్‌కు పూర్వ సంకేతం కావచ్చు. అల్లూరి జిల్లా ఏరియా ఆసుపత్రి పాడేరు లేదా సి.హెచ్.సి జి.మాడుగులలో 4మి.మీ పంచ్ బయాప్సీ చేయించుకోవాలని సూచించడమైనది.';
      } else if (currentLang === 'hi') {
        return 'ल्यूकोप्लाकिया मुंह के भीतर सफेद धब्बे को कहते हैं जो 2-3 हफ्तों में ठीक नहीं होता। यह कैंसर का शुरुआती लक्षण हो सकता है। पाडेरू एरिया अस्पताल या सीएचसी में 4 मिमी पंच बायोप्सी जांच अवश्य करवाएं।';
      }
      return 'Oral Leukoplakia is a persistent, non-scrapable white patch in the oral cavity. If present for over 2-3 weeks, it is a clinically significant precancerous lesion. An immediate 4mm diagnostic punch biopsy at Area Hospital Paderu or CHC G. Madugula is strongly recommended.';
    }

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
      q.includes('तंबाकू')
    ) {
      if (currentLang === 'te') {
        return 'అడ్డాపొగ (రివర్స్ స్మోకింగ్) అనేది చుట్ట వెలిగించిన కొనను నోటి లోపల పెట్టుకుని తాగే ప్రమాదకర అలవాటు. దీని వల్ల నోటి లోపల 58 డిగ్రీలకు పైగా తీవ్ర వేడి పుట్టి అంగిలి కణజాలం తీవ్రంగా కాలిపోతుంది. దీనివల్ల సాధారణం కంటే అంగిలి క్యాన్సర్ వచ్చే ముప్పు 14 రెట్లు ఎక్కువ! మా అలవాటు మాన్పు కౌన్సెలింగ్ ద్వారా దీనిని వెంటనే ఆపండి.';
      } else if (currentLang === 'hi') {
        return 'अड्डा पोगा (उलटा धूम्रपान) में जलती हुई चट्टा को मुंह के भीतर रखकर पिया जाता है। इससे 58 डिग्री से अधिक गर्मी पैदा होती है जिससे तालु जलने लगता है और कैंसर का खतरा 14 गुना बढ़ जाता है। इसे तुरंत छोड़ें।';
      }
      return 'Adda Poga (Reverse Smoking) involves keeping the burning end of indigenous cigars inside the mouth. Heat exceeds 58°C, causing severe thermal and chemical injury to the palatal mucosa, raising palatal cancer risk by 14x. Habit cessation counseling is immediately advised.';
    }

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
      q.includes('दर्द')
    ) {
      if (currentLang === 'te') {
        return 'బయాప్సీ అనేది ఎలాంటి నొప్పి లేని సులభమైన 5 నిమిషాల సురక్షితమైన పరీక్ష! స్థానిక మత్తుమందు (లోకల్ అనెస్తీషియా) ఇచ్చి, ఒక చిన్న 4మి.మీ కణజాలాన్ని సేకరించి మైక్రోస్కోప్ ద్వారా పరిశీలిస్తారు. దీని ద్వారా వ్యాధిని తొలి దశలోనే గుర్తించి 100% నయం చేయవచ్చు. బయాప్సీ గురించి ఎవరూ భయపడవద్దు.';
      } else if (currentLang === 'hi') {
        return '4 मिमी पंच बायोप्सी एक पूरी तरह दर्द रहित और सुरक्षित 5 मिनट की जांच है। हल्का सुन्न करके ऊतक की जांच की जाती है जिससे प्रारंभिक अवस्था में ही रोग का पता लगाकर पूर्ण इलाज किया जा सकता है।';
      }
      return 'A 4mm diagnostic punch biopsy is a painless, safe 5-minute procedure performed under gentle local anesthesia. A tiny tissue core is excised and examined histologically to detect early dysplasia before malignancy develops. Early detection ensures 100% curability.';
    }

    if (
      q.includes('appointment') ||
      q.includes('book') ||
      q.includes('slot') ||
      q.includes('అపాయింట్‌మెంట్') ||
      q.includes('బుకింగ్') ||
      q.includes('స్లాట్') ||
      q.includes('अपॉइंटमेंट') ||
      q.includes('बुकिंग')
    ) {
      if (currentLang === 'te') {
        return 'డాక్టర్ అపాయింట్‌మెంట్ తీసుకోవడానికి: మీ డ్యాష్‌బోర్డ్‌లోని "బుక్ డాక్టర్" బటన్ క్లిక్ చేసి, జనరల్ చెకప్ లేదా బయాప్సీ ఎంచుకోండి. మీ మండలం (పాడేరు, అరకు, చింతపల్లి మొదలైనవి), డాక్టర్ మరియు అందుబాటులో ఉన్న సమయం ఎంచుకోండి. డాక్టర్ ఆమోదించగానే మీకు గ్రీన్ కార్డు నోటిఫికేషన్ వస్తుంది.';
      } else if (currentLang === 'hi') {
        return 'अपॉइंटमेंट बुक करने के लिए: "बुक डॉक्टर" पर क्लिक करें, सामान्य परामर्श या बायोप्सी चुनें, अपना नजदीकी स्वास्थ्य केंद्र, डॉक्टर और समय चुनें। स्वीकृति का लाइव कार्ड आपके डैशबोर्ड पर दिखेगा।';
      }
      return 'To book a doctor appointment: Click "Book Doctor", select General Consultation or Biopsy, choose your nearest Mandal health facility, doctor, and convenient time slot. You will receive an approved live status card with date and time.';
    }

    if (
      q.includes('video') ||
      q.includes('call') ||
      q.includes('webrtc') ||
      q.includes('telemedicine') ||
      q.includes('వీడియో') ||
      q.includes('కాల్') ||
      q.includes('టెలిమెడిసిన్') ||
      q.includes('वीडियो') ||
      q.includes('कॉल')
    ) {
      if (currentLang === 'te') {
        return 'లైవ్ వీడియో కాల్ కోసం: మీ డ్యాష్‌బోర్డ్‌లోని "లైవ్ వీడియో కాల్" బటన్ నొక్కండి. సురక్షితమైన WebRTC సాంకేతికత ద్వారా పాడేరు జిల్లా ఆంకాలజిస్ట్ డాక్టర్ స్వప్నా దేవి లేదా డాక్టర్ అనిల్ కుమార్‌తో ముఖాముఖి మాట్లాడవచ్చు. మీ కెమెరా, మైక్రోఫోన్ ఆన్ చేసి మాట్లాడండి.';
      } else if (currentLang === 'hi') {
        return 'लाइव वीडियो परामर्श के लिए "लाइव वीडियो कॉल" पर क्लिक करें। वेबआरटीसी द्वारा कैंसर विशेषज्ञ डॉक्टरों से सीधे लाइव वीडियो और ऑडियो द्वारा परामर्श प्राप्त करें।';
      }
      return 'To launch a live video call: Click "Live Video Call" to enter our peer-to-peer encrypted WebRTC room. You can consult live with Dr. Swapna Devi, MDS or Dr. Anil Kumar, MS with real-time video, audio, and clinical prescription notes.';
    }

    if (
      q.includes('mandal') ||
      q.includes('11') ||
      q.includes('hospital') ||
      q.includes('clinic') ||
      q.includes('paderu') ||
      q.includes('araku') ||
      q.includes('మండల') ||
      q.includes('ఆసుపత్రి') ||
      q.includes('పాడేరు') ||
      q.includes('11 मंडल')
    ) {
      if (currentLang === 'te') {
        return 'అల్లూరి సీతారామరాజు జిల్లాలోని 11 మండలాలు: పాడేరు, అరకు లోయ, చింతపల్లి, జి.మాడుగుల, అనంతగిరి, డుంబ్రిగుడ, హుకుంపేట, కొయ్యూరు, జి.కె.వీధి, ముంచంగిపుట్టు మరియు పెదబయలు. ఏరియా ఆసుపత్రి పాడేరు ప్రధాన కేంద్రంగా అన్ని పి.హెచ్.సిలలో స్క్రీనింగ్ మరియు బయాప్సీ అందుబాటులో ఉన్నాయి.';
      } else if (currentLang === 'hi') {
        return 'हमारा नेटवर्क अल्लूरी जिले के सभी 11 मंडलों में फैला है: पाडेरू, अरकु, चिंतापल्ली, जी.माडुगुला, अनंतगिरि, डुम्ब्रिगुडा, हुकुंपेटा, कोइयुरू, जीके वीधि, मुंचिंगपुट्टू और पेदाबायालु। पाडेरू अस्पताल मुख्य केंद्र है।';
      }
      return 'Our onco-network spans all 11 Mandals: Paderu, Araku Valley, Chintapalli, G. Madugula, Ananthagiri, Dumbriguda, Hukumpeta, Koyyuru, G.K. Veedhi, Munchingiputtu, and Pedabayalu, anchored by Area Hospital Paderu as the District Oncology Hub.';
    }

    if (
      q.includes('108') ||
      q.includes('104') ||
      q.includes('sos') ||
      q.includes('emergency') ||
      q.includes('అత్యవసర') ||
      q.includes('ఆపద') ||
      q.includes('आपात')
    ) {
      if (currentLang === 'te') {
        return 'గిరిజన అత్యవసర సమయాల్లో తక్షణ సహాయం కోసం 108 అంబులెన్స్ మరియు 104 ఉచిత వైద్య సలహా హెల్ప్‌లైన్‌ను సంప్రదించండి. హెడర్‌లోని ఎరుపు రంగు "గిరిజన అత్యవసర 108/104" బటన్ నొక్కడం ద్వారా నేరుగా కాల్ చేయవచ్చు.';
      } else if (currentLang === 'hi') {
        return 'चिकित्सीय आपात स्थिति में 108 एम्बुलेंस और 104 स्वास्थ्य सलाह हेल्पलाइन 24 घंटे उपलब्ध हैं। शीर्ष बार में लाल इमरजेंसी बटन दबाकर सीधे संपर्क करें।';
      }
      return 'In any medical emergency, call 108 for immediate 4WD ambulance dispatch across agency terrain or 104 for round-the-clock medical advice. You can also tap the red Emergency SOS button in the top navigation bar.';
    }

    if (
      q.includes('card') ||
      q.includes('uidn') ||
      q.includes('golden') ||
      q.includes('కార్డు') ||
      q.includes('గోల్డెన్ కార్డ్') ||
      q.includes('कार्ड')
    ) {
      if (currentLang === 'te') {
        return 'ఆరోగ్య దృష్టి గోల్డెన్ హెల్త్ కార్డులో మీ గిరిజన గుర్తింపు సంఖ్య (UIDN), బ్లడ్ గ్రూప్, బయోమార్కర్ రిస్క్ మరియు క్యూఆర్ కోడ్ ఉంటాయి. మీ డ్యాష్‌బోర్డ్ నుండి కార్డును 1-క్లిక్‌తో డౌన్‌లోడ్ లేదా ప్రింట్ చేసుకోవచ్చు.';
      } else if (currentLang === 'hi') {
        return 'आरोग्य दृष्टि डिजिटल कार्ड में आपका यूआईडीएन, रक्त समूह, बायोमार्कर रेटिंग और त्वरित जांच हेतु क्यूआर कोड शामिल है जिसे आप आसानी से डाउनलोड और प्रिंट कर सकते हैं।';
      }
      return 'The Aarogya Drishti Golden Health Card contains your official tribal UIDN, blood group, onco-biomarker score, and QR code for rapid hospital check-in with 1-click download and PDF printing.';
    }

    // General Greeting
    if (
      q.includes('hi') ||
      q.includes('hello') ||
      q.includes('namaste') ||
      q.includes('నమస్కారం') ||
      q.includes('హలో') ||
      q.includes('नमस्ते')
    ) {
      if (currentLang === 'te') {
        return 'నమస్కారం! నేను ఏఐ ఆరోహి బోట్. మీకు నోటి ఆరోగ్యం, ల్యూకోప్లాకియా పరీక్ష, అడ్డాపొగ అలవాటు మాన్పు లేదా డాక్టర్ అపాయింట్‌మెంట్లలో ఏ సహాయం కావాలన్నా నన్ను అడగండి!';
      } else if (currentLang === 'hi') {
        return 'नमस्ते! मैं एआई आरोही बॉट हूँ। मुख स्वास्थ्य, सफेद धब्बों की जांच, तंबाकू मुक्ति या डॉक्टर अपॉइंटमेंट पर मुझसे कुछ भी पूछें!';
      }
      return 'Namaste! I am AI Aarohi Bot. Feel free to ask me anything about oral cancer screening, white patches, reverse smoking cessation, or booking an appointment!';
    }

    // Default Clinical guidance
    if (currentLang === 'te') {
      return `మీరు అడిగిన '${query}' సమాచారాన్ని పరిశీలించాను. నోటిలో ఏవైనా తెల్లటి/ఎర్రటి మచ్చలు, మానని పుండ్లు లేదా కారం తిన్నప్పుడు మంట ఉంటే వెంటనే మా 'లైవ్ ఏఐ నోటి కెమెరా' ద్వారా ఫోటో తీసి పరిశీలించండి లేదా మా వైద్యులతో లైవ్ వీడియో సంప్రదింపులు జరపండి.`;
    } else if (currentLang === 'hi') {
      return `'${query}' के संबंध में: किसी भी लक्षण या सलाह हेतु हमारे एआई ओरल स्कैनर से फोटो लेकर जांच करें अथवा कैंसर विशेषज्ञ से लाइव वीडियो परामर्श प्राप्त करें।`;
    }
    return `Regarding your question on '${query}': For clinical symptoms or guidance, use our Multimodal AI Oral Scanner to take an oral photograph, or book a live WebRTC tele-consultation with our onco-specialists.`;
  };

  // Submit a question to Aarohi (Real Gemini API with Clinical Fallback)
  const handleAsk = async (queryText: string) => {
    const clean = queryText.trim();
    if (!clean) return;

    if (
      clean.toLowerCase().includes('wind wheel') ||
      clean.includes('గాలి చక్రం') ||
      clean.includes('पवन चक्र')
    ) {
      triggerGymnasticWindWheel(true);
      setQueryInput('');
      return;
    }

    const userMessage: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      text: clean,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    setQueryInput('');
    setIsThinking(true);

    try {
      const historyContext = messages.slice(-6).map((m) => ({
        role: m.role,
        text: m.text
      }));

      const res = await api.askAarohiChat({
        message: clean,
        language: lang,
        history: historyContext,
        role: 'patient'
      });

      let responseText = '';
      let source: 'gemini' | 'clinical_engine' = 'gemini';

      if (res && res.success && res.reply) {
        responseText = res.reply;
        source = res.source || 'gemini';
      } else {
        responseText = getClinicalFallback(clean, lang);
        source = 'clinical_engine';
      }

      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source
      };

      setMessages((prev) => [...prev, botMessage]);
      setIsThinking(false);

      speakAloud(responseText, lang);
    } catch (err) {
      console.warn('[Aarohi Chat API Notice, using clinical engine fallback]', err);
      const fallbackText = getClinicalFallback(clean, lang);

      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        text: fallbackText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: 'clinical_engine'
      };

      setMessages((prev) => [...prev, botMessage]);
      setIsThinking(false);

      speakAloud(fallbackText, lang);
    }
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
      const speechText =
        lang === 'te'
          ? 'చూడండి నా ఉల్లాసభరితమైన జిమ్నాస్టిక్ గాలి చక్రం (విండ్-వీల్) విన్యాసం! 11 మండలాల ప్రజల ఆరోగ్యం, ఉల్లాసం మరియు నవ్వుల కోసం నేను ఎల్లప్పుడూ సిద్ధంగా ఉంటాను!'
          : lang === 'hi'
          ? 'देखिए मेरा फुर्तीला पवन चक्र (विंड-व्हील) जिम्नास्टिक करतब! सभी 11 मंडलों में स्वास्थ्य और ऊर्जा का संचार!'
          : 'Watch my energetic gymnastic wind-wheel acrobatic flip! Keeping healthcare vibrant, positive, and engaging across all 11 Mandals of ITDA Paderu!';

      const trickMessage: ChatMessage = {
        id: `trick-${Date.now()}`,
        role: 'assistant',
        text: speechText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: 'clinical_engine'
      };

      setMessages((prev) => [...prev, trickMessage]);
      speakAloud(speechText, lang);
    }

    setTimeout(() => {
      setIsDoingWindWheel(false);
    }, 1300);
  };

  // UI Inspector Click-to-explain Handler
  useEffect(() => {
    if (!isInspectorActive) {
      setHighlightRect(null);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
      if (!el || el.closest('#aarohi-bot-container')) return;
      const rect = el.getBoundingClientRect();
      setHighlightRect(rect);
    };

    const handleClick = (e: MouseEvent) => {
      const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
      if (!el || el.closest('#aarohi-bot-container')) return;

      e.preventDefault();
      e.stopPropagation();

      const text = (el.innerText || el.getAttribute('aria-label') || el.title || '').trim();
      if (text) {
        setIsInspectorActive(false);
        setHighlightRect(null);
        handleAsk(
          lang === 'te'
            ? `'${text.slice(0, 50)}' గురించి వివరించండి`
            : lang === 'hi'
            ? `'${text.slice(0, 50)}' के बारे में समझाएं`
            : `Explain '${text.slice(0, 50)}'`
        );
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('click', handleClick, true);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('click', handleClick, true);
    };
  }, [isInspectorActive, lang]);

  // Quick Prompt Chips in Active Language
  const promptChips = [
    {
      id: 'leukoplakia',
      labelTe: '🔬 ల్యూకోప్లాకియా అంటే ఏమిటి?',
      labelEn: '🔬 What is Leukoplakia?',
      labelHi: '🔬 ल्यूकोप्लाकिया क्या है?'
    },
    {
      id: 'addapoga',
      labelTe: '🚬 అడ్డాపొగ ప్రమాదాలు ఏమిటి?',
      labelEn: '🚬 Adda Poga Risks?',
      labelHi: '🚬 उल्टा धूम्रपान के खतरे?'
    },
    {
      id: 'biopsy',
      labelTe: '🩺 4మి.మీ బయాప్సీ నొప్పిగా ఉంటుందా?',
      labelEn: '🩺 Is 4mm Punch Biopsy Painful?',
      labelHi: '🩺 क्या बायोप्सी में दर्द होता है?'
    },
    {
      id: 'booking',
      labelTe: '📅 డాక్టర్ అపాయింట్‌మెంట్ ఎలా బుక్ చేయాలి?',
      labelEn: '📅 How to book Appointment?',
      labelHi: '📅 डॉक्टर अपॉइंटमेंट कैसे लें?'
    },
    {
      id: 'hospitals',
      labelTe: '🏥 11 మండలాల ఆసుపత్రులు ఎక్కడ ఉన్నాయి?',
      labelEn: '🏥 11 Mandals Hospital Network',
      labelHi: '🏥 11 मंडल अस्पताल सूची'
    },
    {
      id: 'emergency',
      labelTe: '🚑 108 గిరిజన అత్యవసర సేవలు',
      labelEn: '🚑 108 Tribal Emergency SOS',
      labelHi: '🚑 108 जनजातीय आपातकालीन सेवा'
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

      {/* 2. Floating AI Aarohi Bot Container - LOCKED TO BOTTOM RIGHT CORNER */}
      <div
        id="aarohi-bot-container"
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 select-none print:hidden flex flex-col items-end"
        style={{
          position: 'fixed',
          bottom: '16px',
          right: '16px',
          left: 'auto',
          top: 'auto',
          zIndex: 9999
        }}
      >
        {/* A. Rich Conversational Chat Drawer */}
        {!isMinimized && (
          <div className="mb-3 w-[360px] sm:w-[420px] max-w-[calc(100vw-32px)] bg-white/95 backdrop-blur-md rounded-3xl border-2 border-[#088395] shadow-2xl flex flex-col overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-2">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#0A4D68] via-[#088395] to-[#0A4D68] p-3.5 text-white flex items-center justify-between shadow-md">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-full bg-white/20 border border-white/40 flex items-center justify-center p-0.5">
                  <Bot className="w-5 h-5 text-cyan-200" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-extrabold text-sm tracking-wide text-white">
                      {lang === 'te' ? 'ఏఐ ఆరోహి (AI Aarohi)' : lang === 'hi' ? 'एआई आरोही (AI Aarohi)' : 'AI Aarohi Bot'}
                    </h3>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <p className="text-[10px] text-cyan-100 font-medium">
                    {lang === 'te'
                      ? 'రోబో డాక్టర్ సహాయకురాలు • Bhashini & Web Speech'
                      : lang === 'hi'
                      ? 'रोबोट डॉक्टर सहायक • Bhashini & Web Speech'
                      : 'Robot Doctor Assistant • Multilingual Voice'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-1.5">
                {/* Language Switchers */}
                {onLanguageChange && (
                  <div className="flex items-center bg-black/25 rounded-lg p-0.5 text-[9px] font-bold">
                    <button
                      onClick={() => onLanguageChange('en')}
                      className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                        lang === 'en' ? 'bg-white text-[#0A4D68] shadow-sm' : 'text-cyan-100 hover:text-white'
                      }`}
                    >
                      EN
                    </button>
                    <button
                      onClick={() => onLanguageChange('te')}
                      className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                        lang === 'te' ? 'bg-white text-[#0A4D68] shadow-sm' : 'text-cyan-100 hover:text-white'
                      }`}
                    >
                      తె
                    </button>
                    <button
                      onClick={() => onLanguageChange('hi')}
                      className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                        lang === 'hi' ? 'bg-white text-[#0A4D68] shadow-sm' : 'text-cyan-100 hover:text-white'
                      }`}
                    >
                      हि
                    </button>
                  </div>
                )}

                {/* Sound Mute Toggle */}
                <button
                  onClick={() => {
                    if (isSpeaking) stopVoice();
                    setSoundMuted(!soundMuted);
                  }}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    soundMuted ? 'bg-red-500/80 text-white' : 'hover:bg-white/20 text-cyan-100'
                  }`}
                  title={soundMuted ? 'Unmute voice' : 'Mute voice'}
                >
                  {soundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>

                {/* Minimize Button */}
                <button
                  onClick={() => setIsMinimized(true)}
                  className="p-1.5 hover:bg-white/20 rounded-lg text-cyan-100 transition-colors cursor-pointer"
                  title="Minimize"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Chat Messages Body */}
            <div className="p-3.5 space-y-3 overflow-y-auto max-h-[300px] min-h-[180px] bg-slate-50/70 text-xs">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 shadow-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-[#0A4D68] text-white rounded-br-none'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                    }`}
                  >
                    <p className="whitespace-pre-line text-xs font-medium">{msg.text}</p>

                    <div
                      className={`mt-1.5 flex items-center justify-between text-[10px] ${
                        msg.role === 'user' ? 'text-cyan-200' : 'text-slate-400'
                      }`}
                    >
                      <span>{msg.timestamp}</span>

                      {/* Replay Voice button on Assistant messages */}
                      {msg.role === 'assistant' && (
                        <div className="flex items-center space-x-1.5">
                          {msg.source === 'gemini' && (
                            <span className="text-[9px] bg-emerald-50 text-emerald-700 px-1 py-0.2 rounded border border-emerald-200 font-bold">
                              Gemini AI
                            </span>
                          )}
                          <button
                            onClick={() => speakAloud(msg.text, lang)}
                            className="p-1 text-slate-500 hover:text-[#088395] rounded transition-colors cursor-pointer"
                            title="Speak message aloud"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Thinking Indicator */}
              {isThinking && (
                <div className="flex items-start space-x-2">
                  <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none p-3 shadow-sm flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-[#088395] animate-ping" />
                    <span className="text-xs font-bold text-slate-600">
                      {lang === 'te'
                        ? 'ఆరోహి ఆలోచిస్తోంది...'
                        : lang === 'hi'
                        ? 'आरोही विश्लेषण कर रही है...'
                        : 'Aarohi is analyzing...'}
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestion Chips */}
            <div className="px-3 py-2 bg-slate-100/90 border-t border-slate-200 flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              <span className="w-full text-[9px] font-bold text-slate-500 mb-0.5">
                {lang === 'te'
                  ? 'త్వరిత ప్రశ్నలు (ఒక్క క్లిక్‌తో అడగండి):'
                  : lang === 'hi'
                  ? 'त्वरित प्रश्न (एक क्लिक में पूछें):'
                  : 'Quick Suggestions (Tap to ask):'}
              </span>
              {promptChips.map((chip) => (
                <button
                  key={chip.id}
                  onClick={() =>
                    handleAsk(
                      lang === 'te'
                        ? chip.labelTe
                        : lang === 'hi'
                        ? chip.labelHi
                        : chip.labelEn
                    )
                  }
                  className="text-[10px] bg-white hover:bg-cyan-50 hover:text-[#088395] hover:border-[#088395] text-slate-700 px-2 py-1 rounded-full border border-slate-200 shadow-2xs transition-all font-medium text-left truncate max-w-full cursor-pointer"
                >
                  {lang === 'te' ? chip.labelTe : lang === 'hi' ? chip.labelHi : chip.labelEn}
                </button>
              ))}
            </div>

            {/* Voice Status & Stop Button Bar */}
            {isSpeaking && (
              <div className="px-3.5 py-1.5 bg-amber-50 border-t border-amber-200 flex items-center justify-between text-xs text-amber-900 animate-pulse">
                <div className="flex items-center space-x-2">
                  <span className="flex space-x-0.5 items-end h-3">
                    <span className="w-1 bg-[#088395] animate-[bounce_0.6s_infinite_100ms] h-3 rounded-full" />
                    <span className="w-1 bg-cyan-400 animate-[bounce_0.6s_infinite_300ms] h-2 rounded-full" />
                    <span className="w-1 bg-[#D97706] animate-[bounce_0.6s_infinite_200ms] h-3.5 rounded-full" />
                  </span>
                  <span className="font-bold text-[11px]">
                    {lang === 'te'
                      ? 'ఆరోహి మాట్లాడుతోంది...'
                      : lang === 'hi'
                      ? 'आरोही बोल रही है...'
                      : 'Aarohi speaking...'}
                  </span>
                </div>
                <button
                  onClick={stopVoice}
                  className="px-2.5 py-0.5 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-md text-[10px] flex items-center space-x-1 shadow-sm cursor-pointer"
                >
                  <Square className="w-2.5 h-2.5 fill-current" />
                  <span>
                    {lang === 'te' ? 'వాయిస్ ఆపు ⏹️' : lang === 'hi' ? 'आवाज रोकें ⏹️' : 'Stop Voice ⏹️'}
                  </span>
                </button>
              </div>
            )}

            {/* Question Input Form with Speech-to-Text Mic */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAsk(queryInput);
              }}
              className="p-2.5 bg-white border-t border-slate-200 flex items-center space-x-2"
            >
              {/* Microphone Button (STT) */}
              <button
                type="button"
                onClick={toggleListening}
                className={`p-2 rounded-xl transition-all flex items-center justify-center cursor-pointer ${
                  isListening
                    ? 'bg-red-500 text-white animate-pulse ring-2 ring-red-400 shadow-md'
                    : 'bg-slate-100 text-slate-700 hover:text-[#088395] hover:bg-cyan-50 border border-slate-200'
                }`}
                title={
                  isListening
                    ? lang === 'te'
                      ? 'వినడం ఆపు'
                      : 'Stop listening'
                    : lang === 'te'
                    ? 'మైక్ ద్వారా అడగండి (te-IN)'
                    : 'Speak via Microphone'
                }
              >
                <Mic className="w-4 h-4" />
              </button>

              {/* Text Input */}
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
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#088395] focus:bg-white transition-all"
              />

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!queryInput.trim()}
                className={`p-2 rounded-xl transition-all flex items-center justify-center cursor-pointer ${
                  queryInput.trim()
                    ? 'bg-[#088395] hover:bg-[#0A4D68] text-white shadow-sm'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
                title="Send Question"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* B. Action Quick Bar above Robot */}
        <div className="flex items-center space-x-1.5 mb-1.5 bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-full border border-slate-700 shadow-lg text-[10px] text-white">
          {/* Inspector Toggle */}
          <button
            onClick={() => setIsInspectorActive(!isInspectorActive)}
            className={`px-2 py-0.5 rounded-full font-bold transition-all flex items-center space-x-1 cursor-pointer ${
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

          {/* GYMNASTIC WIND-WHEEL BUTTON */}
          <button
            onClick={() => triggerGymnasticWindWheel(true)}
            className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold flex items-center space-x-1 shadow transition-all hover:scale-105 active:scale-95 cursor-pointer"
            title="Aarohi Bot performs a full gymnastic wind-wheel flip!"
          >
            <Zap className="w-3 h-3 fill-current text-slate-950" />
            <span>
              {lang === 'te' ? '🤸‍♀️ గాలి చక్రం' : lang === 'hi' ? '🤸‍♀️ पवन चक्र' : '🤸‍♀️ Wind Wheel'}
            </span>
          </button>

          {/* Toggle Chat Box */}
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="px-2 py-0.5 rounded-full bg-[#088395] hover:bg-[#0A4D68] text-white font-bold flex items-center space-x-1 cursor-pointer"
          >
            <MessageCircle className="w-3 h-3" />
            <span>{isMinimized ? (lang === 'te' ? 'చాట్ తెరువు' : 'Open Chat') : (lang === 'te' ? 'మడతపెట్టు' : 'Minimize')}</span>
          </button>
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
          title="Click AI Aarohi Bot to chat or see her wind-wheel cartwheel!"
        >
          {/* Glowing Aura Ring */}
          <div className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-cyan-400 via-[#088395] to-[#D97706] opacity-75 blur-sm group-hover:opacity-100 transition-opacity animate-pulse" />

          {/* Robot SVG Masterpiece */}
          <div className="relative w-22 h-22 sm:w-26 sm:h-26 rounded-full bg-gradient-to-b from-slate-100 to-slate-200 border-2 border-white shadow-2xl flex items-center justify-center overflow-hidden">
            <svg
              viewBox="0 0 200 200"
              className="w-full h-full"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
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
                <path
                  d="M 40 160 Q 100 145 160 160 L 175 200 L 25 200 Z"
                  fill="url(#doctorApron)"
                  stroke="#CBD5E1"
                  strokeWidth="2"
                />
                <path
                  d="M 68 155 L 100 195 L 132 155 Z"
                  fill="#0A4D68"
                  stroke="#088395"
                  strokeWidth="2"
                />
                <circle cx="62" cy="180" r="8" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
                <rect x="60" y="174" width="4" height="12" rx="1" fill="#991B1B" />
                <rect x="56" y="178" width="12" height="4" rx="1" fill="#991B1B" />

                <path
                  d="M 75 152 Q 100 185 125 152"
                  stroke="url(#stethoscopeCol)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  fill="none"
                />
                <circle cx="100" cy="186" r="6" fill="#088395" stroke="#FFFFFF" strokeWidth="1.5" />
                <circle cx="100" cy="186" r="3" fill="#67E8F9" filter="url(#glowCyan)" />
              </g>

              {/* --- 2. CONTINUOUS WAVING MECHANICAL RIGHT HAND --- */}
              <g id="drWavingHand" className="animate-dr-hand-wave">
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
                <circle cx="177" cy="122" r="7" fill="#FFFFFF" stroke="#0A4D68" strokeWidth="2" />
                <rect x="173" y="108" width="2.5" height="9" rx="1.2" fill="#67E8F9" stroke="#088395" strokeWidth="0.8" />
                <rect x="177" y="106" width="2.5" height="11" rx="1.2" fill="#67E8F9" stroke="#088395" strokeWidth="0.8" />
                <rect x="181" y="109" width="2.5" height="8" rx="1.2" fill="#67E8F9" stroke="#088395" strokeWidth="0.8" />
              </g>

              {/* --- 3. ROBOTIC HEAD & NODDING ANIMATION --- */}
              <g id="drHead" className="animate-dr-head-nod">
                <g id="antenna">
                  <line x1="140" y1="65" x2="162" y2="40" stroke="#0A4D68" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx="163" cy="39" r="5.5" fill="#D97706" className="animate-dr-antenna-pulse" filter="url(#glowCyan)" />
                  <circle cx="163" cy="39" r="2.5" fill="#67E8F9" />
                </g>

                <rect x="42" y="70" width="8" height="24" rx="4" fill="#0A4D68" stroke="#088395" strokeWidth="1" />
                <rect x="150" y="70" width="8" height="24" rx="4" fill="#0A4D68" stroke="#088395" strokeWidth="1" />

                <path
                  d="M 50 85 C 50 48, 150 48, 150 85 C 150 125, 130 148, 100 148 C 70 148, 50 125, 50 85 Z"
                  fill="url(#headShell)"
                  stroke="#0A4D68"
                  strokeWidth="3"
                />

                <path d="M 58 64 Q 100 52 142 64" stroke="#088395" strokeWidth="3.5" strokeLinecap="round" fill="none" />
                <circle cx="100" cy="57" r="4.5" fill="#D97706" stroke="#FFFFFF" strokeWidth="1.5" />

                <path
                  d="M 58 82 C 58 72, 142 72, 142 82 C 142 114, 130 128, 100 128 C 70 128, 58 114, 58 82 Z"
                  fill="url(#darkVisor)"
                  stroke="#088395"
                  strokeWidth="2"
                />

                <path d="M 66 79 Q 100 74 134 79" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" opacity="0.35" fill="none" />

                {/* --- GLOWING CYAN LED EYES --- */}
                <g id="eyes" className="animate-dr-eye-blink">
                  <g id="leftEye">
                    <path d="M 72 82 Q 74 76 71 73" stroke="#67E8F9" strokeWidth="1.6" strokeLinecap="round" />
                    <path d="M 78 80 Q 80 74 78 71" stroke="#67E8F9" strokeWidth="1.6" strokeLinecap="round" />
                    <circle cx="80" cy="92" r="10" fill="url(#cyanLedEye)" filter="url(#glowCyan)" />
                    <circle cx="77" cy="89" r="3" fill="#FFFFFF" opacity="0.9" />
                  </g>

                  <g id="rightEye">
                    <path d="M 116 81 Q 113 75 112 72" stroke="#67E8F9" strokeWidth="1.6" strokeLinecap="round" />
                    <path d="M 122 80 Q 120 74 122 71" stroke="#67E8F9" strokeWidth="1.6" strokeLinecap="round" />
                    <circle cx="120" cy="92" r="10" fill="url(#cyanLedEye)" filter="url(#glowCyan)" />
                    <circle cx="117" cy="89" r="3" fill="#FFFFFF" opacity="0.9" />
                  </g>
                </g>

                <path
                  d="M 88 114 Q 100 124 112 114"
                  stroke="#67E8F9"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  fill="none"
                  filter="url(#glowCyan)"
                />
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
    </>
  );
};

export default AiArogyaAarohiBot;
