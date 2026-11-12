import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  X,
  Bot,
  User,
  HelpCircle,
  ShieldCheck,
  Stethoscope,
  Info,
  Headphones,
  Volume2,
  Paperclip,
  FileText,
  CheckCircle,
  Calendar,
  Video,
  Activity,
  QrCode
} from 'lucide-react';
import { Language, translations } from '../i18n/translations.ts';

interface Message {
  sender: 'ai' | 'user';
  text: string;
  time: string;
  attachment?: {
    type: 'prescription';
    title: string;
    details: string;
  };
}

interface AiArogyaDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

const SPOKEN_GUIDES = [
  {
    id: 'guide-appt',
    titleEn: '1. Apply for Appointment',
    titleTe: '1. అపాయింట్‌మెంట్ బుకింగ్',
    titleHi: '1. अपॉइंटमेंट बुक करना',
    speechEn: 'To apply for an appointment: Click on Core Health Action 2 or the Book Doctor button. Choose General Oral Consultation or Biopsy Procedure, select your Mandal, PHC, Doctor, Date, and Time Slot, then submit.',
    speechTe: 'అపాయింట్‌మెంట్ కోసం: కోర్ యాక్షన్ 2 క్లిక్ చేసి జనరల్ కన్సల్టేషన్ లేదా బయాప్సీ ఎంచుకోండి. మీ మండలం, పిహెచ్‌సి, డాక్టర్ మరియు సమయం సెలెక్ట్ చేసి కన్ఫర్మ్ చేయండి.',
    speechHi: 'अपॉइंटमेंट के लिए: कोर एक्शन 2 पर क्लिक करें, जनरल जांच या बायोप्सी चुनें, अपना मंडल, पीएचसी, डॉक्टर और समय चुनकर सबमिट करें।'
  },
  {
    id: 'guide-notif',
    titleEn: '2. Check Notifications',
    titleTe: '2. నోటిఫికేషన్లు చూడటం',
    titleHi: '2. नोटिफिकेशन चेक करना',
    speechEn: 'To check appointment notifications: View the Live Appointment Notifications section on your dashboard. You will see real-time status badges for Approved, Rejected, or Pending, with date, day, time, doctor name, and facility.',
    speechTe: 'నోటిఫికేషన్ల కోసం: మీ డ్యాష్‌బోర్డ్‌లోని లైవ్ అపాయింట్‌మెంట్ కార్డ్స్ చూడండి. డాక్టర్ అప్రూవ్ చేసిన తేదీ, రోజు, సమయం మరియు స్టేటస్ కనిపిస్తాయి.',
    speechHi: 'नोटिफिकेशन के लिए: अपने डैशबोर्ड पर लाइव अपॉइंटमेंट सेक्शन देखें, जहां अप्रूव्ड, रिजेक्टेड या पेंडिंग स्टेटस तारीख और समय के साथ दिखेगा।'
  },
  {
    id: 'guide-chat',
    titleEn: '3. Chat with Doctor',
    titleTe: '3. డాక్టర్‌తో చాట్',
    titleHi: '3. डॉक्टर से चैट करना',
    speechEn: 'To chat with the doctor: Scroll to Doctor Live ChatBox. The green dot confirms the doctor is Active Online. Type your message or click Send Prescription from History to send your e-prescription.',
    speechTe: 'డాక్టర్‌తో చాట్ కోసం: డ్యాష్‌బోర్డ్‌లోని డాక్టర్ చాట్‌బాక్స్‌కు వెళ్లండి. గ్రీన్ డాట్ డాక్టర్ ఆన్‌లైన్‌లో ఉన్నారని తెలుపుతుంది. మీ సందేహం టైప్ చేయండి లేదా ప్రిస్క్రిప్షన్ పంపండి.',
    speechHi: 'डॉक्टर से चैट के लिए: चैटबॉक्स में जाएं, ग्रीन डॉट से डॉक्टर की लाइव उपस्थिति देखें और अपना संदेश या पर्चा भेजें।'
  },
  {
    id: 'guide-video',
    titleEn: '4. Join Video Call',
    titleTe: '4. వీడియో కాల్‌లో చేరడం',
    titleHi: '4. वीडियो कॉल में जुड़ना',
    speechEn: 'To join a video call: Click Core Health Action 3 Start Video Call. The two-system WebRTC room connects you directly with Dr. Swapna Devi with live camera and microphone controls.',
    speechTe: 'వీడియో కాల్ కోసం: కోర్ యాక్షన్ 3 స్టార్ట్ వీడియో కాల్ క్లిక్ చేయండి. వెబ్‌ఆర్‌టిసి ద్వారా పాడేరు ఆంకాలజిస్ట్ డాక్టర్ స్వప్నా దేవితో నేరుగా మాట్లాడవచ్చు.',
    speechHi: 'वीडियो कॉल के लिए: कोर एक्शन 3 स्टार्ट वीडियो कॉल पर क्लिक करें। वेबआरटीसी से डॉक्टर स्वप्ना देवी से लाइव परामर्श प्राप्त करें।'
  },
  {
    id: 'guide-history',
    titleEn: '5. History & Tracking',
    titleTe: '5. హిస్టరీ & ట్రాకింగ్',
    titleHi: '5. हिस्ट्री और ट्रैकिंग',
    speechEn: 'To check history and tracking: View the 4-Step Onco-Care Treatment Journey bar: Screening Triage, Medical Rx Dispensed, Biopsy Scheduled, and Histopathology Review.',
    speechTe: 'ట్రాకింగ్ స్టేటస్ కోసం: 4-దశల ఆంకో-కేర్ జర్నీ బార్ చూడండి: స్క్రీనింగ్, ప్రిస్క్రిప్షన్, బయాప్సీ షెడ్యూల్ మరియు పాథాలజీ రివ్యూ వివరాలు కనిపిస్తాయి.',
    speechHi: 'हिस्ट्री और ट्रैकिंग के लिए: 4-चरणीय ऑन्को-केयर जर्नी बार देखें जिसमें स्क्रीनिंग, दवा, बायोप्सी और रिपोर्ट की स्थिति दिखती है।'
  },
  {
    id: 'guide-card',
    titleEn: '6. UIDN & Health Card',
    titleTe: '6. ఆరోగ్య దృష్టి కార్డు',
    titleHi: '6. आरोग्य दृष्टि कार्ड',
    speechEn: 'To view UIDN and Arogya Card: Scroll to Arogya Drishti Health Card. Your unique tribal UIDN, age, blood group, village, and ABDM QR code are displayed with 1-click Download and Print buttons.',
    speechTe: 'హెల్త్ కార్డు కోసం: ఆరోగ్య దృష్టి కార్డు విభాగంలో మీ యుఐడిఎన్, రక్త వర్గం, గ్రామం మరియు క్యూఆర్ కోడ్ ఉంటాయి. డౌన్‌లోడ్ లేదా ప్రింట్ చేసుకోవచ్చు.',
    speechHi: 'हेल्थ कार्ड के लिए: आरोग्य दृष्टि डिजिटल कार्ड देखें जिसमें आपका यूआईडीएन, ब्लड ग्रुप और क्यूआर कोड डाउनलोड और प्रिंट के लिए उपलब्ध है।'
  },
  {
    id: 'guide-download',
    titleEn: '7. Download Prescriptions',
    titleTe: '7. ప్రిస్క్రిప్షన్ డౌన్‌లోడ్',
    titleHi: '7. दवा पर्चा डाउनलोड',
    speechEn: 'To download medical and biopsy prescriptions: In the Verified e-Prescription card, click Print Official Slip to view and download your official bilingual PDF with barcode.',
    speechTe: 'ప్రిస్క్రిప్షన్ డౌన్‌లోడ్ కోసం: ఇ-ప్రిస్క్రిప్షన్ కార్డులోని ప్రింట్ స్లిప్ బటన్ క్లిక్ చేసి బార్‌కోడ్‌తో కూడిన అధికారిక పిడిఎఫ్ పొందండి.',
    speechHi: 'दवा पर्चा डाउनलोड के लिए: प्रिंट ऑफिशियल स्लिप बटन पर क्लिक करके बारकोड युक्त पर्चा डाउनलोड करें।'
  },
  {
    id: 'guide-sendfile',
    titleEn: '8. Send Rx from History',
    titleTe: '8. డాక్టర్‌కు ప్రిస్క్రిప్షన్ పంపడం',
    titleHi: '8. डॉक्टर को पर्चा भेजना',
    speechEn: 'To send downloaded prescriptions directly to the doctor: Click the Paperclip Document icon inside this AI Arogya chat or the Send Prescription from History button in the doctor chat.',
    speechTe: 'డాక్టర్‌కు ఫైల్ పంపడానికి: ఈ ఏఐ ఆరోగ్యా చాట్‌లోని డాక్యుమెంట్ పిన్ క్లిక్ చేయండి లేదా డాక్టర్ చాట్‌బాక్స్‌లోని సెండ్ ప్రిస్క్రిప్షన్ బటన్ ఉపయోగించండి.',
    speechHi: 'डॉक्टर को पर्चा भेजने के लिए: इस चैट में दिए गए पेपरक्लिप आइकन पर क्लिक करें या डॉक्टर चैटबॉक्स का बटन दबाएं।'
  }
];

