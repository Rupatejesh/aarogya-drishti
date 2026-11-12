import React, { useState } from 'react';
import {
  Stethoscope,
  Lock,
  Mail,
  KeyRound,
  CheckCircle,
  X,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import api from '../services/api.ts';
import { Language, translations } from '../i18n/translations.ts';

interface DoctorAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onAuthenticated: (doctor: any) => void;
}

export const DoctorAuthModal: React.FC<DoctorAuthModalProps> = ({
  isOpen,
  onClose,
  lang,
  onAuthenticated
}) => {
  const t = translations[lang];

  // Form states
  const [doctorIdOrEmail, setDoctorIdOrEmail] = useState('DOC-SWAPNA');
  const [password, setPassword] = useState('Aarogya@2026');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Forgot password modal state
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotDocId, setForgotDocId] = useState('DOC-SWAPNA');
  const [forgotSecurityCode, setForgotSecurityCode] = useState('ASR-DOC-2026');
  const [forgotNewPass, setForgotNewPass] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.doctorLogin(doctorIdOrEmail, password);
      if (res.doctor) {
        onAuthenticated(res.doctor);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Doctor login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (docId: string, email: string) => {
    setDoctorIdOrEmail(docId);
    setPassword('Aarogya@2026');
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.doctorResetPassword(forgotDocId, forgotSecurityCode, forgotNewPass);
      setForgotSuccess(true);
      setTimeout(() => {
        setIsForgotOpen(false);
        setForgotSuccess(false);
        setDoctorIdOrEmail(forgotDocId);
      }, 1500);
    } catch (err: any) {
      alert(`Reset failed: ${err.response?.data?.message || err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div
        className="bg-white max-w-md w-full rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-royal-600 text-white flex items-center justify-center shadow-blue-card">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-slate-900">
                Doctor Portal Sign-In
              </h3>
              <p className="text-xs text-slate-500">
                Authorized Onco-Pathologists & Medical Officers
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

        {/* Demo Fast-Track Card for Evaluators */}
        <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-royal-950 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-royal-600" />
              <span>Hackathon Evaluator 1-Click Credentials</span>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleQuickFill('DOC-SWAPNA', 'dr.swapna@aarogyadrishti.org')}
              className="p-2 rounded-xl bg-white border border-blue-200 hover:border-royal-500 text-left transition-all"
            >
              <div className="text-[11px] font-extrabold text-slate-900">Dr. Swapna Devi, MDS</div>
              <div className="text-[10px] text-royal-700 font-mono">DOC-SWAPNA</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('DOC-RAJESH', 'dr.rajesh@aarogyadrishti.org')}
              className="p-2 rounded-xl bg-white border border-blue-200 hover:border-royal-500 text-left transition-all"
            >
              <div className="text-[11px] font-extrabold text-slate-900">Dr. K. Rajesh, MS</div>
              <div className="text-[10px] text-royal-700 font-mono">DOC-RAJESH</div>
            </button>
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
              Doctor User-ID or Official Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={doctorIdOrEmail}
                autoComplete="username"
                onChange={(e) => setDoctorIdOrEmail(e.target.value)}
                placeholder="DOC-SWAPNA or doctor@aarogyadrishti.org"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-royal-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-slate-700">Account Password</label>
              <button
                type="button"
                onClick={() => setIsForgotOpen(true)}
                className="text-[11px] text-royal-600 hover:text-royal-800 font-bold"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="password"
                value={password}
                autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-royal-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-royal-600 hover:bg-royal-700 text-white font-bold text-xs rounded-xl shadow-blue-card transition-all flex items-center justify-center space-x-2"
          >
            {loading ? (
              <span>Authenticating Doctor...</span>
            ) : (
              <>
                <span>Enter Doctor Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>ABDM Verified Telemedicine Hub</span>
          <span className="font-mono text-[10px]">AP-7821</span>
        </div>

        {/* Forgot Password Sub-Modal */}
        {isForgotOpen && (
          <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white max-w-sm w-full rounded-3xl p-6 border border-slate-200 shadow-2xl space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
                  <KeyRound className="w-4 h-4 text-royal-600" />
                  <span>Reset Doctor Password</span>
                </h4>
                <button
                  onClick={() => setIsForgotOpen(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold"
                >
                  ✕
                </button>
              </div>

              {forgotSuccess ? (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 text-center font-bold">
                  Password updated! Redirecting to login...
                </div>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-0.5">Doctor ID</label>
                    <input
                      type="text"
                      value={forgotDocId}
                      onChange={(e) => setForgotDocId(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-0.5">
                      Security Code (Demo: ASR-DOC-2026)
                    </label>
                    <input
                      type="text"
                      value={forgotSecurityCode}
                      onChange={(e) => setForgotSecurityCode(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-0.5">New Password</label>
                    <input
                      type="password"
                      value={forgotNewPass}
                      autoComplete="new-password"
                      onChange={(e) => setForgotNewPass(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-royal-600 hover:bg-royal-700 text-white rounded-xl text-xs font-bold transition-all"
                  >
                    Confirm Password Reset
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorAuthModal;
