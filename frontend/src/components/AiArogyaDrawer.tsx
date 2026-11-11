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
  Info
} from 'lucide-react';
import { Language, translations } from '../i18n/translations.ts';

interface Message {
  sender: 'ai' | 'user';
  text: string;
  time: string;
}

interface AiArogyaDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

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
            : 'Based on clinical guidelines for ITDA Paderu, please capture an intra-oral image using our Live AI Oral Camera or launch a WebRTC tele-consultation with Dr. S. Rao (Chief Onco-Pathologist).';
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
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-md bg-[#FAF9F5] h-full shadow-2xl border-l border-amber-300 flex flex-col animate-slideLeft">
        {/* Drawer Header */}
        <div className="bg-gradient-to-r from-amber-950 via-amber-900 to-amber-950 text-white p-4 flex items-center justify-between border-b border-amber-600/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-gold-glow">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm font-serif-royal">{t.aiArogyaTitle}</h3>
              <p className="text-[10px] text-amber-200">Trilingual Oral Oncology AI</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/20 transition-colors text-amber-200 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Feed */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex items-start space-x-2 ${
                m.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                  m.sender === 'user'
                    ? 'bg-amber-600 text-white'
                    : 'bg-emerald-700 text-white'
                }`}
              >
                {m.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>

              <div
                className={`p-3 rounded-2xl text-xs max-w-[82%] leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-tr-none shadow-sm'
                    : 'bg-white border border-amber-200 text-slate-800 rounded-tl-none shadow-sm'
                }`}
              >
                {m.text}
                <div
                  className={`text-[9px] mt-1 text-right ${
                    m.sender === 'user' ? 'text-amber-100' : 'text-slate-400'
                  }`}
                >
                  {m.time}
                </div>
              </div>
            </div>
          ))}

          {typing && (
            <div className="flex items-center space-x-2 text-slate-400 text-xs italic">
              <Bot className="w-4 h-4 text-emerald-600 animate-spin" />
              <span>AI Arogya is reasoning...</span>
            </div>
          )}
        </div>

        {/* Quick Suggestion Pills */}
        <div className="px-4 py-2 border-t border-amber-200/80 bg-white/70 overflow-x-auto">
          <div className="flex space-x-1.5 whitespace-nowrap">
            {SAMPLE_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSend(prompt)}
                className="px-2.5 py-1 rounded-full text-[10px] bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-medium transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-amber-200 flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={t.askQuestion}
            className="flex-1 bg-[#FAF9F5] border border-amber-300 rounded-full px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <button
            onClick={() => handleSend()}
            className="w-9 h-9 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white flex items-center justify-center shadow-gold-glow hover:brightness-105 active:scale-95 transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiArogyaDrawer;

