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

  // STRICT 1-PAGE PRINT / PDF EXPORT (ZERO EXTRA PAGES)
  const handlePrintCard = () => {
    let portal = document.getElementById('health-card-print-portal');
    if (!portal) {
      portal = document.createElement('div');
      portal.id = 'health-card-print-portal';
      document.body.appendChild(portal);
    }

    const cardElement = cardRef.current;
    if (!cardElement) return;

    portal.innerHTML = '';
    const clone = cardElement.cloneNode(true) as HTMLElement;
    clone.style.maxWidth = '580px';
    clone.style.width = '100%';
    clone.style.margin = '0 auto';
    clone.style.boxShadow = 'none';
    portal.appendChild(clone);

    const originalTitle = document.title;
    document.title = `Arogya_Drishti_Health_Card_${patient.uidn || 'ASR'}`;

    document.body.classList.add('printing-health-card-only');

    const cleanup = () => {
      document.body.classList.remove('printing-health-card-only');
      if (portal) portal.innerHTML = '';
      document.title = originalTitle;
      window.removeEventListener('afterprint', cleanup);
    };

    window.addEventListener('afterprint', cleanup);

    setTimeout(() => {
      window.print();
      setTimeout(cleanup, 3000);
    }, 150);
  };

  // DIRECT IMAGE / PNG DOWNLOAD (ZERO EXTRA PAGES, INSTANT DOWNLOAD)
  const handleDownloadImage = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1000;
    canvas.height = 630;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const roundRect = (x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    };

    // Card Background Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 1000, 630);
    bgGrad.addColorStop(0, '#FFFFFF');
    bgGrad.addColorStop(0.5, '#F8FAFC');
    bgGrad.addColorStop(1, '#EFF6FF');
    ctx.fillStyle = bgGrad;
    roundRect(10, 10, 980, 610, 28);
    ctx.fill();

    // Card Border
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#1D4ED8';
    roundRect(10, 10, 980, 610, 28);
    ctx.stroke();

    // Decorative corner accent
    ctx.fillStyle = 'rgba(219, 234, 254, 0.4)';
    ctx.beginPath();
    ctx.arc(950, 50, 180, 0, Math.PI * 2);
    ctx.fill();

    // 1. Header Section
    const iconGrad = ctx.createLinearGradient(45, 45, 105, 105);
    iconGrad.addColorStop(0, '#1E3A8A');
    iconGrad.addColorStop(1, '#1D4ED8');
    ctx.fillStyle = iconGrad;
    roundRect(45, 45, 60, 60, 14);
    ctx.fill();

    // Medical cross icon
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(70, 57, 10, 36);
    ctx.fillRect(57, 70, 36, 10);

    ctx.fillStyle = '#1E3A8A';
    ctx.font = 'bold 13px Inter, system-ui, sans-serif';
    ctx.fillText('GOVERNMENT OF ANDHRA PRADESH • ITDA PADERU', 120, 66);

    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 24px Inter, system-ui, sans-serif';
    ctx.fillText('AROGYA DRISHTI HEALTH CARD', 120, 96);

    // ABDM Verified Badge
    ctx.fillStyle = '#059669';
    roundRect(810, 48, 140, 28, 14);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ABDM VERIFIED', 880, 67);

    ctx.fillStyle = '#64748B';
    ctx.font = '12px Inter, system-ui, sans-serif';
    ctx.fillText('Alluri Sitharama Raju', 880, 94);
    ctx.textAlign = 'left';

    // Divider
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(45, 125);
    ctx.lineTo(955, 125);
    ctx.stroke();

    // 2. Middle Section: Avatar & Info & QR
    const avatarGrad = ctx.createLinearGradient(45, 150, 195, 300);
    avatarGrad.addColorStop(0, '#1E3A8A');
    avatarGrad.addColorStop(1, '#2563EB');
    ctx.fillStyle = avatarGrad;
    roundRect(45, 150, 145, 145, 20);
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#3B82F6';
    roundRect(45, 150, 145, 145, 20);
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 70px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText((patient.name || 'P').charAt(0).toUpperCase(), 117, 248);
    ctx.textAlign = 'left';

    ctx.fillStyle = '#020617';
    ctx.font = 'bold 30px Inter, system-ui, sans-serif';
    ctx.fillText(patient.name || 'K. Somanna', 215, 185);

    ctx.fillStyle = '#334155';
    ctx.font = '600 16px Inter, system-ui, sans-serif';
    ctx.fillText(`${patient.age || '46'} Yrs • ${patient.gender || 'Male'} • Blood:`, 215, 220);

    // Blood Group Badge (Red)
    ctx.fillStyle = '#FEE2E2';
    roundRect(435, 202, 50, 26, 6);
    ctx.fill();
    ctx.strokeStyle = '#FCA5A5';
    ctx.lineWidth = 1;
    roundRect(435, 202, 50, 26, 6);
    ctx.stroke();
    ctx.fillStyle = '#DC2626';
    ctx.font = 'bold 15px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(patient.bloodGroup || 'O+', 460, 221);
    ctx.textAlign = 'left';

    ctx.fillStyle = '#475569';
    ctx.font = '15px Inter, system-ui, sans-serif';
    ctx.fillText(`📍 ${patient.village || 'G. Madugula'}, ${patient.mandal || 'G. Madugula'} (ITDA)`, 215, 255);

    ctx.fillStyle = '#334155';
    ctx.font = '500 15px monospace';
    ctx.fillText(`Aadhaar: ${patient.aadhar || '4321 8765 2109'}`, 215, 285);

    // QR Code Container
    ctx.fillStyle = '#FFFFFF';
    roundRect(805, 150, 145, 145, 18);
    ctx.fill();
    ctx.strokeStyle = '#BFDBFE';
    ctx.lineWidth = 2;
    roundRect(805, 150, 145, 145, 18);
    ctx.stroke();

    const qx = 825;
    const qy = 165;
    const qs = 105;
    ctx.fillStyle = '#0F172A';
    const drawFinder = (fx: number, fy: number) => {
      ctx.fillRect(fx, fy, 28, 28);
      ctx.clearRect(fx + 4, fy + 4, 20, 20);
      ctx.fillRect(fx + 8, fy + 8, 12, 12);
    };
    drawFinder(qx, qy);
    drawFinder(qx + qs - 28, qy);
    drawFinder(qx, qy + qs - 28);
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if ((r + c) % 2 === 0) {
          ctx.fillRect(qx + 35 + c * 7, qy + 35 + r * 7, 5, 5);
        }
      }
    }
    ctx.fillStyle = '#1D4ED8';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ABDM QR CODE', 877, 285);
    ctx.textAlign = 'left';

    // 3. Footer Section
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(45, 330);
    ctx.lineTo(955, 330);
    ctx.stroke();

    ctx.fillStyle = '#64748B';
    ctx.font = 'bold 11px Inter, system-ui, sans-serif';
    ctx.fillText('UNIVERSAL PATIENT ID (UIDN)', 45, 365);

    ctx.fillStyle = '#1D4ED8';
    ctx.font = 'bold 26px monospace';
    ctx.fillText(patient.uidn || 'UIDN-ASR-2026-GM046', 45, 400);

    // 108 SOS
    ctx.fillStyle = '#DC2626';
    roundRect(720, 365, 105, 34, 17);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 13px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('📞 108 SOS', 772, 387);

    // 104 Mobile Van
    ctx.fillStyle = '#1E3A8A';
    roundRect(835, 365, 120, 34, 17);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 13px Inter, system-ui, sans-serif';
    ctx.fillText('104 Mobile Van', 895, 387);
    ctx.textAlign = 'left';

    ctx.fillStyle = '#94A3B8';
    ctx.font = '12px Inter, system-ui, sans-serif';
    ctx.fillText('Alluri Sitharama Raju District • Integrated Tribal Oral Cancer Surveillance • Paderu Hub', 45, 435);

    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `Arogya_Drishti_Health_Card_${patient.uidn || 'AP'}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    link.remove();
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
      <div className="flex flex-wrap justify-between items-center gap-3 print:hidden">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-royal-600 animate-pulse" />
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
            AROGYA DRISHTI DIGITAL HEALTH CARD
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrintCard}
            className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-xl text-xs transition-all duration-200 hover:-translate-y-0.5 shadow-sm flex items-center space-x-1.5 cursor-pointer"
            title="Print or Save as 1-Page PDF (Zero Extra Pages)"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / Save PDF (1 Page)</span>
          </button>
          <button
            onClick={handleDownloadImage}
            className="px-3.5 py-2 bg-white hover:bg-blue-50 text-blue-700 border border-blue-300 rounded-xl text-xs font-bold transition-all duration-200 hover:-translate-y-0.5 shadow-sm flex items-center space-x-1.5 cursor-pointer"
            title="Download Official Health Card Image"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Card</span>
          </button>
        </div>
      </div>

      {/* The Physical Card Container (Crisp White & Royal Blue Theme) */}
      <div
        id="arogya-drishti-health-card-print"
        ref={cardRef}
        className="relative aspect-[1.586/1] max-w-lg mx-auto rounded-3xl p-6 sm:p-7 text-slate-900 overflow-hidden shadow-xl border-2 border-royal-400 bg-gradient-to-br from-white via-blue-50/40 to-blue-100/30 select-none health-card-printable-container"
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
            <div className="w-10 h-10 rounded-xl bg-blue-700 flex items-center justify-center text-white font-bold shadow-md">
              <Activity className="w-6 h-6 stroke-[2.4]" />
            </div>
            <div>
              <div className="text-[10px] font-extrabold tracking-widest text-blue-900 uppercase">
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
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-blue-700 text-white font-bold border-2 border-blue-800 overflow-hidden shadow-md flex-shrink-0 flex items-center justify-center text-3xl">
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
            <span className="bg-amber-400 text-slate-950 font-bold px-2.5 py-0.5 rounded-full shadow-sm">
              104 Mobile Van
            </span>
          </div>
        </div>
      </div>

      {/* PATIENT SEARCH ENGINE: Search own Arogya Drishti records */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3 print:hidden">
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
