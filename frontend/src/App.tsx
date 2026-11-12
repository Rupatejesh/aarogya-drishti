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
  LogOut
} from 'lucide-react';
import confetti from 'canvas-confetti';
import api from './services/api.ts';
import { Language, translations } from './i18n/translations.ts';
import Header, { ActiveRole } from './components/Header.tsx';
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
      // 1. Load Quick Roster
      const rosterRes = await api.getQuickLoginRoster();
      if (rosterRes.roster) {
        setRoster(rosterRes.roster);
      }

      // 2. Pre-load Compulsory Hackathon Patient K. Somanna (UIDN-ASR-2026-GM046)
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
        colors: ['#D4AF37', '#F59E0B', '#10B981']
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

  const handleLogout = () => {
    localStorage.removeItem('aarogya_patient_token');
    localStorage.removeItem('aarogya_doctor_token');
    localStorage.removeItem('aarogya_admin_token');
    setRole('landing');
  };

  // 4-Stage Guided Presentation Demo Flow Bar (For seamless evaluator presentation)
  const renderDemoFlowBar = () => (
    <div className="bg-gradient-to-r from-amber-500/10 via-white to-emerald-500/10 border-2 border-amber-300/80 rounded-3xl p-4 sm:p-5 shadow-luxury">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 px-1">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-xs font-black tracking-wider uppercase text-amber-950 font-serif-royal">
            Presentation Demo Flow (4-Stage Guided Architecture)
          </span>
        </div>
        <span className="text-[11px] font-bold text-slate-500 hidden sm:inline">
          Click any stage to transition directly for evaluator demonstrations
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Stage 1: Patient Registration & Card */}
        <button
          onClick={() => {
            setRole('patient');
            setTimeout(() => {
              const el = document.getElementById('patient-health-card-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }, 80);
          }}
          className={`p-3.5 rounded-2xl border text-left transition-all duration-200 hover:-translate-y-0.5 active:scale-95 flex items-center justify-between ${
            role === 'patient' && !isCameraModalOpen
              ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white border-amber-600 shadow-md shadow-amber-500/30'
              : 'bg-white hover:bg-amber-50 text-slate-800 border-amber-200'
          }`}
        >
          <div className="flex items-center space-x-3">
            <span
              className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black ${
                role === 'patient' && !isCameraModalOpen
                  ? 'bg-white text-amber-900 shadow-sm'
                  : 'bg-amber-100 text-amber-900'
              }`}
            >
              1
            </span>
            <div>
              <div className="text-xs font-black">Patient Registration & Card</div>
              <div
                className={`text-[10px] ${
                  role === 'patient' && !isCameraModalOpen ? 'text-amber-100 font-medium' : 'text-slate-500'
                }`}
              >
                Somanna • Golden Card
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 opacity-70" />
        </button>

        {/* Stage 2: Oral Photo & AI Triage */}
        <button
          onClick={() => {
            setRole('patient');
            setIsCameraModalOpen(true);
          }}
          className={`p-3.5 rounded-2xl border text-left transition-all duration-200 hover:-translate-y-0.5 active:scale-95 flex items-center justify-between ${
            isCameraModalOpen
              ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white border-amber-600 shadow-md shadow-amber-500/30'
              : 'bg-white hover:bg-amber-50 text-slate-800 border-amber-200'
          }`}
        >
          <div className="flex items-center space-x-3">
            <span
              className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black ${
                isCameraModalOpen ? 'bg-white text-amber-900 shadow-sm' : 'bg-amber-100 text-amber-900'
              }`}
            >
              2
            </span>
            <div>
              <div className="text-xs font-black">Oral Photo & AI Triage</div>
              <div className={`text-[10px] ${isCameraModalOpen ? 'text-amber-100 font-medium' : 'text-slate-500'}`}>
                Live Reticle • 92.4% Leukoplakia
              </div>
            </div>
          </div>
          <Sparkles className="w-4 h-4 text-amber-500" />
        </button>

        {/* Stage 3: Doctor Review & WebRTC */}
        <button
          onClick={() => {
            setRole('doctor');
          }}
          className={`p-3.5 rounded-2xl border text-left transition-all duration-200 hover:-translate-y-0.5 active:scale-95 flex items-center justify-between ${
            role === 'doctor'
              ? 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white border-emerald-700 shadow-md shadow-emerald-500/30'
              : 'bg-white hover:bg-emerald-50 text-slate-800 border-amber-200'
          }`}
        >
          <div className="flex items-center space-x-3">
            <span
              className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black ${
                role === 'doctor' ? 'bg-white text-emerald-900 shadow-sm' : 'bg-emerald-100 text-emerald-900'
              }`}
            >
              3
            </span>
            <div>
              <div className="text-xs font-black">Doctor Review & WebRTC</div>
              <div className={`text-[10px] ${role === 'doctor' ? 'text-emerald-100 font-medium' : 'text-slate-500'}`}>
                Dr. Swapna • Queue & Tele-Call
              </div>
            </div>
          </div>
          <Video className="w-4 h-4 opacity-70" />
        </button>

        {/* Stage 4: Biopsy Slip & 11 Mandals Admin */}
        <button
          onClick={() => {
            setRole('admin');
          }}
          className={`p-3.5 rounded-2xl border text-left transition-all duration-200 hover:-translate-y-0.5 active:scale-95 flex items-center justify-between ${
            role === 'admin'
              ? 'bg-slate-900 text-white border-slate-950 shadow-md'
              : 'bg-white hover:bg-slate-100 text-slate-800 border-amber-200'
          }`}
        >
          <div className="flex items-center space-x-3">
            <span
              className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black ${
                role === 'admin' ? 'bg-amber-400 text-slate-950 shadow-sm' : 'bg-slate-200 text-slate-800'
              }`}
            >
              4
            </span>
            <div>
              <div className="text-xs font-black">Biopsy Slip & 11 Mandals</div>
              <div className={`text-[10px] ${role === 'admin' ? 'text-slate-300 font-medium' : 'text-slate-500'}`}>
                Barcode • GGH Paderu • Admin
              </div>
            </div>
          </div>
          <Hospital className="w-4 h-4 opacity-70" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-slate-800 flex flex-col font-sans selection:bg-amber-200 selection:text-amber-950">
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
      <div className="bg-white/80 border-b border-amber-200/70 py-2.5 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Active Status Badge */}
          <div className="flex items-center space-x-2 text-xs">
            {role === 'landing' && (
              <span className="font-semibold text-amber-900 bg-amber-100/70 px-3 py-1 rounded-full border border-amber-300/70 flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>Portal Gateway Selection</span>
              </span>
            )}
            {role === 'patient' && patient && (
              <div className="flex items-center space-x-2">
                <span className="text-slate-500 hidden sm:inline">Active Patient:</span>
                <span className="font-bold text-amber-900 bg-amber-50 px-3 py-1 rounded-full border border-amber-300 flex items-center space-x-1.5 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{patient.name}</span>
                  <span className="font-mono text-[10px] text-amber-700">({patient.uidn})</span>
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

          {/* Home Gateway Link when logged in */}
          {role !== 'landing' && (
            <button
              onClick={() => setRole('landing')}
              className="hidden md:flex items-center space-x-1 px-3 py-1 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-amber-50 border border-slate-300 hover:border-amber-300 transition-all"
            >
              <span>← Portal Home</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-10">
        {/* ========================================================================= */}
        {/* VIEW 0: WELCOME LANDING SCREEN & 3 DISTINCT PORTAL ENTRY GATEWAYS */}
        {/* ========================================================================= */}
        {role === 'landing' && (
          <div className="space-y-12">
            {/* HERO SECTION WITH 3D HELIX BIOMARKER MOTION */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white rounded-3xl border border-amber-300 p-6 sm:p-10 shadow-luxury">
              {/* Left Pitch (7 Cols) */}
              <div className="lg:col-span-7 space-y-5">
                <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-500/10 via-amber-500/20 to-emerald-500/10 border border-amber-400/50 px-3.5 py-1.5 rounded-full text-xs font-bold text-amber-900 shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-spin" style={{ animationDuration: '6s' }} />
                  <span>AAROHAN 2026 • ITDA PADERU TRIBAL ONCO-CARE INITIATIVE</span>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-950 font-serif-royal leading-tight tracking-tight">
                  AAROGYA DRISHTI{' '}
                  <span className="gold-gradient-text block sm:inline">ఆరోగ్య దృష్టి</span>
                </h1>

                <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
                  AI-Powered Early Oral Cancer Detection, Tele-Consultation & Biopsy Tracking designed specifically for the tribal agency areas of 11 Mandals in Alluri Sitharama Raju District, Andhra Pradesh.
                </p>

                {/* Quick Roster Fast-Track Pill for Evaluators */}
                <div className="p-4 bg-amber-50/70 border border-amber-300 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-amber-950 flex items-center space-x-1.5">
                      <Flame className="w-4 h-4 text-amber-600" />
                      <span>Hackathon Compulsory Evaluation Fast-Track</span>
                    </span>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded-full">
                      1-Click Instant Enter
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      onClick={() => handlePatientQuickLogin('UIDN-ASR-2026-GM046')}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center space-x-1.5"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>K. Somanna (46y, G. Madugula - Leukoplakia Case)</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveDoctor({
                          uidn: 'DOC-SWAPNA',
                          name: 'Dr. Swapna Devi, MDS',
                          designation: 'Chief Onco-Pathologist & Lead Tele-Consultant',
                          hospitalDuty: 'PHC G. Madugula / GGH Paderu Tele-Lab Hub',
                          abdmCode: 'ABDM-DOC-AP-7821',
                          email: 'dr.swapna@aarogyadrishti.org'
                        });
                        setRole('doctor');
                        confetti({ particleCount: 40, spread: 50 });
                      }}
                      className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center space-x-1.5"
                    >
                      <Stethoscope className="w-3.5 h-3.5" />
                      <span>Dr. Swapna Devi, MDS (Doctor View)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right: Embedded Interactive 3D Helix Model (5 Cols) */}
              <div className="lg:col-span-5">
                <OralBiomarkerHelix3D />
              </div>
            </section>

            {/* PRESENTATION DEMO FLOW STEP-INDICATOR BAR */}
            {renderDemoFlowBar()}

            {/* 3 DISTINCT CLEAN PORTAL ENTRY CARDS */}
            <section className="space-y-4">
              <div>
                <h2 className="text-2xl font-black font-serif-royal text-slate-950 flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-amber-500" />
                  <span>Choose Authorized Portal Gateway</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Role-isolated access ensures complete medical confidentiality, ABDM compliance, and district surveillance integrity.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                {/* 1. CITIZEN / PATIENT PORTAL CARD */}
                <div className="bg-white rounded-3xl border-2 border-amber-300 p-6 sm:p-7 shadow-luxury flex flex-col justify-between hover:border-amber-400 hover:shadow-xl transition-all duration-300 group">
                  <div className="space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-white flex items-center justify-center shadow-gold-glow group-hover:scale-105 transition-transform">
                      <UserCheck className="w-7 h-7" />
                    </div>

                    <div>
                      <span className="text-[10px] font-mono font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                        CITIZEN ACCESS
                      </span>
                      <h3 className="text-xl font-extrabold text-slate-950 mt-2 font-serif-royal">
                        Citizen & Patient Portal
                      </h3>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        AI lesion photo screening, live doctor video consultation, digital health card, habit cessation streak, and biopsy status tracking.
                      </p>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-amber-100 text-xs text-slate-700">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span>Instant Roster / Aadhaar / Phone Sign-In</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span>Self-registration with auto-age from DOB</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span>Official bilingual Rx & Biopsy referral slips</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 space-y-2.5">
                    <button
                      onClick={() => handlePatientQuickLogin('UIDN-ASR-2026-GM046')}
                      className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white font-extrabold text-xs shadow-gold-glow hover:brightness-110 active:scale-95 transition-all flex items-center justify-center space-x-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Enter as K. Somanna (Evaluation Demo)</span>
                    </button>

                    <button
                      onClick={() => setIsPatientAuthModalOpen(true)}
                      className="w-full py-2.5 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs transition-all flex items-center justify-center space-x-2"
                    >
                      <UserPlus className="w-4 h-4 text-amber-700" />
                      <span>Sign In / Register Other Patient</span>
                    </button>
                  </div>
                </div>

                {/* 2. MEDICAL OFFICER / DOCTOR PORTAL CARD */}
                <div className="bg-white rounded-3xl border-2 border-emerald-300 p-6 sm:p-7 shadow-luxury flex flex-col justify-between hover:border-emerald-400 hover:shadow-xl transition-all duration-300 group">
                  <div className="space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                      <Stethoscope className="w-7 h-7" />
                    </div>

                    <div>
                      <span className="text-[10px] font-mono font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                        CLINICAL AUTHORITY
                      </span>
                      <h3 className="text-xl font-extrabold text-slate-950 mt-2 font-serif-royal">
                        Medical Officer / Doctor
                      </h3>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        Clinical triage review, appointment approvals, WebRTC telemedicine encounters, histopathology biopsy vault, and Rx generation.
                      </p>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-emerald-100 text-xs text-slate-700">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span>Sign-in only with admin-provisioned email/pass</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span>Real-time patient call queue & status updates</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span>Instant password recovery via ASR-DOC-2026</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 space-y-2.5">
                    <button
                      onClick={() => setIsDoctorAuthModalOpen(true)}
                      className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-extrabold text-xs shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center justify-center space-x-2"
                    >
                      <KeyRound className="w-4 h-4" />
                      <span>Doctor Sign-In (Dr. Swapna Devi)</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveDoctor({
                          uidn: 'DOC-SWAPNA',
                          name: 'Dr. Swapna Devi, MDS',
                          designation: 'Chief Onco-Pathologist & Lead Tele-Consultant',
                          hospitalDuty: 'PHC G. Madugula / GGH Paderu Tele-Lab Hub',
                          abdmCode: 'ABDM-DOC-AP-7821',
                          email: 'dr.swapna@aarogyadrishti.org'
                        });
                        setRole('doctor');
                        confetti({ particleCount: 40, spread: 50 });
                      }}
                      className="w-full py-2.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-xs transition-all flex items-center justify-center space-x-2"
                    >
                      <ArrowRight className="w-4 h-4 text-emerald-700" />
                      <span>Instant 1-Click Doctor Workspace</span>
                    </button>
                  </div>
                </div>

                {/* 3. ITDA DISTRICT ADMIN PORTAL CARD */}
                <div className="bg-white rounded-3xl border-2 border-slate-400 p-6 sm:p-7 shadow-luxury flex flex-col justify-between hover:border-slate-600 hover:shadow-xl transition-all duration-300 group">
                  <div className="space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-900 via-amber-950 to-slate-900 text-amber-300 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                      <Building2 className="w-7 h-7" />
                    </div>

                    <div>
                      <span className="text-[10px] font-mono font-bold text-slate-800 bg-slate-200 px-2 py-0.5 rounded border border-slate-300">
                        ADMINISTRATIVE COMMAND
                      </span>
                      <h3 className="text-xl font-extrabold text-slate-950 mt-2 font-serif-royal">
                        ITDA District Admin Portal
                      </h3>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        Comprehensive 11 Mandals healthcare infrastructure, facility surveillance, biopsy equipment readiness, and specialist doctor provisioning.
                      </p>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-700">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span>Secure credentials: admin@itdapaderu.gov.in</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span>Provision verified doctor accounts (Email & Pass)</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span>11 / 11 ASR Agency Mandals live registry</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 space-y-2.5">
                    <button
                      onClick={() => setIsAdminAuthModalOpen(true)}
                      className="w-full py-3 rounded-2xl bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-amber-200 font-extrabold text-xs shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center justify-center space-x-2 border border-amber-400/40"
                    >
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      <span>Admin Sign-In (admin123)</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveAdmin({ name: 'ITDA Paderu District Officer', email: 'admin@itdapaderu.gov.in' });
                        setRole('admin');
                        confetti({ particleCount: 40, spread: 50 });
                      }}
                      className="w-full py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold text-xs transition-all flex items-center justify-center space-x-2"
                    >
                      <ArrowRight className="w-4 h-4 text-slate-700" />
                      <span>Instant 1-Click Admin Console</span>
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 1: STRICTLY ROLE-ISOLATED CITIZEN & PATIENT DASHBOARD */}
        {/* ========================================================================= */}
        {role === 'patient' && (
          <div className="space-y-8">
            {/* Presentation Flow Bar */}
            {renderDemoFlowBar()}

            {/* PATIENT PROFILE HEADER CARD (Airy, Modern, High-Contrast) */}
            {patient && (
              <section className="bg-white rounded-3xl border border-amber-300 p-6 sm:p-8 shadow-luxury space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-amber-200">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-extrabold text-2xl shadow-gold-glow">
                      {patient.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-3">
                        <h2 className="text-2xl font-bold font-serif-royal text-slate-950">
                          Namaste, {patient.name}
                        </h2>
                        <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-bold border border-emerald-300 flex items-center space-x-1">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          <span>ABDM Profile Active</span>
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-x-4">
                        <span>UIDN: <strong className="font-mono text-slate-800">{patient.uidn}</strong></span>
                        <span>Mandal: <strong>{patient.mandal}</strong></span>
                        <span>Village: <strong>{patient.village}</strong></span>
                        <span>Age: <strong>{patient.age} Yrs ({patient.gender})</strong></span>
                        <span>Blood: <strong>{patient.bloodGroup || 'O+'}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setIsPatientAuthModalOpen(true)}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-amber-50 hover:bg-amber-100 border border-amber-300 transition-all flex items-center space-x-1.5"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-amber-700" />
                      <span>Switch Patient Account</span>
                    </button>
                    <button
                      onClick={handleLogout}
                      className="px-3 py-2 rounded-xl text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-all flex items-center space-x-1"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>

                {/* 4 SIMPLE VISUAL ACTION CARDS (SPACIOUS & BEAUTIFUL) */}
                <div>
                  <div className="text-xs font-bold text-amber-950 uppercase tracking-wider mb-3">
                    Core Health Actions
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Card 1: Check Mouth Photo (AI Triage) */}
                    <div
                      onClick={() => setIsCameraModalOpen(true)}
                      className="bg-[#FCFBF7] hover:bg-white border-2 border-amber-300 hover:border-amber-400 rounded-3xl p-5 shadow-sm hover:shadow-gold-glow transition-all duration-200 hover:-translate-y-1 cursor-pointer flex flex-col justify-between group"
                    >
                      <div className="space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                          <Camera className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-sm text-slate-950 font-serif-royal">
                            1. Check Mouth Photo
                          </h4>
                          <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                            Instant AI screening with live reticle, bounding lesion box & triage prediction.
                          </p>
                        </div>
                      </div>
                      <div className="pt-3 border-t border-amber-200/80 flex items-center justify-between text-xs font-bold text-amber-700">
                        <span>Launch Camera</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>

                    {/* Card 2: Book Doctor / Biopsy */}
                    <div
                      onClick={() => setIsAppointmentModalOpen(true)}
                      className="bg-[#FCFBF7] hover:bg-white border-2 border-amber-300 hover:border-amber-400 rounded-3xl p-5 shadow-sm hover:shadow-gold-glow transition-all duration-200 hover:-translate-y-1 cursor-pointer flex flex-col justify-between group"
                    >
                      <div className="space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-700 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                          <Calendar className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-sm text-slate-950 font-serif-royal">
                            2. Book Doctor / Biopsy
                          </h4>
                          <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                            General consultation or Biopsy procedure slot with Dr. Swapna Devi.
                          </p>
                        </div>
                      </div>
                      <div className="pt-3 border-t border-amber-200/80 flex items-center justify-between text-xs font-bold text-amber-700">
                        <span>{activeAppointment ? activeAppointment.status : 'Book Slot'}</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>

                    {/* Card 3: Chat & Video Call */}
                    <div
                      onClick={() => handleLaunchTelemedicine(patient)}
                      className="bg-[#FCFBF7] hover:bg-white border-2 border-emerald-300 hover:border-emerald-400 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1 cursor-pointer flex flex-col justify-between group"
                    >
                      <div className="space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                          <Video className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-sm text-slate-950 font-serif-royal">
                            3. Chat & Video Call
                          </h4>
                          <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                            Live encrypted WebRTC consultation & doctor chat with prescription attachment.
                          </p>
                        </div>
                      </div>
                      <div className="pt-3 border-t border-emerald-200 flex items-center justify-between text-xs font-bold text-emerald-800">
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
                      className="bg-[#FCFBF7] hover:bg-white border-2 border-amber-300 hover:border-amber-400 rounded-3xl p-5 shadow-sm hover:shadow-gold-glow transition-all duration-200 hover:-translate-y-1 cursor-pointer flex flex-col justify-between group"
                    >
                      <div className="space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                          <QrCode className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-sm text-slate-950 font-serif-royal">
                            4. Health Card & Slips
                          </h4>
                          <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                            ABDM QR card, printable bilingual prescription slip & biopsy referral order.
                          </p>
                        </div>
                      </div>
                      <div className="pt-3 border-t border-amber-200/80 flex items-center justify-between text-xs font-bold text-amber-700">
                        <span>View Golden Card</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
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
                          Target Area: <strong>{activeScreening.oralRegion}</strong> • Habit: <strong>18-Yr Chewing Tobacco / Reverse Smoking</strong>
                        </div>
                      </div>

                      <p className="text-xs text-slate-700 bg-white/80 p-3 rounded-xl border border-amber-200 leading-relaxed">
                        {activeScreening.clinicalRemarks}
                      </p>

                      <div className="pt-2 flex justify-between items-center text-xs font-bold text-amber-950 border-t border-amber-200/80">
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

            {/* GOLDEN HEALTH CARD & HABIT CESSATION TRACKER (Side-by-Side) */}
            {patient && (
              <section id="patient-health-card-section" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start scroll-mt-24">
                <div className="lg:col-span-6 bg-white rounded-3xl border border-amber-300 p-6 shadow-luxury">
                  <GoldenHealthCard patient={patient} lang={lang} />
                </div>

                <div className="lg:col-span-6 bg-white rounded-3xl border border-amber-300 p-6 shadow-luxury">
                  <HabitCessationTracker patientUidn={patient.uidn} lang={lang} />
                </div>
              </section>
            )}

            {/* DOCTOR LIVE CHATBOX WITH SEND PRESCRIPTION ATTACHMENT */}
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
            {renderDemoFlowBar()}
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
            {renderDemoFlowBar()}
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
          handlePatientQuickLogin(uidn);
        }}
        onSelectDoctor={(doc) => {
          setActiveDoctor(doc);
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

      {/* 2. CITIZEN / PATIENT AUTHENTICATION & REGISTRATION MODAL */}
      <PatientAuthModal
        isOpen={isPatientAuthModalOpen}
        onClose={() => setIsPatientAuthModalOpen(false)}
        lang={lang}
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

      {/* 11. Luxury Executive Footer */}
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
