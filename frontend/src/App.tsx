import React, { useState, useEffect } from 'react';
import {
  Search,
  Activity,
  Hospital,
  Calendar,
  FileText,
  ShieldCheck,
  UserCheck,
  Phone,
  Sparkles,
  ChevronRight,
  Stethoscope,
  MapPin,
  CheckCircle,
  AlertTriangle,
  QrCode,
  Radio,
  Camera,
  Video,
  UserPlus,
  Dna,
  HeartHandshake,
  Layers,
  ArrowRight,
  ShieldAlert,
  Download,
  Printer,
  Clock,
  CheckCircle2,
  FileCheck2,
  Award,
  HeartPulse,
  Share2,
  MessageSquare
} from 'lucide-react';
import confetti from 'canvas-confetti';
import api from './services/api.ts';
import { Language, translations } from './i18n/translations.ts';
import Header, { UserRoleTab } from './components/Header.tsx';
import OralBiomarkerHelix3D from './components/OralBiomarkerHelix3D.tsx';
import LiveOralCamera from './components/LiveOralCamera.tsx';
import WebRTCTelemedicineRoom from './components/WebRTCTelemedicineRoom.tsx';
import EmergencySosModal from './components/EmergencySosModal.tsx';
import AiArogyaDrawer from './components/AiArogyaDrawer.tsx';
import GoldenHealthCard from './components/GoldenHealthCard.tsx';
import HabitCessationTracker from './components/HabitCessationTracker.tsx';
import DoctorChatBox from './components/DoctorChatBox.tsx';
import PrescriptionSlipModal from './components/PrescriptionSlipModal.tsx';
import AppointmentRequestModal from './components/AppointmentRequestModal.tsx';
import PatientAuthModal from './components/PatientAuthModal.tsx';
import DoctorPortal from './components/DoctorPortal.tsx';
import AdminPortal from './components/AdminPortal.tsx';
import AiArogyaVoiceAssistant from './components/AiArogyaVoiceAssistant.tsx';
import UniversalOmnibarModal from './components/UniversalOmnibarModal.tsx';

