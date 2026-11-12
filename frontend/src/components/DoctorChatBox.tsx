import React, { useState } from 'react';
import {
  MessageSquare,
  Send,
  Paperclip,
  FileText,
  Stethoscope,
  CheckCheck,
  Sparkles,
  QrCode,
  UserCheck,
  CheckCircle2
} from 'lucide-react';
import { Language, translations } from '../i18n/translations.ts';

interface DoctorChatBoxProps {
  patientUidn: string;
  patientName: string;
  doctorName?: string;
  doctorHospital?: string;
  prescription?: any;
  lang: Language;
}

interface ChatMessage {
  id: string;
  sender: 'doctor' | 'patient';
  text: string;
  attachment?: {
    type: 'prescription';
    rxId: string;
    barcode: string;
    details: string;
  };
  timestamp: string;
}

export const DoctorChatBox: React.FC<DoctorChatBoxProps> = ({
  patientUidn,
  patientName,
  doctorName = 'Dr. Swapna Devi, MDS',
  doctorHospital = 'PHC G. Madugula / GGH Paderu Tele-Lab Hub',
  prescription,
  lang
}) => {
  const [isDoctorOnline, setIsDoctorOnline] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'doctor',
      text: `Hello ${patientName}. I have reviewed your intra-oral scan and high-risk habit history from Nurmati. Please share your current prescription slip so I can check your antioxidant regimen.`,
      timestamp: '10:15 AM'
    }
  ]);
  const [inputMsg, setInputMsg] = useState('');

  const handleSend = () => {
    if (!inputMsg.trim()) return;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'patient',
      text: inputMsg,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputMsg('');

    // Simulated doctor live response
    setTimeout(() => {
      const replyMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'doctor',
        text: 'Noted. Keep using the Kenacort paste after dinner. I have verified your CHC G. Madugula punch biopsy slot.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, replyMsg]);
    }, 1200);
  };

  // One-click Send Prescription from History to Doctor
  const handleSendPrescriptionFile = () => {
    const rxId = prescription?.rxId || 'RX-ASR-2026-0001';
    const barcode = prescription?.printableBarcodeId || 'BAR-ASR-2026-90412-SOMANNA';

    const attachmentMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'patient',
      text: 'Dr. Swapna Devi, here is my saved official e-Prescription & Biopsy referral slip from my history.',
      attachment: {
        type: 'prescription',
        rxId,
        barcode,
        details: 'Biopsy Scheduled • Kenacort 0.1% Paste, Lycopene 8mg, Chlorhexidine 0.2%'
      },
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, attachmentMsg]);

    setTimeout(() => {
      const docReply: ChatMessage = {
        id: `msg-${Date.now() + 2}`,
        sender: 'doctor',
        text: `Prescription ${rxId} received and verified via barcode ${barcode}. Your case sheet is updated in the ITDA tele-oncology vault.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, docReply]);
    }, 1000);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-luxury overflow-hidden flex flex-col h-[520px]">
      {/* Chat Header with Doctor Presence (Royal Blue) */}
      <div className="bg-royal-700 text-white p-4 flex items-center justify-between border-b border-royal-800">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            {isDoctorOnline && (
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-royal-900 animate-pulse" />
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-extrabold text-sm tracking-wide">{doctorName}</h3>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-200 font-bold px-2 py-0.5 rounded-full border border-emerald-400/40">
                {isDoctorOnline ? 'Active Online' : 'Offline'}
              </span>
            </div>
            <p className="text-[11px] text-blue-100">{doctorHospital}</p>
          </div>
        </div>

        {/* Quick action button to send prescription file from history */}
        <button
          onClick={handleSendPrescriptionFile}
          className="px-3 py-1.5 rounded-xl bg-yellow-300 hover:bg-yellow-400 text-slate-950 font-extrabold text-xs shadow-sm transition-all flex items-center space-x-1.5 active:scale-95"
          title="Send Prescription from History to Doctor"
        >
          <FileText className="w-3.5 h-3.5 text-royal-700" />
          <span className="hidden sm:inline">Send Prescription from History</span>
        </button>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/60">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start space-x-2 ${
              m.sender === 'patient' ? 'flex-row-reverse space-x-reverse' : ''
            }`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                m.sender === 'patient' ? 'bg-royal-600 text-white' : 'bg-slate-800 text-white'
              }`}
            >
              {m.sender === 'patient' ? 'Me' : 'Dr'}
            </div>

            <div
              className={`p-3.5 rounded-2xl text-xs max-w-[82%] space-y-2 leading-relaxed ${
                m.sender === 'patient'
                  ? 'bg-royal-600 text-white rounded-tr-none shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm'
              }`}
            >
              <div>{m.text}</div>

              {/* Prescription Attachment Preview */}
              {m.attachment && (
                <div className="bg-blue-50/90 rounded-xl p-3 border border-blue-200 text-slate-900 space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-bold text-royal-900">
                    <span className="flex items-center space-x-1">
                      <FileText className="w-3.5 h-3.5 text-royal-600" />
                      <span>OFFICIAL PRESCRIPTION FILE</span>
                    </span>
                    <span className="font-mono bg-blue-200 px-1.5 py-0.5 rounded">
                      {m.attachment.rxId}
                    </span>
                  </div>
                  <div className="text-[11px] font-semibold text-slate-700">{m.attachment.details}</div>
                  <div className="pt-1 flex items-center space-x-1 font-mono text-[9px] text-slate-500">
                    <QrCode className="w-3 h-3 text-royal-600" />
                    <span>Barcode: {m.attachment.barcode}</span>
                  </div>
                </div>
              )}

              <div
                className={`text-[9px] flex items-center justify-end space-x-1 ${
                  m.sender === 'patient' ? 'text-blue-100' : 'text-slate-400'
                }`}
              >
                <span>{m.timestamp}</span>
                {m.sender === 'patient' && <CheckCheck className="w-3 h-3" />}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Input Bar */}
      <div className="p-3 bg-white border-t border-slate-200 flex items-center space-x-2">
        <button
          onClick={handleSendPrescriptionFile}
          className="p-2 text-slate-500 hover:text-royal-600 hover:bg-slate-100 rounded-xl transition-colors"
          title="Attach Prescription from History"
        >
          <Paperclip className="w-4 h-4" />
        </button>

        <input
          type="text"
          value={inputMsg}
          onChange={(e) => setInputMsg(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type message to Dr. Swapna Devi..."
          className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-royal-500"
        />

        <button
          onClick={handleSend}
          className="w-9 h-9 rounded-full bg-royal-600 hover:bg-royal-700 text-white flex items-center justify-center shadow-blue-card transition-all active:scale-95"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default DoctorChatBox;
