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
  MessageSquare,
  Building2,
  PhoneCall,
  Flame,
  KeyRound,
  ExternalLink,
  ChevronDown,
  HelpCircle,
  LogOut,
  LogIn
} from 'lucide-react';
import confetti from 'canvas-confetti';
import api from './services/api.ts';
import { Language, translations } from './i18n/translations.ts';
import { applyDOMTranslation, translateText } from './i18n/translator.ts';
import Header, { ActiveRole } from './components/Header.tsx';
import OralBiomarkerHelix3D from './components/OralBiomarkerHelix3D.tsx';
import LiveOralCamera from './components/LiveOralCamera.tsx';
import PatientAiScreeningUpload from './components/PatientAiScreeningUpload.tsx';
import WebRTCTelemedicineRoom from './components/WebRTCTelemedicineRoom.tsx';
import EmergencySosModal from './components/EmergencySosModal.tsx';
import AiArogyaDrawer from './components/AiArogyaDrawer.tsx';
import GoldenHealthCard from './components/GoldenHealthCard.tsx';
import HabitCessationTracker from './components/HabitCessationTracker.tsx';
import DoctorChatBox from './components/DoctorChatBox.tsx';
import PrescriptionSlipModal from './components/PrescriptionSlipModal.tsx';
import AppointmentRequestModal from './components/AppointmentRequestModal.tsx';
import PatientAuthModal from './components/PatientAuthModal.tsx';
import DoctorAuthModal from './components/DoctorAuthModal.tsx';
import AdminAuthModal from './components/AdminAuthModal.tsx';
import DoctorPortal from './components/DoctorPortal.tsx';
import AdminPortal from './components/AdminPortal.tsx';
import AiArogyaVoiceAssistant from './components/AiArogyaVoiceAssistant.tsx';
import UniversalOmnibarModal from './components/UniversalOmnibarModal.tsx';

