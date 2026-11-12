import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  KeyRound,
  CheckCircle,
  XCircle,
  Video,
  FileText,
  Search,
  Lock,
  RefreshCw,
  FolderLock,
  UserCheck,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  QrCode,
  Plus,
  Clock,
  Check,
  Trash2,
  Sparkles,
  Eye,
  EyeOff
} from 'lucide-react';
import api from '../services/api.ts';
import { Language, translations } from '../i18n/translations.ts';

interface DoctorPortalProps {
  lang: Language;
  onLaunchTelemedicine: (patient: any, doctor: any) => void;
  onViewPrescription: (prescription: any, patient: any) => void;
  initialDoctor?: any;
}

export const DoctorPortal: React.FC<DoctorPortalProps> = ({
  lang,
  onLaunchTelemedicine,
  onViewPrescription,
  initialDoctor
}) => {
  const t = translations[lang];

  const getInitialDoctor = () => {
    if (initialDoctor) return initialDoctor;
    try {
      const stored = localStorage.getItem('aarogya_doctor');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return {
      uidn: 'DOC-ANIL',
      name: 'Dr. Anil Kumar, MBBS, MS',
      designation: 'Oral Onco-Surgeon & Specialist Tele-Consultant',
      hospitalDuty: 'Area Hospital Chintapalli / GGH Paderu Tele-Lab Hub',
      abdmCode: 'ABDM-DOC-AP-9901',
      email: 'dr.anil@aarogyadrishti.org'
    };
  };

  // Auth States
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [activeDoctor, setActiveDoctor] = useState<any>(getInitialDoctor());
  const [doctorIdInput, setDoctorIdInput] = useState(initialDoctor?.uidn || 'DOC-ANIL');
  const [doctorPassword, setDoctorPassword] = useState('Aarogya@2026');

  useEffect(() => {
    if (initialDoctor) {
      setActiveDoctor(initialDoctor);
      setIsAuthenticated(true);
    }
  }, [initialDoctor]);

  // Status toggle
  const [isOnline, setIsOnline] = useState(true);

  // New Prescription / Biopsy Modal state
  const [isCreateRxModalOpen, setIsCreateRxModalOpen] = useState(false);
  const [newRxPatientUidn, setNewRxPatientUidn] = useState('UIDN-ASR-2026-GM046');
  const [newRxType, setNewRxType] = useState<'tablet' | 'biopsy'>('biopsy');
  const [newRxMedicines, setNewRxMedicines] = useState('Lycopene 8mg, Kenacort 0.1% Dental Paste, Chlorhexidine 0.2% Rinse');
  const [newRxInstructions, setNewRxInstructions] = useState('Apply paste topically twice daily after meals. Avoid tobacco/smoking completely.');
  const [newRxBiopsyDetails, setNewRxBiopsyDetails] = useState('Diagnostic 4mm punch biopsy of right buccal mucosa under local anesthesia at PHC G. Madugula.');
  const [submittingRx, setSubmittingRx] = useState(false);

  // Forgot password modal
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotSecurityCode, setForgotSecurityCode] = useState('ASR-DOC-2026');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Doctor Data States
  const [incomingQueue, setIncomingQueue] = useState<any[]>([]);
  const [patientsUnderCare, setPatientsUnderCare] = useState<any[]>([]);
  const [biopsyVault, setBiopsyVault] = useState<any[]>([]);
  const [searchUidn, setSearchUidn] = useState('');
  const [loading, setLoading] = useState(false);

  // Doctor Availability Slots State
  const PRESET_TIME_SLOTS = [
    '09:00 AM - 09:30 AM',
    '09:30 AM - 10:00 AM',
    '10:00 AM - 10:30 AM',
    '10:30 AM - 11:00 AM',
    '11:00 AM - 11:30 AM',
    '11:30 AM - 12:00 PM',
    '12:00 PM - 12:30 PM',
    '02:00 PM - 02:30 PM',
    '02:30 PM - 03:00 PM',
    '03:00 PM - 03:30 PM',
    '03:30 PM - 04:00 PM',
    '04:00 PM - 04:30 PM',
    '04:30 PM - 05:00 PM',
    '05:00 PM - 05:30 PM'
  ];

  const [slotDate, setSlotDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [selectedSlots, setSelectedSlots] = useState<string[]>([
    '09:30 AM - 10:00 AM',
    '10:00 AM - 10:30 AM',
    '11:00 AM - 11:30 AM',
    '02:00 PM - 02:30 PM',
    '03:30 PM - 04:00 PM'
  ]);
  const [customSlotInput, setCustomSlotInput] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [savingSlots, setSavingSlots] = useState(false);
  const [slotSaveSuccess, setSlotSaveSuccess] = useState(false);
  const [bookedSlotsForDay, setBookedSlotsForDay] = useState<any[]>([]);

  const loadDoctorAvailability = async (targetDate: string) => {
    const docCode = activeDoctor?.uidn || activeDoctor?.doctorId;
    if (!docCode) return;
    setLoadingSlots(true);
    try {
      const res = await api.getDoctorAvailability(docCode, targetDate);
      if (res && res.slots && res.slots.length > 0) {
        const availableOnes = res.slots.filter((s: any) => !s.isBooked).map((s: any) => s.timeSlot);
        const bookedOnes = res.slots.filter((s: any) => s.isBooked);
        setSelectedSlots(availableOnes);
        setBookedSlotsForDay(bookedOnes);
      } else if (res && res.freeSlots && res.freeSlots.length > 0) {
        setSelectedSlots(res.freeSlots);
        setBookedSlotsForDay([]);
      }
    } catch (e) {
      console.warn('Availability load notice:', e);
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    loadDoctorAvailability(slotDate);
  }, [slotDate, activeDoctor]);

  const handleSaveSlots = async () => {
    const docCode = activeDoctor?.uidn || activeDoctor?.doctorId;
    if (!docCode) return;
    setSavingSlots(true);
    try {
      await api.updateDoctorAvailability(docCode, slotDate, selectedSlots);
      setSlotSaveSuccess(true);
      setTimeout(() => setSlotSaveSuccess(false), 3000);
      loadDoctorAvailability(slotDate);
    } catch (err: any) {
      alert(`Error saving availability: ${err.message}`);
    } finally {
      setSavingSlots(false);
    }
  };

  const toggleSlot = (slot: string) => {
    if (selectedSlots.includes(slot)) {
      setSelectedSlots(selectedSlots.filter((s) => s !== slot));
    } else {
      setSelectedSlots([...selectedSlots, slot]);
    }
  };

  const handleAddCustomSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSlotInput.trim()) return;
    const formatted = customSlotInput.trim();
    if (!selectedSlots.includes(formatted)) {
      setSelectedSlots([...selectedSlots, formatted]);
    }
    setCustomSlotInput('');
  };

  useEffect(() => {
    loadDoctorData();
  }, [activeDoctor]);

  const loadDoctorData = async () => {
    try {
      const docCode = activeDoctor?.uidn || activeDoctor?.doctorId;

      // 1. Fetch appointments assigned strictly to THIS doctor
      const apptsRes = await api.getAllAppointments(docCode);
      let myAppts: any[] = [];
      if (apptsRes.appointments) {
        myAppts = apptsRes.appointments.filter((a: any) => {
          if (!docCode) return false;
          return (
            a.doctorUidn === docCode ||
            a.doctorId === docCode ||
            (docCode === 'DOC-SWAPNA' && (!a.doctorUidn || a.doctorUidn === 'DOC-ASR-2026-001'))
          );
        });
        setIncomingQueue(myAppts);
      }

      // 2. Strict Role Boundary: Patients Under Care MUST ONLY be patients with appointments for THIS doctor
      const patientsRes = await api.getQuickLoginRoster();
      const rosterList = patientsRes.roster || [];
      const assignedPatients = myAppts.map((a: any) => {
        const found = rosterList.find((p: any) => p.uidn === a.patientUidn);
        if (found) return found;
        return {
          uidn: a.patientUidn,
          name: a.patientName || `Patient ${a.patientUidn}`,
          age: a.patientAge || 22,
          mandal: a.mandal || 'Chintapalli',
          village: a.village || a.hospitalName || 'Agency Unit',
          condition: a.diseaseDiagnosed || a.apptType || 'Oral Lesion Tele-Consultation'
        };
      });
      // Deduplicate by UIDN
      const uniquePatients = Array.from(new Map(assignedPatients.map((p: any) => [p.uidn, p])).values());
      setPatientsUnderCare(uniquePatients);
      const myPatientUidns = new Set(uniquePatients.map((p: any) => p.uidn));

      // 3. Strict Vault Boundary: Only prescriptions issued by or assigned to THIS doctor
      const rxRes = await api.getAllPrescriptions(docCode);
      if (rxRes.prescriptions) {
        const myRx = rxRes.prescriptions.filter((rx: any) => {
          if (!docCode) return false;
          return (
            rx.doctorUidn === docCode ||
            rx.doctorId === docCode ||
            myPatientUidns.has(rx.patientUidn) ||
            (docCode === 'DOC-SWAPNA' && (!rx.doctorUidn || rx.doctorUidn === 'DOC-ASR-2026-001'))
          );
        });
        setBiopsyVault(myRx);
      }
    } catch (err) {
      console.warn('Doctor portal data load notice:', err);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.doctorResetPassword(doctorIdInput, forgotSecurityCode, forgotNewPassword);
      setResetSuccess(true);
      setTimeout(() => {
        setIsForgotModalOpen(false);
        setResetSuccess(false);
      }, 1500);
    } catch (err: any) {
      alert(`Reset error: ${err.message}`);
    }
  };

  const handleUpdateStatus = async (appointmentId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const remarks =
        status === 'APPROVED'
          ? `Approved by ${activeDoctor?.name || 'Medical Officer'} for consultation at ${activeDoctor?.hospitalDuty || 'Hospital'}.`
          : 'Rejected due to slot availability.';
      await api.updateAppointmentStatus(appointmentId, status, remarks);
      setIncomingQueue((prev) =>
        prev.map((a) => (a.appointmentId === appointmentId ? { ...a, status, doctorRemarks: remarks } : a))
      );
    } catch (err: any) {
      alert(`Status update error: ${err.message}`);
    }
  };

  const handleCreatePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingRx(true);
    try {
      const rxPayload = {
        patientUidn: newRxPatientUidn,
        doctorUidn: activeDoctor.uidn || 'DOC-ONLINE',
        doctorName: activeDoctor.name || 'Medical Officer',
        facilityName: activeDoctor.hospitalDuty || 'PHC G. Madugula',
        medicines: newRxMedicines.split(',').map((m) => ({ name: m.trim(), dosage: '1 unit', duration: '14 days' })),
        instructions: newRxInstructions,
        biopsyRecommended: newRxType === 'biopsy',
        biopsyProcedureDetails: newRxType === 'biopsy' ? newRxBiopsyDetails : 'No biopsy required.',
        trackingStatus: newRxType === 'biopsy' ? 'Biopsy Scheduled' : 'Medical Rx Dispensed'
      };

      const res = await api.createPrescription(rxPayload);
      if (res.prescription) {
        setBiopsyVault((prev) => [res.prescription, ...prev]);
        alert(`Prescription ${res.prescription.rxId} saved successfully for ${newRxPatientUidn}!`);
        setIsCreateRxModalOpen(false);
      }
    } catch (err: any) {
      alert(`Error saving prescription: ${err.message}`);
    } finally {
      setSubmittingRx(false);
    }
  };

  // Filtered patients by UIDN search
  const filteredPatients = patientsUnderCare.filter(
    (p) =>
      p.uidn?.toLowerCase().includes(searchUidn.toLowerCase()) ||
      p.name?.toLowerCase().includes(searchUidn.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Doctor Header Banner (Royal Blue) */}
      <div className="bg-gradient-to-r from-blue-800 to-blue-700 text-white rounded-3xl p-6 sm:p-8 border border-blue-900 shadow-xl flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-white font-black text-2xl shadow-md">
            <Stethoscope className="w-8 h-8 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-2xl font-extrabold text-white">{activeDoctor.name}</h2>
              <span className="text-xs font-bold bg-white/20 text-white px-3 py-0.5 rounded-full border border-white/30">
                {activeDoctor.uidn}
              </span>
            </div>
            <p className="text-xs text-blue-100 mt-1 font-medium">
              {activeDoctor.designation} • {activeDoctor.hospitalDuty}
            </p>
            <div className="text-[11px] text-blue-200 font-mono mt-0.5 font-semibold">
              ABDM Provider: {activeDoctor.abdmCode}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Active / Inactive Telemedicine Status Toggle */}
          <button
            onClick={() => setIsOnline(!isOnline)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 border shadow-sm ${
              isOnline
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-400'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-white animate-pulse' : 'bg-slate-500'}`} />
            <span>{isOnline ? 'Active for Tele-Consultation (Online)' : 'Status: Inactive (Offline)'}</span>
          </button>

          <button
            onClick={() => setIsForgotModalOpen(true)}
            className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-blue-100 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Reset Password</span>
          </button>

          <button
            onClick={loadDoctorData}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-sm cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Queue</span>
          </button>
        </div>
      </div>

      {/* 1. UIDN PATIENT SEARCH ENGINE */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center space-x-3">
        <Search className="w-5 h-5 text-royal-600" />
        <input
          type="text"
          value={searchUidn}
          onChange={(e) => setSearchUidn(e.target.value)}
          placeholder="Lookup Patient Case History by Patient UIDN (e.g. UIDN-ASR-2026-GM046, Somanna)..."
          className="flex-1 bg-transparent text-xs font-semibold text-slate-900 focus:outline-none placeholder-slate-400"
        />
        {searchUidn && (
          <button onClick={() => setSearchUidn('')} className="text-xs text-slate-400 hover:text-slate-600 font-bold">
            Clear
          </button>
        )}
      </div>

      {/* 2. DOCTOR FREE AVAILABILITY SLOTS MANAGER */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-luxury space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center space-x-2">
              <Clock className="w-5 h-5 text-royal-600" />
              <span>Manage Free Tele-Consultation Availability Slots</span>
            </h3>
            <p className="text-xs text-slate-500">
              Declare your free consulting hours for each day. Patients booking appointments will strictly choose from your declared free slots.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-xs font-bold text-slate-700 flex items-center space-x-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <Calendar className="w-3.5 h-3.5 text-royal-600" />
              <span>Select Date:</span>
              <input
                type="date"
                value={slotDate}
                onChange={(e) => setSlotDate(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-2 py-0.5 text-xs font-mono font-bold text-slate-900 focus:outline-none"
              />
            </label>
          </div>
        </div>

        {/* Selected Date Summary & Booked Slots */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-3 flex-wrap gap-y-1">
            <span className="font-bold text-slate-900">
              Availability for {new Date(slotDate).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}:
            </span>
            <span className="bg-emerald-100 text-emerald-800 font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-300 flex items-center space-x-1">
              <CheckCircle className="w-3 h-3 text-emerald-700" />
              <span>{selectedSlots.length} Free Slots Active</span>
            </span>
            {bookedSlotsForDay.length > 0 && (
              <span className="bg-red-100 text-red-800 font-extrabold px-2.5 py-0.5 rounded-full border border-red-300 flex items-center space-x-1">
                <AlertTriangle className="w-3 h-3 text-red-700" />
                <span>{bookedSlotsForDay.length} Patient Bookings Reserved</span>
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setSelectedSlots([
                  '09:30 AM - 10:00 AM',
                  '10:00 AM - 10:30 AM',
                  '10:30 AM - 11:00 AM',
                  '11:30 AM - 12:00 PM',
                  '02:00 PM - 02:30 PM',
                  '03:00 PM - 03:30 PM',
                  '04:00 PM - 04:30 PM'
                ]);
              }}
              className="text-[11px] text-slate-600 hover:text-royal-700 font-bold underline cursor-pointer"
            >
              Reset to Standard OPD Hours
            </button>
          </div>
        </div>

        {/* Preset Slot Chips Grid */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 block">
            Click to Toggle Free Slots for {new Date(slotDate).toLocaleDateString('en-US', { weekday: 'long' })}:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
            {PRESET_TIME_SLOTS.map((slot) => {
              const isSelected = selectedSlots.includes(slot);
              const isBooked = bookedSlotsForDay.some((b) => b.timeSlot === slot);
              return (
                <button
                  key={slot}
                  type="button"
                  onClick={() => toggleSlot(slot)}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center transition-all cursor-pointer ${
                    isBooked
                      ? 'bg-red-50 border-red-300 text-red-700 cursor-not-allowed'
                      : isSelected
                      ? 'bg-emerald-600 border-emerald-700 text-white shadow-sm ring-2 ring-emerald-300 scale-[1.02]'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-1">
                    {isSelected && !isBooked && <Check className="w-3.5 h-3.5 text-white" />}
                    <span>{slot.split(' - ')[0]}</span>
                  </div>
                  <span className={`text-[10px] mt-0.5 ${isSelected && !isBooked ? 'text-emerald-100 font-normal' : isBooked ? 'text-red-600 font-bold' : 'text-slate-500 font-normal'}`}>
                    {isBooked ? 'Booked' : isSelected ? 'Free' : 'Unavailable'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Slot Addition */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <form onSubmit={handleAddCustomSlot} className="flex items-center space-x-2">
            <input
              type="text"
              value={customSlotInput}
              onChange={(e) => setCustomSlotInput(e.target.value)}
              placeholder="Custom slot e.g. 05:30 PM - 06:00 PM"
              className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-royal-500 w-64"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-royal-600 hover:bg-royal-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Custom Slot</span>
            </button>
          </form>

          <button
            onClick={handleSaveSlots}
            disabled={savingSlots}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center space-x-2 cursor-pointer"
          >
            {savingSlots ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : slotSaveSuccess ? (
              <CheckCircle className="w-4 h-4 text-emerald-200" />
            ) : (
              <Clock className="w-4 h-4" />
            )}
            <span>{savingSlots ? 'Saving...' : slotSaveSuccess ? 'Availability Saved!' : `Save Free Slots for ${slotDate}`}</span>
          </button>
        </div>
      </div>

      {/* 3. INCOMING CONSULTATION & BIOPSY QUEUE (APPOINTMENT NOTIFICATIONS) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-luxury space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-royal-600 animate-pulse" />
              <span>Incoming Appointment Notifications & Review Queue</span>
            </h3>
            <p className="text-xs text-slate-500">View patient appointment requests for nearby PHCs and approve/reject live</p>
          </div>
          <span className="text-xs font-bold bg-blue-50 text-royal-900 px-3 py-1 rounded-full border border-blue-200">
            {incomingQueue.length} Requests Active
          </span>
        </div>

        {incomingQueue.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-300 rounded-2xl space-y-2">
            <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800">No Pending Requests Allocated</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              There are currently no patient appointment requests waiting for {activeDoctor.name || activeDoctor.uidn}.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {incomingQueue.map((appt) => (
              <div
                key={appt.appointmentId}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-4 hover:border-royal-300 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-[10px] font-bold bg-slate-200 text-slate-800 px-2 py-0.5 rounded">
                      {appt.appointmentId}
                    </span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                      appt.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                      appt.status === 'REJECTED' ? 'bg-red-100 text-red-800 border border-red-300' :
                      'bg-amber-100 text-slate-900 border border-amber-300'
                    }`}>
                      {appt.status}
                    </span>
                    <span className="text-xs font-bold text-slate-900">{appt.apptType}</span>
                  </div>

                  <div className="text-xs text-slate-700">
                    Patient UIDN: <strong className="font-mono text-royal-700">{appt.patientUidn}</strong> • Mandal: <strong>{appt.mandal}</strong> • Facility: <strong>{appt.hospitalName}</strong>
                  </div>

                  <div className="text-[11px] text-slate-500">
                    Time Slot: <strong>{appt.timeSlot}</strong> • Remarks: {appt.doctorRemarks || 'None'}
                  </div>
                </div>

                {/* Action Buttons for Doctor */}
                <div className="flex items-center space-x-2">
                  {appt.status === 'APPROVED' && appt.consultationMode !== 'OFFLINE' && (
                    <button
                      onClick={() => {
                        const pat = patientsUnderCare.find((p) => p.uidn === appt.patientUidn) || {
                          uidn: appt.patientUidn,
                          name: appt.patientName || appt.patientUidn,
                          mandal: appt.mandal || 'Chintapalli',
                          village: appt.hospitalName || 'Agency Unit'
                        };
                        onLaunchTelemedicine(pat, activeDoctor);
                      }}
                      className="px-3.5 py-2 bg-royal-700 hover:bg-royal-800 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-sm active:scale-95 cursor-pointer"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Launch Video Call</span>
                    </button>
                  )}

                  {appt.status !== 'APPROVED' && (
                    <button
                      onClick={() => handleUpdateStatus(appt.appointmentId, 'APPROVED')}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-sm cursor-pointer"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Approve Slot</span>
                    </button>
                  )}

                  {appt.status !== 'REJECTED' && (
                    <button
                      onClick={() => handleUpdateStatus(appt.appointmentId, 'REJECTED')}
                      className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1 shadow-sm cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. MY PATIENT LIST UNDER CARE & 1-CLICK WEBRTC VIDEO CALL */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-luxury space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center space-x-2">
              <UserCheck className="w-5 h-5 text-royal-600" />
              <span>My Patient List & Video Call</span>
            </h3>
            <p className="text-xs text-slate-500">Patients under this doctor's care with 1-click WebRTC Tele-Consultation</p>
          </div>
        </div>

        {filteredPatients.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-300 rounded-2xl space-y-2">
            <UserCheck className="w-8 h-8 text-slate-400 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800">No Patients Under Current Care</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Only patients with appointments allocated or scheduled with Dr. {activeDoctor.name || activeDoctor.uidn} appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filteredPatients.map((pat) => (
              <div key={pat.uidn} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 flex flex-col justify-between hover:border-royal-400 transition-all">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-mono font-bold bg-blue-100 text-royal-800 px-2 py-0.5 rounded border border-blue-200">
                      {pat.uidn}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">{pat.mandal}</span>
                  </div>
                  <h4 className="text-base font-bold text-slate-900 mt-2">{pat.name}</h4>
                  <p className="text-xs text-slate-600">{pat.age} Yrs • {pat.village}</p>
                  <div className="text-[11px] text-royal-700 font-semibold mt-1">{pat.condition}</div>
                </div>

                <div className="pt-2 border-t border-slate-200 flex gap-2">
                  <button
                    onClick={() => onLaunchTelemedicine(pat, activeDoctor)}
                    className="flex-1 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                  >
                    <Video className="w-3.5 h-3.5 text-white" />
                    <span>Launch WebRTC Call</span>
                  </button>

                  <button
                    onClick={() => onViewPrescription(null, pat)}
                    className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl flex items-center justify-center space-x-1 transition-all"
                    title="View Medical Reports & Rx"
                  >
                    <FileText className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. BIOPSY & PATHOLOGY REPORTS VAULT */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-luxury space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-royal-700">
              <FolderLock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">
                Biopsy & Pathology Reports Vault
              </h3>
              <p className="text-xs text-slate-500">Securely stored and organized under Patient UIDN</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold bg-blue-50 text-royal-800 px-3 py-1 rounded-full border border-blue-200">
              {biopsyVault.length} Indexed Cases
            </span>
            <button
              onClick={() => setIsCreateRxModalOpen(true)}
              className="px-3.5 py-1.5 bg-royal-600 hover:bg-royal-700 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1 shadow-sm active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Issue Prescription / Biopsy</span>
            </button>
          </div>
        </div>

        {biopsyVault.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-300 rounded-2xl space-y-2">
            <FolderLock className="w-8 h-8 text-slate-400 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800">No Prescriptions or Biopsy Orders</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Prescriptions and biopsy orders issued by Dr. {activeDoctor.name || activeDoctor.uidn} will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 border border-slate-200 rounded-2xl overflow-hidden">
            {biopsyVault.map((rx) => (
              <div key={rx.rxId} className="p-4 bg-slate-50/50 hover:bg-white flex flex-wrap items-center justify-between gap-4 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-slate-900">{rx.rxId}</span>
                    <span className="font-mono text-xs text-royal-800 bg-blue-100 px-2 py-0.5 rounded font-bold border border-blue-200">
                      UIDN: {rx.patientUidn}
                    </span>
                    <span className="bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2 py-0.5 rounded border border-emerald-200">
                      {rx.trackingStatus}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600">
                    {rx.biopsyProcedureDetails || 'Biopsy order recorded with histopathological follow-up'}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono flex items-center space-x-1">
                    <QrCode className="w-3 h-3 text-royal-600" />
                    <span>Barcode: {rx.printableBarcodeId}</span>
                  </div>
                </div>

                <button
                  onClick={() => onViewPrescription(rx, { uidn: rx.patientUidn, name: 'K. Somanna', age: 46, mandal: 'G. Madugula' })}
                  className="px-4 py-2 bg-royal-700 hover:bg-royal-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center space-x-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Open Biopsy Slip</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Forgot Password Modal */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-base text-slate-900">Doctor Password Reset</h4>
              <button onClick={() => setIsForgotModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            {resetSuccess ? (
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-300 text-center space-y-2">
                <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto" />
                <div className="font-bold text-sm text-emerald-950">Password Reset Successful!</div>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Doctor ID</label>
                  <input
                    type="text"
                    value={doctorIdInput}
                    onChange={(e) => setDoctorIdInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Security Verification Code (Demo: ASR-DOC-2026)
                  </label>
                  <input
                    type="text"
                    value={forgotSecurityCode}
                    onChange={(e) => setForgotSecurityCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-mono text-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">New Password</label>
                  <div className="relative">
                    <input
                      type={showResetPassword ? 'text' : 'password'}
                      value={forgotNewPassword}
                      autoComplete="new-password"
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 pr-10 text-xs text-slate-900"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetPassword(!showResetPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                      title={showResetPassword ? 'Hide password' : 'Show password'}
                    >
                      {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-royal-600 hover:bg-royal-700 text-white font-bold text-xs rounded-xl shadow-blue-card transition-all"
                >
                  Verify & Reset Password
                </button>
              </form>
            )}
          </div>
        </div>
      )}
      {/* Create Prescription / Biopsy Order Modal */}
      {isCreateRxModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-3xl p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3 border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-royal-100 text-royal-700 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-base text-slate-900">Issue Prescription / Biopsy Referral</h4>
                  <p className="text-[11px] text-slate-500">Saved to both Doctor Vault and Patient Health Record</p>
                </div>
              </div>
              <button onClick={() => setIsCreateRxModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePrescription} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Target Patient UIDN</label>
                <input
                  type="text"
                  value={newRxPatientUidn}
                  onChange={(e) => setNewRxPatientUidn(e.target.value)}
                  placeholder="e.g. UIDN-ASR-2026-GM046"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-royal-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Prescription Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewRxType('tablet')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      newRxType === 'tablet'
                        ? 'bg-blue-50 text-royal-800 border-royal-400 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    💊 Tablet Course Only
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewRxType('biopsy')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      newRxType === 'biopsy'
                        ? 'bg-red-50 text-red-800 border-red-400 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    🔬 Biopsy Procedure Order
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Medicines / Dosage (Comma Separated)</label>
                <input
                  type="text"
                  value={newRxMedicines}
                  onChange={(e) => setNewRxMedicines(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-royal-500 focus:outline-none"
                  required
                />
              </div>

              {newRxType === 'biopsy' && (
                <div>
                  <label className="text-xs font-bold text-red-700 block mb-1">Biopsy Procedure Protocol & Facility</label>
                  <input
                    type="text"
                    value={newRxBiopsyDetails}
                    onChange={(e) => setNewRxBiopsyDetails(e.target.value)}
                    className="w-full bg-red-50/50 border border-red-200 rounded-xl p-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-red-500 focus:outline-none"
                    required
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Patient Instructions</label>
                <textarea
                  value={newRxInstructions}
                  onChange={(e) => setNewRxInstructions(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-royal-500 focus:outline-none"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateRxModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRx}
                  className="px-5 py-2.5 bg-royal-600 hover:bg-royal-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50"
                >
                  {submittingRx ? 'Saving Record...' : 'Issue & Sign Official Rx'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorPortal;
