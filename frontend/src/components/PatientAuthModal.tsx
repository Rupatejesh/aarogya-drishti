import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  CreditCard,
  Phone,
  UserPlus,
  KeyRound,
  CheckCircle,
  X,
  Calendar,
  MapPin,
  AlertTriangle
} from 'lucide-react';
import api from '../services/api.ts';
import { Language, translations } from '../i18n/translations.ts';

interface PatientAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onAuthenticated: (patient: any) => void;
  defaultMode?: 'login' | 'register';
}

export const PatientAuthModal: React.FC<PatientAuthModalProps> = ({
  isOpen,
  onClose,
  lang,
  onAuthenticated,
  defaultMode = 'login'
}) => {
  const t = translations[lang];

  const [authMethod, setAuthMethod] = useState<'login' | 'register'>(defaultMode);

  useEffect(() => {
    if (defaultMode) {
      setAuthMethod(defaultMode);
    }
  }, [defaultMode, isOpen]);

  // Login credentials
  const [loginIdentifier, setLoginIdentifier] = useState(''); // Phone / UIDN / Aadhaar
  const [loginMethod, setLoginMethod] = useState<'phone' | 'aadhar'>('phone');
  const [otpValue, setOtpValue] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // Registration State (Clean, no demo data prefilled)
  const [regName, setRegName] = useState('');
  const [regDob, setRegDob] = useState('');
  const [regGender, setRegGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE');
  const [regBloodGroup, setRegBloodGroup] = useState('O+');
  const [regPhone, setRegPhone] = useState('');
  const [regAadhar, setRegAadhar] = useState('');
  const [regMandal, setRegMandal] = useState('Paderu');
  const [regVillage, setRegVillage] = useState('');
  const [regHabitation, setRegHabitation] = useState('');

  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Auto-calculated age
  const calculateAge = (dobString: string): number => {
    if (!dobString) return 0;
    const dob = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return Math.max(0, age);
  };

  const calculatedAge = calculateAge(regDob);

  // Direct Aadhaar or UIDN Login
  const handleAadharOrUidnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier.trim()) {
      setStatusMsg('Please enter your Aadhaar number or UIDN');
      return;
    }
    setLoading(true);
    setStatusMsg(null);
    try {
      const res = await api.aadharLogin(loginIdentifier.trim());
      if (res.patient) {
        onAuthenticated(res.patient);
        onClose();
      } else {
        setStatusMsg('Patient record not found. Please register as a new patient.');
      }
    } catch (err: any) {
      setStatusMsg(err.response?.data?.message || err.message || 'Lookup failed');
    } finally {
      setLoading(false);
    }
  };

  // Send Phone OTP
  const handleSendOtp = async () => {
    if (!loginIdentifier || loginIdentifier.trim().length < 10) {
      setStatusMsg('Please enter a valid 10-digit mobile number');
      return;
    }
    setLoading(true);
    setStatusMsg(null);
    try {
      const res = await api.sendPhoneOtp(loginIdentifier.trim());
      setOtpSent(true);
      setStatusMsg(`OTP sent to +91-${loginIdentifier.trim()}. Code: ${res.demoOtp || '123456'}`);
    } catch (err: any) {
      setStatusMsg(err.response?.data?.message || err.message || 'OTP delivery failed');
    } finally {
      setLoading(false);
    }
  };

  // Verify Phone OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpValue) {
      setStatusMsg('Please enter the OTP');
      return;
    }
    setLoading(true);
    setStatusMsg(null);
    try {
      const res = await api.verifyPhoneOtp(loginIdentifier.trim(), otpValue.trim());
      if (res.patient) {
        onAuthenticated(res.patient);
        onClose();
      } else {
        setAuthMethod('register');
        setRegPhone(loginIdentifier.trim());
        setStatusMsg('Mobile verified. Please finish one-time patient registration below.');
      }
    } catch (err: any) {
      setStatusMsg(err.response?.data?.message || err.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  // Register New Patient
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regPhone.trim()) {
      setStatusMsg('Please enter full name and phone number');
      return;
    }
    setLoading(true);
    setStatusMsg(null);
    try {
      const payload = {
        name: regName.trim(),
        age: calculatedAge || 30,
        dob: regDob || '1990-01-01',
        gender: regGender,
        bloodGroup: regBloodGroup,
        phone: regPhone.trim(),
        aadhar: regAadhar.trim() || 'Not Provided',
        mandal: regMandal,
        village: regVillage.trim() || 'Headquarters',
        habitation: regHabitation.trim() || 'Central'
      };
      const res = await api.registerPatient(payload);
      if (res.patient) {
        onAuthenticated(res.patient);
        alert(`Patient registered successfully! Assigned UIDN: ${res.patient.uidn}`);
        onClose();
      }
    } catch (err: any) {
      setStatusMsg(err.response?.data?.message || err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white max-w-xl w-full rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-8">
        {/* Header (Royal Blue) */}
        <div className="bg-royal-700 text-white p-5 flex items-center justify-between border-b border-royal-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-wide">
                {authMethod === 'register' ? 'NEW PATIENT REGISTRATION' : 'PATIENT LOGIN'}
              </h3>
              <p className="text-[11px] text-blue-100">ITDA Paderu Alluri District Care Access</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/20 text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Auth Method Navigation Tabs */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex gap-2 text-xs font-bold">
          <button
            onClick={() => {
              setAuthMethod('login');
              setStatusMsg(null);
            }}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
              authMethod === 'login'
                ? 'bg-royal-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Patient Login</span>
          </button>

          <button
            onClick={() => {
              setAuthMethod('register');
              setStatusMsg(null);
            }}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
              authMethod === 'register'
                ? 'bg-royal-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>New Patient Registration</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-4">
          {statusMsg && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-royal-900 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-royal-600 flex-shrink-0" />
              <span>{statusMsg}</span>
            </div>
          )}

          {/* TAB 1: Patient Login */}
          {authMethod === 'login' && (
            <div className="space-y-4">
              <div className="flex border-b border-slate-200 pb-2 mb-2 gap-4 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setLoginMethod('phone')}
                  className={`pb-1 border-b-2 transition-all ${
                    loginMethod === 'phone'
                      ? 'border-royal-600 text-royal-600 font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Phone Number & OTP
                </button>
                <button
                  type="button"
                  onClick={() => setLoginMethod('aadhar')}
                  className={`pb-1 border-b-2 transition-all ${
                    loginMethod === 'aadhar'
                      ? 'border-royal-600 text-royal-600 font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Aadhaar / UIDN Lookup
                </button>
              </div>

              {loginMethod === 'phone' ? (
                <form onSubmit={handleVerifyOtp} className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      10-Digit Mobile Number
                    </label>
                    <div className="flex space-x-2">
                      <div className="relative flex-1">
                        <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                        <input
                          type="tel"
                          value={loginIdentifier}
                          onChange={(e) => setLoginIdentifier(e.target.value)}
                          placeholder="e.g. 9490123456"
                          maxLength={10}
                          className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-semibold text-slate-900 focus:ring-2 focus:ring-royal-500 focus:outline-none"
                          required
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={loading || !loginIdentifier}
                        className="px-4 py-2 bg-royal-100 hover:bg-royal-200 text-royal-700 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                      >
                        {loading ? 'Sending...' : 'Send OTP'}
                      </button>
                    </div>
                  </div>

                  {otpSent && (
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Enter 6-Digit OTP
                      </label>
                      <input
                        type="text"
                        value={otpValue}
                        onChange={(e) => setOtpValue(e.target.value)}
                        placeholder="123456"
                        maxLength={6}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold tracking-widest text-center focus:ring-2 focus:ring-royal-500 focus:outline-none"
                        required
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !otpSent}
                    className="w-full py-3 bg-royal-600 hover:bg-royal-700 text-white font-bold text-xs rounded-xl shadow-blue-card transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>{loading ? 'Verifying...' : 'Verify OTP & Login'}</span>
                  </button>
                </form>
              ) : (
                <form onSubmit={handleAadharOrUidnSubmit} className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      12-Digit Aadhaar or Patient UIDN
                    </label>
                    <div className="relative">
                      <CreditCard className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="text"
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        placeholder="e.g. 6543-8901-2345 or UIDN-ASR-..."
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-semibold text-slate-900 focus:ring-2 focus:ring-royal-500 focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !loginIdentifier}
                    className="w-full py-3 bg-royal-600 hover:bg-royal-700 text-white font-bold text-xs rounded-xl shadow-blue-card transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>{loading ? 'Searching...' : 'Login with Aadhaar / UIDN'}</span>
                  </button>
                </form>
              )}

              <div className="pt-3 text-center border-t border-slate-100">
                <span className="text-xs text-slate-500">Don't have an account yet? </span>
                <button
                  type="button"
                  onClick={() => setAuthMethod('register')}
                  className="text-xs font-bold text-royal-600 hover:underline"
                >
                  Register as New Patient
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: New Patient Registration */}
          {authMethod === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Full Name (Tribal Citizen) *
                </label>
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Enter full name"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-royal-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    value={regDob}
                    onChange={(e) => setRegDob(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-royal-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Calculated Age
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={`${calculatedAge} Years`}
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Gender</label>
                  <select
                    value={regGender}
                    onChange={(e: any) => setRegGender(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-royal-500 focus:outline-none"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Blood Group</label>
                  <select
                    value={regBloodGroup}
                    onChange={(e) => setRegBloodGroup(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-royal-500 focus:outline-none"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Mobile Phone *
                  </label>
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="9490123456"
                    maxLength={10}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-royal-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Aadhaar Number
                  </label>
                  <input
                    type="text"
                    value={regAadhar}
                    onChange={(e) => setRegAadhar(e.target.value)}
                    placeholder="xxxx-xxxx-xxxx"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-royal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  ITDA Paderu Agency Mandal *
                </label>
                <select
                  value={regMandal}
                  onChange={(e) => setRegMandal(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-royal-900 focus:ring-2 focus:ring-royal-500 focus:outline-none"
                >
                  {[
                    'Paderu',
                    'Araku Valley',
                    'Ananthagiri',
                    'Dumbriguda',
                    'Hukumpeta',
                    'Pedabayalu',
                    'Munchingiputtu',
                    'G. Madugula',
                    'Chintapalli',
                    'G.K. Veedhi',
                    'Koyyuru'
                  ].map((m) => (
                    <option key={m} value={m}>
                      {m} Mandal
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Village Name</label>
                  <input
                    type="text"
                    value={regVillage}
                    onChange={(e) => setRegVillage(e.target.value)}
                    placeholder="e.g. Nurmati"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-royal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Habitation / Gudem</label>
                  <input
                    type="text"
                    value={regHabitation}
                    onChange={(e) => setRegHabitation(e.target.value)}
                    placeholder="e.g. Hill Top Colony"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-royal-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-royal-600 hover:bg-royal-700 text-white font-bold text-xs rounded-xl shadow-blue-card transition-all flex items-center justify-center space-x-2 mt-4"
              >
                <UserPlus className="w-4 h-4" />
                <span>{loading ? 'Registering Citizen...' : 'Register Citizen & Generate UIDN'}</span>
              </button>

              <div className="pt-2 text-center">
                <span className="text-xs text-slate-500">Already registered? </span>
                <button
                  type="button"
                  onClick={() => setAuthMethod('login')}
                  className="text-xs font-bold text-royal-600 hover:underline"
                >
                  Go to Patient Login
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientAuthModal;