export default function App() {
  const [lang, setLang] = useState<Language>('en');
  const t = translations[lang];

  // Active Role and Navigation
  const [role, setRole] = useState<UserRoleTab>('patient');

  // Modals & Drawers
  const [isTelemedicineOpen, setIsTelemedicineOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [isSosModalOpen, setIsSosModalOpen] = useState(false);
  const [isAiArogyaOpen, setIsAiArogyaOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [isOmnibarOpen, setIsOmnibarOpen] = useState(false);

  // Application Data States
  const [patient, setPatient] = useState<any>(null);
  const [roster, setRoster] = useState<any[]>([]);
  const [hospitalsData, setHospitalsData] = useState<any>(null);
  const [activePrescription, setActivePrescription] = useState<any>(null);
  const [activeScreening, setActiveScreening] = useState<any>(null);
  const [activeAppointment, setActiveAppointment] = useState<any>(null);
  const [patientAppointments, setPatientAppointments] = useState<any[]>([]);
  const [selectedDoctorForCall, setSelectedDoctorForCall] = useState<any>(null);

  // Global Keyboard Listener for '/' Omnibar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        setIsOmnibarOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    initializeAppData();
  }, []);

  const initializeAppData = async () => {
    try {
      // 1. Load Roster
      const rosterRes = await api.getQuickLoginRoster();
      if (rosterRes.roster) {
        setRoster(rosterRes.roster);
      }

      // 2. Default Login as Compulsory Hackathon Patient K. Somanna (UIDN-ASR-2026-GM046)
      const somannaLogin = await api.patientQuickLogin('UIDN-ASR-2026-GM046');
      if (somannaLogin.patient) {
        setPatient(somannaLogin.patient);
        setActivePrescription(somannaLogin.latestPrescription);
        setActiveScreening(somannaLogin.latestScreening);
        setActiveAppointment(somannaLogin.activeAppointment);
      }

      // 3. Load 11 Mandals Health Facilities Grid
      const hosp = await api.get11MandalsHospitals();
      setHospitalsData(hosp);

      // 4. Load Patient Appointments
      if (somannaLogin.patient?.uidn) {
        const apptsRes = await api.getPatientAppointments(somannaLogin.patient.uidn);
        if (apptsRes.appointments) {
          setPatientAppointments(apptsRes.appointments);
        }
      }
    } catch (err) {
      console.warn('Initial data synchronization notice:', err);
    }
  };

  const handleQuickLogin = async (uidn: string) => {
    try {
      const res = await api.patientQuickLogin(uidn);
      setPatient(res.patient);
      setActivePrescription(res.latestPrescription);
      setActiveScreening(res.latestScreening);
      setActiveAppointment(res.activeAppointment);

      // Load patient appointments
      const apptsRes = await api.getPatientAppointments(uidn);
      if (apptsRes.appointments) {
        setPatientAppointments(apptsRes.appointments);
      }

      // Trigger royal gold celebration confetti
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#D4AF37', '#F59E0B', '#10B981']
      });
    } catch (err: any) {
      alert(`Login notice: ${err.message}`);
    }
  };

  const handleScreeningCompleted = (screening: any) => {
    setActiveScreening(screening);
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10B981', '#F59E0B', '#D4AF37']
    });
  };

  const handleLaunchTelemedicine = (targetPatient?: any, targetDoctor?: any) => {
    if (targetPatient) setPatient(targetPatient);
    if (targetDoctor) setSelectedDoctorForCall(targetDoctor);
    setIsTelemedicineOpen(true);
  };

  const handleViewPrescription = (rx?: any, targetPatient?: any) => {
    if (targetPatient) setPatient(targetPatient);
    if (rx) setActivePrescription(rx);
    setIsPrescriptionModalOpen(true);
  };

  const handleAppointmentBooked = (appt: any) => {
    setActiveAppointment(appt);
    setPatientAppointments((prev) => [appt, ...prev]);
    confetti({
      particleCount: 40,
      spread: 60,
      colors: ['#10B981', '#F59E0B']
    });
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-slate-800 flex flex-col font-sans selection:bg-amber-200 selection:text-amber-950">
      {/* 1. Header with Role Switcher, Languages, SOS & Omnibar Trigger */}
      <Header
        currentRole={role}
        onRoleChange={setRole}
        lang={lang}
        onLanguageChange={setLang}
        onOpenSos={() => setIsSosModalOpen(true)}
        onOpenAiArogya={() => setIsAiArogyaOpen(true)}
        activePatientName={patient?.name}
      />

      {/* 2. Sub-Header: Omnibar Trigger & Patient Chip */}
      <div className="bg-white/80 border-b border-amber-200/70 py-2.5 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Active Patient Chip */}
          {patient && (
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-slate-500 hidden sm:inline">{t.authenticatedAs}:</span>
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300 flex items-center space-x-1.5 shadow-sm transition-colors"
                title="Click to Switch Patient or Register New"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{patient.name}</span>
                <span className="font-mono text-[10px] text-amber-700">({patient.uidn})</span>
                <span className="text-[10px] text-slate-400 font-normal ml-1">▼</span>
              </button>
            </div>
          )}

          {/* Omnibar Input Button Trigger */}
          <div className="flex-1 max-w-xl mx-auto">
            <button
              onClick={() => setIsOmnibarOpen(true)}
              className="w-full bg-[#FAF9F5] hover:bg-white border border-amber-300 rounded-full pl-4 pr-3 py-1.5 text-xs text-left text-slate-500 flex items-center justify-between shadow-inner transition-all hover:border-amber-400 group"
            >
              <div className="flex items-center space-x-2">
                <Search className="w-3.5 h-3.5 text-amber-600 group-hover:scale-110 transition-transform" />
                <span>Search Patients, Doctors, 11 Mandals, Biopsy Orders...</span>
              </div>
              <div className="hidden sm:flex items-center space-x-1 px-1.5 py-0.5 rounded bg-amber-100/70 text-[10px] font-mono font-bold text-amber-800">
                <span>Press</span>
                <kbd className="bg-white px-1 rounded shadow-sm">/</kbd>
              </div>
            </button>
          </div>

          {/* Quick Action: New Patient Sign In Modal */}
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="hidden md:flex items-center space-x-1.5 px-3 py-1 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-amber-50 border border-slate-300 hover:border-amber-300 transition-all"
          >
            <UserCheck className="w-3.5 h-3.5 text-amber-600" />
            <span>Switch Patient</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-10">
        {/* ========================================================================= */}
        {/* ROLE 1: PATIENT PORTAL */}
        {/* ========================================================================= */}
        {role === 'patient' && (
          <div className="space-y-10">
            {/* 1. HERO SECTION WITH 3D HELIX BIOMARKER MOTION */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Hero Pitch (7 Cols) */}
              <div className="lg:col-span-7 space-y-5">
                <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-500/10 via-amber-500/20 to-emerald-500/10 border border-amber-400/50 px-3.5 py-1.5 rounded-full text-xs font-bold text-amber-900 shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-spin" style={{ animationDuration: '6s' }} />
                  <span>{t.heroBadge}</span>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-950 font-serif-royal leading-tight tracking-tight">
                  {t.heroHeading}{' '}
                  <span className="gold-gradient-text block sm:inline">{t.heroHighlight}</span>
                </h1>

                <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
                  {t.heroDescription}
                </p>

                {/* Quick Action Buttons */}
                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    onClick={() => setIsCameraModalOpen(true)}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white font-extrabold text-xs shadow-gold-glow hover:brightness-110 active:scale-95 transition-all flex items-center space-x-2"
                  >
                    <Camera className="w-4 h-4" />
                    <span>{t.startScreening}</span>
                  </button>

                  <button
                    onClick={() => handleLaunchTelemedicine(patient)}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-700 to-teal-800 text-white font-extrabold text-xs shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center space-x-2"
                  >
                    <Video className="w-4 h-4" />
                    <span>{t.openTelemedicine}</span>
                  </button>

                  <button
                    onClick={() => setIsAppointmentModalOpen(true)}
                    className="px-5 py-3 rounded-2xl bg-white hover:bg-amber-50 text-slate-800 font-bold text-xs border border-amber-300 shadow-sm transition-all flex items-center space-x-1.5"
                  >
                    <Calendar className="w-4 h-4 text-amber-600" />
                    <span>Book Appointment</span>
                  </button>

                  <button
                    onClick={() => setIsPrescriptionModalOpen(true)}
                    className="px-4 py-3 rounded-2xl bg-white hover:bg-amber-50 text-slate-800 font-bold text-xs border border-amber-300 shadow-sm transition-all flex items-center space-x-1.5"
                  >
                    <FileText className="w-4 h-4 text-amber-600" />
                    <span>Rx & Biopsy Slip</span>
                  </button>
                </div>
              </div>

              {/* Right: Embedded Interactive 3D Helix Model (5 Cols) */}
              <div className="lg:col-span-5">
                <OralBiomarkerHelix3D />
              </div>
            </section>

            {/* 2. COMPULSORY 1-CLICK PATIENT ROSTER (Somanna, Lakshmi, Ramu) */}
            <section className="space-y-4">
              <div className="flex flex-wrap justify-between items-center gap-2">
                <div>
                  <h2 className="text-lg font-bold font-serif-royal text-slate-900 flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span>{t.patientRosterTitle}</span>
                  </h2>
                  <p className="text-xs text-slate-500">{t.patientRosterSubtitle}</p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsAuthModalOpen(true)}
                    className="text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-xl border border-amber-300 transition-all flex items-center space-x-1"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-amber-700" />
                    <span>Aadhaar / Phone / Register</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {roster.map((pat) => (
                  <div
                    key={pat.uidn}
                    onClick={() => handleQuickLogin(pat.uidn)}
                    className={`gold-card p-5 cursor-pointer transition-all duration-300 relative group overflow-hidden ${
                      patient?.uidn === pat.uidn
                        ? 'ring-2 ring-amber-500 bg-gradient-to-br from-amber-50/80 via-white to-amber-100/30 shadow-gold-glow scale-[1.02]'
                        : 'hover:-translate-y-1'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                          {pat.uidn}
                        </span>
                        <h3 className="text-lg font-bold text-slate-950 mt-2 font-serif-royal">{pat.name}</h3>
                        <p className="text-xs text-slate-600">
                          {pat.age} Yrs • {pat.gender} • {pat.village}, {pat.mandal}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-amber-600 group-hover:translate-x-1 transition-transform" />
                    </div>

                    <div className="mt-4 pt-3 border-t border-amber-200/80">
                      <div className="text-[11px] text-slate-500">Case Profile:</div>
                      <div className="text-xs font-bold text-amber-900 mt-0.5 flex items-center space-x-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                        <span className="truncate">{pat.condition}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 3. ACTIVE PATIENT EXECUTIVE MEDICAL DASHBOARD */}
            {patient && (
              <section className="bg-white rounded-3xl border border-amber-300 p-6 sm:p-8 shadow-luxury space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-amber-200">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-extrabold text-2xl shadow-gold-glow">
                      {patient.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-3">
                        <h2 className="text-2xl font-bold font-serif-royal text-slate-950">{patient.name}</h2>
                        <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-bold border border-emerald-300 flex items-center space-x-1">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          <span>ABDM Profile Active</span>
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-x-4">
                        <span>UIDN: <strong className="font-mono text-slate-800">{patient.uidn}</strong></span>
                        <span>Mandal: <strong>{patient.mandal}</strong></span>
                        <span>Village: <strong>{patient.village}</strong></span>
                        <span>Phone: <strong>{patient.phone}</strong></span>
                        <span>Aadhar: <strong>{patient.aadhar}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Consultation and Camera Trigger Buttons */}
                  <div className="flex flex-wrap gap-2.5">
                    <button
                      onClick={() => setIsCameraModalOpen(true)}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 transition-all flex items-center space-x-2"
                    >
                      <Camera className="w-4 h-4 text-amber-700" />
                      <span>Capture Oral Scan</span>
                    </button>

                    <button
                      onClick={() => handleLaunchTelemedicine(patient)}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-700 shadow-md hover:brightness-105 transition-all flex items-center space-x-2"
                    >
                      <Video className="w-4 h-4" />
                      <span>Launch Tele-Call</span>
                    </button>

                    <button
                      onClick={() => setIsAppointmentModalOpen(true)}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-800 bg-white hover:bg-amber-50 border border-amber-300 transition-all flex items-center space-x-2"
                    >
                      <Calendar className="w-4 h-4 text-amber-600" />
                      <span>Request Biopsy / Appt</span>
                    </button>
                  </div>
                </div>

                {/* 4-STEP LONGITUDINAL TREATMENT JOURNEY TRACKER */}
                <div className="space-y-3 pt-2">
                  <div className="text-xs font-bold text-amber-900 uppercase tracking-wide flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-amber-700" />
                    <span>Official ITDA Paderu 4-Step Onco-Care Treatment Journey</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                      {
                        step: '1',
                        title: 'Screening & AI Triage',
                        subtitle: 'Completed (94.8% Indurated Patch)',
                        status: 'done'
                      },
                      {
                        step: '2',
                        title: 'Medical Rx Dispensed',
                        subtitle: activePrescription ? activePrescription.rxId : 'Lycopene + Kenacort Active',
                        status: 'done'
                      },
                      {
                        step: '3',
                        title: 'Biopsy Scheduled',
                        subtitle: 'CHC G. Madugula (Punch Kit Ready)',
                        status: 'current'
                      },
                      {
                        step: '4',
                        title: 'Histopathology Review',
                        subtitle: 'Area Hospital Paderu Tele-Lab',
                        status: 'pending'
                      }
                    ].map((st, i) => (
                      <div
                        key={i}
                        className={`p-3.5 rounded-2xl border transition-all ${
                          st.status === 'done'
                            ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                            : st.status === 'current'
                            ? 'bg-amber-50 border-amber-400 text-amber-950 ring-2 ring-amber-300'
                            : 'bg-slate-50 border-slate-200 text-slate-500'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                              st.status === 'done'
                                ? 'bg-emerald-600 text-white'
                                : st.status === 'current'
                                ? 'bg-amber-600 text-white animate-pulse'
                                : 'bg-slate-300 text-slate-700'
                            }`}
                          >
                            {st.step}
                          </span>
                          <span className="font-bold text-xs">{st.title}</span>
                        </div>
                        <div className="text-[11px] mt-1 pl-8 font-medium">{st.subtitle}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Screening Triage & e-Prescription Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  {/* Screening & AI Triage Summary */}
                  {activeScreening && (
                    <div className="bg-gradient-to-br from-amber-50/70 to-white rounded-2xl p-5 border border-amber-300 shadow-sm space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-extrabold text-amber-900 uppercase tracking-wide flex items-center space-x-1.5">
                          <ShieldAlert className="w-4 h-4 text-amber-700" />
                          <span>AI Onco-Triage Analysis</span>
                        </span>
                        <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          {activeScreening.aiConfidenceScore}% Accuracy
                        </span>
                      </div>

                      <div>
                        <div className="text-base font-bold text-slate-900">{activeScreening.aiLesionType}</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Target Area: <strong>{activeScreening.oralRegion}</strong> • Habit: <strong>18-Yr Reverse Smoking</strong>
                        </div>
                      </div>

                      <p className="text-xs text-slate-700 bg-white/80 p-3 rounded-xl border border-amber-200 leading-relaxed">
                        {activeScreening.clinicalRemarks}
                      </p>

                      <div className="pt-2 flex justify-between items-center text-xs font-bold text-amber-950 border-t border-amber-200/80">
                        <span>Biopsy Referral: Scheduled</span>
                        <span className="text-emerald-700">PHC G. Madugula (Dr. Swapna Devi, MDS)</span>
                      </div>
                    </div>
                  )}

                  {/* Verified e-Prescription with Barcode */}
                  {activePrescription && (
                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wide flex items-center space-x-1.5">
                            <FileText className="w-4 h-4 text-amber-600" />
                            <span>Verified e-Prescription</span>
                          </span>
                          <span className="text-[11px] font-mono bg-slate-200 text-slate-800 px-2 py-0.5 rounded font-bold">
                            {activePrescription.rxId}
                          </span>
                        </div>

                        <div className="space-y-2 mt-3">
                          {activePrescription.medicines?.map((m: any, idx: number) => (
                            <div key={idx} className="text-xs text-slate-800 flex justify-between items-start">
                              <span className="font-semibold">• {m.name}</span>
                              <span className="text-slate-500 text-[11px]">{m.dosage} ({m.duration})</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          <QrCode className="w-6 h-6 text-amber-700" />
                          <span className="font-mono text-xs text-slate-700 font-bold">
                            {activePrescription.printableBarcodeId}
                          </span>
                        </div>
                        <button
                          onClick={() => setIsPrescriptionModalOpen(true)}
                          className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold text-xs shadow-sm transition-all"
                        >
                          Print Official Slip
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Real-Time Appointment Notification Cards */}
                {patientAppointments.length > 0 && (
                  <div className="pt-4 border-t border-amber-200/80 space-y-3">
                    <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span className="flex items-center space-x-1.5">
                        <Calendar className="w-4 h-4 text-amber-600" />
                        <span>Live Appointment & Biopsy Notifications</span>
                      </span>
                      <span className="text-[10px] text-slate-400">Auto-synced with Doctor Portal</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {patientAppointments.slice(0, 2).map((a) => (
                        <div
                          key={a.appointmentId}
                          className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                            a.status === 'APPROVED'
                              ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                              : a.status === 'REJECTED'
                              ? 'bg-red-50/80 border-red-300 text-red-950'
                              : 'bg-amber-50/80 border-amber-300 text-amber-950'
                          }`}
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center space-x-2">
                              <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/70">
                                {a.appointmentId}
                              </span>
                              <span className="font-bold text-xs">{a.apptType}</span>
                            </div>
                            <div className="text-[11px] opacity-80">
                              {a.hospitalName} • Slot: <strong>{a.timeSlot}</strong>
                            </div>
                            <div className="text-[10px] italic">
                              Remarks: {a.doctorRemarks || 'Awaiting specialist review'}
                            </div>
                          </div>

                          <span
                            className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border shadow-sm ${
                              a.status === 'APPROVED'
                                ? 'bg-emerald-600 text-white border-emerald-700'
                                : a.status === 'REJECTED'
                                ? 'bg-red-600 text-white border-red-700'
                                : 'bg-amber-500 text-white border-amber-600'
                            }`}
                          >
                            {a.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* 4. GOLDEN HEALTH CARD & HABIT CESSATION TRACKER (Side-by-Side) */}
            {patient && (
              <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Golden Health Card (6 Cols) */}
                <div className="lg:col-span-6 bg-white rounded-3xl border border-amber-300 p-6 shadow-luxury">
                  <GoldenHealthCard patient={patient} lang={lang} />
                </div>

                {/* Habit Cessation Streak & Mucosal Healing (6 Cols) */}
                <div className="lg:col-span-6 bg-white rounded-3xl border border-amber-300 p-6 shadow-luxury">
                  <HabitCessationTracker patientUidn={patient.uidn} lang={lang} />
                </div>
              </section>
            )}

            {/* 5. DOCTOR LIVE CHATBOX WITH SEND PRESCRIPTION ATTACHMENT */}
            {patient && (
              <section className="bg-white rounded-3xl border border-amber-300 p-6 shadow-luxury">
                <DoctorChatBox
                  patientUidn={patient.uidn}
                  patientName={patient.name}
                  doctorName="Dr. Swapna Devi, MDS"
                  doctorHospital="PHC G. Madugula / Area Hospital Paderu Hub"
                  prescription={activePrescription}
                  lang={lang}
                />
              </section>
            )}

            {/* 6. TRILINGUAL AI AROGYA SPOKEN VOICE ASSISTANT */}
            <section>
              <AiArogyaVoiceAssistant
                lang={lang}
                onTranscriptionComplete={(text) => {
                  console.log('Recognized speech:', text);
                }}
              />
            </section>

            {/* 7. 11 MANDALS HEALTH GRID OVERVIEW */}
            <section className="bg-white rounded-3xl border border-amber-300 p-6 sm:p-8 shadow-luxury space-y-6">
              <div className="flex flex-wrap justify-between items-center gap-3">
                <div>
                  <h2 className="text-xl font-bold font-serif-royal text-slate-950 flex items-center space-x-2">
                    <Hospital className="w-5 h-5 text-amber-600" />
                    <span>{t.mandalsGridTitle}</span>
                  </h2>
                  <p className="text-xs text-slate-500">{t.mandalsGridSubtitle}</p>
                </div>
                <span className="text-xs font-bold bg-amber-100 text-amber-900 px-3 py-1 rounded-full border border-amber-300">
                  11 / 11 ASR Mandals Live
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {hospitalsData?.hospitals?.map((h: any) => (
                  <div
                    key={h.abdmFacilityCode}
                    className="border border-amber-200/80 rounded-2xl p-4 bg-[#FCFBF7] space-y-2 hover:border-amber-400 hover:shadow-md transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-300">
                        {h.facilityType} • {h.mandal}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          h.biopsyEquipStatus === 'AVAILABLE'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {h.biopsyEquipStatus}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-slate-900">{h.name}</h3>
                    <div className="text-xs text-slate-600">{t.medicalOfficer}: {h.moInCharge}</div>
                    <div className="text-xs text-slate-500">ABDM: {h.abdmFacilityCode} • Phone: {h.phone}</div>

                    <div className="pt-2 border-t border-amber-200 flex justify-between text-[11px] text-slate-600 font-medium">
                      <span>{t.activeCases}: {h.caseSheetsRunning}</span>
                      <span>{t.dischargedCases}: {h.caseSheetsDischarged}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ROLE 2: DOCTOR WORKSPACE */}
        {/* ========================================================================= */}
        {role === 'doctor' && (
          <DoctorPortal
            lang={lang}
            onLaunchTelemedicine={(pat, doc) => handleLaunchTelemedicine(pat, doc)}
            onViewPrescription={(rx, pat) => handleViewPrescription(rx, pat)}
          />
        )}

        {/* ========================================================================= */}
        {/* ROLE 3: ADMIN 11 MANDALS INFRASTRUCTURE PORTAL */}
        {/* ========================================================================= */}
        {role === 'admin' && (
          <AdminPortal lang={lang} />
        )}
      </main>

      {/* ========================================================================= */}
      {/* GLOBAL MODALS & OVERLAYS */}
      {/* ========================================================================= */}

      {/* 1. UNIVERSAL OMNIBAR MODAL ('/' Key) */}
      <UniversalOmnibarModal
        isOpen={isOmnibarOpen}
        onClose={() => setIsOmnibarOpen(false)}
        lang={lang}
        onSelectPatient={(uidn) => {
          handleQuickLogin(uidn);
          setRole('patient');
        }}
        onSelectDoctor={(doc) => {
          setSelectedDoctorForCall(doc);
          setRole('doctor');
        }}
        onSelectHospital={(hosp) => {
          setRole('admin');
        }}
        onSelectPrescription={(rx) => {
          setActivePrescription(rx);
          setIsPrescriptionModalOpen(true);
        }}
      />

      {/* 2. PATIENT AUTHENTICATION & REGISTRATION MODAL */}
      <PatientAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        lang={lang}
        onAuthenticated={(newPatient) => {
          setPatient(newPatient);
          setIsAuthModalOpen(false);
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.6 }
          });
        }}
      />

      {/* 3. APPOINTMENT REQUEST MODAL (General vs Biopsy) */}
      <AppointmentRequestModal
        isOpen={isAppointmentModalOpen}
        onClose={() => setIsAppointmentModalOpen(false)}
        patient={patient}
        lang={lang}
        onAppointmentBooked={handleAppointmentBooked}
      />

      {/* 4. OFFICIAL PRESCRIPTION & BIOPSY REFERRAL SLIP MODAL */}
      <PrescriptionSlipModal
        isOpen={isPrescriptionModalOpen}
        onClose={() => setIsPrescriptionModalOpen(false)}
        patient={patient}
        prescription={activePrescription}
        doctor={{
          name: 'Dr. Swapna Devi, MDS',
          designation: 'Chief Onco-Pathologist & Lead Tele-Consultant',
          hospitalDuty: 'PHC G. Madugula / Area Hospital Paderu Tele-Lab',
          abdmCode: 'ABDM-DOC-AP-7821'
        }}
        lang={lang}
      />

      {/* 5. LIVE ORAL CAMERA MODAL */}
      {isCameraModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="w-full max-w-5xl">
            <div className="flex justify-end pb-2">
              <button
                onClick={() => setIsCameraModalOpen(false)}
                className="px-4 py-1.5 bg-white/20 hover:bg-white/40 text-white rounded-full text-xs font-bold transition-colors"
              >
                Close Camera
              </button>
            </div>
            <LiveOralCamera
              patientUidn={patient?.uidn || 'UIDN-ASR-2026-GM046'}
              patientName={patient?.name || 'K. Somanna'}
              lang={lang}
              onAnalysisComplete={handleScreeningCompleted}
            />
          </div>
        </div>
      )}

      {/* 6. WEBRTC TELEMEDICINE ROOM MODAL */}
      {isTelemedicineOpen && (
        <WebRTCTelemedicineRoom
          patient={patient || { name: 'K. Somanna', uidn: 'UIDN-ASR-2026-GM046', mandal: 'G. Madugula', age: 46 }}
          lang={lang}
          onClose={() => setIsTelemedicineOpen(false)}
          onPrescriptionCreated={(rx) => setActivePrescription(rx)}
        />
      )}

      {/* 7. EMERGENCY SOS MODAL */}
      {isSosModalOpen && (
        <EmergencySosModal
          onClose={() => setIsSosModalOpen(false)}
          lang={lang}
          patientMandal={patient?.mandal || 'G. Madugula'}
          patientVillage={patient?.village || 'Nurmati'}
        />
      )}

      {/* 8. AI AROGYA TRILINGUAL DRAWER */}
      <AiArogyaDrawer
        isOpen={isAiArogyaOpen}
        onClose={() => setIsAiArogyaOpen(false)}
        lang={lang}
      />

      {/* 9. Luxury Executive Footer */}
      <footer className="bg-slate-950 text-slate-400 text-xs py-8 border-t border-amber-500/30 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <div className="font-bold text-white font-serif-royal text-sm gold-gradient-text">
              AAROGYA DRISHTI — AAROHAN 2026
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Integrated Tribal Development Agency (ITDA) Paderu • Alluri Sitharama Raju District
            </p>
          </div>
          <div className="flex flex-wrap items-center space-x-6 text-[11px]">
            <span>11 ASR Mandals Grid</span>
            <span>WebRTC Tele-Oncology</span>
            <span>Multimodal Gemini 2.0 AI</span>
            <span>Web Speech API te-IN</span>
            <span className="text-amber-400 font-bold">Hackathon 2026 Evaluation Ready</span>
          </div>
        </div>
      </footer>
    </div>
  );
}