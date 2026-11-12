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
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div
        className="bg-white max-w-md w-full rounded-3xl border-2 border-emerald-400 shadow-2xl p-6 sm:p-8 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold font-serif-royal text-slate-900">
                Medical Officer Sign-In
              </h3>
              <p className="text-xs text-slate-500">
                ITDA Paderu Authorized Clinical Tele-Oncology Portal
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informative Notice */}
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3.5 text-xs text-emerald-950 flex items-start space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
          <span>
            Doctor accounts are provisioned exclusively by the ITDA District Health Admin. Sign in with your assigned Email or Doctor ID.
          </span>
        </div>

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Quick Demo Pre-fills */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Quick 1-Click Specialist Select (Demo Evaluation)
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill('DOC-SWAPNA', 'dr.swapna@aarogyadrishti.org')}
              className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                doctorIdOrEmail === 'DOC-SWAPNA'
                  ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold ring-1 ring-emerald-400'
                  : 'bg-[#FCFBF7] border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="font-bold">Dr. Swapna Devi, MDS</div>
              <div className="text-[10px] text-slate-500">Chief Onco-Pathologist</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('DOC-RAJESH', 'dr.rajesh@aarogyadrishti.org')}
              className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                doctorIdOrEmail === 'DOC-RAJESH'
                  ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold ring-1 ring-emerald-400'
                  : 'bg-[#FCFBF7] border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="font-bold">Dr. K. Rajesh, MS</div>
              <div className="text-[10px] text-slate-500">Head & Neck Surgeon</div>
            </button>
          </div>
        </div>

        {/* Sign-In Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Email Address or Doctor ID
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={doctorIdOrEmail}
                onChange={(e) => setDoctorIdOrEmail(e.target.value)}
                placeholder="e.g. DOC-SWAPNA or dr.swapna@aarogyadrishti.org"
                className="w-full bg-[#FAF9F5] border border-amber-300 rounded-xl pl-9 pr-3 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-slate-700">Password</label>
              <button
                type="button"
                onClick={() => setIsForgotOpen(true)}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 underline"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full bg-[#FAF9F5] border border-amber-300 rounded-xl pl-9 pr-3 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 hover:brightness-110 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-md transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In to Doctor Workspace'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Forgot Password Modal */}
        {isForgotOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-white max-w-sm w-full rounded-3xl p-6 border border-emerald-300 shadow-2xl space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-sm text-slate-900 font-serif-royal">
                  Doctor Password Reset
                </h4>
                <button
                  onClick={() => setIsForgotOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>

              {forgotSuccess ? (
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-300 text-center space-y-2">
                  <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto" />
                  <div className="font-bold text-xs text-emerald-950">Password Reset Successful!</div>
                </div>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-0.5">Doctor ID / Email</label>
                    <input
                      type="text"
                      value={forgotDocId}
                      onChange={(e) => setForgotDocId(e.target.value)}
                      className="w-full bg-[#FAF9F5] border border-slate-300 rounded-xl p-2 text-xs font-semibold"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-0.5">
                      Security Verification Code (Demo: ASR-DOC-2026)
                    </label>
                    <input
                      type="text"
                      value={forgotSecurityCode}
                      onChange={(e) => setForgotSecurityCode(e.target.value)}
                      className="w-full bg-[#FAF9F5] border border-slate-300 rounded-xl p-2 text-xs font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-0.5">New Password</label>
                    <input
                      type="password"
                      value={forgotNewPass}
                      onChange={(e) => setForgotNewPass(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full bg-[#FAF9F5] border border-slate-300 rounded-xl p-2 text-xs"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all"
                  >
                    Verify Code & Reset
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
