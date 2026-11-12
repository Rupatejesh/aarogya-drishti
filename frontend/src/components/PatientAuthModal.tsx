import React, { useState } from 'react';
import {
  UserCheck,
  CreditCard,
  Phone,
  UserPlus,
  KeyRound,
  CheckCircle,
  X,
  Sparkles,
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
}

export const PatientAuthModal: React.FC<PatientAuthModalProps> = ({
  isOpen,
  onClose,
  lang,
  onAuthenticated
}) => {
  const t = translations[lang];

  const [authMethod, setAuthMethod] = useState<'roster' | 'aadhar' | 'phone' | 'register'>('roster');

  // Aadhaar State
  const [aadharNumber, setAadharNumber] = useState('6543-8901-2345');

  // Phone & OTP State
  const [phoneNumber, setPhoneNumber] = useState('9490123451');
  const [otpValue, setOtpValue] = useState('123456');
  const [otpSent, setOtpSent] = useState(false);

  // Registration State
  const [regName, setRegName] = useState('G. Appa Rao');
  const [regDob, setRegDob] = useState('1984-06-15');
  const [regGender, setRegGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE');
  const [regBloodGroup, setRegBloodGroup] = useState('B+');
  const [regPhone, setRegPhone] = useState('9490123499');
  const [regAadhar, setRegAadhar] = useState('4567-8901-2345');
  const [regMandal, setRegMandal] = useState('Hukumpeta');
  const [regVillage, setRegVillage] = useState('Bakuru');
  const [regHabitation, setRegHabitation] = useState('Hukumpeta Hills');

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

  // 1-Click Roster Login
  const handleRosterClick = async (uidn: string) => {
    setLoading(true);
    setStatusMsg(null);
    try {
      const res = await api.patientQuickLogin(uidn);
      onAuthenticated(res.patient);
      onClose();
    } catch (err: any) {
      setStatusMsg(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // Aadhaar Login
  const handleAadharSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg(null);
    try {
      const res = await api.aadharLogin(aadharNumber);
      onAuthenticated(res.patient);
      onClose();
    } catch (err: any) {
      setStatusMsg(err.response?.data?.message || err.message || 'Aadhaar lookup failed');
    } finally {
      setLoading(false);
    }
  };

  // Send Demo OTP
  const handleSendOtp = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      setStatusMsg('Please enter a valid 10-digit mobile number');
      return;
    }
    setLoading(true);
    setStatusMsg(null);
    try {
      const res = await api.sendPhoneOtp(phoneNumber);
      setOtpSent(true);
      setStatusMsg(`Demo OTP sent to +91-${phoneNumber}. Code: ${res.demoOtp || '123456'}`);
    } catch (err: any) {
      setStatusMsg(err.response?.data?.message || err.message || 'OTP delivery failed');
    } finally {
      setLoading(false);
    }
  };

  // Verify Phone OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg(null);
    try {
      const res = await api.verifyPhoneOtp(phoneNumber, otpValue);
      if (res.patient) {
        onAuthenticated(res.patient);
        onClose();
      } else {
        setAuthMethod('register');
        setRegPhone(phoneNumber);
        setStatusMsg('New mobile verified. Please finish one-time registration profile below.');
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
    setLoading(true);
    setStatusMsg(null);
    try {
      const payload = {
        name: regName,
        age: calculatedAge,
        dob: regDob,
        gender: regGender,
        bloodGroup: regBloodGroup,
        phone: regPhone,
        aadhar: regAadhar,
        mandal: regMandal,
        village: regVillage,
        habitation: regHabitation
      };
      const res = await api.registerPatient(payload);
      onAuthenticated(res.patient);
      alert(`Patient successfully registered with auto-assigned UIDN: ${res.patient.uidn}`);
      onClose();
    } catch (err: any) {
      setStatusMsg(err.response?.data?.message || err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white max-w-xl w-full rounded-3xl border border-slate-200 shadow-2xl overflow-hidden">
        {/* Header (Royal Blue) */}
        <div className="bg-royal-700 text-white p-5 flex items-center justify-between border-b border-royal-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-wide">PATIENT AUTHENTICATION</h3>
              <p className="text-[11px] text-blue-100">ITDA Paderu Alluri District Care Access</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/20 text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Auth Method Navigation Tabs */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap gap-1.5 text-xs font-bold">
          <button
            onClick={() => setAuthMethod('roster')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 ${
              authMethod === 'roster'
                ? 'bg-royal-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>1-Click Roster</span>
          </button>

          <button
            onClick={() => setAuthMethod('aadhar')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 ${
              authMethod === 'aadhar'
                ? 'bg-royal-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>12-Digit Aadhaar</span>
          </button>

          <button
            onClick={() => setAuthMethod('phone')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 ${
              authMethod === 'phone'
                ? 'bg-royal-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Phone OTP</span>
          </button>

          <button
            onClick={() => setAuthMethod('register')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 ${
              authMethod === 'register'
                ? 'bg-royal-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>New Patient</span>
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

          {/* TAB 1: 1-Click Roster */}
          {authMethod === 'roster' && (
            <div className="space-y-3">
              <div className="text-xs font-semibold text-slate-600 mb-2">
                Select a compulsory Hackathon case for instant 1-click test fill:
              </div>

              <div
                onClick={() => handleRosterClick('UIDN-ASR-2026-GM046')}
                className="bg-white border border-slate-200 p-4 rounded-2xl cursor-pointer hover:border-royal-500 hover:shadow-md transition-all flex justify-between items-center group"
              >
                <div>
                  <span className="text-[10px] font-mono font-bold bg-blue-100 text-royal-800 px-2 py-0.5 rounded border border-blue-200">
                    UIDN-ASR-2026-GM046 • Compulsory Case
                  </span>
                  <div className="text-sm font-bold text-slate-900 mt-1">K. Somanna</div>
                  <div className="text-xs text-slate-600">46 Yrs • Male • Nurmati, G. Madugula</div>
                  <div className="text-[11px] text-royal-700 font-semibold mt-1">
                    Persistent white patch • 18-Yr Reverse Tobacco
                  </div>
                </div>
                <button className="px-3 py-1.5 bg-royal-600 group-hover:bg-royal-700 text-white rounded-xl text-xs font-bold transition-colors">
                  Login
                </button>
              </div>

              <div
                onClick={() => handleRosterClick('UIDN-ASR-2026-0002')}
                className="bg-white border border-slate-200 p-4 rounded-2xl cursor-pointer hover:border-royal-500 hover:shadow-md transition-all flex justify-between items-center group"
              >
                <div>
                  <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-300">
                    UIDN-ASR-2026-0002
                  </span>
                  <div className="text-sm font-bold text-slate-900 mt-1">M. Lakshmi</div>
                  <div className="text-xs text-slate-600">32 Yrs • Female • Padmapuram, Araku Valley</div>
                  <div className="text-[11px] text-royal-700 font-semibold mt-1">
                    Erythroplakia • Betel Quid & Burning Mucosa
                  </div>
                </div>
                <button className="px-3 py-1.5 bg-royal-600 group-hover:bg-royal-700 text-white rounded-xl text-xs font-bold transition-colors">
                  Login
                </button>
              </div>

              <div
                onClick={() => handleRosterClick('UIDN-ASR-2026-0003')}
                className="bg-white border border-slate-200 p-4 rounded-2xl cursor-pointer hover:border-royal-500 hover:shadow-md transition-all flex justify-between items-center group"
              >
                <div>
                  <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-300">
                    UIDN-ASR-2026-0003
                  </span>
                  <div className="text-sm font-bold text-slate-900 mt-1">P. Ramu</div>
                  <div className="text-xs text-slate-600">58 Yrs • Male • Paderu Tribal Hamlet, Paderu</div>
                  <div className="text-[11px] text-royal-700 font-semibold mt-1">
                    Oral Submucous Fibrosis (OSMF) • Trismus
                  </div>
                </div>
                <button className="px-3 py-1.5 bg-royal-600 group-hover:bg-royal-700 text-white rounded-xl text-xs font-bold transition-colors">
                  Login
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: 12-Digit Aadhaar Login */}
          {authMethod === 'aadhar' && (
            <form onSubmit={handleAadharSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  12-Digit Aadhaar Card Number
                </label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 text-royal-600 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={aadharNumber}
                    onChange={(e) => setAadharNumber(e.target.value)}
                    placeholder="XXXX-XXXX-XXXX"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-4 py-2.5 text-xs font-mono font-bold tracking-widest text-slate-900 focus:ring-2 focus:ring-royal-500"
                    required
                  />
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Demo Aadhaar cards: 6543-8901-2345 (Somanna), 7812-3456-7890 (Lakshmi), 8923-4567-8901 (Ramu)
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-royal-600 to-royal-700 text-white font-bold text-xs shadow-blue-card hover:brightness-110 transition-all"
              >
                {loading ? 'Authenticating Aadhaar...' : 'Sign In with Aadhaar'}
              </button>
            </form>
          )}

          {/* TAB 3: Phone OTP Login */}
          {authMethod === 'phone' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Mobile Phone Number
                </label>
                <div className="flex space-x-2">
                  <div className="relative flex-1">
                    <Phone className="w-4 h-4 text-royal-600 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="10-digit mobile number"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-4 py-2 text-xs font-mono font-bold text-slate-900"
                      required
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={loading}
                    className="px-4 py-2 bg-royal-700 text-white rounded-xl text-xs font-bold hover:bg-royal-800 transition-colors whitespace-nowrap"
                  >
                    Send OTP
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Instant Demo OTP Code (Use: 123456)
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-royal-600 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={otpValue}
                    onChange={(e) => setOtpValue(e.target.value)}
                    placeholder="123456"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-4 py-2 text-xs font-mono font-bold tracking-widest text-slate-900"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-royal-600 to-royal-700 text-white font-bold text-xs shadow-blue-card hover:brightness-110 transition-all"
              >
                {loading ? 'Verifying OTP...' : 'Verify OTP & Enter Portal'}
              </button>
            </form>
          )}

          {/* TAB 4: New Patient Registration */}
          {authMethod === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-0.5">Full Name</label>
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-0.5">Gender</label>
                  <select
                    value={regGender}
                    onChange={(e: any) => setRegGender(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              {/* DOB with Automatic Age Calculation */}
              <div className="grid grid-cols-2 gap-3 bg-blue-50/60 p-2.5 rounded-xl border border-blue-200">
                <div>
                  <label className="text-[11px] font-bold text-royal-950 block mb-0.5 flex items-center space-x-1">
                    <Calendar className="w-3 h-3 text-royal-600" />
                    <span>Date of Birth</span>
                  </label>
                  <input
                    type="date"
                    value={regDob}
                    onChange={(e) => setRegDob(e.target.value)}
                    className="w-full bg-white border border-blue-200 rounded-lg p-1.5 text-xs font-mono text-slate-900"
                    required
                  />
                </div>

                <div className="flex flex-col justify-center">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Auto-Calculated Age</span>
                  <span className="text-base font-extrabold text-royal-900">
                    {calculatedAge} <span className="text-xs font-normal">Years Old</span>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-0.5">Blood Group (Optional)</label>
                  <select
                    value={regBloodGroup}
                    onChange={(e) => setRegBloodGroup(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900"
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

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-0.5">11 Mandals Picker</label>
                  <select
                    value={regMandal}
                    onChange={(e) => setRegMandal(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-bold text-slate-900"
                  >
                    <option value="G. Madugula">G. Madugula</option>
                    <option value="Paderu">Paderu</option>
                    <option value="Araku Valley">Araku Valley</option>
                    <option value="Chintapalle">Chintapalle</option>
                    <option value="Ananthagiri">Ananthagiri</option>
                    <option value="Dumbriguda">Dumbriguda</option>
                    <option value="Hukumpeta">Hukumpeta</option>
                    <option value="G.K. Veedhi">G.K. Veedhi</option>
                    <option value="Koyyuru">Koyyuru</option>
                    <option value="Munchingi Puttu">Munchingi Puttu</option>
                    <option value="Pedabayalu">Pedabayalu</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-0.5">Village / Hamlet</label>
                  <input
                    type="text"
                    value={regVillage}
                    onChange={(e) => setRegVillage(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-0.5">Mobile Phone</label>
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-mono text-slate-900"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-0.5">12-Digit Aadhaar Card</label>
                <input
                  type="text"
                  value={regAadhar}
                  onChange={(e) => setRegAadhar(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-mono text-slate-900"
                  required
                />
              </div>

              <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-200 text-[11px] text-royal-900 flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-royal-600 flex-shrink-0" />
                <span>An official unique identifier (UIDN-ASR-2026-XXXX) will be automatically assigned.</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-royal-600 to-royal-700 text-white font-bold text-xs shadow-blue-card hover:brightness-110 transition-all"
              >
                {loading ? 'Creating Patient Profile...' : 'Complete Registration & Generate UIDN'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientAuthModal;
