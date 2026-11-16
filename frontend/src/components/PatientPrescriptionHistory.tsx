import React, { useState, useEffect } from 'react';
import {
  FileText,
  Activity,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  QrCode,
  Download,
  Printer,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Stethoscope,
  Eye,
  Pill,
  Filter,
  RefreshCw
} from 'lucide-react';
import { Language } from '../i18n/translations.ts';
import api from '../services/api.ts';

interface PatientPrescriptionHistoryProps {
  patient: any;
  lang: Language;
  onViewPrescription: (prescription: any, patient: any) => void;
  onOpenScreening?: () => void;
}

export const PatientPrescriptionHistory: React.FC<PatientPrescriptionHistoryProps> = ({
  patient,
  lang,
  onViewPrescription,
  onOpenScreening
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'prescriptions' | 'screenings' | 'consultations'>('all');
  const [historyData, setHistoryData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadHistory = async () => {
    if (!patient?.uidn) return;
    setLoading(true);
    try {
      const res = await api.getPatientHistory(patient.uidn);
      if (res && res.success) {
        setHistoryData(res);
      }
    } catch (err) {
      console.warn('[History] API fetch warning, using local patient data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [patient?.uidn]);

  // Demo fallback datasets if database is empty
  const prescriptions = historyData?.prescriptions?.length > 0 ? historyData.prescriptions : [
    {
      rxId: 'RX-ASR-2026-9449',
      patientUidn: patient?.uidn || 'UIDN-ASR-2026-0038',
      doctorUidn: 'DOC-ANIL',
      doctorName: 'Dr. Anil Kumar, MBBS, MS',
      hospitalDuty: 'Area Hospital Chintapalli / GGH Paderu',
      date: new Date().toISOString(),
      trackingStatus: 'Biopsy Scheduled',
      biopsyRecommended: true,
      biopsyProcedureDetails: 'Diagnostic 4mm punch biopsy of right buccal mucosa under local anesthesia at PHC G. Madugula.',
      printableBarcodeId: 'BAR-ASR-2026-44121-0038',
      clinicalNotes: 'Indurated mucosal border persistent for 3 weeks. Advised complete tobacco/Adda Poga cessation.',
      medicines: [
        {
          name: 'Lycopene 8mg Capsules',
          dosage: '1 Cap',
          frequency: 'Twice daily',
          duration: '30 Days',
          instructions: 'Take after meals with water'
        },
        {
          name: 'Kenacort 0.1% Dental Paste',
          dosage: 'Topical application',
          frequency: 'Thrice daily',
          duration: '14 Days',
          instructions: 'Apply gently on indurated lesion after meals'
        },
        {
          name: 'Chlorhexidine 0.2% Antiseptic Rinse',
          dosage: '10 ml',
          frequency: 'Twice daily',
          duration: '14 Days',
          instructions: 'Rinse mouth for 1 minute, do not swallow'
        }
      ]
    },
    {
      rxId: 'RX-ASR-2026-2858',
      patientUidn: patient?.uidn || 'UIDN-ASR-2026-0038',
      doctorUidn: 'DOC-SWAPNA',
      doctorName: 'Dr. Swapna Devi, MDS',
      hospitalDuty: 'PHC G. Madugula / Area Hospital Paderu',
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      trackingStatus: 'Prescription Dispensed',
      biopsyRecommended: false,
      printableBarcodeId: 'BAR-ASR-2026-11121-0038',
      clinicalNotes: 'Initial screening review. Leukoplakia patch on left cheek.',
      medicines: [
        {
          name: 'Multivitamin & Zinc Supplements',
          dosage: '1 Tab',
          frequency: 'Once daily',
          duration: '30 Days',
          instructions: 'Take in morning'
        },
        {
          name: 'Antioxidant Oral Gel',
          dosage: 'Topical application',
          frequency: 'Twice daily',
          duration: '21 Days',
          instructions: 'Apply on white patch'
        }
      ]
    }
  ];

  const screenings = historyData?.screenings?.length > 0 ? historyData.screenings : [
    {
      screeningId: 'SC-ASR-2026-8801',
      patientUidn: patient?.uidn || 'UIDN-ASR-2026-0038',
      oralRegion: 'Right Buccal Mucosa',
      imageUrl: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&q=80&w=600',
      aiCondition: 'Serious',
      aiConfidenceScore: 92.4,
      aiLesionType: 'Precancerous Oral Leukoplakia & Submucous Fibrosis',
      createdAt: new Date().toISOString(),
      clinicalRemarks: 'High-risk non-scrapable induration observed on right inner cheek. 4mm punch biopsy strongly recommended to rule out dysplasia.',
      symptomsChecklist: ['Burning with spicy food', 'Restricted opening (3-finger test fail)', 'Rough white patch'],
      habitExposure: { reverseSmoking: true, tobacco: true, years: 14 }
    },
    {
      screeningId: 'SC-ASR-2026-6210',
      patientUidn: patient?.uidn || 'UIDN-ASR-2026-0038',
      oralRegion: 'Palate',
      imageUrl: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&q=80&w=600',
      aiCondition: 'Medium',
      aiConfidenceScore: 88.2,
      aiLesionType: 'Palatal Thermal Erythema (Adda Poga Exposure)',
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      clinicalRemarks: 'Thermal burn marks on hard palate consistent with reverse cigar smoking habit. Habit cessation advised.',
      symptomsChecklist: ['Dry mouth', 'Mild palate burning'],
      habitExposure: { reverseSmoking: true, tobacco: false, years: 12 }
    }
  ];

  const timeline = historyData?.timeline?.length > 0 ? historyData.timeline : [
    {
      id: 'tl-1',
      type: 'prescription',
      date: new Date().toISOString(),
      title: 'e-Prescription Issued (RX-ASR-2026-9449)',
      description: '3 Medications prescribed by Dr. Anil Kumar, MS • Biopsy procedure scheduled at PHC G. Madugula.',
      badgeColor: 'blue',
      data: prescriptions[0]
    },
    {
      id: 'tl-2',
      type: 'screening',
      date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      title: 'AI Oral Screening Completed (92.4% Serious Risk)',
      description: 'Right Buccal Mucosa indurated white patch flagged by Multimodal Gemini Vision AI.',
      badgeColor: 'red',
      data: screenings[0]
    },
    {
      id: 'tl-3',
      type: 'appointment',
      date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      title: 'Specialist Tele-Consultation Approved',
      description: 'Scheduled with Dr. Anil Kumar at Area Hospital Chintapalli via WebRTC.',
      badgeColor: 'emerald',
      data: { status: 'APPROVED', doctorName: 'Dr. Anil Kumar, MBBS, MS' }
    }
  ];

  return (
    <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-200 px-3 py-0.5 rounded-full text-xs font-bold text-royal-800 shadow-2xs mb-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-royal-600" />
            <span>
              {lang === 'te'
                ? 'వ్యక్తిగత ఆరోగ్య రికార్డు • ABDM అనుసంధానం'
                : lang === 'hi'
                ? 'व्यक्तिगत स्वास्थ्य रिकॉर्ड • ABDM लिंक्ड'
                : 'PERSONAL HEALTH RECORD • ABDM LINKED'}
            </span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight flex items-center space-x-2">
            <FileText className="w-6 h-6 text-royal-700" />
            <span>
              {lang === 'te'
                ? 'ప్రిస్క్రిప్షన్‌లు & పూర్తి వైద్య చరిత్ర'
                : lang === 'hi'
                ? 'नुस्खे एवं पूर्ण चिकित्सा इतिहास'
                : 'Prescriptions & Medical History'}
            </span>
          </h3>

          <p className="text-xs text-slate-600 mt-1">
            {lang === 'te'
              ? 'మీ గత నోటి పరీక్షల నివేదికలు, AI రిస్క్ స్కోర్లు, డాక్టర్ సూచించిన మందులు మరియు బయాప్సీ స్లిప్పులు ఇక్కడ భద్రపరచబడ్డాయి.'
              : lang === 'hi'
              ? 'आपकी पिछली मुख जांच रिपोर्ट, एआई जोखिम स्कोर, डॉक्टरों द्वारा दिए गए नुस्खे व बायोप्सी पर्चियां यहां सुरक्षित हैं।'
              : 'Your longitudinal clinical screening logs, AI triage scores, doctor consultation notes, and downloadable e-prescriptions.'}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={loadHistory}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer"
            title="Refresh History"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">
              {lang === 'te' ? 'రిఫ్రెష్' : lang === 'hi' ? 'रीफ्रेश' : 'Refresh'}
            </span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3 text-xs font-bold">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
            activeTab === 'all'
              ? 'bg-royal-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>
            {lang === 'te' ? 'మొత్తం చరిత్ర' : lang === 'hi' ? 'संपूर्ण इतिहास' : 'All History'} ({timeline.length})
          </span>
        </button>

        <button
          onClick={() => setActiveTab('prescriptions')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
            activeTab === 'prescriptions'
              ? 'bg-royal-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Pill className="w-3.5 h-3.5" />
          <span>
            {lang === 'te' ? 'ఈ-ప్రిస్క్రిప్షన్‌లు' : lang === 'hi' ? 'ई-पर्चे' : 'e-Prescriptions'} ({prescriptions.length})
          </span>
        </button>

        <button
          onClick={() => setActiveTab('screenings')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
            activeTab === 'screenings'
              ? 'bg-royal-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>
            {lang === 'te' ? 'గత నోటి స్క్రీనింగ్‌లు' : lang === 'hi' ? 'पिछली मुख जांचें' : 'Past Screenings'} ({screenings.length})
          </span>
        </button>

        <button
          onClick={() => setActiveTab('consultations')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
            activeTab === 'consultations'
              ? 'bg-royal-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Stethoscope className="w-3.5 h-3.5" />
          <span>
            {lang === 'te' ? 'డాక్టర్ సలహాలు' : lang === 'hi' ? 'डॉक्टर परामर्श' : 'Doctor Notes'}
          </span>
        </button>
      </div>

      {/* TAB CONTENT 1: ALL HISTORY TIMELINE */}
      {activeTab === 'all' && (
        <div className="space-y-4">
          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {timeline.map((item: any, idx: number) => (
              <div key={item.id || idx} className="relative group">
                <div
                  className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-2 bg-white ${
                    item.badgeColor === 'red'
                      ? 'border-red-500'
                      : item.badgeColor === 'amber'
                      ? 'border-amber-500'
                      : item.badgeColor === 'emerald'
                      ? 'border-emerald-500'
                      : 'border-royal-600'
                  }`}
                />
                <div className="bg-slate-50 hover:bg-white border border-slate-200 hover:border-royal-300 rounded-2xl p-4 transition-all shadow-2xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5 border-b border-slate-100">
                    <span className="font-extrabold text-xs text-slate-900 flex items-center space-x-1.5">
                      {item.type === 'prescription' && <FileText className="w-3.5 h-3.5 text-royal-600" />}
                      {item.type === 'screening' && <Eye className="w-3.5 h-3.5 text-red-600" />}
                      {item.type === 'appointment' && <Calendar className="w-3.5 h-3.5 text-emerald-600" />}
                      <span>{item.title}</span>
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {new Date(item.date).toLocaleDateString(lang === 'te' ? 'te-IN' : 'en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 mt-2 leading-relaxed">{item.description}</p>

                  {item.type === 'prescription' && (
                    <div className="mt-3 pt-2 border-t border-slate-200/60 flex justify-end">
                      <button
                        onClick={() => onViewPrescription(item.data, patient)}
                        className="px-3 py-1 bg-royal-600 hover:bg-royal-700 text-white rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center space-x-1 cursor-pointer"
                      >
                        <Printer className="w-3 h-3" />
                        <span>
                          {lang === 'te' ? 'ప్రిస్క్రిప్షన్ స్లిప్ చూడండి' : lang === 'hi' ? 'पर्चा देखें' : 'View Slip'}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: E-PRESCRIPTIONS VAULT */}
      {activeTab === 'prescriptions' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {prescriptions.map((rx: any) => (
            <div
              key={rx.rxId}
              className="bg-slate-50 rounded-2xl border border-slate-200 hover:border-royal-300 p-5 flex flex-col justify-between space-y-4 shadow-2xs hover:shadow-sm transition-all"
            >
              <div>
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-200">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-royal-600" />
                    <span className="font-mono text-xs font-bold text-royal-900 bg-blue-100/60 px-2 py-0.5 rounded">
                      {rx.rxId}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                      rx.trackingStatus === 'Biopsy Scheduled'
                        ? 'bg-red-50 text-red-800 border-red-200'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    }`}
                  >
                    {rx.trackingStatus}
                  </span>
                </div>

                <div className="text-xs text-slate-600 mt-2 space-y-1">
                  <div>
                    {lang === 'te' ? 'వైద్యులు:' : lang === 'hi' ? 'डॉक्टर:' : 'Doctor:'}{' '}
                    <strong className="text-slate-900">{rx.doctorName || rx.doctorUidn}</strong>
                  </div>
                  <div>
                    {lang === 'te' ? 'ఆసుపత్రి:' : lang === 'hi' ? 'अस्पताल:' : 'Facility:'}{' '}
                    <span>{rx.hospitalDuty || 'Area Hospital Paderu'}</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {lang === 'te' ? 'తేదీ:' : lang === 'hi' ? 'दिनांक:' : 'Date:'}{' '}
                    {new Date(rx.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </div>
                </div>

                {/* Prescribed Medicines List */}
                <div className="mt-3.5 space-y-2 bg-white rounded-xl p-3 border border-slate-200">
                  <div className="text-[11px] font-extrabold text-slate-900 uppercase tracking-wide">
                    {lang === 'te' ? 'మందుల వివరాలు:' : lang === 'hi' ? 'दवाओं का विवरण:' : 'Prescribed Medicines:'}
                  </div>
                  {rx.medicines?.map((med: any, mIdx: number) => (
                    <div key={mIdx} className="text-xs text-slate-800 border-b border-slate-100 last:border-b-0 pb-1.5 last:pb-0">
                      <div className="font-bold text-royal-900 flex justify-between">
                        <span>• {med.name}</span>
                        <span className="text-[11px] font-normal text-slate-500">{med.dosage}</span>
                      </div>
                      <div className="text-[11px] text-slate-600 flex justify-between">
                        <span>{med.frequency}</span>
                        <span>{med.duration}</span>
                      </div>
                      {med.instructions && (
                        <div className="text-[10px] text-slate-500 italic mt-0.5">{med.instructions}</div>
                      )}
                    </div>
                  ))}
                </div>

                {rx.biopsyRecommended && (
                  <div className="mt-2.5 p-2 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900">
                    <span className="font-extrabold block">
                      {lang === 'te' ? '⚠️ బయాప్సీ సిఫార్సు చేయబడింది:' : lang === 'hi' ? '⚠️ बायोप्सी अनुशंसित:' : '⚠️ Biopsy Recommended:'}
                    </span>
                    <span className="text-[11px]">{rx.biopsyProcedureDetails}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-1.5">
                  <QrCode className="w-5 h-5 text-slate-700" />
                  <span className="font-mono text-[10px] text-slate-500 font-bold">
                    {rx.printableBarcodeId}
                  </span>
                </div>

                <button
                  onClick={() => onViewPrescription(rx, patient)}
                  className="px-3.5 py-1.5 bg-royal-600 hover:bg-royal-700 text-white rounded-xl font-bold text-xs shadow-sm transition-all flex items-center space-x-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>
                    {lang === 'te' ? 'స్లిప్ ప్రింట్ చేయండి' : lang === 'hi' ? 'पर्चा प्रिंट करें' : 'Print Slip'}
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB CONTENT 3: PAST SCREENINGS */}
      {activeTab === 'screenings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {screenings.map((sc: any) => (
            <div
              key={sc.screeningId}
              className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4 hover:border-royal-300 transition-all shadow-2xs"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-bold text-slate-800 bg-slate-200 px-2 py-0.5 rounded">
                    {sc.screeningId}
                  </span>
                  <span className="text-xs font-bold text-slate-900">{sc.oralRegion}</span>
                </div>
                <span
                  className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                    sc.aiCondition === 'Serious' || sc.aiCondition === 'Urgent Clinical Evaluation'
                      ? 'bg-red-100 text-red-900 border-red-300'
                      : sc.aiCondition === 'Medium'
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                  }`}
                >
                  {sc.aiCondition} ({sc.aiConfidenceScore}%)
                </span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-950">{sc.aiLesionType}</h4>
                <p className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200 mt-2 leading-relaxed">
                  {sc.clinicalRemarks}
                </p>
              </div>

              <div className="text-[11px] text-slate-500 space-y-1">
                <div>
                  {lang === 'te' ? 'గుర్తించిన లక్షణాలు:' : lang === 'hi' ? 'पहचाने गए लक्षण:' : 'Recorded Symptoms:'}{' '}
                  <strong className="text-slate-700">{sc.symptomsChecklist?.join(', ')}</strong>
                </div>
                <div>
                  {lang === 'te' ? 'అలవాట్లు:' : lang === 'hi' ? 'आदतें:' : 'Habit Exposure:'}{' '}
                  <span>
                    {sc.habitExposure?.reverseSmoking ? 'Adda Poga (Reverse Smoking) • ' : ''}
                    {sc.habitExposure?.tobacco ? 'Chewable Tobacco • ' : ''}
                    {sc.habitExposure?.years ? `${sc.habitExposure.years} Years` : ''}
                  </span>
                </div>
                <div className="text-slate-400">
                  {lang === 'te' ? 'స్క్రీనింగ్ తేదీ:' : lang === 'hi' ? 'जांच तिथि:' : 'Screening Date:'}{' '}
                  {new Date(sc.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                </div>
              </div>

              {onOpenScreening && (
                <div className="pt-2 border-t border-slate-200 flex justify-end">
                  <button
                    onClick={onOpenScreening}
                    className="text-xs font-bold text-royal-700 hover:text-royal-900 flex items-center space-x-1 cursor-pointer"
                  >
                    <span>
                      {lang === 'te' ? 'మళ్లీ స్కాన్ చేయండి' : lang === 'hi' ? 'पुनः जांचें' : 'Retake Scan'}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* TAB CONTENT 4: DOCTOR CONSULTATION NOTES */}
      {activeTab === 'consultations' && (
        <div className="space-y-4">
          <div className="p-5 bg-blue-50/60 rounded-2xl border border-blue-200 space-y-3">
            <div className="flex items-center space-x-2">
              <Stethoscope className="w-5 h-5 text-royal-700" />
              <h4 className="font-extrabold text-sm text-royal-950">
                {lang === 'te'
                  ? 'డాక్టర్ సంప్రదింపుల క్లినికల్ గమనికలు (Dr. Swapna Devi, MDS & Dr. Anil Kumar, MS)'
                  : lang === 'hi'
                  ? 'डॉक्टर क्लिनिकल नोट्स (Dr. Swapna Devi, MDS & Dr. Anil Kumar, MS)'
                  : 'Doctor Clinical Consultation Notes'}
              </h4>
            </div>

            <div className="space-y-2 text-xs text-slate-800 leading-relaxed bg-white p-4 rounded-xl border border-blue-100 shadow-2xs">
              <p>
                <strong>Observation:</strong> Patient presents with mild submucous burning on the right buccal mucosa. Histological evaluation via diagnostic 4mm punch biopsy scheduled at CHC G. Madugula.
              </p>
              <p>
                <strong>Habit Advice:</strong> Strictly discontinue Adda Poga (reverse smoking) and chewable tobacco immediately. Vitamin A and Lycopene prescribed to accelerate mucosal epithelium regeneration.
              </p>
              <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                Follow-up OPD review: Scheduled 14 days post-biopsy at Area Hospital Paderu Onco-Hub.
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default PatientPrescriptionHistory;
