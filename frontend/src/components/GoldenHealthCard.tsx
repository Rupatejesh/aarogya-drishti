import React, { useRef } from 'react';
import {
  QrCode,
  Printer,
  Download,
  ShieldCheck,
  PhoneCall,
  Activity,
  Heart,
  Calendar,
  MapPin,
  CheckCircle2
} from 'lucide-react';
import { Language, translations } from '../i18n/translations.ts';

interface GoldenHealthCardProps {
  patient: any;
  lang: Language;
}

export const GoldenHealthCard: React.FC<GoldenHealthCardProps> = ({ patient, lang }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  if (!patient) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-3">
      {/* Action Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
          <h3 className="text-sm font-extrabold font-serif-royal text-slate-900 uppercase tracking-wider">
            GOLDEN AROGYA DRISHTI DIGITAL HEALTH CARD
          </h3>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handlePrint}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Card</span>
          </button>
        </div>
      </div>

      {/* The Physical Card Container */}
      <div
        ref={cardRef}
        className="relative aspect-[1.586/1] max-w-lg mx-auto rounded-3xl p-6 sm:p-7 text-amber-950 overflow-hidden shadow-2xl border-2 border-amber-400 bg-gradient-to-br from-[#FFFDF0] via-[#FAF4D3] to-[#E6CA65] select-none"
        style={{
          boxShadow: '0 20px 40px -15px rgba(212, 175, 55, 0.4), inset 0 0 30px rgba(255,255,255,0.8)'
        }}
      >
        {/* Background Holographic Shimmer Accents */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-white/60 via-amber-200/20 to-transparent rounded-bl-full pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-gradient-to-tr from-amber-600/10 to-transparent rounded-full pointer-events-none" />

        {/* Card Header */}
        <div className="relative z-10 flex justify-between items-start border-b border-amber-600/30 pb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center text-white shadow-md">
              <Activity className="w-6 h-6 stroke-[2.4]" />
            </div>
            <div>
              <div className="text-[10px] font-extrabold tracking-widest text-amber-900 uppercase">
                GOVERNMENT OF ANDHRA PRADESH • ITDA PADERU
              </div>
              <div className="text-base font-extrabold font-serif-royal gold-gradient-text tracking-wide">
                AROGYA DRISHTI HEALTH CARD
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[9px] font-bold bg-amber-800 text-amber-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
              ABDM VERIFIED
            </span>
            <div className="text-[9px] text-amber-900/80 font-mono mt-0.5">ASR District Grid</div>
          </div>
        </div>

        {/* Card Middle: Photo, Chip, Patient Info */}
        <div className="relative z-10 my-4 flex items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            {/* Patient Photo Avatar */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-amber-100 border-2 border-amber-500 overflow-hidden shadow-md flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-amber-200 to-amber-400 text-amber-950 font-bold text-3xl">
              {patient.name.charAt(0)}
            </div>

            {/* Demographics */}
            <div className="space-y-1">
              <div className="text-lg sm:text-xl font-black font-serif-royal text-amber-950 leading-tight">
                {patient.name}
              </div>
              <div className="text-xs font-semibold text-amber-900">
                {patient.age} Yrs • {patient.gender} • Blood Group: <strong className="text-red-700 font-extrabold">{patient.bloodGroup || 'O+'}</strong>
              </div>
              <div className="text-xs text-amber-800 flex items-center space-x-1">
                <MapPin className="w-3 h-3 text-amber-700" />
                <span>{patient.village}, {patient.mandal} (ITDA)</span>
              </div>
              <div className="text-[11px] font-mono text-amber-900 font-bold pt-0.5">
                Aadhaar: {patient.aadhar}
              </div>
            </div>
          </div>

          {/* QR Code */}
          <div className="text-center p-2 bg-white/90 rounded-2xl border border-amber-300 shadow-sm flex-shrink-0">
            <QrCode className="w-14 h-14 sm:w-16 sm:h-16 text-amber-950" />
            <span className="text-[8px] font-mono text-amber-900 block mt-0.5 font-bold">SCAN RECORD</span>
          </div>
        </div>

        {/* Card Footer: UIDN & Emergency Helplines */}
        <div className="relative z-10 pt-3 border-t border-amber-600/30 flex justify-between items-center text-xs">
          <div>
            <span className="text-[9px] uppercase font-bold text-amber-800 block">Universal Patient ID (UIDN)</span>
            <span className="font-mono text-sm sm:text-base font-black tracking-wider text-amber-950">
              {patient.uidn}
            </span>
          </div>

          <div className="flex items-center space-x-2 text-[10px] font-bold">
            <span className="bg-red-600 text-white px-2 py-0.5 rounded-full flex items-center space-x-1 shadow-sm">
              <PhoneCall className="w-2.5 h-2.5" />
              <span>108 Tribal SOS</span>
            </span>
            <span className="bg-amber-900 text-amber-100 px-2 py-0.5 rounded-full">
              104 Mobile Van
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoldenHealthCard;

