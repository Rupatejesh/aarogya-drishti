import React from 'react';
import {
  Activity,
  AlertOctagon,
  Languages,
  User,
  Stethoscope,
  Building2,
  Sparkles,
  Wifi,
  Radio,
  PhoneCall
} from 'lucide-react';
import { Language, translations } from '../i18n/translations.ts';

export type UserRoleTab = 'patient' | 'doctor' | 'admin';

interface HeaderProps {
  currentRole: UserRoleTab;
  onRoleChange: (role: UserRoleTab) => void;
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  onOpenSos: () => void;
  onOpenAiArogya: () => void;
  activePatientName?: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onRoleChange,
  lang,
  onLanguageChange,
  onOpenSos,
  onOpenAiArogya,
  activePatientName
}) => {
  const t = translations[lang];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-amber-300/60 shadow-sm transition-all">
      {/* Top District & Latency Bar */}
      <div className="bg-gradient-to-r from-amber-950 via-amber-900 to-amber-950 text-amber-100 px-4 sm:px-8 py-1.5 text-[11px] flex flex-wrap justify-between items-center gap-2 border-b border-amber-700/40">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-semibold tracking-wider text-amber-200 uppercase font-sans">
            ITDA PADERU | ALLURI SITHARAMA RAJU DISTRICT
          </span>
          <span className="opacity-60 hidden md:inline">• Andhra Pradesh Tribal Healthcare Network</span>
        </div>

        <div className="flex items-center space-x-3">
          {/* Live Latency Pill */}
          <div className="flex items-center space-x-1.5 bg-black/30 px-2.5 py-0.5 rounded-full border border-amber-500/30 text-[10px] text-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="font-mono">{t.onlineSync} (18ms)</span>
            <span className="opacity-50">|</span>
            <span>{t.offlineDrafts}</span>
          </div>

          {/* Emergency 108/104 SOS Button */}
          <button
            onClick={onOpenSos}
            className="bg-red-600 hover:bg-red-500 text-white font-bold px-3 py-0.5 rounded-full text-[10px] tracking-wide transition-all shadow-sm flex items-center space-x-1 animate-pulse"
          >
            <PhoneCall className="w-3 h-3" />
            <span>{t.emergencySos}</span>
          </button>
        </div>
      </div>

      {/* Main Header Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Logo & Subtitle */}
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center text-white shadow-gold-glow flex-shrink-0">
            <Activity className="w-6 h-6 stroke-[2.3]" />
          </div>

          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-xl font-extrabold tracking-tight font-serif-royal gold-gradient-text">
                {t.appName}
              </h1>
              <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full border border-amber-300 shadow-sm">
                {t.pillBadge}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              {t.subtitle}
            </p>
          </div>
        </div>

        {/* Right Section: Role Switcher, Language Toggle, and AI Arogya Drawer Launcher */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Role Switcher Tabs */}
          <div className="bg-[#FAF9F5] p-1 rounded-2xl border border-amber-200 flex items-center space-x-1 shadow-inner text-xs">
            <button
              onClick={() => onRoleChange('patient')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center space-x-1.5 ${
                currentRole === 'patient'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-amber-900 hover:bg-amber-50'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>{t.rolePatient}</span>
            </button>

            <button
              onClick={() => onRoleChange('doctor')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center space-x-1.5 ${
                currentRole === 'doctor'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-amber-900 hover:bg-amber-50'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span>{t.roleDoctor}</span>
            </button>

            <button
              onClick={() => onRoleChange('admin')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center space-x-1.5 ${
                currentRole === 'admin'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-amber-900 hover:bg-amber-50'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>{t.roleAdmin}</span>
            </button>
          </div>

          {/* Language Toggle */}
          <div className="flex items-center space-x-1 bg-[#FAF9F5] border border-amber-200 rounded-xl p-1 text-[11px] font-bold">
            <button
              onClick={() => onLanguageChange('en')}
              className={`px-2 py-1 rounded-lg transition-all ${
                lang === 'en' ? 'bg-amber-500 text-white' : 'text-slate-600 hover:bg-amber-50'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => onLanguageChange('te')}
              className={`px-2 py-1 rounded-lg transition-all ${
                lang === 'te' ? 'bg-amber-500 text-white font-telugu' : 'text-slate-600 hover:bg-amber-50'
              }`}
            >
              తెలుగు
            </button>
            <button
              onClick={() => onLanguageChange('hi')}
              className={`px-2 py-1 rounded-lg transition-all ${
                lang === 'hi' ? 'bg-amber-500 text-white font-devanagari' : 'text-slate-600 hover:bg-amber-50'
              }`}
            >
              हिंदी
            </button>
          </div>

          {/* AI Arogya Floating Drawer Launcher */}
          <button
            onClick={onOpenAiArogya}
            className="px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white font-extrabold text-xs shadow-gold-glow hover:brightness-110 active:scale-95 transition-all flex items-center space-x-2 border border-amber-300"
          >
            <Sparkles className="w-4 h-4 text-amber-200 animate-spin" style={{ animationDuration: '6s' }} />
            <span>{t.aiArogyaLauncher}</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;

