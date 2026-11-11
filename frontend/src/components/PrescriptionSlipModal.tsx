import React, { useRef } from 'react';
import {
  FileText,
  Printer,
  Download,
  X,
  CheckCircle,
  QrCode,
  ShieldCheck,
  Stethoscope,
  Activity,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Language, translations } from '../i18n/translations.ts';

interface PrescriptionSlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: any;
  prescription: any;
  doctor?: any;
  lang: Language;
}

export const PrescriptionSlipModal: React.FC<PrescriptionSlipModalProps> = ({
  isOpen,
  onClose,
  patient,
  prescription = {
    rxId: 'RX-ASR-2026-0001',
    date: '2026-11-10',
    medicines: [
      {
        name: 'Antioxidant & Lycopene Capsules (LycoRed 8mg)',
        dosage: '1 capsule',
        frequency: 'Twice daily after meals',
        duration: '30 days',
        instructions: 'Swallow whole with warm water. Do not chew.'
      },
      {
        name: 'Triamcinolone Acetonide Oral Paste 0.1% (Kenacort 0.1%)',
        dosage: 'Pea-sized dab',
        frequency: 'Thrice daily application after food',
        duration: '14 days',
        instructions: 'Apply gently over the cheek lesion with a clean finger.'
      },
      {
        name: 'Chlorhexidine Gluconate Mouthwash 0.2%',
        dosage: '10 ml undiluted',
        frequency: 'Twice daily',
        duration: '14 days',
        instructions: 'Swish for 60 seconds and spit out.'
      }
    ],
    biopsyRecommended: true,
    biopsyProcedureDetails: 'Diagnostic 4mm punch biopsy of right buccal mucosa. Histopathology referral to GGH Paderu (Government General Hospital Paderu).',
    trackingStatus: 'Biopsy Scheduled',
    printableBarcodeId: 'BAR-ASR-2026-GM046',
    clinicalNotes: 'Biopsy order linked to UIDN-ASR-2026-GM046 with histopathology referral to GGH Paderu.'
  },
  doctor = {
    name: 'Dr. Swapna Devi, MDS',
    designation: 'Chief Onco-Pathologist & Lead Tele-Consultant',
    hospitalDuty: 'PHC G. Madugula / GGH Paderu Tele-Lab Hub',
    abdmCode: 'ABDM-DOC-AP-7821'
  },
  lang
}) => {
  const printableRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !patient) return null;

  const handlePrint = () => {
    window.print();
  };

  // 4-Step Longitudinal Journey
  const journeySteps = [
    { step: 1, title: 'Screening & Triage', status: 'Completed', date: '01-Nov-2026' },
    { step: 2, title: 'Prescription Dispensed', status: 'Completed', date: '10-Nov-2026' },
    { step: 3, title: 'Biopsy Procedure Scheduled', status: 'Active', date: '15-Nov-2026' },
    { step: 4, title: 'Histopathology Review', status: 'Pending', date: '22-Nov-2026' }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white max-w-3xl w-full rounded-3xl border border-amber-300 shadow-2xl overflow-hidden animate-scaleIn my-auto">
        {/* Modal Top Control Bar */}
        <div className="bg-slate-900 text-white px-6 py-3 flex justify-between items-center print:hidden border-b border-amber-500/40">
          <div className="flex items-center space-x-2 text-xs font-bold text-amber-300">
            <FileText className="w-4 h-4 text-amber-400" />
            <span>Official Bilingual e-Prescription & Biopsy Referral Slip</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors flex items-center space-x-1"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Slip</span>
            </button>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-white/20 text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 4-Step Treatment Journey Tracker */}
        <div className="bg-[#FCFBF7] p-5 border-b border-amber-200 print:hidden space-y-2">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
            Longitudinal Oral Cancer Care Continuum (ITDA Paderu)
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {journeySteps.map((s) => (
              <div
                key={s.step}
                className={`p-2.5 rounded-xl border text-xs flex flex-col justify-between ${
                  s.status === 'Completed'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    : s.status === 'Active'
                    ? 'bg-amber-50 border-amber-400 ring-1 ring-amber-400 text-amber-950 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
              >
                <div>
                  <div className="text-[10px] font-mono font-bold text-amber-800">Step 0{s.step}</div>
                  <div className="font-bold text-[11px] leading-tight mt-0.5">{s.title}</div>
                </div>
                <div className="text-[10px] opacity-75 mt-2 flex justify-between">
                  <span>{s.date}</span>
                  <span className="font-semibold">{s.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Printable Official Slip Document */}
        <div ref={printableRef} className="p-6 sm:p-8 space-y-6 text-slate-800 bg-white">
          {/* AP Govt & ITDA Paderu Header */}
          <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
            <div className="space-y-1">
              <div className="text-[11px] font-bold text-slate-700 tracking-wider uppercase">
                GOVERNMENT OF ANDHRA PRADESH • APVVP
              </div>
              <div className="text-xl font-extrabold font-serif-royal text-slate-950">
                INTEGRATED TRIBAL DEVELOPMENT AGENCY (ITDA) PADERU
              </div>
              <div className="text-xs text-slate-600 font-medium">
                District Onco-Surveillance Hub • Alluri Sitharama Raju District
              </div>
            </div>

            <div className="text-right space-y-1">
              <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-300">
                ABDM: {doctor.abdmCode}
              </span>
              <div className="text-[11px] font-mono text-slate-500">
                Rx ID: <strong>{prescription.rxId}</strong>
              </div>
              <div className="text-[11px] text-slate-500">
                Date: <strong>10-Nov-2026</strong>
              </div>
            </div>
          </div>

          {/* Patient Particulars */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 block text-[10px]">Patient Name</span>
              <strong className="text-sm font-bold text-slate-900">{patient.name}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">UIDN Number</span>
              <strong className="font-mono text-xs text-amber-900 font-bold">{patient.uidn}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Age / Gender / Blood</span>
              <strong>{patient.age} Yrs / {patient.gender} / {patient.bloodGroup || 'O+'}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Mandal & Village</span>
              <strong>{patient.village}, {patient.mandal}</strong>
            </div>
          </div>

          {/* Clinical Diagnosis & Triage */}
          <div className="space-y-1 text-xs">
            <span className="text-[10px] uppercase font-bold text-slate-500">Preliminary Clinical Diagnosis</span>
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-300 font-semibold text-amber-950 flex items-center justify-between">
              <span>Oral Leukoplakia with Suspicious Indurated Margins (Right Buccal Mucosa)</span>
              <span className="text-xs font-bold bg-red-600 text-white px-2 py-0.5 rounded">
                Urgent Clinical Evaluation
              </span>
            </div>
          </div>

          {/* Official Biopsy Order Slip */}
          {prescription.biopsyRecommended && (
            <div className="p-4 rounded-2xl bg-red-50/70 border border-red-300 space-y-2 text-xs">
              <div className="flex justify-between items-center text-red-950 font-bold">
                <span className="flex items-center space-x-1.5 uppercase tracking-wide">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span>4mm Diagnostic Punch Biopsy Order</span>
                </span>
                <span className="bg-red-200 text-red-900 text-[10px] px-2 py-0.5 rounded font-mono">
                  PROCEDURE SCHEDULED
                </span>
              </div>
              <p className="text-slate-700 leading-relaxed">
                {prescription.biopsyProcedureDetails}
              </p>
              <div className="text-[11px] text-slate-600 font-semibold pt-1">
                Designated Surgical Unit: <strong>Community Health Centre (CHC) G. Madugula</strong>
              </div>
            </div>
          )}

          {/* Prescribed Medications Table */}
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-500">Rx - Prescribed Medications</span>
            <table className="w-full text-xs text-left border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-100 text-slate-700 text-[11px] uppercase">
                <tr>
                  <th className="p-2.5">Medicine Name</th>
                  <th className="p-2.5">Dosage</th>
                  <th className="p-2.5">Frequency</th>
                  <th className="p-2.5">Duration</th>
                  <th className="p-2.5">Clinical Instructions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {prescription.medicines?.map((m: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="p-2.5 font-bold text-slate-900">{m.name}</td>
                    <td className="p-2.5 text-slate-600">{m.dosage}</td>
                    <td className="p-2.5 text-slate-600">{m.frequency}</td>
                    <td className="p-2.5 text-slate-600">{m.duration}</td>
                    <td className="p-2.5 text-amber-900">{m.instructions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Doctor Signature & Printable Barcode */}
          <div className="pt-6 border-t border-slate-200 flex justify-between items-end">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <QrCode className="w-8 h-8 text-amber-700" />
                <div>
                  <span className="font-mono text-xs font-bold text-slate-900 block">
                    {prescription.printableBarcodeId}
                  </span>
                  <span className="text-[9px] text-slate-500">ABDM Verified Digital Health Identifier</span>
                </div>
              </div>
            </div>

            <div className="text-right space-y-1">
              <div className="font-serif-royal italic text-sm text-amber-900 font-bold">
                {doctor.name}
              </div>
              <div className="text-[11px] text-slate-600 font-semibold">{doctor.designation}</div>
              <div className="text-[10px] text-slate-500">{doctor.hospitalDuty}</div>
              <div className="text-[9px] text-emerald-700 font-mono font-bold">Digitally Certified via ABDM AP-7821</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionSlipModal;

