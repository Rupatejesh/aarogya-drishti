import React, { useState, useEffect } from 'react';
import {
  Hospital,
  Building2,
  Stethoscope,
  ShieldCheck,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  PhoneCall,
  UserPlus,
  KeyRound,
  FileText,
  Activity,
  Download,
  Plus,
  Sparkles,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import api from '../services/api.ts';
import { Language, translations } from '../i18n/translations.ts';

interface AdminPortalProps {
  lang: Language;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ lang }) => {
  const t = translations[lang];

  // Data states
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedMandalFilter, setSelectedMandalFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Add Doctor Modal State
  const [isAddDoctorModalOpen, setIsAddDoctorModalOpen] = useState(false);
  const [newDoctor, setNewDoctor] = useState({
    name: 'Dr. Ramesh Varma, MDS',
    uidn: 'DOC-RAMESH',
    degreeCertificate: 'MDS (Oral & Maxillofacial Pathology)',
    university: 'Andhra Medical College / Dr. NTR UHS',
    passingYear: 2017,
    relievingYear: 2020,
    experienceYears: 7,
    designation: 'Oral Onco-Pathology Consultant',
    specialization: 'Oral Cancer & Tissue Histopathology',
    hospitalDuty: 'Community Health Centre Chintapalle',
    mandal: 'Chintapalle',
    abdmCode: 'ABDM-DOC-AP-8842',
    email: 'dr.ramesh@aarogyadrishti.org',
    phone: '9490123477',
    password: 'Doctor@2026',
    isActive: true
  });
  const [addDoctorSuccess, setAddDoctorSuccess] = useState(false);

  // Active admin tab
  const [adminTab, setAdminTab] = useState<'hospitals' | 'doctors'>('hospitals');

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [hospRes, docRes] = await Promise.all([
        api.get11MandalsHospitals(),
        api.getAllDoctors()
      ]);

      if (hospRes?.hospitals) {
        setHospitals(hospRes.hospitals);
      }
      if (docRes?.doctors) {
        setDoctors(docRes.doctors);
      }
    } catch (err) {
      console.warn('Admin portal fetch notice:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createDoctor(newDoctor);
      if (res.doctor) {
        setDoctors((prev) => [res.doctor, ...prev]);
        setAddDoctorSuccess(true);
        setTimeout(() => {
          setIsAddDoctorModalOpen(false);
          setAddDoctorSuccess(false);
        }, 1800);
      }
    } catch (err: any) {
      alert(`Failed to add doctor: ${err.message}`);
    }
  };

  const toggleDoctorStatus = (docUidn: string) => {
    setDoctors((prev) =>
      prev.map((d) => (d.uidn === docUidn ? { ...d, isActive: !d.isActive } : d))
    );
  };

  const mandalList = [
    'ALL',
    'G. Madugula',
    'Paderu HQ',
    'Araku Valley',
    'Chintapalle',
    'Ananthagiri',
    'Dumbriguda',
    'Hukumpeta',
    'G.K. Veedhi',
    'Koyyuru',
    'Munchingiputtu',
    'Pedabayalu'
  ];

  // Filtering hospitals
  const filteredHospitals = hospitals.filter((h) => {
    const matchesMandal = selectedMandalFilter === 'ALL' || h.mandal === selectedMandalFilter;
    const matchesSearch =
      !searchQuery ||
      h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.mandal.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.moInCharge.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.abdmFacilityCode.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesMandal && matchesSearch;
  });

  // Calculate high-level KPIs
  const totalCasesRunning = hospitals.reduce((acc, h) => acc + (h.caseSheetsRunning || 0), 0);
  const totalCasesDischarged = hospitals.reduce((acc, h) => acc + (h.caseSheetsDischarged || 0), 0);
  const biopsyReadyCount = hospitals.filter((h) => h.biopsyEquipStatus === 'AVAILABLE').length;

  return (
    <div className="space-y-8">
      {/* 1. Administrative Overview Header (Royal Blue & Crisp Slate) */}
      <div className="bg-royal-700 text-white rounded-3xl p-6 sm:p-8 border border-royal-800 shadow-xl flex flex-wrap items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="bg-white/20 text-white text-xs font-bold px-3 py-0.5 rounded-full border border-white/30">
              ITDA Paderu District Health Administration
            </span>
            <span className="bg-emerald-500/20 text-emerald-200 text-xs font-bold px-3 py-0.5 rounded-full border border-emerald-400/40">
              Alluri Sitharama Raju District
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            11 Mandals Healthcare Command & Registry Portal
          </h2>
          <p className="text-xs text-blue-100 max-w-2xl leading-relaxed">
            Autonomous district surveillance tracking PHCs, CHCs, Area Hospitals, onco-pathologists, biopsy punch kits, blood banks, and ambulance units across Alluri Sitharama Raju agency.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsAddDoctorModalOpen(true)}
            className="px-4 py-2.5 bg-white text-royal-700 hover:bg-blue-50 font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-1.5"
          >
            <UserPlus className="w-4 h-4 text-royal-600" />
            <span>Generate Doctor Credentials</span>
          </button>
        </div>
      </div>

      {/* 2. Key Administrative Metric Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">11 Mandals Network</span>
          <div className="text-2xl font-extrabold text-slate-900 flex items-center justify-between">
            <span>{hospitals.length} Units</span>
            <Hospital className="w-5 h-5 text-royal-600" />
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold">100% Facilities Integrated</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Registered Doctors</span>
          <div className="text-2xl font-extrabold text-slate-900 flex items-center justify-between">
            <span>{doctors.length} MDS / MOs</span>
            <Stethoscope className="w-5 h-5 text-royal-600" />
          </div>
          <div className="text-[11px] text-slate-500 font-medium">Onco-Pathology Specialists</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Biopsy Punch Kits</span>
          <div className="text-2xl font-extrabold text-slate-900 flex items-center justify-between">
            <span>{biopsyReadyCount} Ready</span>
            <Activity className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold">Formalin Jars Stocked</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Active Tribal Cases</span>
          <div className="text-2xl font-extrabold text-slate-900 flex items-center justify-between">
            <span>{totalCasesRunning}</span>
            <FileText className="w-5 h-5 text-royal-600" />
          </div>
          <div className="text-[11px] text-slate-500 font-medium">{totalCasesDischarged} Cleared / Discharged</div>
        </div>
      </div>

      {/* 3. Navigation Tabs: Hospitals Directory vs. Doctor Registry */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-2xl p-1 shadow-sm">
        <button
          onClick={() => setAdminTab('hospitals')}
          className={`px-5 py-3 text-xs font-bold rounded-xl flex items-center space-x-2 transition-all ${
            adminTab === 'hospitals'
              ? 'bg-royal-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Hospital className="w-4 h-4" />
          <span>11 Mandals Health Facilities Directory ({hospitals.length})</span>
        </button>

        <button
          onClick={() => setAdminTab('doctors')}
          className={`px-5 py-3 text-xs font-bold rounded-xl flex items-center space-x-2 transition-all ${
            adminTab === 'doctors'
              ? 'bg-royal-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Stethoscope className="w-4 h-4" />
          <span>Doctors List & Credential Generator ({doctors.length})</span>
        </button>
      </div>

      {/* 4. TAB 1: 11 MANDALS HOSPITALS DIRECTORY TABLE */}
      {adminTab === 'hospitals' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-luxury space-y-6">
          {/* Controls: Search and Mandal Filter */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center space-x-2 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs">
                <Filter className="w-3.5 h-3.5 text-royal-600" />
                <span className="font-bold text-slate-700">Mandal Filter:</span>
                <select
                  value={selectedMandalFilter}
                  onChange={(e) => setSelectedMandalFilter(e.target.value)}
                  className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer"
                >
                  {mandalList.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter facility, MO, or ABDM code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-royal-500 text-slate-900"
                />
              </div>
            </div>

            <span className="text-xs font-bold text-slate-500">
              Showing <strong>{filteredHospitals.length}</strong> of <strong>{hospitals.length}</strong> facilities
            </span>
          </div>

          {/* Detailed Data Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Facility Name & ABDM Code</th>
                  <th className="py-3.5 px-4">Facility Type & Mandal</th>
                  <th className="py-3.5 px-4">MO & Specialization</th>
                  <th className="py-3.5 px-4">Blood Banks</th>
                  <th className="py-3.5 px-4">Ambulances (108/104)</th>
                  <th className="py-3.5 px-4">Oral Biopsy Equipment</th>
                  <th className="py-3.5 px-4">Case-Sheets</th>
                  <th className="py-3.5 px-4">Pending Appts</th>
                  <th className="py-3.5 px-4 text-center">Contact Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {filteredHospitals.map((h) => (
                  <tr key={h.abdmFacilityCode} className="hover:bg-blue-50/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{h.name}</div>
                      <div className="font-mono text-[10px] text-royal-700 font-semibold">{h.abdmFacilityCode}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {h.facilityType} • {h.mandal}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{h.moInCharge}</div>
                      <div className="text-[10px] text-slate-500">Chief Tele-Consultant</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded ${
                        h.bloodBankAvailable ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {h.bloodBankAvailable ? 'Available' : 'Absent'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-[11px] font-mono font-semibold text-slate-800">
                        {h.ambulance108_104_Unit || 'Unit AP-108-ASR'}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center space-x-1 text-[10px] font-extrabold px-2 py-0.5 rounded ${
                        h.biopsyEquipStatus === 'AVAILABLE'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}>
                        {h.biopsyEquipStatus === 'AVAILABLE' ? (
                          <>
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            <span>Present</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            <span>Absent</span>
                          </>
                        )}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      <div>Running: <strong className="text-royal-800">{h.caseSheetsRunning}</strong></div>
                      <div className="text-slate-500">Discharged: {h.caseSheetsDischarged}</div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-center">
                      <span className="bg-blue-100 text-royal-800 font-bold px-2 py-0.5 rounded-full text-xs">
                        {Math.floor((h.caseSheetsRunning || 4) / 2)}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <a
                        href={`tel:${h.phone}`}
                        className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-royal-800 font-bold rounded-xl transition-all shadow-sm border border-blue-200"
                        title={`Direct Hotline: ${h.phone}`}
                      >
                        <PhoneCall className="w-3 h-3 text-royal-600" />
                        <span>Call</span>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. TAB 2: DOCTORS LIST & CREDENTIAL GENERATOR SECTION */}
      {adminTab === 'doctors' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-luxury space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center space-x-2">
                <Stethoscope className="w-5 h-5 text-royal-600" />
                <span>Verified Doctors Directory & Credential Provisioning</span>
              </h3>
              <p className="text-xs text-slate-500">Admin generated doctor credentials, qualification details, and active consultation roster</p>
            </div>

            <button
              onClick={() => setIsAddDoctorModalOpen(true)}
              className="px-4 py-2.5 bg-royal-600 hover:bg-royal-700 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Create Doctor Credentials</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Doctor & UIDN</th>
                  <th className="py-3.5 px-4">Specialization & Designation</th>
                  <th className="py-3.5 px-4">Degree & Alma Mater</th>
                  <th className="py-3.5 px-4">Passing / Relieving</th>
                  <th className="py-3.5 px-4">Experience</th>
                  <th className="py-3.5 px-4">Duty Hospital & PHC</th>
                  <th className="py-3.5 px-4">Contact (Email & Phone)</th>
                  <th className="py-3.5 px-4">Consultations</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {doctors.map((d) => (
                  <tr key={d.uidn} className="hover:bg-blue-50/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{d.name}</div>
                      <div className="font-mono text-[10px] text-royal-700 font-semibold">{d.uidn}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{d.abdmCode}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{d.designation}</div>
                      <div className="text-[11px] text-royal-700 font-semibold">{d.specialization || 'Oral Onco-Pathology'}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{d.degreeCertificate}</div>
                      <div className="text-[10px] text-slate-500">{d.university}</div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      <div>Passing: {d.passingYear || 2018}</div>
                      <div className="text-slate-500">Relieving: {d.relievingYear || 2021}</div>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {d.experienceYears} Years
                    </td>

                    <td className="py-3.5 px-4 text-xs font-medium text-slate-700">
                      <div>{d.hospitalDuty}</div>
                      <div className="text-[10px] font-bold text-slate-500">{d.mandal} Mandal</div>
                    </td>

                    <td className="py-3.5 px-4 text-xs">
                      <div className="font-mono text-slate-800">{d.email}</div>
                      <div className="text-slate-500 font-mono text-[11px]">{d.phone}</div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-royal-800">
                      {d.consultationsCount || 12}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => toggleDoctorStatus(d.uidn)}
                        className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors ${
                          d.isActive !== false
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : 'bg-slate-200 text-slate-600 border-slate-300'
                        }`}
                      >
                        {d.isActive !== false ? <ToggleRight className="w-4 h-4 text-emerald-600" /> : <ToggleLeft className="w-4 h-4 text-slate-500" />}
                        <span>{d.isActive !== false ? 'ACTIVE' : 'INACTIVE'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. CREATE DOCTOR CREDENTIALS MODAL */}
      {isAddDoctorModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white max-w-lg w-full rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-royal-600" />
                <h3 className="font-bold text-base text-slate-900">
                  Provision Doctor Credentials & Roster Account
                </h3>
              </div>
              <button
                onClick={() => setIsAddDoctorModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            {addDoctorSuccess ? (
              <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-300 text-center space-y-3">
                <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-base text-emerald-950">Doctor Credentials Provisioned!</h4>
                <div className="bg-white/90 border border-emerald-200 rounded-xl p-3.5 text-left text-xs space-y-1.5 shadow-sm max-w-sm mx-auto">
                  <div className="font-bold text-slate-800 border-b border-emerald-100 pb-1">Doctor Login Credentials:</div>
                  <div className="text-slate-600"><strong>User-ID:</strong> <span className="font-mono text-royal-800 font-bold">{newDoctor.uidn}</span></div>
                  <div className="text-slate-600"><strong>Email:</strong> <span className="font-mono text-emerald-900 font-bold">{newDoctor.email}</span></div>
                  <div className="text-slate-600"><strong>Password:</strong> <span className="font-mono text-royal-800 font-bold">{newDoctor.password}</span></div>
                  <div className="text-slate-600"><strong>Duty Hospital:</strong> {newDoctor.hospitalDuty}</div>
                  <div className="text-[10px] text-emerald-700 font-semibold pt-1">
                    ✓ Doctor can immediately sign in via the Doctor Portal!
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateDoctor} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Doctor Full Name</label>
                    <input
                      type="text"
                      value={newDoctor.name}
                      onChange={(e) => setNewDoctor({ ...newDoctor, name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-900"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">User-ID / UIDN</label>
                    <input
                      type="text"
                      value={newDoctor.uidn}
                      onChange={(e) => setNewDoctor({ ...newDoctor, uidn: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-900"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Doctor Official Email</label>
                    <input
                      type="email"
                      value={newDoctor.email}
                      onChange={(e) => setNewDoctor({ ...newDoctor, email: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-medium text-slate-900"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Login Password</label>
                    <input
                      type="text"
                      value={newDoctor.password}
                      autoComplete="new-password"
                      onChange={(e) => setNewDoctor({ ...newDoctor, password: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-900"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Degree Certificate</label>
                    <input
                      type="text"
                      value={newDoctor.degreeCertificate}
                      onChange={(e) => setNewDoctor({ ...newDoctor, degreeCertificate: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={newDoctor.phone}
                      onChange={(e) => setNewDoctor({ ...newDoctor, phone: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Alma Mater / University</label>
                  <input
                    type="text"
                    value={newDoctor.university}
                    onChange={(e) => setNewDoctor({ ...newDoctor, university: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900"
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Passing Year</label>
                    <input
                      type="number"
                      value={newDoctor.passingYear}
                      onChange={(e) => setNewDoctor({ ...newDoctor, passingYear: parseInt(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Relieving Year</label>
                    <input
                      type="number"
                      value={newDoctor.relievingYear}
                      onChange={(e) => setNewDoctor({ ...newDoctor, relievingYear: parseInt(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Experience (Yrs)</label>
                    <input
                      type="number"
                      value={newDoctor.experienceYears}
                      onChange={(e) => setNewDoctor({ ...newDoctor, experienceYears: parseInt(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Assigned Mandal</label>
                    <select
                      value={newDoctor.mandal}
                      onChange={(e) => setNewDoctor({ ...newDoctor, mandal: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-900"
                    >
                      {mandalList.filter((m) => m !== 'ALL').map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Duty Facility / PHC</label>
                    <input
                      type="text"
                      value={newDoctor.hospitalDuty}
                      onChange={(e) => setNewDoctor({ ...newDoctor, hospitalDuty: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900"
                      required
                    />
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    className="w-full py-3 bg-royal-600 hover:bg-royal-700 text-white font-extrabold text-xs rounded-xl shadow-blue-card transition-all flex items-center justify-center space-x-2"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Provision Credentials & Register Doctor</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPortal;
