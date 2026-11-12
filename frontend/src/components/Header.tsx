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

  const getRoleSubtitle = () => {
    switch (currentRole) {
      case 'patient':
        return 'Tribal Citizen Patient Care & Health Portal';
      case 'doctor':
        return 'Medical Officer & Tele-Oncology Command';
      case 'admin':
        return 'District Health Administration & 11 Mandals Registry';
      default:
        return 'ITDA Paderu • Oral Cancer Detection & Care System';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all">
      {/* 1. Top District Logistics & Latency Bar (Deep Royal Blue & Slate) */}
      <div className="bg-slate-900 text-slate-100 px-4 sm:px-8 py-1.5 text-[11px] flex flex-wrap justify-between items-center gap-2 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-bold tracking-wider text-blue-200 uppercase">
            ITDA PADERU | ALLURI SITHARAMA RAJU DISTRICT
          </span>
          <span className="opacity-60 hidden md:inline text-slate-300">• Integrated Tribal Healthcare Network (AP Govt)</span>
        </div>

        <div className="flex items-center space-x-3">
          {/* Live Latency Pill */}
          <div className="flex items-center space-x-1.5 bg-slate-800/80 px-2.5 py-0.5 rounded-full border border-slate-700 text-[10px] text-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="font-mono">Sync Active (18ms)</span>
            <span className="opacity-50">|</span>
            <span className="text-slate-300">Offline Resilience</span>
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
          className="flex items-center space-x-3 cursor-pointer group select-none"
        >
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-royal-600 via-royal-700 to-royal-800 flex items-center justify-center text-white shadow-blue-card flex-shrink-0 group-hover:scale-105 transition-transform">
            <Activity className="w-6 h-6 stroke-[2.3]" />
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
                AAROGYA DRISHTI
              </h1>
              <span className="text-[10px] font-extrabold bg-yellow-100 text-slate-900 px-2.5 py-0.5 rounded-full border border-yellow-300 shadow-sm">
                AAROHAN 2026
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium notranslate">
              <span key={`header-sub-${currentRole}`}>{getRoleSubtitle()}</span>
            </p>
          </div>
        </div>

        {/* Right Section: Role Profile Details, Language Switcher & Clean Logout */}
        <div className="flex flex-wrap items-center gap-3">
          {/* 1. PATIENT ACTIVE PILL */}
          {currentRole === 'patient' && activePatient && (
            <div className="hidden sm:flex items-center space-x-2 bg-blue-50 border border-blue-200 rounded-full px-3 py-1 text-xs shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-extrabold text-slate-900">{activePatient.name}</span>
              <span className="font-mono text-[10px] font-bold text-royal-700 bg-blue-100 px-1.5 py-0.5 rounded">
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
              <span className="font-extrabold text-slate-900">ITDA Paderu Admin</span>
              <span className="text-[10px] bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded font-bold">
                11 Mandals Command
              </span>
            </div>
          )}

          {/* Trilingual Language Selector (తెలుగు, English, हिन्दी) */}
          <div className="flex items-center space-x-1.5 bg-slate-100 border border-slate-300 rounded-2xl p-1 text-xs font-black shadow-sm">
            <button
              onClick={() => onLanguageChange('te')}
              className={`px-3 py-1.5 rounded-xl transition-all duration-200 hover:-translate-y-0.5 active:scale-95 flex items-center space-x-1 ${
                lang === 'te'
                  ? 'bg-blue-700 text-white font-extrabold shadow-md'
                  : 'text-slate-700 hover:bg-slate-200'
              }`}
              title="తెలుగులోకి మార్చండి"
            >
              <span>తెలుగు</span>
            </button>
            <button
              onClick={() => onLanguageChange('en')}
              className={`px-3 py-1.5 rounded-xl transition-all duration-200 hover:-translate-y-0.5 active:scale-95 flex items-center space-x-1 ${
                lang === 'en'
                  ? 'bg-blue-700 text-white font-extrabold shadow-md'
                  : 'text-slate-700 hover:bg-slate-200'
              }`}
              title="Switch to English"
            >
              <span>English</span>
            </button>
            <button
              onClick={() => onLanguageChange('hi')}
              className={`px-3 py-1.5 rounded-xl transition-all duration-200 hover:-translate-y-0.5 active:scale-95 flex items-center space-x-1 ${
                lang === 'hi'
                  ? 'bg-blue-700 text-white font-extrabold shadow-md'
                  : 'text-slate-700 hover:bg-slate-200'
              }`}
              title="हिन्दी में बदलें"
            >
              <span>हिन्दी</span>
            </button>
          </div>

          {/* AI Arogya Drawer Launcher (Only in Patient Portal) */}
          {currentRole === 'patient' && onOpenAiArogya && (
            <button
              onClick={onOpenAiArogya}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 text-white font-extrabold text-xs shadow-md hover:brightness-110 hover:-translate-y-0.5 active:scale-95 transition-all duration-200 flex items-center space-x-1.5 border border-blue-600"
            >
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
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