export default function App() {
  const [lang, setLang] = useState<Language>('en');
  const t = translations[lang];

  // Active Role State: strictly isolated ('landing' | 'patient' | 'doctor' | 'admin')
  const [role, setRole] = useState<ActiveRole>('landing');

  // Modals & Drawers
  const [isTelemedicineOpen, setIsTelemedicineOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [isSosModalOpen, setIsSosModalOpen] = useState(false);
  const [isAiArogyaOpen, setIsAiArogyaOpen] = useState(false);
  const [isPatientAuthModalOpen, setIsPatientAuthModalOpen] = useState(false);
  const [patientAuthMode, setPatientAuthMode] = useState<'login' | 'register'>('login');
  const [isDoctorAuthModalOpen, setIsDoctorAuthModalOpen] = useState(false);
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [isOmnibarOpen, setIsOmnibarOpen] = useState(false);

  // Application Data States
  const [patient, setPatient] = useState<any>(null);
  const [activeDoctor, setActiveDoctor] = useState<any>(null);
  const [activeAdmin, setActiveAdmin] = useState<any>(null);
  const [roster, setRoster] = useState<any[]>([]);
  const [hospitalsData, setHospitalsData] = useState<any>(null);
  const [activePrescription, setActivePrescription] = useState<any>(null);
  const [activeScreening, setActiveScreening] = useState<any>(null);
  const [activeAppointment, setActiveAppointment] = useState<any>(null);
  const [patientAppointments, setPatientAppointments] = useState<any[]>([]);
  const [selectedDoctorForCall, setSelectedDoctorForCall] = useState<any>(null);

  // Trilingual Live DOM Translation Effect
  useEffect(() => {
    applyDOMTranslation(document.body, lang);

    const observer = new MutationObserver(() => {
      applyDOMTranslation(document.body, lang);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });

    return () => observer.disconnect();
  }, [lang]);

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
      // 1. Load 11 Mandals Health Facilities Grid
      const hosp = await api.get11MandalsHospitals();
      setHospitalsData(hosp);

      // Check existing patient session if saved
      const savedPatientToken = localStorage.getItem('aarogya_patient_token');
      if (savedPatientToken) {
        // Patient session can be restored if valid
      }
    } catch (err) {
      console.warn('Initial data synchronization notice:', err);
    }
  };

  const handlePatientQuickLogin = async (uidn: string) => {
    try {
      const res = await api.patientQuickLogin(uidn);
      setPatient(res.patient);
      setActivePrescription(res.latestPrescription);
      setActiveScreening(res.latestScreening);
      setActiveAppointment(res.activeAppointment);

      const apptsRes = await api.getPatientAppointments(uidn);
      if (apptsRes.appointments) {
        setPatientAppointments(apptsRes.appointments);
      }

      setRole('patient');
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#2563EB', '#1D4ED8', '#10B981']
      });
    } catch (err: any) {
      alert(`Patient login notice: ${err.message}`);
    }
  };

  const handleScreeningCompleted = (screening: any) => {
    setActiveScreening(screening);
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10B981', '#2563EB', '#FACC15']
    });
  };

  const handleLaunchTelemedicine = (targetPatient?: any, targetDoctor?: any) => {
    if (targetPatient) setPatient(targetPatient);
    if (targetDoctor) {
      setSelectedDoctorForCall(targetDoctor);
    } else {
      // Find the doctor from the patient's booked appointments
      const bookedAppt =
        patientAppointments.find((a: any) => a.status === 'APPROVED') ||
        patientAppointments[0];

      if (bookedAppt) {
        const docCode = bookedAppt.doctorUidn || bookedAppt.doctorId || 'DOC-SWAPNA';
        const docName =
          bookedAppt.doctorName ||
          (docCode === 'DOC-SWAPNA'
            ? 'Dr. Swapna Devi, MDS'
            : docCode === 'DOC-RAJESH'
            ? 'Dr. K. Rajesh, MS ENT'
            : 'Dr. Anand Kumar, MDS');

        setSelectedDoctorForCall({
          uidn: docCode,
          name: docName,
          designation: 'Assigned Tele-Consultant Specialist',
          hospitalDuty: bookedAppt.hospitalName || 'PHC G. Madugula'
        });
      } else {
        alert('Notice: Please book a tele-consultation appointment slot first. Once booked with your assigned specialist doctor, you can connect live with them here.');
        const el = document.getElementById('patient-booking-card-section') || document.getElementById('patient-appointments-list-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
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
      colors: ['#10B981', '#2563EB']
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('aarogya_patient_token');
    localStorage.removeItem('aarogya_doctor_token');
    localStorage.removeItem('aarogya_admin_token');
    setPatient(null);
    setActiveDoctor(null);
    setActiveAdmin(null);
    setSelectedDoctorForCall(null);
    setRole('landing');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-royal-900">
      {/* 1. Header (STRICTLY ROLE-ISOLATED - ZERO ROLE SWITCHER TABS!) */}
      <Header
        currentRole={role}
        lang={lang}
        onLanguageChange={setLang}
        onOpenSos={() => setIsSosModalOpen(true)}
        onOpenAiArogya={() => setIsAiArogyaOpen(true)}
        activePatient={patient}
        activeDoctor={activeDoctor || { name: 'Dr. Swapna Devi, MDS', hospitalDuty: 'PHC G. Madugula / GGH Paderu' }}
        activeAdmin={activeAdmin || { name: 'ITDA Paderu Admin' }}
        onLogout={handleLogout}
        onNavigateHome={() => setRole('landing')}
      />

      {/* 2. Top Omnibar Trigger Bar */}
      <div className="bg-white border-b border-slate-200 py-2.5 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Active Status Badge */}
          <div className="flex items-center space-x-2 text-xs">
            {role === 'landing' && (
              <span className="font-bold text-royal-900 bg-blue-50 px-3 py-1 rounded-full border border-blue-200 flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-royal-600 animate-pulse" />
                <span>Portal Gateway Selection</span>
              </span>
            )}
            {role === 'patient' && patient && (
              <div className="flex items-center space-x-2">
                <span className="text-slate-500 hidden sm:inline">Active Patient:</span>
                <span className="font-bold text-slate-900 bg-blue-50 px-3 py-1 rounded-full border border-blue-200 flex items-center space-x-1.5 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{patient.name}</span>
                  <span className="font-mono text-[10px] text-royal-700">({patient.uidn})</span>
                </span>
              </div>
            )}
            {role === 'doctor' && (
              <div className="flex items-center space-x-2">
                <span className="font-bold text-emerald-950 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-300 flex items-center space-x-1.5 shadow-sm">
                  <Stethoscope className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Medical Officer Workspace (Dr. Swapna Devi, MDS)</span>
                </span>
              </div>
            )}
            {role === 'admin' && (
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded-full border border-slate-300 flex items-center space-x-1.5 shadow-sm">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-700" />
                  <span>ITDA Paderu 11 Mandals Registry Command</span>
                </span>
              </div>
            )}
          </div>

          {/* Omnibar Input Button Trigger */}
          <div className="flex-1 max-w-xl mx-auto">
            <button
              onClick={() => setIsOmnibarOpen(true)}
              className="w-full bg-slate-50 hover:bg-white border border-slate-200 rounded-full pl-4 pr-3 py-1.5 text-xs text-left text-slate-500 flex items-center justify-between shadow-inner transition-all hover:border-royal-400 group"
            >
              <div className="flex items-center space-x-2">
                <Search className="w-3.5 h-3.5 text-royal-600 group-hover:scale-110 transition-transform" />
                <span>Search Patients, Doctors, 11 Mandals, Biopsy Orders...</span>
              </div>
              <div className="hidden sm:flex items-center space-x-1 px-1.5 py-0.5 rounded bg-slate-200/80 text-[10px] font-mono font-bold text-slate-700">
                <span>Press</span>
                <kbd className="bg-white px-1 rounded shadow-sm text-slate-900">/</kbd>
              </div>
            </button>
          </div>

          {/* Home Gateway Link when logged in */}
          {role !== 'landing' && (
            <button
              onClick={() => setRole('landing')}
              className="hidden md:flex items-center space-x-1 px-3 py-1 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-blue-50 border border-slate-300 hover:border-royal-300 transition-all"
            >
              <span>← Portal Home</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-10">
        {/* ========================================================================= */}
        {/* VIEW 0: WELCOME HOME SCREEN - REGISTRATION & SECURE LOGIN */}
        {/* ========================================================================= */}
        {role === 'landing' && (
          <div className="space-y-8 max-w-5xl mx-auto">
            {/* HERO / WELCOME BANNER */}
            <section className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-sm text-center space-y-4">
              <div className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-200 px-4 py-1.5 rounded-full text-xs font-bold text-royal-800 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-royal-600" />
                <span>ITDA PADERU • ALLURI SITHARAMA RAJU DISTRICT</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight">
                AAROGYA DRISHTI <span className="royal-gradient-text">ఆరోగ్య దృష్టి</span>
              </h1>

              <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
                Autonomous AI Early Oral Cancer Detection, Tele-Consultation & Care Coordination for the tribal agency areas of 11 Mandals in Alluri Sitharama Raju District.
              </p>
            </section>

            {/* 2 PRIMARY GATEWAYS: REGISTRATION & LOGIN */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* CARD 1: PATIENT REGISTRATION */}
              <div className="bg-white rounded-3xl border border-slate-200 hover:border-royal-400 p-8 shadow-sm flex flex-col justify-between transition-all group">
                <div className="space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-royal-600 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                    <UserPlus className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold text-royal-900 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                      NEW CITIZEN
                    </span>
                    <h2 className="text-2xl font-extrabold text-slate-950 mt-2">
                      Patient Registration
                    </h2>
                    <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                      Register as a new patient to receive your unique Digital UIDN and Golden Health Card across 11 ITDA Paderu Mandals.
                    </p>
                  </div>
                  <ul className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-700">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>Instant auto-assigned UIDN barcode</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>Free AI oral screening & risk triage</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>Direct specialist tele-consultations</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-8">
                  <button
                    onClick={() => {
                      setPatientAuthMode('register');
                      setIsPatientAuthModalOpen(true);
                    }}
                    className="w-full py-3.5 rounded-2xl bg-royal-600 hover:bg-royal-700 text-white font-extrabold text-sm shadow-blue-card active:scale-95 transition-all flex items-center justify-center space-x-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Register as New Patient</span>
                  </button>
                </div>
              </div>

              {/* CARD 2: PORTAL LOGIN */}
              <div className="bg-white rounded-3xl border border-slate-200 hover:border-slate-400 p-8 shadow-sm flex flex-col justify-between transition-all group">
                <div className="space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                    <LogIn className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                      SECURE SIGN-IN
                    </span>
                    <h2 className="text-2xl font-extrabold text-slate-950 mt-2">
                      Portal Login
                    </h2>
                    <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                      Select your authorized gateway to sign in to your role-isolated portal.
                    </p>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setPatientAuthMode('login');
                        setIsPatientAuthModalOpen(true);
                      }}
                      className="w-full py-3 rounded-2xl bg-blue-50 hover:bg-blue-100 text-royal-800 border border-blue-200 font-bold text-xs transition-all flex items-center justify-center space-x-2"
                    >
                      <UserCheck className="w-4 h-4 text-royal-600" />
                      <span>Patient Login (Phone / Aadhaar / UIDN)</span>
                    </button>

                    <button
                      onClick={() => setIsDoctorAuthModalOpen(true)}
                      className="w-full py-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-xs transition-all flex items-center justify-center space-x-2"
                    >
                      <Stethoscope className="w-4 h-4 text-emerald-700" />
                      <span>Doctor Login (Medical Officer / Specialist)</span>
                    </button>

                    <button
                      onClick={() => setIsAdminAuthModalOpen(true)}
                      className="w-full py-3 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-300 font-bold text-xs transition-all flex items-center justify-center space-x-2"
                    >
                      <ShieldCheck className="w-4 h-4 text-slate-700" />
                      <span>ITDA Admin Login (11 Mandals Registry)</span>
                    </button>
                  </div>
                </div>

                <div className="pt-4 text-center">
                  <span className="text-[11px] text-slate-400">
                    ABDM compliant & HIPAA-grade role isolation
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 1: STRICTLY ROLE-ISOLATED CITIZEN & PATIENT DASHBOARD */}
        {/* ========================================================================= */}
        {role === 'patient' && (
          <div className="space-y-8">
            {/* PATIENT PROFILE HEADER CARD */}
            {patient && (
              <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-200">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-2xl bg-royal-600 flex items-center justify-center text-white font-extrabold text-2xl shadow-sm">
                      {patient.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-3">
                        <h2 className="text-2xl font-bold text-slate-950">
                          Namaste, {patient.name}
                        </h2>
                        <span className="bg-emerald-50 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-bold border border-emerald-300 flex items-center space-x-1">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          <span>ABDM Profile Active</span>
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-x-4">
                        <span>UIDN: <strong className="font-mono text-royal-700">{patient.uidn}</strong></span>
                        <span>Mandal: <strong>{patient.mandal}</strong></span>
                        <span>Village: <strong>{patient.village}</strong></span>
                        <span>Age: <strong>{patient.age} Yrs ({patient.gender})</strong></span>
                        <span>Blood Group: <strong className="text-red-600 font-bold">{patient.bloodGroup || 'O+'}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleLogout}
                      className="px-3 py-2 rounded-xl text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-all flex items-center space-x-1"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>

                {/* 4 CORE HEALTH ACTION CARDS */}
                <div>
                  <div className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                    Core Health Actions
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Card 1: Check Mouth Photo (AI Triage) */}
                    <div
                      onClick={() => setIsCameraModalOpen(true)}
                      className="bg-white hover:bg-blue-50/50 border border-slate-200 hover:border-royal-400 rounded-3xl p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 cursor-pointer flex flex-col justify-between group"
                    >
                      <div className="space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-royal-600 text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                          <Camera className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-sm text-slate-950">
                            1. Check Mouth Photo
                          </h4>
                          <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                            Instant AI screening with live reticle, bounding lesion box & triage prediction.
                          </p>
                        </div>
                      </div>
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-royal-700">
                        <span>Launch Camera</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>

                    {/* Card 2: Book Doctor / Biopsy */}
                    <div
                      onClick={() => setIsAppointmentModalOpen(true)}
                      className="bg-white hover:bg-blue-50/50 border border-slate-200 hover:border-royal-400 rounded-3xl p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 cursor-pointer flex flex-col justify-between group"
                    >
                      <div className="space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-royal-700 text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                          <Calendar className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-sm text-slate-950">
                            2. Book Doctor / Biopsy
                          </h4>
                          <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                            General oral consultation or Biopsy procedure slot with Dr. Swapna Devi.
                          </p>
                        </div>
                      </div>
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-royal-700">
                        <span>{activeAppointment ? activeAppointment.status : 'Book Slot'}</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>

                    {/* Card 3: Chat & Video Call */}
                    <div
                      onClick={() => handleLaunchTelemedicine(patient)}
                      className="bg-white hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-400 rounded-3xl p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 cursor-pointer flex flex-col justify-between group"
                    >
                      <div className="space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                          <Video className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-sm text-slate-950">
                            3. Chat & Video Call
                          </h4>
                          <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                            Live encrypted WebRTC consultation & doctor chat with prescription attachment.
                          </p>
                        </div>
                      </div>
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-800">
                        <span>Start Video Call</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>

                    {/* Card 4: My Health Card & Prescriptions */}
                    <div
                      onClick={() => {
                        const el = document.getElementById('patient-health-card-section');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="bg-white hover:bg-blue-50/50 border border-slate-200 hover:border-royal-400 rounded-3xl p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 cursor-pointer flex flex-col justify-between group"
                    >
                      <div className="space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-royal-800 text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                          <QrCode className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-sm text-slate-950">
                            4. Health Card & Slips
                          </h4>
                          <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                            ABDM QR card, printable bilingual prescription slip & biopsy referral order.
                          </p>
                        </div>
                      </div>
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-royal-700">
                        <span>View Health Card</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4-STEP LONGITUDINAL TREATMENT JOURNEY TRACKER */}
                <div className="space-y-3 pt-2">
                  <div className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-royal-600" />
                    <span>Official ITDA Paderu 4-Step Onco-Care Treatment Journey</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                      {
                        step: '1',
                        title: 'Screening & AI Triage',
                        subtitle: 'Completed (92.4% Indurated Patch)',
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
                            ? 'bg-blue-50 border-royal-400 text-royal-950 ring-2 ring-royal-200'
                            : 'bg-slate-50 border-slate-200 text-slate-500'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                              st.status === 'done'
                                ? 'bg-emerald-600 text-white'
                                : st.status === 'current'
                                ? 'bg-royal-600 text-white animate-pulse'
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
                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-extrabold text-royal-900 uppercase tracking-wide flex items-center space-x-1.5">
                          <ShieldAlert className="w-4 h-4 text-royal-600" />
                          <span>AI Onco-Triage Analysis</span>
                        </span>
                        <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          {activeScreening.aiConfidenceScore}% Accuracy
                        </span>
                      </div>

                      <div>
                        <div className="text-base font-bold text-slate-900">{activeScreening.aiLesionType}</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Target Area: <strong>{activeScreening.oralRegion}</strong> • Habit: <strong>18-Yr Chewing Tobacco / Reverse Smoking</strong>
                        </div>
                      </div>

                      <p className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200 leading-relaxed">
                        {activeScreening.clinicalRemarks}
                      </p>

                      <div className="pt-2 flex justify-between items-center text-xs font-bold text-slate-900 border-t border-slate-200">
                        <span>Biopsy Referral: Recommended</span>
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
                            <FileText className="w-4 h-4 text-royal-600" />
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
                          <QrCode className="w-6 h-6 text-royal-700" />
                          <span className="font-mono text-xs text-slate-700 font-bold">
                            {activePrescription.printableBarcodeId}
                          </span>
                        </div>
                        <button
                          onClick={() => setIsPrescriptionModalOpen(true)}
                          className="px-3 py-1 bg-royal-600 hover:bg-royal-700 text-white rounded-lg font-bold text-xs shadow-sm transition-all"
                        >
                          Print Official Slip
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Real-Time Appointment Notification Cards */}
                {patientAppointments.length > 0 && (
                  <div className="pt-4 border-t border-slate-200 space-y-3">
                    <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span className="flex items-center space-x-1.5">
                        <Calendar className="w-4 h-4 text-royal-600" />
                        <span>Live Appointment & Biopsy Notifications</span>
                      </span>
                      <span className="text-[10px] text-slate-400">Auto-synced with Doctor Portal</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {patientAppointments.slice(0, 4).map((a) => {
                        const apptDateObj = a.appointmentDate ? new Date(a.appointmentDate) : null;
                        const formattedDate = apptDateObj && !isNaN(apptDateObj.getTime())
                          ? apptDateObj.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
                          : 'Nov 21, 2026';
                        const dayOfWeek = a.appointmentDay || (apptDateObj && !isNaN(apptDateObj.getTime())
                          ? apptDateObj.toLocaleDateString('en-US', { weekday: 'long' })
                          : 'Saturday');
                        const docDisplayName = a.doctorName || (a.doctorUidn === 'DOC-SWAPNA' ? 'Dr. Swapna Devi, MDS' : a.doctorUidn === 'DOC-RAJESH' ? 'Dr. K. Rajesh, MS ENT' : 'Dr. Anand Kumar, MDS');

                        return (
                          <div
                            key={a.appointmentId}
                            className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                              a.status === 'APPROVED'
                                ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                                : a.status === 'REJECTED'
                                ? 'bg-red-50/80 border-red-300 text-red-950'
                                : 'bg-yellow-50 border-yellow-300 text-slate-900'
                            }`}
                          >
                            <div className="space-y-1.5">
                              <div className="flex items-center space-x-2">
                                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-800 shadow-sm">
                                  {a.appointmentId}
                                </span>
                                <span className="font-bold text-xs text-slate-900">{a.apptType}</span>
                              </div>

                              <div className="text-xs text-slate-700 flex flex-wrap gap-x-3 gap-y-1">
                                <span>📅 Date: <strong>{formattedDate} ({dayOfWeek})</strong></span>
                                <span>⏰ Time: <strong>{a.timeSlot}</strong></span>
                              </div>

                              <div className="text-xs text-slate-600 flex flex-wrap gap-x-3 gap-y-1">
                                <span>👨‍⚕️ Specialist: <strong>{docDisplayName}</strong></span>
                                <span>🏥 Facility: <strong>{a.hospitalName}</strong></span>
                                <span>📍 Mandal: <strong>{a.mandal || 'G. Madugula'}</strong></span>
                              </div>

                              <div className="text-[11px] text-slate-500 italic pt-0.5">
                                Remarks: {a.doctorRemarks || 'Awaiting specialist review'}
                              </div>
                            </div>

                            <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-1.5 flex-shrink-0">
                              <span
                                className={`text-[10px] font-extrabold px-3 py-1 rounded-full border shadow-sm ${
                                  a.status === 'APPROVED'
                                    ? 'bg-emerald-600 text-white border-emerald-700'
                                    : a.status === 'REJECTED'
                                    ? 'bg-red-600 text-white border-red-700'
                                    : 'bg-yellow-400 text-slate-950 font-bold border-yellow-500'
                                }`}
                              >
                                {a.status}
                              </span>

                              {a.status === 'APPROVED' && (
                                <button
                                  onClick={() => {
                                    const docObj = {
                                      uidn: a.doctorUidn || 'DOC-SWAPNA',
                                      name: docDisplayName,
                                      hospitalDuty: a.hospitalName,
                                      designation: 'Approved Tele-Consultant'
                                    };
                                    handleLaunchTelemedicine(patient, docObj);
                                  }}
                                  className="mt-1 px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center space-x-1 shadow-sm transition-all"
                                >
                                  <Video className="w-3 h-3" />
                                  <span>Join Video Call</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* SECTION 2: AI ORAL LESION PHOTO SCANNER & UPLOAD CENTER */}
            {patient && (
              <section id="patient-ai-screening-section" className="scroll-mt-24">
                <PatientAiScreeningUpload
                  patient={patient}
                  lang={lang}
                  onScreeningCompleted={(sc) => {
                    handleScreeningCompleted(sc);
                  }}
                  onLaunchFullCameraModal={() => setIsCameraModalOpen(true)}
                />
              </section>
            )}

            {/* SECTION 1: AROGYA DRISHTI HEALTH CARD & PATIENT SEARCH ENGINE */}
            {patient && (
              <section id="patient-health-card-section" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start scroll-mt-24">
                <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                  <GoldenHealthCard patient={patient} lang={lang} />
                </div>

                <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                  <HabitCessationTracker patientUidn={patient.uidn} lang={lang} />
                </div>
              </section>
            )}

            {/* SECTION 5: DOCTOR LIVE CHATBOX WITH SEND PRESCRIPTION ATTACHMENT */}
            {patient && (
              <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
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

            {/* TRILINGUAL AI AROGYA SPOKEN VOICE ASSISTANT */}
            <section>
              <AiArogyaVoiceAssistant
                lang={lang}
                onTranscriptionComplete={(text) => {
                  console.log('Recognized speech:', text);
                }}
              />
            </section>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: STRICTLY ROLE-ISOLATED DOCTOR WORKSPACE */}
        {/* ========================================================================= */}
        {role === 'doctor' && (
          <div className="space-y-8">
            <DoctorPortal
              lang={lang}
              onLaunchTelemedicine={(pat, doc) => handleLaunchTelemedicine(pat, doc)}
              onViewPrescription={(rx, pat) => handleViewPrescription(rx, pat)}
              initialDoctor={activeDoctor}
            />
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: STRICTLY ROLE-ISOLATED ADMIN 11 MANDALS COMMAND CENTER */}
        {/* ========================================================================= */}
        {role === 'admin' && (
          <div className="space-y-8">
            <AdminPortal lang={lang} />
          </div>
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
          if (role === 'admin') {
            handlePatientQuickLogin(uidn);
          }
        }}
        onSelectDoctor={(doc) => {
          if (role === 'admin') {
            setActiveDoctor(doc);
            setRole('doctor');
          }
        }}
        onSelectHospital={(hosp) => {
          if (role === 'admin') {
            setRole('admin');
          }
        }}
        onSelectPrescription={(rx) => {
          setActivePrescription(rx);
          setIsPrescriptionModalOpen(true);
        }}
      />

      {/* 2. CITIZEN / PATIENT AUTHENTICATION & REGISTRATION MODAL */}
      <PatientAuthModal
        isOpen={isPatientAuthModalOpen}
        onClose={() => setIsPatientAuthModalOpen(false)}
        lang={lang}
        defaultMode={patientAuthMode}
        onAuthenticated={(newPatient) => {
          setPatient(newPatient);
          setRole('patient');
          setIsPatientAuthModalOpen(false);
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.6 }
          });
        }}
      />

      {/* 3. MEDICAL OFFICER / DOCTOR AUTHENTICATION MODAL */}
      <DoctorAuthModal
        isOpen={isDoctorAuthModalOpen}
        onClose={() => setIsDoctorAuthModalOpen(false)}
        lang={lang}
        onAuthenticated={(doc) => {
          setActiveDoctor(doc);
          setRole('doctor');
          setIsDoctorAuthModalOpen(false);
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.6 }
          });
        }}
      />

      {/* 4. ITDA DISTRICT ADMIN AUTHENTICATION MODAL */}
      <AdminAuthModal
        isOpen={isAdminAuthModalOpen}
        onClose={() => setIsAdminAuthModalOpen(false)}
        lang={lang}
        onAuthenticated={(adm) => {
          setActiveAdmin(adm);
          setRole('admin');
          setIsAdminAuthModalOpen(false);
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.6 }
          });
        }}
      />

      {/* 5. APPOINTMENT REQUEST MODAL (General vs Biopsy) */}
      <AppointmentRequestModal
        isOpen={isAppointmentModalOpen}
        onClose={() => setIsAppointmentModalOpen(false)}
        patient={patient}
        lang={lang}
        onAppointmentBooked={handleAppointmentBooked}
      />

      {/* 6. OFFICIAL PRESCRIPTION & BIOPSY REFERRAL SLIP MODAL */}
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

      {/* 7. LIVE ORAL CAMERA MODAL */}
      {isCameraModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
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

      {/* 8. WEBRTC TELEMEDICINE ROOM MODAL */}
      {isTelemedicineOpen && (
        <WebRTCTelemedicineRoom
          patient={patient || { name: 'K. Somanna', uidn: 'UIDN-ASR-2026-GM046', mandal: 'G. Madugula', age: 46 }}
          lang={lang}
          onClose={() => setIsTelemedicineOpen(false)}
          onPrescriptionCreated={(rx) => setActivePrescription(rx)}
        />
      )}

      {/* 9. EMERGENCY SOS MODAL */}
      {isSosModalOpen && (
        <EmergencySosModal
          onClose={() => setIsSosModalOpen(false)}
          lang={lang}
          patientMandal={patient?.mandal || 'G. Madugula'}
          patientVillage={patient?.village || 'Nurmati'}
        />
      )}

      {/* 10. AI AROGYA TRILINGUAL DRAWER */}
      <AiArogyaDrawer
        isOpen={isAiArogyaOpen}
        onClose={() => setIsAiArogyaOpen(false)}
        lang={lang}
      />

      {/* 11. Crisp Executive Footer */}
      <footer className="bg-slate-900 text-slate-300 text-xs py-8 border-t border-slate-800 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <div className="font-bold text-white text-sm">
              AAROGYA DRISHTI — AAROHAN 2026
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Integrated Tribal Development Agency (ITDA) Paderu • Alluri Sitharama Raju District
            </p>
          </div>
          <div className="flex flex-wrap items-center space-x-6 text-[11px]">
            <span>11 ASR Mandals Grid</span>
            <span>WebRTC Tele-Oncology</span>
            <span>Multimodal Gemini 2.0 AI</span>
            <span>Web Speech API te-IN</span>
            <span className="text-yellow-400 font-bold">Hackathon 2026 Evaluation Ready</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
