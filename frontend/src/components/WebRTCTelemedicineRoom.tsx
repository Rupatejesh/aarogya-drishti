import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Heart,
  Activity,
  FileText,
  ShieldCheck,
  CheckCircle,
  Plus,
  Trash2,
  Calendar,
  AlertTriangle,
  QrCode,
  UserCheck,
  Stethoscope,
  Maximize2,
  Radio
} from 'lucide-react';
import api from '../services/api.ts';
import { Language, translations } from '../i18n/translations.ts';

interface WebRTCTelemedicineRoomProps {
  patient: any;
  doctor?: any;
  lang: Language;
  onClose: () => void;
  onPrescriptionCreated?: (prescription: any) => void;
}

export const WebRTCTelemedicineRoom: React.FC<WebRTCTelemedicineRoomProps> = ({
  patient,
  doctor = {
    name: 'Dr. S. Rao, M.D.',
    designation: 'Chief Onco-Pathologist & Lead Tele-Consultant',
    hospitalDuty: 'Area Hospital Paderu (AH Paderu / District Hub)',
    uidn: 'DOC-ASR-2026-001'
  },
  lang,
  onClose,
  onPrescriptionCreated
}) => {
  const t = translations[lang];

  // Video stream refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Call Controls
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callActive, setCallActive] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'Connecting' | 'Connected (P2P 22ms)' | 'Disconnected'>('Connected (P2P 22ms)');

  // Clinical Documentation States
  const [clinicalNotes, setClinicalNotes] = useState(
    'Patient presents with persistent non-scrapable white patch in right buccal pouch. History of 18-yr reverse smoking. Margins indurated. AI Onco-triage index: 94.8% urgent leukoplakia. Diagnostic 4mm punch biopsy required.'
  );

  const [biopsyScheduled, setBiopsyScheduled] = useState(true);
  const [biopsyDetails, setBiopsyDetails] = useState('4mm Diagnostic punch biopsy under local anesthesia at CHC G. Madugula.');

  const [medicines, setMedicines] = useState([
    {
      name: 'Antioxidant & Lycopene 8mg Capsules',
      dosage: '1 capsule',
      frequency: 'Twice daily after meals',
      duration: '30 days',
      instructions: 'Swallow whole with warm water'
    },
    {
      name: 'Kenacort 0.1% Oral Mucosal Paste',
      dosage: 'Pea-sized dab',
      frequency: 'Thrice daily after food',
      duration: '14 days',
      instructions: 'Apply gently over cheek lesion'
    },
    {
      name: 'Chlorhexidine 0.2% Antiseptic Rinse',
      dosage: '10 ml',
      frequency: 'Twice daily',
      duration: '14 days',
      instructions: 'Swish for 60 seconds and spit'
    }
  ]);

  const [createdPrescription, setCreatedPrescription] = useState<any>(null);
  const [savingPrescription, setSavingPrescription] = useState(false);

  // Initialize WebRTC media streams
  useEffect(() => {
    let localStream: MediaStream | null = null;

    const setupStream = async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          localStream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 640 }, height: { ideal: 480 } },
            audio: true
          });
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = localStream;
            localVideoRef.current.play();
          }
        }
      } catch (err) {
        console.warn('Local webcam unavailable, running simulated WebRTC feeds:', err);
      }
    };

    setupStream();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      stream.getAudioTracks().forEach((track) => (track.enabled = isMuted));
    }
  };

  const toggleVideo = () => {
    setIsVideoOff(!isVideoOff);
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      stream.getVideoTracks().forEach((track) => (track.enabled = isVideoOff));
    }
  };

  const handleEndCall = () => {
    setCallActive(false);
    setConnectionStatus('Disconnected');
    onClose();
  };

  const handleAddMedicine = () => {
    setMedicines([
      ...medicines,
      {
        name: 'Beta-Carotene & Multivitamin Softgels',
        dosage: '1 capsule',
        frequency: 'Daily once',
        duration: '30 days',
        instructions: 'After breakfast'
      }
    ]);
  };

  const handleRemoveMedicine = (index: number) => {
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const handleSavePrescription = async () => {
    setSavingPrescription(true);
    try {
      const payload = {
        patientUidn: patient.uidn,
        doctorUidn: doctor.uidn,
        medicines,
        biopsyRecommended: biopsyScheduled,
        biopsyProcedureDetails: biopsyScheduled ? biopsyDetails : undefined,
        trackingStatus: biopsyScheduled ? 'Biopsy Scheduled' : 'Prescription Dispensed',
        clinicalNotes
      };

      const res = await api.createPrescription(payload);
      setCreatedPrescription(res.prescription);
      if (onPrescriptionCreated) {
        onPrescriptionCreated(res.prescription);
      }
      alert('Prescription successfully saved & linked to patient record with verified barcode!');
    } catch (err: any) {
      alert(`Error saving prescription: ${err.message}`);
    } finally {
      setSavingPrescription(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-[#FAF9F5] w-full max-w-7xl rounded-3xl border border-amber-400 shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-amber-950 via-amber-900 to-slate-900 text-white px-6 py-3.5 flex items-center justify-between border-b border-amber-600/50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400 flex items-center justify-center">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-sm tracking-wide font-serif-royal">{t.telemedicineRoomTitle}</h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded border border-emerald-400/40">
                  {connectionStatus}
                </span>
              </div>
              <p className="text-[11px] text-amber-200/80">
                Encrypted WebRTC P2P Session • ITDA Paderu Tribal Tele-Care
              </p>
            </div>
          </div>

          <button
            onClick={handleEndCall}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-sm"
          >
            <PhoneOff className="w-3.5 h-3.5" />
            <span>{t.endCall}</span>
          </button>
        </div>

        {/* Patient Vitals & Clinical Context Bar */}
        <div className="bg-amber-100/70 border-b border-amber-200 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs text-amber-950">
          <div className="flex items-center space-x-4">
            <span className="font-bold flex items-center space-x-1">
              <UserCheck className="w-3.5 h-3.5 text-amber-700" />
              <span>{patient.name} ({patient.uidn})</span>
            </span>
            <span>Age: <strong>{patient.age} Yrs</strong></span>
            <span>Mandal: <strong>{patient.mandal}</strong></span>
            <span>Village: <strong>{patient.village}</strong></span>
          </div>

          <div className="flex items-center space-x-4 font-mono text-[11px]">
            <span className="flex items-center space-x-1 text-red-700 font-bold bg-white px-2 py-0.5 rounded border border-red-200">
              <Heart className="w-3 h-3 text-red-500 animate-pulse" />
              <span>BP: 128/84</span>
            </span>
            <span className="flex items-center space-x-1 text-emerald-800 font-bold bg-white px-2 py-0.5 rounded border border-emerald-200">
              <Activity className="w-3 h-3 text-emerald-600" />
              <span>SpO2: 98%</span>
            </span>
            <span className="bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded font-sans font-bold">
              Habit: 18-Yr Reverse Tobacco
            </span>
          </div>
        </div>

        {/* Main Body: Video Panes (Left) & Clinical Documentation (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden">
          {/* LEFT: Video Panes (7 Cols) */}
          <div className="lg:col-span-7 p-4 sm:p-6 bg-slate-950 flex flex-col justify-between space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
              {/* Doctor Video Pane (Remote) */}
              <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-amber-500/30 flex items-center justify-center aspect-[4/3]">
                {/* Doctor Avatar / Mock Video Feed */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
                <img
                  src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=600"
                  alt="Doctor Stream"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-3 left-3 z-20 text-white">
                  <div className="text-xs font-bold flex items-center space-x-1.5">
                    <Stethoscope className="w-3.5 h-3.5 text-amber-400" />
                    <span>{doctor.name}</span>
                  </div>
                  <div className="text-[10px] text-amber-200">{doctor.hospitalDuty}</div>
                </div>
                <div className="absolute top-3 right-3 z-20 bg-emerald-500/90 text-slate-950 font-bold text-[9px] px-2 py-0.5 rounded-full flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping" />
                  <span>DOCTOR LIVE</span>
                </div>
              </div>

              {/* Patient Video Pane (Local / User Stream) */}
              <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-amber-500/30 flex items-center justify-center aspect-[4/3]">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
                {!isVideoOff ? (
                  <video
                    ref={localVideoRef}
                    playsInline
                    muted
                    className="w-full h-full object-cover transform -scale-x-100"
                  />
                ) : (
                  <div className="text-center text-slate-400 space-y-1">
                    <VideoOff className="w-8 h-8 mx-auto" />
                    <div className="text-xs">Camera is Off</div>
                  </div>
                )}

                {/* Patient Label */}
                <div className="absolute bottom-3 left-3 z-20 text-white">
                  <div className="text-xs font-bold">{patient.name} (Patient Feed)</div>
                  <div className="text-[10px] text-slate-300">G. Madugula Tribal Unit</div>
                </div>
                <div className="absolute top-3 right-3 z-20 bg-amber-500/90 text-slate-950 font-bold text-[9px] px-2 py-0.5 rounded-full">
                  PATIENT (P2P)
                </div>
              </div>
            </div>

            {/* In-Call Controls Toolbar */}
            <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl p-3 border border-amber-500/30 flex items-center justify-center space-x-3">
              <button
                onClick={toggleMute}
                className={`p-3 rounded-xl transition-all ${
                  isMuted ? 'bg-red-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-amber-200'
                }`}
                title={isMuted ? t.unmuteMic : t.muteMic}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              <button
                onClick={toggleVideo}
                className={`p-3 rounded-xl transition-all ${
                  isVideoOff ? 'bg-red-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-amber-200'
                }`}
                title={isVideoOff ? t.cameraOn : t.cameraOff}
              >
                {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
              </button>

              <button
                onClick={handleEndCall}
                className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-all flex items-center space-x-1.5 shadow-lg shadow-red-600/30"
              >
                <PhoneOff className="w-4 h-4" />
                <span>{t.endCall}</span>
              </button>
            </div>
          </div>

          {/* RIGHT: Real-Time Clinical Documentation & Prescription Panel (5 Cols) */}
          <div className="lg:col-span-5 p-5 sm:p-6 bg-white border-l border-amber-200 overflow-y-auto space-y-5">
            <div>
              <h4 className="text-sm font-bold text-slate-900 font-serif-royal flex items-center space-x-2">
                <FileText className="w-4 h-4 text-amber-600" />
                <span>{t.clinicalNotes}</span>
              </h4>
              <textarea
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                rows={3}
                className="w-full mt-2 p-3 text-xs bg-[#FAF9F5] border border-amber-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* 4mm Punch Biopsy Protocol */}
            <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-300 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-amber-950 flex items-center space-x-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={biopsyScheduled}
                    onChange={(e) => setBiopsyScheduled(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                  />
                  <span>{t.schedulePunchBiopsy}</span>
                </label>
                <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded">
                  CHC G. Madugula
                </span>
              </div>
              {biopsyScheduled && (
                <input
                  type="text"
                  value={biopsyDetails}
                  onChange={(e) => setBiopsyDetails(e.target.value)}
                  className="w-full text-xs p-2 bg-white rounded-lg border border-amber-300"
                />
              )}
            </div>

            {/* Prescribed Medicines */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  {t.prescribeMedicines}
                </span>
                <button
                  onClick={handleAddMedicine}
                  className="text-[11px] font-bold text-amber-700 hover:text-amber-800 flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Item</span>
                </button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {medicines.map((m, idx) => (
                  <div key={idx} className="bg-[#FAF9F5] p-2.5 rounded-xl border border-slate-200 text-xs flex justify-between items-start">
                    <div>
                      <div className="font-bold text-slate-800">{m.name}</div>
                      <div className="text-[11px] text-slate-500">
                        {m.dosage} • {m.frequency} ({m.duration})
                      </div>
                      <div className="text-[10px] text-amber-800 mt-0.5 font-medium">{m.instructions}</div>
                    </div>
                    <button
                      onClick={() => handleRemoveMedicine(idx)}
                      className="text-slate-400 hover:text-red-500 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Save & Generate Barcode Prescription Button */}
            <button
              onClick={handleSavePrescription}
              disabled={savingPrescription}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white font-bold text-xs shadow-gold-glow hover:brightness-105 active:scale-95 transition-all flex items-center justify-center space-x-2"
            >
              <QrCode className="w-4 h-4" />
              <span>{savingPrescription ? 'Saving...' : t.generatePrescription}</span>
            </button>

            {/* Generated Barcode Card */}
            {createdPrescription && (
              <div className="bg-emerald-50 rounded-2xl border border-emerald-300 p-3.5 space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-950 flex items-center space-x-1">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Prescription Saved & Verified</span>
                  </span>
                  <span className="font-mono text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded">
                    {createdPrescription.rxId}
                  </span>
                </div>
                <div className="flex items-center space-x-2 pt-1">
                  <QrCode className="w-6 h-6 text-amber-700" />
                  <span className="font-mono text-xs text-slate-700 font-bold">
                    {createdPrescription.printableBarcodeId}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebRTCTelemedicineRoom;

