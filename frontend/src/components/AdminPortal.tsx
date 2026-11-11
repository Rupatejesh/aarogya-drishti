import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Hospital,
  Stethoscope,
  PhoneCall,
  UserPlus,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Activity,
  Layers,
  FileText,
  AlertTriangle,
  Building,
  MapPin,
  RefreshCw,
  Plus,
  Sparkles,
  Award
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
    degreeCertificate: 'MDS (Oral & Maxillofacial Pathology)',
    university: 'Andhra Medical College / Dr. NTR UHS',
    passingYear: 2017,
    relievingYear: 2020,
    experienceYears: 7,
    designation: 'Oral Onco-Pathology Consultant',
    hospitalDuty: 'Community Health Centre Chintapalle',
    mandal: 'Chintapalle',
    abdmCode: 'ABDM-DOC-AP-8842',
    email: 'dr.ramesh@aarogyadrishti.org',
    phone: '9490123477'
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
        }, 1500);
      }
    } catch (err: any) {
      alert(`Failed to add doctor: ${err.message}`);
    }
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
      {/* 1. Administrative Overview Header */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-950 text-white rounded-3xl p-6 sm:p-8 border border-amber-400 shadow-luxury flex flex-wrap items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="bg-amber-500/20 text-amber-300 text-xs font-bold px-3 py-0.5 rounded-full border border-amber-400/40">
              ITDA Paderu District Health Administration
            </span>
            <span className="bg-emerald-500/20 text-emerald-300 text-xs font-bold px-3 py-0.5 rounded-full border border-emerald-400/40">
              Alluri Sitharama Raju District
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-serif-royal">
            11 Mandals Healthcare Command & Registry Portal
          </h2>
          <p className="text-xs text-amber-200/80 max-w-2xl leading-relaxed">
            Autonomous surveillance and healthcare operations console tracking PHCs, CHCs, Area Hospitals, onco-pathologists, biopsy kits, and ambulance logistics across Alluri Sitharama Raju tribal agency.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsAddDoctorModalOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-slate-950 font-bold text-xs rounded-xl shadow-gold-glow transition-all flex items-center space-x-1.5"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Specialist Doctor</span>
          </button>

          <button
            onClick={fetchAdminData}
            className="p-2.5 bg-white/10 hover:bg-white/20 text-amber-200 rounded-xl transition-all"
            title="Refresh Command Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. District Metric KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-amber-200/80 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Tribal Mandals</span>
          <div className="text-2xl font-extrabold text-slate-900 font-serif-royal flex items-center justify-between">
            <span>11 / 11</span>
            <MapPin className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold">100% ITDA Coverage</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-amber-200/80 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Health Facilities</span>
          <div className="text-2xl font-extrabold text-slate-900 font-serif-royal flex items-center justify-between">
            <span>{hospitals.length || 11}</span>
            <Building className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-[11px] text-slate-500 font-medium">PHCs, CHCs, & Area Hosp</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-amber-200/80 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Biopsy Punch Units</span>
          <div className="text-2xl font-extrabold text-slate-900 font-serif-royal flex items-center justify-between">
            <span>{biopsyReadyCount} / {hospitals.length || 11}</span>
            <Activity className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold">Formalin Jars Stocked</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-amber-200/80 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Active Tribal Cases</span>
          <div className="text-2xl font-extrabold text-slate-900 font-serif-royal flex items-center justify-between">
            <span>{totalCasesRunning}</span>
            <FileText className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-[11px] text-slate-500 font-medium">{totalCasesDischarged} Cleared / Discharged</div>
        </div>
      </div>

      {/* 3. Navigation Tabs: Hospitals Directory vs. Doctor Registry */}
      <div className="flex border-b border-amber-200">
        <button
          onClick={() => setAdminTab('hospitals')}
          className={`px-5 py-3 text-xs font-bold border-b-2 flex items-center space-x-2 transition-all ${
            adminTab === 'hospitals'
              ? 'border-amber-600 text-amber-900 bg-amber-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Hospital className="w-4 h-4 text-amber-600" />
          <span>11 Mandals Health Facilities Directory ({hospitals.length})</span>
        </button>

        <button
          onClick={() => setAdminTab('doctors')}
          className={`px-5 py-3 text-xs font-bold border-b-2 flex items-center space-x-2 transition-all ${
            adminTab === 'doctors'
              ? 'border-amber-600 text-amber-900 bg-amber-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Stethoscope className="w-4 h-4 text-amber-600" />
          <span>Specialist Doctors & Onco-Registry ({doctors.length})</span>
        </button>
      </div>

      {/* 4. TAB 1: 11 MANDALS HOSPITALS DIRECTORY TABLE */}
      {adminTab === 'hospitals' && (
        <div className="bg-white rounded-3xl border border-amber-300 p-6 shadow-luxury space-y-6">
          {/* Controls: Search and Mandal Filter */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center space-x-2 bg-[#FAF9F5] border border-amber-300 rounded-xl px-3 py-2 text-xs">
                <Filter className="w-3.5 h-3.5 text-amber-600" />
                <span className="font-bold text-slate-700">Mandal Filter:</span>
                <select
                  value={selectedMandalFilter}
                  onChange={(e) => setSelectedMandalFilter(e.target.value)}
                  className="bg-transparent font-semibold text-amber-900 focus:outline-none cursor-pointer"
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
                  className="bg-[#FAF9F5] border border-amber-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <span className="text-xs font-bold text-slate-500">
              Showing <strong>{filteredHospitals.length}</strong> of <strong>{hospitals.length}</strong> facilities
            </span>
          </div>

          {/* Detailed Data Table */}
          <div className="overflow-x-auto rounded-2xl border border-amber-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FCFBF7] text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-amber-200">
                <tr>
                  <th className="py-3.5 px-4">Facility & ABDM Code</th>
                  <th className="py-3.5 px-4">Mandal</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">MO In-Charge</th>
                  <th className="py-3.5 px-4">Logistics (Blood / 108)</th>
                  <th className="py-3.5 px-4">Biopsy Kits</th>
                  <th className="py-3.5 px-4">Case Sheets</th>
                  <th className="py-3.5 px-4 text-center">Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100 font-medium text-slate-800">
                {filteredHospitals.map((h) => (
                  <tr key={h.abdmFacilityCode} className="hover:bg-amber-50/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{h.name}</div>
                      <div className="font-mono text-[10px] text-amber-700 font-semibold">{h.abdmFacilityCode}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-amber-900 bg-amber-100/60 px-2 py-0.5 rounded border border-amber-200">
                        {h.mandal}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-700">
                      {h.facilityType}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{h.moInCharge}</div>
                      <div className="text-[10px] text-slate-500">In-Charge Medical Officer</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          h.bloodBankAvailable ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                        }`}>
                          Blood: {h.bloodBankAvailable ? 'YES' : 'NO'}
                        </span>
                        <div className="text-[10px] text-slate-500 font-mono">
                          108: {h.ambulance108_104_Unit}
                        </div>
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
                            <span>READY</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            <span>TRANSIT</span>
                          </>
                        )}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      <div>
                        Running: <strong className="text-amber-900">{h.caseSheetsRunning}</strong>
                      </div>
                      <div className="text-slate-500">
                        Discharged: {h.caseSheetsDischarged}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <a
                        href={`tel:${h.phone}`}
                        className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold rounded-xl transition-all shadow-sm"
                        title={`Direct Hotline: ${h.phone}`}
                      >
                        <PhoneCall className="w-3 h-3 text-amber-700" />
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

      {/* 5. TAB 2: SPECIALIST DOCTORS REGISTRY */}
      {adminTab === 'doctors' && (
        <div className="bg-white rounded-3xl border border-amber-300 p-6 shadow-luxury space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold font-serif-royal text-slate-900 flex items-center space-x-2">
                <Stethoscope className="w-5 h-5 text-amber-600" />
                <span>Verified Tele-Oncologists & Medical Officers</span>
              </h3>
              <p className="text-xs text-slate-500">Credentials, experience years, passing university, and duty post</p>
            </div>

            <button
              onClick={() => setIsAddDoctorModalOpen(true)}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Doctor</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-amber-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FCFBF7] text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-amber-200">
                <tr>
                  <th className="py-3.5 px-4">Doctor & ABDM ID</th>
                  <th className="py-3.5 px-4">Designation</th>
                  <th className="py-3.5 px-4">Degree & Alma Mater</th>
                  <th className="py-3.5 px-4">Experience</th>
                  <th className="py-3.5 px-4">Hospital Duty</th>
                  <th className="py-3.5 px-4">Consultations</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100 font-medium text-slate-800">
                {doctors.map((d) => (
                  <tr key={d.uidn} className="hover:bg-amber-50/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{d.name}</div>
                      <div className="font-mono text-[10px] text-amber-700 font-semibold">{d.uidn}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{d.abdmCode}</div>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      {d.designation}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{d.degreeCertificate}</div>
                      <div className="text-[10px] text-slate-500">{d.university} ({d.passingYear})</div>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {d.experienceYears} Years
                    </td>

                    <td className="py-3.5 px-4 text-xs font-medium text-slate-700">
                      {d.hospitalDuty}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-amber-900">
                      {d.consultationsCount || 0}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <CheckCircle className="w-3 h-3 text-emerald-600" />
                        <span>ACTIVE</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. ADD NEW DOCTOR MODAL */}
      {isAddDoctorModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white max-w-lg w-full rounded-3xl p-6 sm:p-7 border border-amber-300 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-amber-200">
              <div className="flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-base text-slate-900 font-serif-royal">
                  Add Specialist Doctor & Generate ABDM Credentials
                </h3>
              </div>
              <button
                onClick={() => setIsAddDoctorModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {addDoctorSuccess ? (
              <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-300 text-center space-y-2">
                <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-base text-emerald-950 font-serif-royal">Doctor Successfully Registered!</h4>
                <p className="text-xs text-emerald-800">
                  Credentials and ABDM provider ID generated and provisioned in ITDA Paderu Registry.
                </p>
              </div>
            ) : (
              <form onSubmit={handleCreateDoctor} className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Doctor Full Name & Title</label>
                  <input
                    type="text"
                    value={newDoctor.name}
                    onChange={(e) => setNewDoctor({ ...newDoctor, name: e.target.value })}
                    className="w-full bg-[#FAF9F5] border border-amber-300 rounded-xl p-2.5 text-xs font-bold"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Degree Certificate</label>
                    <input
                      type="text"
                      value={newDoctor.degreeCertificate}
                      onChange={(e) => setNewDoctor({ ...newDoctor, degreeCertificate: e.target.value })}
                      className="w-full bg-[#FAF9F5] border border-amber-300 rounded-xl p-2.5 text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Alma Mater / University</label>
                    <input
                      type="text"
                      value={newDoctor.university}
                      onChange={(e) => setNewDoctor({ ...newDoctor, university: e.target.value })}
                      className="w-full bg-[#FAF9F5] border border-amber-300 rounded-xl p-2.5 text-xs"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Passing Year</label>
                    <input
                      type="number"
                      value={newDoctor.passingYear}
                      onChange={(e) => setNewDoctor({ ...newDoctor, passingYear: parseInt(e.target.value) })}
                      className="w-full bg-[#FAF9F5] border border-amber-300 rounded-xl p-2.5 text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Relieving Year</label>
                    <input
                      type="number"
                      value={newDoctor.relievingYear}
                      onChange={(e) => setNewDoctor({ ...newDoctor, relievingYear: parseInt(e.target.value) })}
                      className="w-full bg-[#FAF9F5] border border-amber-300 rounded-xl p-2.5 text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Experience (Yrs)</label>
                    <input
                      type="number"
                      value={newDoctor.experienceYears}
                      onChange={(e) => setNewDoctor({ ...newDoctor, experienceYears: parseInt(e.target.value) })}
                      className="w-full bg-[#FAF9F5] border border-amber-300 rounded-xl p-2.5 text-xs"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Designation & Specialty</label>
                  <input
                    type="text"
                    value={newDoctor.designation}
                    onChange={(e) => setNewDoctor({ ...newDoctor, designation: e.target.value })}
                    className="w-full bg-[#FAF9F5] border border-amber-300 rounded-xl p-2.5 text-xs"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Assigned Mandal</label>
                    <select
                      value={newDoctor.mandal}
                      onChange={(e) => setNewDoctor({ ...newDoctor, mandal: e.target.value })}
                      className="w-full bg-[#FAF9F5] border border-amber-300 rounded-xl p-2.5 text-xs font-semibold"
                    >
                      {mandalList.filter((m) => m !== 'ALL').map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Duty Facility</label>
                    <input
                      type="text"
                      value={newDoctor.hospitalDuty}
                      onChange={(e) => setNewDoctor({ ...newDoctor, hospitalDuty: e.target.value })}
                      className="w-full bg-[#FAF9F5] border border-amber-300 rounded-xl p-2.5 text-xs"
                      required
                    />
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white font-extrabold text-xs rounded-xl shadow-gold-glow hover:brightness-110 active:scale-95 transition-all flex items-center justify-center space-x-2"
                  >
                    <Sparkles className="w-4 h-4" />
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