const SAMPLE_PROMPTS = [
  'నా నోటిలో తెల్లటి మచ్చ ఉంది, ప్రమాదకరమా? (Is white patch dangerous?)',
  'What are the health risks of Adda Poga (Reverse Smoking)?',
  'Where is the nearest punch biopsy facility in ASR District?',
  'నోరు తెరవడం కష్టంగా ఉంది (OSMF లక్షణాలు ఏమిటి?)'
];

export const AiArogyaDrawer: React.FC<AiArogyaDrawerProps> = ({
  isOpen,
  onClose,
  lang
}) => {
  const t = translations[lang];

  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'ai',
      text:
        lang === 'te'
          ? 'నమస్కారం! నేను మీ "ఏఐ ఆరోగ్యా" డిజిటల్ సహాయకుడిని. అల్లూరి సీతారామరాజు జిల్లా గిరిజన ప్రాంతాల్లో నోటి క్యాన్సర్, అడ్డాపొగ అలవాట్ల మాన్పు మరియు చికిత్సపై మీ సందేహాలను అడగండి.'
          : lang === 'hi'
          ? 'नमस्ते! मैं आपका "एआई आरोग्या" सहायक हूँ। अल्लूरी सीताराम राजू जिले में मुख कैंसर जांच, तंबाकू मुक्ति और उपचार पर अपने प्रश्न पूछें।'
          : 'Namaste! I am AI Arogya, your multilingual oral oncology clinical assistant for ITDA Paderu (ASR District). Ask me any question about oral lesions, reverse smoking risks, or biopsy facilities.',
      time: 'Just now'
    }
  ]);

  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);

  if (!isOpen) return null;

  const handlePlayAwareness = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const text =
      lang === 'te'
        ? 'నోటి క్యాన్సర్ హెచ్చరిక: నోటిలో రెండు వారాలకు మించి మానని పుండు లేదా తెల్లటి మచ్చ ఉంటే వెంటనే పంచ్ బయాప్సీ చేయించుకోండి. అడ్డా పొగ తక్షణం ఆపండి.'
        : lang === 'hi'
        ? 'मुंह के कैंसर से बचाव: यदि दो सप्ताह से अधिक समय से सफेद धब्बा या छाला है, तो तुरंत डॉक्टर से संपर्क करें और बायोप्सी करवाएं।'
        : 'Oral cancer awareness: Persistent white patch or ulcer over two weeks requires clinical biopsy. Stop reverse smoking to protect oral mucosa.';
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'te' ? 'te-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN';
    window.speechSynthesis.speak(utterance);
  };

  const handlePlayGuide = (guide: typeof SPOKEN_GUIDES[0]) => {
    const text = lang === 'te' ? guide.speechTe : lang === 'hi' ? guide.speechHi : guide.speechEn;
    const title = lang === 'te' ? guide.titleTe : lang === 'hi' ? guide.titleHi : guide.titleEn;

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'te' ? 'te-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN';
      window.speechSynthesis.speak(utterance);
    }

    setMessages((prev) => [
      ...prev,
      {
        sender: 'user',
        text: `Tell me how to: ${title}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      },
      {
        sender: 'ai',
        text: text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const handleSendPrescriptionDocument = () => {
    const docInfo = {
      type: 'prescription' as const,
      title: 'Verified e-Prescription (RX-ASR-2026-0001)',
      details: '4mm Punch Biopsy Scheduled • Kenacort 0.1% Paste + Lycopene 8mg'
    };

    const confirmMsg =
      lang === 'te'
        ? 'మీ సేవ్ చేసిన ప్రిస్క్రిప్షన్ ఫైల్ (RX-ASR-2026-0001) డాక్టర్ స్వప్నా దేవికి నేరుగా పంపబడింది.'
        : lang === 'hi'
        ? 'आपकी सहेजी गई दवा पर्ची (RX-ASR-2026-0001) डॉक्टर स्वप्ना देवी को भेज दी गई है।'
        : 'Your saved e-Prescription file (RX-ASR-2026-0001) has been sent directly to Dr. Swapna Devi in Doctor Chat.';

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(confirmMsg);
      utterance.lang = lang === 'te' ? 'te-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN';
      window.speechSynthesis.speak(utterance);
    }

    setMessages((prev) => [
      ...prev,
      {
        sender: 'user',
        text: '📎 Sent saved prescription from History to doctor',
        attachment: docInfo,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      },
      {
        sender: 'ai',
        text: confirmMsg,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const handleSend = (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const userMsg: Message = {
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setTyping(true);

    setTimeout(() => {
      let reply = '';
      const lower = query.toLowerCase();

      if (lower.includes('తెల్లటి') || lower.includes('white patch') || lower.includes('leukoplakia')) {
        reply =
          lang === 'te'
            ? 'నోటిలో 3 వారాలకు మించి నయంకాని తెల్లటి మచ్చ (ల్యూకోప్లాకియా) ఉంటే అది ప్రాథమిక క్యాన్సర్ సూచన కావచ్చు. వెంటనే దగ్గరలోని సి.హెచ్.సి జి.మాడుగుల లేదా ఏరియా ఆసుపత్రి పాడేరులో 4మి.మీ పంచ్ బయాప్సీ చేయించుకోవడం అత్యంత శ్రేయస్కరం.'
            : 'A non-scrapable persistent white patch (>3 weeks) in the oral mucosa is a classic presentation of Oral Leukoplakia. Given high tobacco exposure in ASR district, an immediate 4mm punch biopsy at CHC G. Madugula or Area Hospital Paderu is strongly recommended.';
      } else if (lower.includes('reverse smoking') || lower.includes('adda poga') || lower.includes('అడ్డాపొగ')) {
        reply =
          lang === 'te'
            ? 'అడ్డాపొగ (రివర్స్ స్మోకింగ్) లో చుట్ట వెలిగించిన భాగాన్ని నోటి లోపల పెట్టుకోవడం వల్ల అంగిలి (ప్యాలెట్) పై అధిక ఉష్ణోగ్రత మరియు నికోటిన్ నేరుగా తగులుతాయి. ఇది ప్యాలటల్ కెరటోసిస్ మరియు క్యాన్సర్‌కు దారితీసే తీవ్ర ప్రమాదకర అలవాటు. వెంటనే మాన్పు కౌన్సెలింగ్ అవసరం.'
            : 'Reverse smoking (Adda Poga) places the lit end of indigenous chutta inside the oral cavity, delivering intense thermal and chemical insults to the palatal mucosa. It carries an extremely high risk for palatal dysplasia and invasive carcinoma.';
      } else if (lower.includes('biopsy') || lower.includes('facility') || lower.includes('ఆసుపత్రి')) {
        reply =
          'In Alluri Sitharama Raju District, active biopsy equipment and onco-pathology services are available at Area Hospital Paderu (AH Paderu / District Hub), CHC Araku Valley, CHC G. Madugula, and CHC Chintapalle. PHCs provide vital referral under ITDA protocol.';
      } else {
        reply =
          lang === 'te'
            ? 'మీరు తెలిపిన సమాచారం ఆధారంగా ఆరోగ్య దృష్టి పోర్టల్ ద్వారా లైవ్ ఏఐ నోటి కెమెరా స్క్రీనింగ్ మరియు వెబ్‌ఆర్‌టిసి ద్వారా పాడేరు ఆంకాలజీ వైద్యులతో సంప్రదించండి.'
            : 'Based on clinical guidelines for ITDA Paderu, please capture an intra-oral image using our Live AI Oral Camera or launch a WebRTC tele-consultation with Dr. Swapna Devi (Lead Tele-Consultant).';
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setTyping(false);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col">
        {/* Drawer Header (Royal Blue) */}
        <div className="bg-royal-700 text-white p-4 flex items-center justify-between border-b border-royal-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm">{t.aiArogyaTitle}</h3>
              <p className="text-[10px] text-blue-100">Trilingual Oral Oncology Assistant</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/20 transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Oral Health Related Awareness Speeches quick trigger bar */}
        <div className="p-2.5 bg-blue-50 border-b border-blue-200 flex items-center justify-between">
          <span className="text-[11px] font-bold text-royal-900 flex items-center space-x-1.5">
            <Headphones className="w-3.5 h-3.5 text-royal-600" />
            <span>Oral Health Awareness Speeches</span>
          </span>
          <button
            onClick={handlePlayAwareness}
            className="px-2.5 py-1 bg-royal-600 hover:bg-royal-700 text-white rounded-lg text-[10px] font-bold transition-all flex items-center space-x-1 active:scale-95 shadow-sm"
          >
            <Volume2 className="w-3 h-3" />
            <span>Listen Aloud</span>
          </button>
        </div>

        {/* Spoken Step-by-Step Interactive Guides Carousel */}
        <div className="p-2.5 bg-slate-50 border-b border-slate-200 space-y-1.5">
          <div className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider flex items-center justify-between">
            <span>Spoken Step-by-Step Guides (Click to Listen)</span>
            <span className="text-[9px] bg-royal-100 text-royal-800 px-1.5 py-0.2 rounded font-mono">8 Flows</span>
          </div>
          <div className="flex space-x-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {SPOKEN_GUIDES.map((g) => (
              <button
                key={g.id}
                onClick={() => handlePlayGuide(g)}
                className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-white hover:bg-blue-50 text-slate-800 hover:text-royal-800 border border-slate-200 transition-all flex items-center space-x-1 flex-shrink-0 shadow-sm active:scale-95"
              >
                <Volume2 className="w-2.5 h-2.5 text-royal-600" />
                <span>{lang === 'te' ? g.titleTe : lang === 'hi' ? g.titleHi : g.titleEn}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Message Feed */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/60">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex items-start space-x-2 ${
                m.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  m.sender === 'user'
                    ? 'bg-royal-600 text-white'
                    : 'bg-emerald-600 text-white'
                }`}
              >
                {m.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>

              <div
                className={`p-3 rounded-2xl text-xs max-w-[82%] leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-royal-600 text-white rounded-tr-none shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm'
                }`}
              >
                {m.text}

                {m.attachment && (
                  <div className="mt-2 p-2.5 bg-blue-50/90 rounded-xl border border-blue-200 space-y-1 text-royal-950">
                    <div className="font-bold flex items-center space-x-1 text-[11px]">
                      <FileText className="w-3.5 h-3.5 text-royal-600" />
                      <span>{m.attachment.title}</span>
                    </div>
                    <div className="text-[10px] text-slate-600">{m.attachment.details}</div>
                    <div className="text-[9px] font-bold text-emerald-700 flex items-center space-x-1 pt-0.5">
                      <CheckCircle className="w-3 h-3 text-emerald-600" />
                      <span>Transmitted to Doctor Clinical Workspace</span>
                    </div>
                  </div>
                )}

                <div
                  className={`text-[9px] mt-1 text-right ${
                    m.sender === 'user' ? 'text-blue-100' : 'text-slate-400'
                  }`}
                >
                  {m.time}
                </div>
              </div>
            </div>
          ))}

          {typing && (
            <div className="flex items-center space-x-2 text-slate-400 text-xs italic">
              <Bot className="w-4 h-4 text-royal-600 animate-spin" />
              <span>AI Arogya is reasoning...</span>
            </div>
          )}
        </div>

        {/* Quick Suggestion Pills */}
        <div className="px-4 py-2 border-t border-slate-200 bg-white overflow-x-auto">
          <div className="flex space-x-1.5 whitespace-nowrap">
            {SAMPLE_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSend(prompt)}
                className="px-2.5 py-1 rounded-full text-[10px] bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-royal-800 border border-slate-200 font-medium transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center space-x-2">
          <button
            type="button"
            onClick={handleSendPrescriptionDocument}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-royal-700 flex items-center justify-center border border-slate-300 transition-all active:scale-95 flex-shrink-0"
            title="Documents File Option: Send Saved Prescription from History to Doctor"
          >
            <Paperclip className="w-4 h-4" />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={t.askQuestion}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-royal-500"
          />
          <button
            onClick={() => handleSend()}
            className="w-9 h-9 rounded-full bg-royal-600 hover:bg-royal-700 text-white flex items-center justify-center shadow-blue-card transition-all active:scale-95 flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiArogyaDrawer;
