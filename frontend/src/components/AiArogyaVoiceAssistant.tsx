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
  Globe
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
  const [speechRate, setSpeechRate] = useState<number>(0.9); // Slightly slower for low-literacy clarity
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

  // Pre-curated bilingual voice guides for tribal civilians
  const topics: AudioTopic[] = [
    {
      id: 'symptoms',
      titleEn: '1. Oral Cancer Warning Signs',
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
      titleEn: '4. How to Book Appointment or Tele-Call',
      titleTe: '4. అపాయింట్‌మెంట్ మరియు వీడియో కాల్ ఎలా చేయాలి',
      titleHi: '4. अपॉइंटमेंट और वीडियो कॉल कैसे बुक करें',
      icon: Calendar,
      speechTextEn:
        'To book an appointment, click on Request Appointment, select your nearest Community Health Centre or Area Hospital Paderu, choose General Oral Consultation or Biopsy, and select your date. Once approved, you can talk directly to Dr. Swapna Devi over live WebRTC video.',
      speechTextTe:
        'అపాయింట్‌మెంట్ తీసుకోవడానికి, రిక్వెస్ట్ అపాయింట్‌మెంట్ క్లిక్ చేసి, మీ సమీప కమ్యూనిటీ హెల్త్ సెంటర్ లేదా ఏరియా ఆసుపత్రి పాడేరును ఎంచుకోండి. డాక్టర్ ఆమోదించిన తర్వాత, మీరు డాక్టర్ స్వప్నా దేవితో నేరుగా వీడియో కాల్ ద్వారా మాట్లాడవచ్చు.',
      speechTextHi:
        'अपॉइंटमेंट बुक करने के लिए, रिक्वेस्ट अपॉइंटमेंट पर क्लिक करें, अपने नजदीकी स्वास्थ्य केंद्र का चयन करें और तारीख चुनें। डॉक्टर की स्वीकृति के बाद, आप सीधे वीडियो कॉल पर बात कर सकते हैं।'
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

    // Select suitable voice
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
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setSpokenTranscript(transcript);
        if (onTranscriptionComplete) {
          onTranscriptionComplete(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition notice:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error(err);
      setIsListening(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-amber-300 p-6 sm:p-8 shadow-luxury space-y-6">
      {/* 1. Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-amber-200">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white shadow-gold-glow">
            <Bot className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-xl font-bold font-serif-royal text-slate-950">
                AI Arogya Trilingual Spoken Voice Engine
              </h3>
              <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full border border-amber-300">
                Web Speech API • te-IN / en-IN / hi-IN
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Empowering illiterate and tribal citizens with clear native spoken audio and voice-assisted triage
            </p>
          </div>
        </div>

        {/* Language selector & Speed controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Language Toggle */}
          <div className="flex bg-[#FAF9F5] border border-amber-300 rounded-xl p-1 text-xs">
            <button
              onClick={() => setSelectedVoiceLang('te')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                selectedVoiceLang === 'te'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              తెలుగు (te)
            </button>
            <button
              onClick={() => setSelectedVoiceLang('en')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                selectedVoiceLang === 'en'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setSelectedVoiceLang('hi')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                selectedVoiceLang === 'hi'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              हिंदी (hi)
            </button>
          </div>

          {/* Speech Rate Slider */}
          <div className="flex items-center space-x-2 bg-[#FAF9F5] border border-amber-200 px-3 py-1.5 rounded-xl text-xs">
            <Sliders className="w-3.5 h-3.5 text-amber-700" />
            <span className="text-slate-600 font-semibold">Speed: {speechRate}x</span>
            <input
              type="range"
              min="0.7"
              max="1.2"
              step="0.1"
              value={speechRate}
              onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
              className="w-16 accent-amber-600 cursor-pointer"
            />
          </div>

          {isSpeaking && (
            <button
              onClick={stopSpeaking}
              className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl text-xs font-bold transition-colors flex items-center space-x-1"
            >
              <VolumeX className="w-3.5 h-3.5" />
              <span>Stop Voice</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Microphone Speech-to-Text Section */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-100/30 to-emerald-500/10 rounded-2xl p-5 border border-amber-300 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <h4 className="font-bold text-sm text-slate-900 font-serif-royal">
              Voice Microphone Input (Symptom Dictation)
            </h4>
          </div>
          <p className="text-xs text-slate-600">
            Press the mic to speak symptoms in Telugu or English (e.g., "నాకు చెంపపై తెల్ల మచ్చ ఉంది" or "I have burning sensation").
          </p>
          {spokenTranscript && (
            <div className="p-3 bg-white rounded-xl border border-amber-300 text-xs font-semibold text-amber-950 mt-2 shadow-inner">
              <span className="text-slate-400 font-mono text-[10px] block">Recognized Speech:</span>
              "{spokenTranscript}"
            </div>
          )}
        </div>

        <button
          onClick={toggleListening}
          className={`px-5 py-3 rounded-2xl font-bold text-xs flex items-center space-x-2 transition-all shadow-md ${
            isListening
              ? 'bg-red-600 text-white animate-pulse ring-4 ring-red-300'
              : 'bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:brightness-110'
          }`}
        >
          {isListening ? (
            <>
              <MicOff className="w-4 h-4" />
              <span>Listening... (Click to Stop)</span>
            </>
          ) : (
            <>
              <Mic className="w-4 h-4" />
              <span>Speak Symptoms Now</span>
            </>
          )}
        </button>
      </div>

      {/* 3. Pre-Recorded / Spoken Awareness Audio Topics */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h4 className="text-sm font-bold font-serif-royal text-slate-900 flex items-center space-x-2">
            <Volume2 className="w-4 h-4 text-amber-600" />
            <span>Spoken Oral Health & System Guides (Play Spoken Audio)</span>
          </h4>
          <span className="text-xs text-slate-500 font-medium">Click any topic to hear clear spoken guidance</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {topics.map((topic) => {
            const Icon = topic.icon;
            const isCurrentPlaying = isSpeaking && activeTopicId === topic.id;
            const currentTitle =
              selectedVoiceLang === 'te'
                ? topic.titleTe
                : selectedVoiceLang === 'hi'
                ? topic.titleHi
                : topic.titleEn;
            const currentSpeech =
              selectedVoiceLang === 'te'
                ? topic.speechTextTe
                : selectedVoiceLang === 'hi'
                ? topic.speechTextHi
                : topic.speechTextEn;

            return (
              <div
                key={topic.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isCurrentPlaying
                    ? 'border-amber-500 bg-amber-50/70 shadow-gold-glow'
                    : 'border-amber-200/80 bg-[#FCFBF7] hover:border-amber-400 hover:bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isCurrentPlaying
                          ? 'bg-amber-500 text-white animate-bounce'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="font-bold text-sm text-slate-900 font-serif-royal">{currentTitle}</h5>
                      <span className="text-[10px] font-mono text-slate-400">Audio Guide #{topic.id}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => speakText(currentSpeech, topic.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-sm ${
                      isCurrentPlaying
                        ? 'bg-amber-600 text-white'
                        : 'bg-amber-100 hover:bg-amber-200 text-amber-950'
                    }`}
                  >
                    {isCurrentPlaying ? (
                      <>
                        <Pause className="w-3.5 h-3.5" />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Play Audio</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-xs text-slate-600 mt-3 line-clamp-3 leading-relaxed">
                  {currentSpeech}
                </p>

                {/* Animated Audio Equalizer Bars when speaking */}
                {isCurrentPlaying && (
                  <div className="mt-3 pt-2 border-t border-amber-300 flex items-center justify-between text-[11px] text-amber-900 font-bold">
                    <span className="flex items-center space-x-1">
                      <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                      <span>Speaking in {selectedVoiceLang === 'te' ? 'Telugu (te-IN)' : selectedVoiceLang === 'hi' ? 'Hindi (hi-IN)' : 'English (en-IN)'}...</span>
                    </span>
                    <div className="flex items-end space-x-1 h-4">
                      <span className="w-1 bg-amber-500 rounded animate-pulse h-3" />
                      <span className="w-1 bg-amber-600 rounded animate-pulse h-4" style={{ animationDelay: '0.1s' }} />
                      <span className="w-1 bg-amber-700 rounded animate-pulse h-2" style={{ animationDelay: '0.2s' }} />
                      <span className="w-1 bg-amber-500 rounded animate-pulse h-4" style={{ animationDelay: '0.3s' }} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AiArogyaVoiceAssistant;