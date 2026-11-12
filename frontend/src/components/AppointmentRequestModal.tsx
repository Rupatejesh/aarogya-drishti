import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Hospital,
  Stethoscope,
  X,
  CheckCircle,
  FileCheck2,
  AlertTriangle,
  Video,
  MapPin,
  Sparkles,
  User,
  ShieldAlert
} from 'lucide-react';
import api from '../services/api.ts';
import { Language, translations } from '../i18n/translations.ts';

interface AppointmentRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: any;
  lang: Language;
  onAppointmentBooked: (appt: any) => void;
  latestScreening?: any;
}

export const AppointmentRequestModal: React.FC<AppointmentRequestModalProps> = ({
  isOpen,
  onClose,
  patient,
  lang,
  onAppointmentBooked,
  latestScreening
}) => {
  const t = translations[lang];

  // Appointment Type & Consultation Mode (Online vs Offline)
  const [apptType, setApptType] = useState<'General Oral Consultation' | 'Biopsy Procedure Appointment'>(
    'General Oral Consultation'
  );
  const [consultationMode, setConsultationMode] = useState<'ONLINE' | 'OFFLINE'>('ONLINE');

  const [mandal, setMandal] = useState(patient?.mandal || 'Paderu');
  const [hospitalName, setHospitalName] = useState('Area Hospital Paderu (AH Paderu)');
  const [doctorUidn, setDoctorUidn] = useState('');
  const [appointmentDate, setAppointmentDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });
  const [timeSlot, setTimeSlot] = useState('10:00 AM - 10:30 AM');
  const [doctorRemarks, setDoctorRemarks] = useState('');
  const [loading, setLoading] = useState(false);

  // Live Doctor Availability Slots States
  const [availableSlots, setAvailableSlots] = useState<string[]>([
    '09:30 AM - 10:00 AM',
    '10:00 AM - 10:30 AM',
    '11:30 AM - 12:00 PM',
    '02:30 PM - 03:00 PM',
    '03:30 PM - 04:00 PM'
  ]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [isDoctorCustomSchedule, setIsDoctorCustomSchedule] = useState(false);

  // Live Doctors list loaded from database
  const [doctorsList, setDoctorsList] = useState<any[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);

  // Load all doctors dynamically from backend on modal open
  useEffect(() => {
    if (!isOpen) return;

    const fetchAllDoctors = async () => {
      setLoadingDoctors(true);
      try {
        const res = await api.getAllDoctors();
        if (res.doctors && res.doctors.length > 0) {
          setDoctorsList(res.doctors);

          // Intelligent Doctor Selection based on analyzed mouth disease
          if (latestScreening?.aiLesionType) {
            const lesion = latestScreening.aiLesionType.toLowerCase();
            let matchedDoc = null;

            if (lesion.includes('leukoplakia') || lesion.includes('white')) {
              matchedDoc = res.doctors.find((d: any) =>
                d.designation?.toLowerCase().includes('pathologist') ||
                d.name?.toLowerCase().includes('swapna')
              );
            } else if (lesion.includes('erythro') || lesion.includes('ulcer') || lesion.includes('carcinoma')) {
              matchedDoc = res.doctors.find((d: any) =>
                d.designation?.toLowerCase().includes('surgeon') ||
                d.designation?.toLowerCase().includes('ent') ||
                d.name?.toLowerCase().includes('rajesh')
              );
            } else if (lesion.includes('fibrosis') || lesion.includes('osmf') || lesion.includes('lichen')) {
              matchedDoc = res.doctors.find((d: any) =>
                d.designation?.toLowerCase().includes('oral medicine') ||
                d.name?.toLowerCase().includes('anand')
              );
            }

            if (matchedDoc) {
              setDoctorUidn(matchedDoc.uidn || matchedDoc.doctorId);
              if (matchedDoc.hospitalDuty) {
                setHospitalName(matchedDoc.hospitalDuty.split('(')[0].trim());
              }
            } else {
              setDoctorUidn(res.doctors[0].uidn || res.doctors[0].doctorId);
            }
          } else {
            setDoctorUidn(res.doctors[0].uidn || res.doctors[0].doctorId);
          }
        }
      } catch (err) {
        console.warn('Could not fetch dynamic doctors list:', err);
      } finally {
        setLoadingDoctors(false);
      }
    };

    fetchAllDoctors();
  }, [isOpen, latestScreening]);

  // Fetch selected doctor's live availability slots for the chosen date
  useEffect(() => {
    if (!isOpen || !doctorUidn || !appointmentDate) return;

    const fetchDoctorSlots = async () => {
      setLoadingSlots(true);
      try {
        const res = await api.getDoctorAvailability(doctorUidn, appointmentDate);
        if (res && res.freeSlots && res.freeSlots.length > 0) {
          setAvailableSlots(res.freeSlots);
          setIsDoctorCustomSchedule(!!res.isCustomSchedule);
          if (!res.freeSlots.includes(timeSlot)) {
            setTimeSlot(res.freeSlots[0]);
          }
        } else if (res && res.slots && res.slots.length > 0) {
          const frees = res.slots.filter((s: any) => !s.isBooked).map((s: any) => s.timeSlot);
          setAvailableSlots(frees);
          setIsDoctorCustomSchedule(!!res.isCustomSchedule);
          if (frees.length > 0 && !frees.includes(timeSlot)) {
            setTimeSlot(frees[0]);
          }
        } else {
          setAvailableSlots([]);
        }
      } catch (err) {
        console.warn('Could not fetch doctor availability slots:', err);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchDoctorSlots();
  }, [isOpen, doctorUidn, appointmentDate]);

  // Pre-fill remarks and category based on mouth disease screening
  useEffect(() => {
    if (latestScreening?.aiLesionType) {
      const lesion = latestScreening.aiLesionType;
      const remarks = `Consultation for ${lesion} detected on ${latestScreening.oralRegion || 'oral mucosa'}. AI Triage: ${latestScreening.aiCondition || 'Clinical evaluation'}. ${latestScreening.clinicalRemarks || ''}`.trim();
      setDoctorRemarks(remarks);

      if (
        latestScreening.clinicalRemarks?.toLowerCase().includes('biopsy') ||
        latestScreening.aiCondition === 'Serious' ||
        latestScreening.aiCondition === 'Urgent Clinical Evaluation'
      ) {
        setApptType('Biopsy Procedure Appointment');
      } else {
        setApptType('General Oral Consultation');
      }
    }
  }, [latestScreening]);

  const getDayOfWeek = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'Friday';
      return d.toLocaleDateString('en-US', { weekday: 'long' });
    } catch {
      return 'Saturday';
    }
  };

  if (!isOpen) return null;

  const selectedDoctorObj = doctorsList.find(
    (d) => d.uidn === doctorUidn || d.doctorId === doctorUidn
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        patientUidn: patient?.uidn || 'UIDN-ASR-2026-GM046',
        doctorUidn: doctorUidn || 'DOC-SWAPNA',
        doctorName: selectedDoctorObj?.name || 'Medical Officer',
        mandal,
        hospitalName,
        apptType,
        consultationMode,
        diseaseDiagnosed: latestScreening?.aiLesionType || 'Suspected Oral Mucosal Condition',
        appointmentDate: new Date(appointmentDate).toISOString(),
        appointmentDay: getDayOfWeek(appointmentDate),
        timeSlot,
        doctorRemarks
      };

      const res = await api.requestAppointment(payload);
      onAppointmentBooked(res.appointment);
      alert(
        `Appointment successfully queued! Mode: ${consultationMode === 'ONLINE' ? 'Online Tele-Consultation' : 'Offline In-Person Visit'} with ${selectedDoctorObj?.name || 'Specialist'}.`
      );
      onClose();
    } catch (err: any) {
      alert(`Error booking appointment: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white max-w-xl w-full rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-6">
        {/* Header (Royal Blue) */}
        <div className="bg-royal-700 text-white p-5 flex items-center justify-between border-b border-royal-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-wide">
                BOOK DOCTOR APPOINTMENT
              </h3>
              <p className="text-[11px] text-blue-100">
                Patient: {patient?.name} ({patient?.uidn})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* AI Screening Disease Banner (if available) */}
        {latestScreening?.aiLesionType && (
          <div className="bg-blue-50 border-b border-blue-200 p-4 flex items-start space-x-3">
            <ShieldAlert className="w-5 h-5 text-royal-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold text-royal-950 uppercase tracking-wide">
                AI Oral Screening Finding:
              </span>
              <div className="text-slate-800 font-extrabold text-sm mt-0.5">
                {latestScreening.aiLesionType}
              </div>
              <p className="text-slate-600 text-[11px] mt-0.5">
                Target: {latestScreening.oralRegion} • Confidence: {latestScreening.aiConfidenceScore}% • Doctor recommended accordingly.
              </p>
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* 1. CONSULTATION MODE: ONLINE vs OFFLINE */}
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-2">
              Select Consultation Mode (Online or Offline)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`p-3.5 rounded-2xl border cursor-pointer flex flex-col items-center text-center transition-all ${
                  consultationMode === 'ONLINE'
                    ? 'bg-blue-50 border-royal-600 ring-2 ring-royal-400 text-royal-950 font-bold shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="consultationMode"
                  value="ONLINE"
                  checked={consultationMode === 'ONLINE'}
                  onChange={() => setConsultationMode('ONLINE')}
                  className="hidden"
                />
                <Video className="w-5 h-5 text-royal-600 mb-1" />
                <span className="text-xs">Online Tele-Consultation</span>
                <span className="text-[10px] text-slate-500 mt-0.5 font-normal">
                  Live WebRTC Video Call with Specialist
                </span>
              </label>

              <label
                className={`p-3.5 rounded-2xl border cursor-pointer flex flex-col items-center text-center transition-all ${
                  consultationMode === 'OFFLINE'
                    ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-400 text-emerald-950 font-bold shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="consultationMode"
                  value="OFFLINE"
                  checked={consultationMode === 'OFFLINE'}
                  onChange={() => setConsultationMode('OFFLINE')}
                  className="hidden"
                />
                <MapPin className="w-5 h-5 text-emerald-600 mb-1" />
                <span className="text-xs">Offline In-Person Visit</span>
                <span className="text-[10px] text-emerald-800 mt-0.5 font-normal">
                  Physical OPD Visit at PHC / CHC Clinic
                </span>
              </label>
            </div>
          </div>

          {/* 2. APPOINTMENT CATEGORY */}
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-2">
              Appointment Category
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`p-3 rounded-2xl border cursor-pointer flex flex-col items-center text-center transition-all ${
                  apptType === 'General Oral Consultation'
                    ? 'bg-blue-50 border-royal-600 ring-2 ring-royal-400 text-royal-950 font-bold'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="apptType"
                  value="General Oral Consultation"
                  checked={apptType === 'General Oral Consultation'}
                  onChange={() => setApptType('General Oral Consultation')}
                  className="hidden"
                />
                <Stethoscope className="w-4 h-4 text-royal-600 mb-1" />
                <span className="text-xs">General Oral Consultation</span>
                <span className="text-[10px] text-slate-500 mt-0.5 font-normal">
                  Clinical Examination & Medical Rx
                </span>
              </label>

              <label
                className={`p-3 rounded-2xl border cursor-pointer flex flex-col items-center text-center transition-all ${
                  apptType === 'Biopsy Procedure Appointment'
                    ? 'bg-red-50 border-red-500 ring-2 ring-red-400 text-red-950 font-bold'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="apptType"
                  value="Biopsy Procedure Appointment"
                  checked={apptType === 'Biopsy Procedure Appointment'}
                  onChange={() => setApptType('Biopsy Procedure Appointment')}
                  className="hidden"
                />
                <FileCheck2 className="w-4 h-4 text-red-600 mb-1" />
                <span className="text-xs">Biopsy Procedure</span>
                <span className="text-[10px] text-red-600 font-semibold mt-0.5">
                  Diagnostic 4mm Punch Biopsy
                </span>
              </label>
            </div>
          </div>

          {/* 3. ATTENDING SPECIALIST DOCTOR SELECTOR (DYNAMIC FROM DB) */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-slate-700">
                Attending Specialist Doctor *
              </label>
              {loadingDoctors && (
                <span className="text-[10px] text-royal-600 font-semibold animate-pulse">
                  Loading verified doctors...
                </span>
              )}
            </div>

            <select
              value={doctorUidn}
              onChange={(e) => {
                setDoctorUidn(e.target.value);
                const found = doctorsList.find((d) => (d.uidn || d.doctorId) === e.target.value);
                if (found?.hospitalDuty) {
                  setHospitalName(found.hospitalDuty.split('(')[0].trim());
                }
              }}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-royal-500 focus:outline-none"
              required
            >
              {doctorsList.length > 0 ? (
                doctorsList.map((doc) => (
                  <option key={doc.uidn || doc.doctorId} value={doc.uidn || doc.doctorId}>
                    {doc.name} — {doc.designation || 'Medical Officer'} ({doc.hospitalDuty || 'Area Hospital'})
                  </option>
                ))
              ) : (
                <>
                  <option value="DOC-SWAPNA">
                    Dr. Swapna Devi, MDS — Chief Onco-Pathologist (PHC G. Madugula / GGH Paderu)
                  </option>
                  <option value="DOC-RAJESH">
                    Dr. K. Rajesh, MS ENT — Head & Neck Onco-Surgeon (AH Paderu Hub)
                  </option>
                  <option value="DOC-ANAND">
                    Dr. Anand Kumar, MDS — Oral Medicine Specialist (CHC G. Madugula)
                  </option>
                </>
              )}
            </select>
            {selectedDoctorObj && (
              <p className="text-[11px] text-royal-700 font-medium mt-1">
                ABDM Code: <span className="font-mono">{selectedDoctorObj.abdmCode || 'ABDM-VERIFIED'}</span> • Facility: {selectedDoctorObj.hospitalDuty}
              </p>
            )}
          </div>

          {/* 4. MANDAL & FACILITY */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Mandal</label>
              <select
                value={mandal}
                onChange={(e) => setMandal(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-900"
              >
                {[
                  'Paderu',
                  'G. Madugula',
                  'Araku Valley',
                  'Chintapalle',
                  'Ananthagiri',
                  'Dumbriguda',
                  'Hukumpeta',
                  'G.K. Veedhi',
                  'Koyyuru',
                  'Munchingi Puttu',
                  'Pedabayalu'
                ].map((m) => (
                  <option key={m} value={m}>
                    {m} Mandal
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Health Facility</label>
              <input
                type="text"
                value={hospitalName}
                onChange={(e) => setHospitalName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-medium"
                required
              />
            </div>
          </div>

          {/* 5. DATE & TIME SLOT */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Appointment Date ({getDayOfWeek(appointmentDate)})
              </label>
              <input
                type="date"
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-900"
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-700 block">Available Time Slot *</label>
                {loadingSlots ? (
                  <span className="text-[10px] text-royal-600 font-semibold animate-pulse">Loading slots...</span>
                ) : isDoctorCustomSchedule ? (
                  <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                    🟢 Doctor Free ({availableSlots.length})
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full font-medium">
                    Standard OPD ({availableSlots.length})
                  </span>
                )}
              </div>

              {availableSlots.length > 0 ? (
                <select
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-royal-500"
                  required
                >
                  {availableSlots.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot} {isDoctorCustomSchedule ? '• Declared Free Slot' : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-2 bg-red-50 border border-red-200 rounded-xl text-[11px] text-red-700 font-bold flex items-center space-x-1">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>No free slots on this date. Please pick another date or doctor.</span>
                </div>
              )}
            </div>
          </div>

          {/* 6. PATIENT SYMPTOMS / DISEASE REMARKS */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Patient Symptoms & Consultation Purpose
            </label>
            <textarea
              value={doctorRemarks}
              onChange={(e) => setDoctorRemarks(e.target.value)}
              rows={2}
              placeholder="e.g. Consultation for persistent patch, burning sensation, biopsy evaluation..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-royal-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-royal-600 hover:bg-royal-700 text-white font-extrabold text-xs shadow-blue-card active:scale-95 transition-all flex items-center justify-center space-x-2"
          >
            {loading ? (
              <span>Submitting Appointment...</span>
            ) : (
              <>
                <Calendar className="w-4 h-4" />
                <span>
                  Confirm {consultationMode === 'ONLINE' ? 'Online Video' : 'Offline In-Person'} Appointment
                </span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AppointmentRequestModal;
