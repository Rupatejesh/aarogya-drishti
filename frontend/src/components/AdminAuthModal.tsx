import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  Building2,
  X,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import api from '../services/api.ts';
import { Language, translations } from '../i18n/translations.ts';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onAuthenticated: (admin: any) => void;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  lang,
  onAuthenticated
}) => {
  const t = translations[lang];

  const [email, setEmail] = useState('admin@itdapaderu.gov.in');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.adminLogin(email, password);
      if (res.admin) {
        onAuthenticated(res.admin);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Admin authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = () => {
    setEmail('admin@itdapaderu.gov.in');
    setPassword('admin123');
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div
        className="bg-white max-w-md w-full rounded-3xl border-2 border-amber-400 shadow-2xl p-6 sm:p-8 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-900 to-amber-950 flex items-center justify-center text-amber-400 shadow-md">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold font-serif-royal text-slate-950">
                ITDA District Admin Sign-In
              </h3>
              <p className="text-xs text-slate-500">
                Alluri Sitharama Raju District • 11 Mandals Command
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Demo Fast Track Badge */}
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-950 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Hackathon Evaluator 1-Click Credentials</span>
            </span>
            <button
              type="button"
              onClick={handleQuickFill}
              className="text-[11px] font-extrabold text-amber-900 bg-amber-200/80 hover:bg-amber-300 px-2.5 py-1 rounded-lg border border-amber-400 transition-all hover:-translate-y-0.5"
            >
              Fill Admin Demo
            </button>
          </div>
          <div className="text-[11px] text-amber-800 font-mono flex items-center justify-between pt-1 border-t border-amber-200">
            <span>Email: <strong>admin@itdapaderu.gov.in</strong></span>
            <span>Pass: <strong>admin123</strong></span>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Admin Official Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@itdapaderu.gov.in"
                className="w-full pl-9 pr-3 py-2.5 bg-[#FAF9F5] border border-amber-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Command Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 bg-[#FAF9F5] border border-amber-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-amber-200 font-extrabold text-xs rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition-all duration-200 flex items-center justify-center space-x-2 border border-amber-400/50 disabled:opacity-50"
          >
            {loading ? (
              <span>Authenticating Command Authority...</span>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Enter 11 Mandals Admin Command</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>AP Govt ITDA Paderu Secure Enclave</span>
          </span>
          <span className="font-mono text-[10px]">AUTH-v2.6</span>
        </div>
      </div>
    </div>
  );
};

export default AdminAuthModal;
