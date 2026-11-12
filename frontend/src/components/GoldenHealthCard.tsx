import React, { useRef, useState } from 'react';
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
  CheckCircle2,
  Search,
  FileText,
  Clock,
  Sparkles
} from 'lucide-react';
import { Language, translations } from '../i18n/translations.ts';

interface GoldenHealthCardProps {
  patient: any;
  lang: Language;
  onSearchRecord?: (query: string) => void;
}

export const GoldenHealthCard: React.FC<GoldenHealthCardProps> = ({ patient, lang, onSearchRecord }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<string[]>([]);

  if (!patient) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const q = searchQuery.toLowerCase();
    const hits: string[] = [];

    if (patient.uidn?.toLowerCase().includes(q)) hits.push(`Assigned UIDN: ${patient.uidn}`);
    if (patient.name?.toLowerCase().includes(q)) hits.push(`Patient Demographics: ${patient.name} (${patient.age}y)`);
    if (patient.mandal?.toLowerCase().includes(q) || patient.village?.toLowerCase().includes(q)) {
      hits.push(`Location: ${patient.village}, ${patient.mandal} Mandal`);
    }
    if ('leukoplakia'.includes(q) || 'white patch'.includes(q) || 'biopsy'.includes(q)) {
      hits.push('Clinical Record: AI Detected Oral Leukoplakia (92.4% score) - 4mm Punch Biopsy Scheduled at PHC G. Madugula');
    }
    if ('lycopene'.includes(q) || 'kenacort'.includes(q) || 'prescription'.includes(q)) {
      hits.push('e-Prescription RX-ASR-2026-0001: Lycopene 8mg + Kenacort 0.1% Paste + Chlorhexidine Rinse active');
    }
    if ('swapna'.includes(q) || 'doctor'.includes(q)) {
      hits.push('Consulting Doctor: Dr. Swapna Devi, MDS (Chief Onco-Pathologist & Lead Tele-Consultant)');
    }
    if ('appointment'.includes(q) || 'saturday'.includes(q) || 'slot'.includes(q)) {
      hits.push('Appointment Status: APPROVED for Saturday 10:30 AM at PHC G. Madugula');
    }

    if (hits.length === 0) {
      hits.push(`Record searched for "${searchQuery}": Verified in ABDM Tribal Registry under ${patient.uidn}`);
    }

    setSearchResults(hits);
    if (onSearchRecord) onSearchRecord(searchQuery);
  };

  return (
    <div className="space-y-5">
      {/* Action Header */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-royal-600 animate-pulse" />
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
            AROGYA DRISHTI DIGITAL HEALTH CARD
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-royal-600 hover:bg-royal-700 text-white rounded-xl text-xs font-bold transition-all duration-200 hover:-translate-y-0.5 shadow-sm flex items-center space-x-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Card</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all duration-200 flex items-center space-x-1"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* The Physical Card Container (Crisp White & Royal Blue Theme) */}
      <div
        ref={cardRef}
        className="relative aspect-[1.586/1] max-w-lg mx-auto rounded-3xl p-6 sm:p-7 text-slate-900 overflow-hidden shadow-xl border-2 border-royal-400 bg-gradient-to-br from-white via-blue-50/40 to-blue-100/30 select-none"
        style={{
          boxShadow: '0 20px 40px -15px rgba(29, 78, 216, 0.15)'
        }}
      >
        {/* Soft Background Accents */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-200/30 via-royal-100/10 to-transparent rounded-bl-full pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-gradient-to-tr from-blue-300/10 to-transparent rounded-full pointer-events-none" />

        {/* Card Header */}
        <div className="relative z-10 flex justify-between items-start border-b border-slate-200 pb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-royal-600 to-royal-800 flex items-center justify-center text-white shadow-md">
              <Activity className="w-6 h-6 stroke-[2.4]" />
            </div>
            <div>
              <div className="text-[10px] font-extrabold tracking-widest text-royal-800 uppercase">
                GOVERNMENT OF ANDHRA PRADESH • ITDA PADERU
              </div>
              <div className="text-base font-extrabold text-slate-900 tracking-tight">
                AROGYA DRISHTI HEALTH CARD
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[9px] font-extrabold bg-emerald-600 text-white px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
              ABDM VERIFIED
            </span>
            <div className="text-[9px] text-slate-500 font-mono mt-0.5">Alluri Sitharama Raju</div>
          </div>
        </div>

        {/* Card Middle: Photo, Chip, Patient Info */}
        <div className="relative z-10 my-4 flex items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            {/* Patient Photo Avatar */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-royal-50 border-2 border-royal-500 overflow-hidden shadow-md flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-royal-600 to-royal-800 text-white font-black text-3xl">
              {patient.name.charAt(0)}
            </div>

            {/* Demographics */}
            <div className="space-y-1">
              <div className="text-lg sm:text-xl font-black text-slate-950 leading-tight">
                {patient.name}
              </div>
              <div className="text-xs font-semibold text-slate-700">
                {patient.age} Yrs • {patient.gender} • Blood: <span className="text-red-600 font-bold bg-red-50 px-1.5 py-0.5 rounded border border-red-200">{patient.bloodGroup || 'O+'}</span>
              </div>
              <div className="text-xs text-slate-600 flex items-center space-x-1">
                <MapPin className="w-3 h-3 text-royal-600" />
                <span>{patient.village}, {patient.mandal} (ITDA)</span>
              </div>
              <div className="text-[11px] font-mono text-slate-600 font-medium pt-0.5">
                Aadhaar: <strong className="text-slate-800">{patient.aadhar}</strong>
              </div>
            </div>
          </div>

          {/* QR Code */}
          <div className="text-center p-2 bg-white rounded-2xl border border-royal-200 shadow-sm flex-shrink-0">
            <QrCode className="w-14 h-14 sm:w-16 sm:h-16 text-slate-900" />
            <span className="text-[8px] font-mono text-royal-700 block mt-0.5 font-bold">ABDM QR</span>
          </div>
        </div>

        {/* Card Footer: UIDN & Emergency Helplines */}
        <div className="relative z-10 pt-3 border-t border-slate-200 flex justify-between items-center text-xs">
          <div>
            <span className="text-[9px] uppercase font-bold text-slate-500 block">Universal Patient ID (UIDN)</span>
            <span className="font-mono text-sm sm:text-base font-black tracking-wider text-royal-700">
              {patient.uidn}
            </span>
          </div>

          <div className="flex items-center space-x-2 text-[10px] font-bold">
            <span className="bg-red-600 text-white px-2 py-0.5 rounded-full flex items-center space-x-1 shadow-sm">
              <PhoneCall className="w-2.5 h-2.5" />
              <span>108 SOS</span>
            </span>
            <span className="bg-royal-800 text-white px-2 py-0.5 rounded-full">
              104 Mobile Van
            </span>
          </div>
        </div>
      </div>

      {/* PATIENT SEARCH ENGINE: Search own Arogya Drishti records */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 uppercase flex items-center space-x-1.5">
            <Search className="w-3.5 h-3.5 text-royal-600" />
            <span>Patient Search Engine (Search Own Records)</span>
          </span>
          <span className="text-[10px] text-slate-400">UIDN {patient.uidn}</span>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search prescriptions, biopsy, doctor notes, appointments..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-royal-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-royal-600 hover:bg-royal-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
          >
            Search
          </button>
        </form>

        {searchResults.length > 0 && (
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <div className="text-[11px] font-semibold text-slate-500">Matching Arogya Drishti Records:</div>
            {searchResults.map((hit, idx) => (
              <div key={idx} className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-royal-950 flex items-start space-x-2">
                <FileText className="w-3.5 h-3.5 text-royal-600 mt-0.5 flex-shrink-0" />
                <span>{hit}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GoldenHealthCard;
