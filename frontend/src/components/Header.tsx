import React from 'react';
import {
  Activity,
  Languages,
  User,
  Stethoscope,
  Building2,
  Sparkles,
  PhoneCall,
  LogOut,
  ShieldCheck,
  CheckCircle2,
  Home
} from 'lucide-react';
import { Language, translations } from '../i18n/translations.ts';

export type ActiveRole = 'landing' | 'patient' | 'doctor' | 'admin';

interface HeaderProps {
  currentRole: ActiveRole;
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  onOpenSos: () => void;
  onOpenAiArogya?: () => void;
  activePatient?: any;
  activeDoctor?: any;
  activeAdmin?: any;
  onLogout: () => void;
  onNavigateHome?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  lang,
  onLanguageChange,
  onOpenSos,
  onOpenAiArogya,
  activePatient,
  activeDoctor,
  activeAdmin,
  onLogout,
  onNavigateHome
}) => {
  const t = translations[lang];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-amber-300/60 shadow-sm transition-all">
      {/* 1. Top District Logistics & Latency Bar */}
      <div className="bg-gradient-to-r from-amber-950 via-amber-900 to-amber-950 text-amber-100 px-4 sm:px-8 py-1.5 text-[11px] flex flex-wrap justify-between items-center gap-2 border-b border-amber-700/40">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-semibold tracking-wider text-amber-200 uppercase font-sans">
            ITDA PADERU | ALLURI SITHARAMA RAJU DISTRICT
          </span>
          <span className="opacity-60 hidden md:inline">• Integrated Tribal Healthcare Network (AP Govt)</span>
        </div>

        <div className="flex items-center space-x-3">
          {/* Live Latency Pill */}
          <div className="flex items-center space-x-1.5 bg-black/30 px-2.5 py-0.5 rounded-full border border-amber-500/30 text-[10px] text-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="font-mono">Sync Active (18ms)</span>
            <span className="opacity-50">|</span>
            <span>Offline Resilience</span>
          </div>

          {/* Emergency 108/104 SOS Button */}
          <button
            onClick={onOpenSos}
            className="bg-red-600 hover:bg-red-500 text-white font-extrabold px-3 py-0.5 rounded-full text-[10px] tracking-wide transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-red-500/30 active:scale-95 flex items-center space-x-1 animate-pulse"
          >
            <PhoneCall className="w-3 h-3" />
            <span>{t.emergencySos}</span>
          </button>
        </div>
      </div>

      {/* 2. Main Navigation Bar (STRICTLY ROLE-ISOLATED - NO ROLE SWITCHER TABS!) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Logo & Subtitle */}
        <div
          onClick={onNavigateHome}
          className="flex items-center space-x-3.5 cursor-pointer group select-none"
        >
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center text-white shadow-gold-glow flex-shrink-0 group-hover:scale-105 transition-transform">
            <Activity className="w-6 h-6 stroke-[2.3]" />
          </div>

          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-xl font-extrabold tracking-tight font-serif-royal gold-gradient-text">
                AAROGYA DRISHTI
              </h1>
              <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full border border-amber-300 shadow-sm">
                AAROHAN 2026
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              {currentRole === 'landing' && 'ITDA Paderu • Oral Cancer Detection & Care System'}
              {currentRole === 'patient' && 'Tribal Citizen Patient Care & Health Portal'}
              {currentRole === 'doctor' && 'Medical Officer & Tele-Oncology Command'}
              {currentRole === 'admin' && 'District Health Administration & 11 Mandals Registry'}
            </p>
          </div>
        </div>

        {/* Right Section: Role Profile Details, Language Switcher & Clean Logout */}
        <div className="flex flex-wrap items-center gap-3">
          {/* 1. PATIENT ACTIVE PILL */}
          {currentRole === 'patient' && activePatient && (
            <div className="hidden sm:flex items-center space-x-2 bg-amber-50/80 border border-amber-300 rounded-full px-3 py-1 text-xs shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-extrabold text-amber-950 font-serif-royal">{activePatient.name}</span>
              <span className="font-mono text-[10px] font-bold text-amber-700 bg-amber-200/60 px-1.5 py-0.5 rounded">
                {activePatient.uidn}
              </span>
            </div>
          )}

          {/* 2. DOCTOR ACTIVE PILL */}
          {currentRole === 'doctor' && activeDoctor && (
            <div className="hidden sm:flex items-center space-x-2 bg-emerald-50 border border-emerald-300 rounded-full px-3 py-1 text-xs shadow-sm">
              <Stethoscope className="w-3.5 h-3.5 text-emerald-700" />
              <span className="font-extrabold text-emerald-950">{activeDoctor.name}</span>
              <span className="text-[10px] text-emerald-800 font-medium hidden md:inline">
                • {activeDoctor.hospitalDuty?.split('(')[0] || 'AH Paderu'}
              </span>
            </div>
          )}

          {/* 3. ADMIN ACTIVE PILL */}
          {currentRole === 'admin' && (
            <div className="hidden sm:flex items-center space-x-2 bg-slate-100 border border-slate-300 rounded-full px-3 py-1 text-xs shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-700" />
              <span className="font-extrabold text-slate-900 font-serif-royal">ITDA Paderu Admin</span>
              <span className="text-[10px] bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded font-bold">
                11 Mandals Command
              </span>
            </div>
          )}

          {/* Trilingual Language Selector */}
          <div className="flex items-center space-x-1 bg-[#FAF9F5] border border-amber-200 rounded-xl p-1 text-[11px] font-bold">
            <button
              onClick={() => onLanguageChange('en')}
              className={`px-2 py-1 rounded-lg transition-all duration-200 hover:-translate-y-0.5 active:scale-95 ${
                lang === 'en' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-600 hover:bg-amber-50'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => onLanguageChange('te')}
              className={`px-2 py-1 rounded-lg transition-all duration-200 hover:-translate-y-0.5 active:scale-95 ${
                lang === 'te' ? 'bg-amber-500 text-white font-telugu shadow-sm' : 'text-slate-600 hover:bg-amber-50'
              }`}
            >
              తెలుగు
            </button>
            <button
              onClick={() => onLanguageChange('hi')}
              className={`px-2 py-1 rounded-lg transition-all duration-200 hover:-translate-y-0.5 active:scale-95 ${
                lang === 'hi' ? 'bg-amber-500 text-white font-devanagari shadow-sm' : 'text-slate-600 hover:bg-amber-50'
              }`}
            >
              हिंदी
            </button>
          </div>

          {/* AI Arogya Drawer Launcher (Only in Patient Portal) */}
          {currentRole === 'patient' && onOpenAiArogya && (
            <button
              onClick={onOpenAiArogya}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white font-extrabold text-xs shadow-gold-glow hover:brightness-110 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-500/30 active:scale-95 transition-all duration-200 flex items-center space-x-1.5 border border-amber-300 animate-pulse"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
              <span>AI AROGYA</span>
            </button>
          )}

          {/* Logout Action (Cleans Session & Returns to Welcome Entry) */}
          {currentRole !== 'landing' && (
            <button
              onClick={onLogout}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 border border-slate-300 hover:border-red-300 text-xs font-bold transition-all duration-200 hover:-translate-y-0.5 active:scale-95 flex items-center space-x-1.5 shadow-sm"
              title="Logout and return to Portal Entry Screen"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
