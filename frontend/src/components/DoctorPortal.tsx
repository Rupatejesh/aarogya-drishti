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
  QrCode,
  Plus
} from 'lucide-react';
import api from '../services/api.ts';
import { Language, translations } from '../i18n/translations.ts';

interface DoctorPortalProps {
  lang: Language;
  onLaunchTelemedicine: (patient: any, doctor: any) => void;
  onViewPrescription: (prescription: any, patient: any) => void;
  initialDoctor?: any;
}

export const DoctorPortal: React.FC<DoctorPortalProps> = ({
  lang,
  onLaunchTelemedicine,
  onViewPrescription,
  initialDoctor
}) => {
  const t = translations[lang];

  // Auth States
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [doctorIdInput, setDoctorIdInput] = useState('DOC-SWAPNA');
  const [doctorPassword, setDoctorPassword] = useState('Aarogya@2026');
  const [activeDoctor, setActiveDoctor] = useState<any>(
    initialDoctor || {
      uidn: 'DOC-SWAPNA',
      name: 'Dr. Swapna Devi, MDS',
      designation: 'Chief Onco-Pathologist & Lead Tele-Consultant',
      hospitalDuty: 'PHC G. Madugula / GGH Paderu Tele-Lab Hub',
      abdmCode: 'ABDM-DOC-AP-7821',
      email: 'dr.swapna@aarogyadrishti.org'
    }
  );

  useEffect(() => {
    if (initialDoctor) {
      setActiveDoctor(initialDoctor);
      setIsAuthenticated(true);
    }
  }, [initialDoctor]);

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
      const remarks = status === 'APPROVED' ? 'Approved by Dr. Swapna Devi, MDS for Saturday 10:30 AM at PHC G. Madugula.' : 'Rejected due to slot availability.';
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
      {/* Doctor Header Banner (Royal Blue) */}
      <div className="bg-royal-700 text-white rounded-3xl p-6 sm:p-8 border border-royal-800 shadow-xl flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-white font-black text-2xl shadow-md">
            <Stethoscope className="w-8 h-8 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-2xl font-extrabold">{activeDoctor.name}</h2>
              <span className="text-xs font-bold bg-white/20 text-white px-3 py-0.5 rounded-full border border-white/30">
                {activeDoctor.uidn}
              </span>
            </div>
            <p className="text-xs text-blue-100 mt-1">
              {activeDoctor.designation} • {activeDoctor.hospitalDuty}
            </p>
            <div className="text-[11px] text-blue-200 font-mono mt-0.5">
              ABDM Provider: {activeDoctor.abdmCode}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsForgotModalOpen(true)}
            className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-blue-100 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Reset Password</span>
          </button>

          <button
            onClick={loadDoctorData}
            className="px-3.5 py-2 bg-white text-royal-700 hover:bg-blue-50 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Queue</span>
          </button>
        </div>
      </div>

      {/* 1. UIDN PATIENT SEARCH ENGINE */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center space-x-3">
        <Search className="w-5 h-5 text-royal-600" />
        <input
          type="text"
          value={searchUidn}
          onChange={(e) => setSearchUidn(e.target.value)}
          placeholder="Lookup Patient Case History by Patient UIDN (e.g. UIDN-ASR-2026-GM046, Somanna)..."
          className="flex-1 bg-transparent text-xs font-semibold text-slate-900 focus:outline-none placeholder-slate-400"
        />
        {searchUidn && (
          <button onClick={() => setSearchUidn('')} className="text-xs text-slate-400 hover:text-slate-600 font-bold">
            Clear
          </button>
        )}
      </div>

      {/* 2. INCOMING CONSULTATION & BIOPSY QUEUE (APPOINTMENT NOTIFICATIONS) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-luxury space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-royal-600 animate-pulse" />
              <span>Incoming Appointment Notifications & Review Queue</span>
            </h3>
            <p className="text-xs text-slate-500">View patient appointment requests for nearby PHCs and approve/reject live</p>
          </div>
          <span className="text-xs font-bold bg-blue-50 text-royal-900 px-3 py-1 rounded-full border border-blue-200">
            {incomingQueue.length} Requests Active
          </span>
        </div>

        <div className="space-y-3">
          {incomingQueue.map((appt) => (
            <div
              key={appt.appointmentId}
              className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-4 hover:border-royal-300 transition-all"
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-[10px] font-bold bg-slate-200 text-slate-800 px-2 py-0.5 rounded">
                    {appt.appointmentId}
                  </span>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                    appt.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                    appt.status === 'REJECTED' ? 'bg-red-100 text-red-800 border border-red-300' :
                    'bg-amber-100 text-slate-900 border border-amber-300'
                  }`}>
                    {appt.status}
                  </span>
                  <span className="text-xs font-bold text-slate-900">{appt.apptType}</span>
                </div>

                <div className="text-xs text-slate-700">
                  Patient UIDN: <strong className="font-mono text-royal-700">{appt.patientUidn}</strong> • Mandal: <strong>{appt.mandal}</strong> • Facility: <strong>{appt.hospitalName}</strong>
                </div>

                <div className="text-[11px] text-slate-500">
                  Time Slot: <strong>{appt.timeSlot}</strong> • Remarks: {appt.doctorRemarks || 'None'}
                </div>
              </div>

              {/* Action Buttons for Doctor */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleUpdateStatus(appt.appointmentId, 'APPROVED')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-sm"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Approve Slot</span>
                </button>

                <button
                  onClick={() => handleUpdateStatus(appt.appointmentId, 'REJECTED')}
                  className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1 shadow-sm"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Reject</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. MY PATIENT LIST UNDER CARE & 1-CLICK WEBRTC VIDEO CALL */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-luxury space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center space-x-2">
              <UserCheck className="w-5 h-5 text-royal-600" />
              <span>My Patient List & Video Call</span>
            </h3>
            <p className="text-xs text-slate-500">Patients under this doctor's care with 1-click WebRTC Tele-Consultation</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filteredPatients.map((pat) => (
            <div key={pat.uidn} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 flex flex-col justify-between hover:border-royal-400 transition-all">
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-mono font-bold bg-blue-100 text-royal-800 px-2 py-0.5 rounded border border-blue-200">
                    {pat.uidn}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">{pat.mandal}</span>
                </div>
                <h4 className="text-base font-bold text-slate-900 mt-2">{pat.name}</h4>
                <p className="text-xs text-slate-600">{pat.age} Yrs • {pat.village}</p>
                <div className="text-[11px] text-royal-700 font-semibold mt-1">{pat.condition}</div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex gap-2">
                <button
                  onClick={() => onLaunchTelemedicine(pat, activeDoctor)}
                  className="flex-1 py-2.5 bg-royal-600 hover:bg-royal-700 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 shadow-sm transition-all"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Start WebRTC Call</span>
                </button>

                <button
                  onClick={() => onViewPrescription(null, pat)}
                  className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl flex items-center justify-center space-x-1 transition-all"
                  title="View Medical Reports & Rx"
                >
                  <FileText className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. BIOPSY & PATHOLOGY REPORTS VAULT */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-luxury space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-royal-700">
              <FolderLock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">
                Biopsy & Pathology Reports Vault
              </h3>
              <p className="text-xs text-slate-500">Securely stored and organized under Patient UIDN</p>
            </div>
          </div>
          <span className="text-xs font-bold bg-blue-50 text-royal-800 px-3 py-1 rounded-full border border-blue-200">
            {biopsyVault.length} Indexed Cases
          </span>
        </div>

        <div className="divide-y divide-slate-200 border border-slate-200 rounded-2xl overflow-hidden">
          {biopsyVault.map((rx) => (
            <div key={rx.rxId} className="p-4 bg-slate-50/50 hover:bg-white flex flex-wrap items-center justify-between gap-4 transition-colors">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-bold text-slate-900">{rx.rxId}</span>
                  <span className="font-mono text-xs text-royal-800 bg-blue-100 px-2 py-0.5 rounded font-bold border border-blue-200">
                    UIDN: {rx.patientUidn}
                  </span>
                  <span className="bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2 py-0.5 rounded border border-emerald-200">
                    {rx.trackingStatus}
                  </span>
                </div>
                <div className="text-xs text-slate-600">
                  {rx.biopsyProcedureDetails || 'Biopsy order recorded with histopathological follow-up'}
                </div>
                <div className="text-[10px] text-slate-400 font-mono flex items-center space-x-1">
                  <QrCode className="w-3 h-3 text-royal-600" />
                  <span>Barcode: {rx.printableBarcodeId}</span>
                </div>
              </div>

              <button
                onClick={() => onViewPrescription(rx, { uidn: rx.patientUidn, name: 'K. Somanna', age: 46, mandal: 'G. Madugula' })}
                className="px-4 py-2 bg-royal-700 hover:bg-royal-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center space-x-1.5"
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
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-base text-slate-900">Doctor Password Reset</h4>
              <button onClick={() => setIsForgotModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">
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
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-900"
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
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-mono text-slate-900"
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
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-royal-600 hover:bg-royal-700 text-white font-bold text-xs rounded-xl shadow-blue-card transition-all"
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
