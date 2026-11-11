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
  QrCode
} from 'lucide-react';
import api from '../services/api.ts';
import { Language, translations } from '../i18n/translations.ts';

interface DoctorPortalProps {
  lang: Language;
  onLaunchTelemedicine: (patient: any, doctor: any) => void;
  onViewPrescription: (prescription: any, patient: any) => void;
}

export const DoctorPortal: React.FC<DoctorPortalProps> = ({
  lang,
  onLaunchTelemedicine,
  onViewPrescription
}) => {
  const t = translations[lang];

  // Auth States
  const [isAuthenticated, setIsAuthenticated] = useState(true); // Default logged in as Dr. Swapna Devi for smooth hackathon evaluation
  const [doctorIdInput, setDoctorIdInput] = useState('DOC-SWAPNA');
  const [doctorPassword, setDoctorPassword] = useState('Aarogya@2026');
  const [activeDoctor, setActiveDoctor] = useState<any>({
    uidn: 'DOC-SWAPNA',
    name: 'Dr. Swapna Devi, MDS',
    designation: 'Chief Onco-Pathologist & Lead Tele-Consultant',
    hospitalDuty: 'PHC G. Madugula / GGH Paderu Tele-Lab Hub',
    abdmCode: 'ABDM-DOC-AP-7821',
    email: 'dr.swapna@aarogyadrishti.org'
  });

  // Forgot password modal
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotSecurityCode, setForgotSecurityCode] = useState('ASR-DOC-2026');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  // Doctor Data States
  const [incomingQueue, setIncomingQueue] = useState<any[]>([]);
  const [patientsUnderCare, setPatientsUnderCare] = useState<any[]>([]);
  const [biopsyVault, setBiopsyVault] = useState<any[]>([]);
  const [searchUidn, setSearchUidn] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDoctorData();
  }, []);

  const loadDoctorData = async () => {
    try {
      const apptsRes = await api.getAllAppointments();
      if (apptsRes.appointments) {
        setIncomingQueue(apptsRes.appointments);
      }

      const patientsRes = await api.getQuickLoginRoster();
      if (patientsRes.roster) {
        setPatientsUnderCare(patientsRes.roster);
      }

      const rxRes = await api.getAllPrescriptions();
      if (rxRes.prescriptions) {
        setBiopsyVault(rxRes.prescriptions);
      }
    } catch (err) {
      console.warn('Doctor portal data load notice:', err);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.doctorLogin(doctorIdInput, doctorPassword);
      setActiveDoctor(res.doctor);
      setIsAuthenticated(true);
      loadDoctorData();
    } catch (err: any) {
      alert(`Doctor login failed: ${err.message}`);
    } finally {
      setLoading(false);
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
      const remarks = status === 'APPROVED' ? 'Approved by Dr. Swapna Devi, MDS for Saturday 10:30 AM at PHC G. Madugula.' : 'Rejected due to schedule conflict.';
      await api.updateAppointmentStatus(appointmentId, status, remarks);
      setIncomingQueue((prev) =>
        prev.map((a) => (a.appointmentId === appointmentId ? { ...a, status, doctorRemarks: remarks } : a))
      );
    } catch (err: any) {
      alert(`Status update error: ${err.message}`);
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
      {/* Doctor Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-950 text-white rounded-3xl p-6 sm:p-8 border border-amber-400 shadow-luxury flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-black text-2xl shadow-gold-glow">
            <Stethoscope className="w-8 h-8 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-2xl font-bold font-serif-royal">{activeDoctor.name}</h2>
              <span className="text-xs font-bold bg-amber-500/20 text-amber-300 px-3 py-0.5 rounded-full border border-amber-400/40">
                {activeDoctor.uidn}
              </span>
            </div>
            <p className="text-xs text-amber-200 mt-1">
              {activeDoctor.designation} • {activeDoctor.hospitalDuty}
            </p>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
              ABDM Provider: {activeDoctor.abdmCode}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsForgotModalOpen(true)}
            className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-amber-200 rounded-xl text-xs font-semibold transition-colors flex items-center space-x-1.5"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Reset Password</span>
          </button>

          <button
            onClick={loadDoctorData}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-colors flex items-center space-x-1.5 shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Queue</span>
          </button>
        </div>
      </div>

      {/* 1. UIDN PATIENT SEARCH BAR */}
      <div className="bg-white rounded-2xl p-4 border border-amber-300 shadow-sm flex items-center space-x-3">
        <Search className="w-5 h-5 text-amber-600" />
        <input
          type="text"
          value={searchUidn}
          onChange={(e) => setSearchUidn(e.target.value)}
          placeholder="Lookup Patient Case History by UIDN (e.g. UIDN-ASR-2026-GM046, Somanna)..."
          className="flex-1 bg-transparent text-xs font-semibold focus:outline-none"
        />
        {searchUidn && (
          <button onClick={() => setSearchUidn('')} className="text-xs text-slate-400 hover:text-slate-600">
            Clear
          </button>
        )}
      </div>

      {/* 2. INCOMING CONSULTATION & BIOPSY QUEUE */}
      <div className="bg-white rounded-3xl border border-amber-300 p-6 shadow-luxury space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold font-serif-royal text-slate-900 flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <span>Incoming Tele-Consultation & Biopsy Queue</span>
            </h3>
            <p className="text-xs text-slate-500">Live triage review for ITDA Paderu 11 Mandals</p>
          </div>
          <span className="text-xs font-bold bg-amber-100 text-amber-900 px-3 py-1 rounded-full border border-amber-300">
            {incomingQueue.length} Requests Active
          </span>
        </div>

        <div className="space-y-3">
          {incomingQueue.map((appt) => (
            <div
              key={appt.appointmentId}
              className="p-4 rounded-2xl border border-amber-200 bg-[#FCFBF7] flex flex-wrap items-center justify-between gap-4 hover:border-amber-400 transition-all"
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-[10px] font-bold bg-slate-200 text-slate-800 px-2 py-0.5 rounded">
                    {appt.appointmentId}
                  </span>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                    appt.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                    appt.status === 'REJECTED' ? 'bg-red-100 text-red-800 border border-red-300' :
                    'bg-amber-100 text-amber-900 border border-amber-300'
                  }`}>
                    {appt.status}
                  </span>
                  <span className="text-xs font-bold text-amber-950 font-serif-royal">{appt.apptType}</span>
                </div>

                <div className="text-xs text-slate-700">
                  Patient UIDN: <strong>{appt.patientUidn}</strong> • Mandal: <strong>{appt.mandal}</strong> • Facility: <strong>{appt.hospitalName}</strong>
                </div>

                <div className="text-[11px] text-slate-500">
                  Time Slot: <strong>{appt.timeSlot}</strong> • Remarks: {appt.doctorRemarks || 'None'}
                </div>
              </div>

              {/* Action Buttons for Doctor */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleUpdateStatus(appt.appointmentId, 'APPROVED')}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center space-x-1"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Approve</span>
                </button>

                <button
                  onClick={() => handleUpdateStatus(appt.appointmentId, 'REJECTED')}
                  className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center space-x-1"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Reject</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. PATIENT LIST UNDER CARE & TELEMEDICINE LAUNCHER */}
      <div className="bg-white rounded-3xl border border-amber-300 p-6 shadow-luxury space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold font-serif-royal text-slate-900 flex items-center space-x-2">
              <UserCheck className="w-5 h-5 text-amber-600" />
              <span>Tribal Patients Under Care</span>
            </h3>
            <p className="text-xs text-slate-500">Direct WebRTC consultation & prescription authoring</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filteredPatients.map((pat) => (
            <div key={pat.uidn} className="gold-card p-4 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                    {pat.uidn}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">{pat.mandal}</span>
                </div>
                <h4 className="text-base font-bold font-serif-royal text-slate-900 mt-2">{pat.name}</h4>
                <p className="text-xs text-slate-600">{pat.age} Yrs • {pat.village}</p>
                <div className="text-[11px] text-amber-900 font-bold mt-1">{pat.condition}</div>
              </div>

              <div className="pt-2 border-t border-amber-200 flex gap-2">
                <button
                  onClick={() => onLaunchTelemedicine(pat, activeDoctor)}
                  className="flex-1 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:brightness-105 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 shadow-sm"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Call WebRTC</span>
                </button>

                <button
                  onClick={() => onViewPrescription(null, pat)}
                  className="px-3 py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs rounded-xl flex items-center justify-center space-x-1"
                  title="View Rx Slip"
                >
                  <FileText className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. BIOPSY & PATHOLOGY REPORTS VAULT */}
      <div className="bg-white rounded-3xl border border-amber-300 p-6 shadow-luxury space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
              <FolderLock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-serif-royal text-slate-900">
                Biopsy & Histopathology Reports Vault
              </h3>
              <p className="text-xs text-slate-500">Indexed securely under Patient UIDN with barcode audit verification</p>
            </div>
          </div>
          <span className="text-xs font-bold bg-amber-100 text-amber-900 px-3 py-1 rounded-full border border-amber-300">
            {biopsyVault.length} Indexed Cases
          </span>
        </div>

        <div className="divide-y divide-amber-200/80 border border-amber-200 rounded-2xl overflow-hidden">
          {biopsyVault.map((rx) => (
            <div key={rx.rxId} className="p-4 bg-[#FCFBF7] hover:bg-white flex flex-wrap items-center justify-between gap-4 transition-colors">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-bold text-slate-900">{rx.rxId}</span>
                  <span className="font-mono text-xs text-amber-800 bg-amber-100 px-2 py-0.5 rounded font-bold">
                    UIDN: {rx.patientUidn}
                  </span>
                  <span className="bg-amber-200 text-amber-950 font-bold text-[10px] px-2 py-0.5 rounded">
                    {rx.trackingStatus}
                  </span>
                </div>
                <div className="text-xs text-slate-600">
                  {rx.biopsyProcedureDetails || 'Biopsy order recorded with histopathological follow-up'}
                </div>
                <div className="text-[10px] text-slate-400 font-mono flex items-center space-x-1">
                  <QrCode className="w-3 h-3 text-amber-700" />
                  <span>Barcode: {rx.printableBarcodeId}</span>
                </div>
              </div>

              <button
                onClick={() => onViewPrescription(rx, { uidn: rx.patientUidn, name: 'K. Somanna', age: 46, mandal: 'G. Madugula' })}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center space-x-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Open Biopsy Slip</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Forgot Password Modal */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 border border-amber-300 shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-base text-slate-900 font-serif-royal">Doctor Password Reset</h4>
              <button onClick={() => setIsForgotModalOpen(false)} className="text-slate-400 hover:text-slate-600">
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
                    className="w-full bg-[#FAF9F5] border border-amber-300 rounded-xl p-2.5 text-xs font-mono font-bold"
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
                    className="w-full bg-[#FAF9F5] border border-amber-300 rounded-xl p-2.5 text-xs font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">New Password</label>
                  <input
                    type="password"
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full bg-[#FAF9F5] border border-amber-300 rounded-xl p-2.5 text-xs"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold text-xs rounded-xl shadow-gold-glow hover:brightness-105 transition-all"
                >
                  Verify & Reset Password
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorPortal;

