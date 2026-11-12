import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  Bot,
  Play,
  Pause,
  AlertCircle,
  HelpCircle,
  Video,
  Calendar,
  FileText,
  Activity,
  CheckCircle2,
  Headphones,
  Sliders,
  Globe,
  QrCode,
  MessageSquare
} from 'lucide-react';
import { Language, translations } from '../i18n/translations.ts';

interface AiArogyaVoiceAssistantProps {
  lang: Language;
  onTranscriptionComplete?: (transcript: string) => void;
  onNavigateToTab?: (tab: string) => void;
}

interface AudioTopic {
  id: string;
  titleEn: string;
  titleTe: string;
  titleHi: string;
  icon: any;
  speechTextEn: string;
  speechTextTe: string;
  speechTextHi: string;
}

export const AiArogyaVoiceAssistant: React.FC<AiArogyaVoiceAssistantProps> = ({
  lang,
  onTranscriptionComplete,
  onNavigateToTab
}) => {
  const t = translations[lang];

  // Speech Synthesis state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);
  const [speechRate, setSpeechRate] = useState<number>(0.9); // Slower for low-literacy clarity
  const [selectedVoiceLang, setSelectedVoiceLang] = useState<Language>(lang);

  // Speech Recognition (Mic) state
  const [isListening, setIsListening] = useState(false);
  const [spokenTranscript, setSpokenTranscript] = useState('');
  const [micSupported, setMicSupported] = useState(true);

  const recognitionRef = useRef<any>(null);

  // Sync selected voice language when prop changes
  useEffect(() => {
    setSelectedVoiceLang(lang);
  }, [lang]);

  // Cleanup speech synthesis on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // Pre-curated bilingual voice guides for tribal citizens
  const topics: AudioTopic[] = [
    {
      id: 'symptoms',
      titleEn: '1. Oral Cancer Warning Signs & Symptoms',
      titleTe: '1. నోటి క్యాన్సర్ హెచ్చరిక లక్షణాలు',
      titleHi: '1. मुँह के कैंसर के चेतावनी लक्षण',
      icon: AlertCircle,
      speechTextEn:
        'Aarogya Drishti oral health alert: If you have a mouth ulcer that has not healed for more than two weeks, a white or red patch on your cheek, difficulty opening your mouth, or a burning sensation when eating food, these are early warning signs. Please capture an oral photo or consult our doctor immediately.',
      speechTextTe:
        'ఆరోగ్య దృష్టి సమాచారం: మీ నోటిలో రెండు వారాల కంటే ఎక్కువ కాలం మానని పుండు, చెంపపై తెల్లటి లేదా ఎర్రటి మచ్చ, నోరు తెరవడంలో ఇబ్బంది లేదా కారంగా ఉన్న ఆహారం తిన్నప్పుడు మంట ఉంటే, ఇవి తొలి దశ లక్షణాలు. వెంటనే మీ నోటి ఫోటో తీసి మా నిపుణుల వైద్యులను సంప్రదించండి.',
      speechTextHi:
        'आरोग्य दृष्टि मौखिक स्वास्थ्य सूचना: यदि आपके मुंह में दो सप्ताह से अधिक समय से ऐसा छाला है जो ठीक नहीं हो रहा है, गाल पर सफेद या लाल धब्बा है, मुंह खोलने में कठिनाई है या जलन होती है, तो यह शुरुआती लक्षण हैं। कृपया तुरंत फोटो लें या हमारे डॉक्टर से संपर्क करें।'
    },
    {
      id: 'reverse_smoking',
      titleEn: '2. Dangers of "Chutta" (Reverse Smoking)',
      titleTe: '2. అడ్డా పొగ (రివర్స్ స్మోకింగ్) ప్రమాదాలు',
      titleHi: '2. उलटा धूम्रपान (रिवर्स स्मोकिंग) के खतरे',
      icon: Activity,
      speechTextEn:
        'Reverse smoking, locally called Chutta, burns tobacco inside the oral cavity reaching temperatures over fifty-eight degrees Celsius. This directly damages the palate and cheek mucosa, increasing the risk of palatal cancer by fourteen times. Stop today to allow natural mucosal healing.',
      speechTextTe:
        'అడ్డా పొగ తాగడం వల్ల నోటి లోపల యాభై ఎనిమిది డిగ్రీల కంటే ఎక్కువ వేడి పుట్టి అంగిలి మరియు చెంప కణజాలం తీవ్రంగా దెబ్బతింటుంది. దీని వలన నోటి క్యాన్సర్ వచ్చే అవకాశం పద్నాలుగు రెట్లు పెరుగుతుంది. మీ ఆరోగ్యం కోసం పొగత్రాగడం తక్షణం ఆపండి.',
      speechTextHi:
        'उलटा धूम्रपान करने से मुंह के अंदर अत्यधिक गर्मी पैदा होती है जिससे तालु और गाल की परत को भारी नुकसान पहुंचता है। इससे कैंसर का खतरा 14 गुना बढ़ जाता है। आज ही इसे छोड़ें और स्वस्थ रहें।'
    },
    {
      id: 'biopsy_safety',
      titleEn: '3. Why Biopsy is Safe & Necessary',
      titleTe: '3. బయాప్సీ సురక్షితమైనది మరియు అవసరమైనది',
      titleHi: '3. बायोप्सी सुरक्षित और आवश्यक क्यों है',
      icon: FileText,
      speechTextEn:
        'A biopsy is a simple, painless diagnostic test taking only five minutes under local numbing. A tiny millimeter sample is examined under a microscope to confirm if a patch is non-cancerous or early-stage curable. Do not fear biopsy; early detection saves lives.',
      speechTextTe:
        'బయాప్సీ అనేది ఎలాంటి నొప్పి లేని సులభమైన ఐదు నిమిషాల పరీక్ష. స్థానిక మత్తుమందు ఇచ్చి ఒక చిన్న ముక్కను మైక్రోస్కోప్ ద్వారా పరిశీలిస్తారు. దీని ద్వారా వ్యాధిని ప్రారంభంలోనే గుర్తించి నయం చేయవచ్చు. బయాప్సీ గురించి ఎవరూ భయపడవద్దు.',
      speechTextHi:
        'बायोप्सी एक दर्द रहित और सुरक्षित जांच है जिसमें केवल पांच मिनट लगते हैं। सूक्ष्मदर्शी से जांच करके बीमारी का सही समय पर पता लगाया जाता है। बायोप्सी से बिल्कुल न डरें; समय पर पहचान जीवन बचाती है।'
    },
    {
      id: 'appointment_guide',
      titleEn: '4. How to Apply for Appointment & Check Notifications',
      titleTe: '4. అపాయింట్‌మెంట్ తీసుకోవడం మరియు నోటిఫికేషన్లు చూడడం',
      titleHi: '4. अपॉइंटमेंट आवेदन और नोटिफिकेशन देखना',
      icon: Calendar,
      speechTextEn:
        'To book an appointment, click on Book Doctor, select General Consultation or Biopsy Procedure, choose your nearest PHC and available slot. In the Notifications section, you can see live green APPROVED or amber PENDING status cards with your allotted date, day, time and doctor remarks.',
      speechTextTe:
        'అపాయింట్‌మెంట్ తీసుకోవడానికి బుక్ డాక్టర్ పై క్లిక్ చేసి, జనరల్ సంప్రదింపు లేదా బయాప్సీ ప్రొసీజర్ ఎంచుకోండి. నోటిఫికేషన్ల విభాగంలో ఆమోదించబడిన తేదీ, సమయం మరియు డాక్టర్ సూచనలతో కూడిన గ్రీన్ అప్రూవ్డ్ కార్డును మీరు నేరుగా చూడవచ్చు.',
      speechTextHi:
        'अपॉइंटमेंट के लिए बुक डॉक्टर पर जाएं, सामान्य परामर्श या बायोप्सी प्रक्रिया चुनें। नोटिफिकेशन सेक्शन में आप स्वीकृत तिथि, समय और डॉक्टर की सलाह सीधे देख सकते हैं।'
    },
    {
      id: 'chat_webrtc',
      titleEn: '5. Doctor Chat, WebRTC Video Call & Documents File Option',
      titleTe: '5. డాక్టర్ చాట్, వీడియో కాల్ మరియు ప్రిస్క్రిప్షన్ ఫైల్ పంపడం',
      titleHi: '5. डॉक्टर चैट, वीडियो कॉल और प्रिस्क्रिप्शन फाइल भेजना',
      icon: MessageSquare,
      speechTextEn:
        'In the Doctor ChatBox, verify if your doctor is active online. You can chat live and click the Send Prescription from History button to automatically attach your official digital prescription to the doctor. Click Launch Video Call to enter the encrypted live WebRTC consultation room.',
      speechTextTe:
        'డాక్టర్ చాట్‌బాక్స్‌లో డాక్టర్ ఆన్‌లైన్‌లో ఉన్నారో లేదో చూడవచ్చు. "సెండ్ ప్రిస్క్రిప్షన్ ఫ్రమ్ హిస్టరీ" బటన్ ద్వారా మీ మునుపటి మందుల పత్రాన్ని డాక్టర్‌కు వెంటనే పంపవచ్చు. వీడియో కాల్ ప్రారంభించడానికి లాంచ్ వీడియో కాల్ బటన్ నొక్కండి.',
      speechTextHi:
        'डॉक्टर चैटबॉक्स में डॉक्टर की ऑनलाइन स्थिति देखकर लाइव संदेश भेजें और "सेंड प्रिस्क्रिप्शन फ्रॉम हिस्ट्री" बटन दबाकर अपनी पुरानी पर्ची डॉक्टर को भेजें। वीडियो कॉल शुरू करने के लिए लॉन्च वीडियो कॉल पर क्लिक करें।'
    },
    {
      id: 'card_history',
      titleEn: '6. Check UIDN, Health Card & Download Prescriptions',
      titleTe: '6. మీ UIDN, హెల్త్ కార్డ్ చూడడం మరియు ప్రిస్క్రిప్షన్ డౌన్‌లోడ్',
      titleHi: '6. अपना UIDN, हेल्थ कार्ड देखना और पर्ची डाउनलोड करना',
      icon: QrCode,
      speechTextEn:
        'Your assigned Universal Patient ID Number is displayed on your Golden Health Card with ABDM QR code. In the Prescription History section, view your 4-step treatment journey tracking status, tablet course, and click Download Slip to print official bilingual Medical or Biopsy treatment prescriptions.',
      speechTextTe:
        'మీ ఆరోగ్య దృష్టి డిజిటల్ కార్డుపై ప్రత్యేకమైన UIDN నంబర్ మరియు క్యూఆర్ కోడ్ ఉంటాయి. ప్రిస్క్రిప్షన్ విభాగంలో 4-దశల చికిత్స ప్రయాణం, మందుల వివరాలు చూడవచ్చు మరియు అధికారిక ప్రిస్క్రిప్షన్ పత్రాన్ని సులభంగా ప్రింట్ లేదా డౌన్‌లోడ్ చేసుకోవచ్చు.',
      speechTextHi:
        'आपके डिजिटल हेल्थ कार्ड पर आपका विशेष UIDN नंबर और क्यूआर कोड उपलब्ध है। इतिहास में 4-चरणीय उपचार स्थिति देखें और मेडिकल व बायोप्सी पर्ची को एक क्लिक में डाउनलोड करें।'
    }
  ];

  // Text-to-Speech Engine
  const speakText = (text: string, topicId?: string) => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported on this browser.');
      return;
    }

    window.speechSynthesis.cancel();

    if (isSpeaking && activeTopicId === topicId) {
      setIsSpeaking(false);
      setActiveTopicId(null);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = speechRate;
    utterance.pitch = 1.0;

    if (selectedVoiceLang === 'te') {
      utterance.lang = 'te-IN';
    } else if (selectedVoiceLang === 'hi') {
      utterance.lang = 'hi-IN';
    } else {
      utterance.lang = 'en-IN';
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      if (topicId) setActiveTopicId(topicId);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setActiveTopicId(null);
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis error:', e);
      setIsSpeaking(false);
      setActiveTopicId(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setActiveTopicId(null);
    }
  };

  // Play All Awareness Speeches in Sequence
  const playAllAwarenessSpeeches = () => {
    const fullText = topics.map((t) => {
      if (selectedVoiceLang === 'te') return `${t.titleTe}. ${t.speechTextTe}`;
      if (selectedVoiceLang === 'hi') return `${t.titleHi}. ${t.speechTextHi}`;
      return `${t.titleEn}. ${t.speechTextEn}`;
    }).join(' ... ');

    speakText(fullText, 'master-awareness');
  };

  // Speech-to-Text Microphone Engine
  const toggleListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported on this browser. Please use Chrome.');
      setMicSupported(false);
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = true;

      if (selectedVoiceLang === 'te') {
        recognition.lang = 'te-IN';
      } else if (selectedVoiceLang === 'hi') {
        recognition.lang = 'hi-IN';
      } else {
        recognition.lang = 'en-IN';
      }

      recognition.onstart = () => {
        setIsListening(true);
        setSpokenTranscript('');
      };

      recognition.onresult = (event: any) => {
        let current = '';
        for (let i = 0; i < event.results.length; i++) {
          current += event.results[i][0].transcript;
        }
        setSpokenTranscript(current);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition notice:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        if (spokenTranscript && onTranscriptionComplete) {
          onTranscriptionComplete(spokenTranscript);
        }
      };

      recognition.start();
    } catch (err) {
      console.warn('Recognition start exception:', err);
      setIsListening(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-luxury space-y-6">
      {/* Top Header (Royal Blue & White Theme) */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-royal-600 to-royal-800 text-white flex items-center justify-center shadow-blue-card">
            <Bot className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                {lang === 'te'
                  ? 'ఏఐ ఆరోగ్యా వాయిస్ అసిస్టెంట్'
                  : lang === 'hi'
                  ? 'एआई आरोग्या वॉइस सहायक'
                  : 'AI Arogya Trilingual Voice Assistant'}
              </h3>
              <span className="text-[10px] font-bold bg-blue-100 text-royal-800 px-2.5 py-0.5 rounded-full border border-blue-200">
                te-IN • hi-IN • en-IN
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {lang === 'te'
                ? 'గిరిజన ప్రజల కోసం నోటి క్యాన్సర్ అవగాహన మరియు వాయిస్ సహాయం'
                : lang === 'hi'
                ? 'जनजातीय नागरिकों हेतु मुख कैंसर जागरूकता एवं वॉइस सहायता'
                : 'Spoken voice assistance & oral cancer awareness designed for low-literacy agency citizens'}
            </p>
          </div>
        </div>

        {/* Action Controls: Master Awareness Speech Button & Language Selector */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={playAllAwarenessSpeeches}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-2 shadow-sm ${
              activeTopicId === 'master-awareness' && isSpeaking
                ? 'bg-yellow-400 text-slate-950 ring-2 ring-yellow-500 animate-pulse'
                : 'bg-royal-600 hover:bg-royal-700 text-white shadow-blue-card'
            }`}
          >
            <Headphones className="w-4 h-4" />
            <span>
              {lang === 'te'
                ? 'నోటి ఆరోగ్య అవగాహన ప్రసంగాలు వినండి'
                : lang === 'hi'
                ? 'मुख स्वास्थ्य जागरूकता भाषण सुनें'
                : 'Oral Health Related Awareness Speeches'}
            </span>
          </button>

          {/* Voice Language Buttons */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => {
                setSelectedVoiceLang('en');
                stopSpeaking();
              }}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                selectedVoiceLang === 'en' ? 'bg-royal-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => {
                setSelectedVoiceLang('te');
                stopSpeaking();
              }}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                selectedVoiceLang === 'te' ? 'bg-royal-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              తెలుగు
            </button>
            <button
              onClick={() => {
                setSelectedVoiceLang('hi');
                stopSpeaking();
              }}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                selectedVoiceLang === 'hi' ? 'bg-royal-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              हिंदी
            </button>
          </div>

          {/* Global Stop Button */}
          {isSpeaking && (
            <button
              onClick={stopSpeaking}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1 shadow-sm"
            >
              <VolumeX className="w-3.5 h-3.5" />
              <span>{lang === 'te' ? 'వాయిస్ ఆపు ⏹️' : lang === 'hi' ? 'आवाज रोकें ⏹️' : 'Stop Voice'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Voice Recognition Microphone Bar */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={toggleListening}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
              isListening
                ? 'bg-red-600 text-white animate-pulse ring-4 ring-red-300'
                : 'bg-royal-600 hover:bg-royal-700 text-white shadow-sm'
            }`}
            title="Click to speak your symptoms or question"
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          <div>
            <div className="text-xs font-bold text-slate-900">
              {isListening
                ? lang === 'te'
                  ? 'మీ వాయిస్ వింటోంది...'
                  : lang === 'hi'
                  ? 'आपकी आवाज सुन रहा है...'
                  : 'Listening to your voice...'
                : lang === 'te'
                ? 'మీ భాషలో మాట్లాడటానికి మైక్ క్లిక్ చేయండి'
                : lang === 'hi'
                ? 'अपनी भाषा में बोलने के लिए माइक दबाएं'
                : 'Tap microphone to speak in your language'}
            </div>
            <div className="text-[11px] text-slate-500">
              {spokenTranscript ||
                (lang === 'te'
                  ? 'లక్షణాలు, తెల్లటి మచ్చ లేదా డాక్టర్ అపాయింట్‌మెంట్ గురించి అడగండి'
                  : lang === 'hi'
                  ? 'लक्षण, सफेद धब्बा या डॉक्टर अपॉइंटमेंट के बारे में बोलें'
                  : 'Speak your symptoms, questions about white patch, or how to book doctor')}
            </div>
          </div>
        </div>

        {spokenTranscript && (
          <button
            onClick={() => {
              if (onTranscriptionComplete) onTranscriptionComplete(spokenTranscript);
              alert(`Voice Query Recorded: "${spokenTranscript}". AI Arogya is analyzing.`);
            }}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            {lang === 'te' ? 'ప్రశ్నను ప్రాసెస్ చేయండి' : lang === 'hi' ? 'प्रश्न प्रोसेस करें' : 'Process Query'}
          </button>
        )}
      </div>

      {/* 6 Curated Spoken Topic Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {topics.map((topic) => {
          const Icon = topic.icon;
          const isCurrentActive = isSpeaking && activeTopicId === topic.id;
          const displayTitle =
            selectedVoiceLang === 'te'
              ? topic.titleTe
              : selectedVoiceLang === 'hi'
              ? topic.titleHi
              : topic.titleEn;
          const displayText =
            selectedVoiceLang === 'te'
              ? topic.speechTextTe
              : selectedVoiceLang === 'hi'
              ? topic.speechTextHi
              : topic.speechTextEn;

          return (
            <div
              key={topic.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                isCurrentActive
                  ? 'bg-blue-50/80 border-royal-500 ring-2 ring-royal-400 shadow-md'
                  : 'bg-white border-slate-200 hover:border-royal-300 hover:shadow-sm'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-royal-700 flex items-center justify-center">
                    <Icon className="w-4 h-4" />
                  </div>
                  {isCurrentActive && (
                    <span className="flex items-center space-x-1 text-[10px] font-bold text-royal-700 bg-blue-100 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-royal-600 animate-ping" />
                      <span>Speaking</span>
                    </span>
                  )}
                </div>

                <h4 className="font-extrabold text-xs text-slate-900 leading-snug">
                  {displayTitle}
                </h4>

                <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-3">
                  {displayText}
                </p>
              </div>

              <button
                onClick={() => speakText(displayText, topic.id)}
                className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                  isCurrentActive
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-royal-600 hover:bg-royal-700 text-white shadow-sm'
                }`}
              >
                {isCurrentActive ? (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span>{lang === 'te' ? 'ఆపు' : lang === 'hi' ? 'रोकें' : 'Stop'}</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>{lang === 'te' ? 'వాయిస్ వినండి' : lang === 'hi' ? 'आवाज सुनें' : 'Listen Aloud'}</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AiArogyaVoiceAssistant;
