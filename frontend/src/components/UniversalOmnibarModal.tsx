import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  User,
  Stethoscope,
  Hospital,
  FileText,
  ArrowRight,
  Sparkles,
  Command,
  CornerDownLeft,
  Calendar,
  Activity
} from 'lucide-react';
import api from '../services/api.ts';
import { Language, translations } from '../i18n/translations.ts';

interface UniversalOmnibarModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onSelectPatient: (uidn: string) => void;
  onSelectDoctor?: (doctor: any) => void;
  onSelectHospital?: (hospital: any) => void;
  onSelectPrescription?: (rx: any) => void;
}

export const UniversalOmnibarModal: React.FC<UniversalOmnibarModalProps> = ({
  isOpen,
  onClose,
  lang,
  onSelectPatient,
  onSelectDoctor,
  onSelectHospital,
  onSelectPrescription
}) => {
  const t = translations[lang];
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery('');
      setResults(null);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSearch = async (val: string) => {
    setQuery(val);
    if (!val || val.trim().length < 2) {
      setResults(null);
      return;
    }

    setLoading(true);
    try {
      const res = await api.searchOmnibar(val.trim());
      if (res.results) {
        setResults(res.results);
      }
    } catch (err) {
      console.warn('Omnibar search notice:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const totalResults =
    (results?.patients?.length || 0) +
    (results?.doctors?.length || 0) +
    (results?.hospitals?.length || 0) +
    (results?.prescriptions?.length || 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-start justify-center p-4 sm:p-6 pt-16 sm:pt-24 animate-in fade-in duration-200">
      <div
        className="bg-white w-full max-w-2xl rounded-3xl border-2 border-amber-400 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header Bar */}
        <div className="p-4 sm:p-5 border-b border-amber-200/80 bg-gradient-to-r from-[#FFFDF8] via-white to-amber-50/40 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700 flex-shrink-0">
            <Search className="w-5 h-5" />
          </div>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Universal Search: Patients, Doctors, Mandals, ABDM Codes, Barcodes..."
            className="flex-1 bg-transparent text-sm sm:text-base font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />

          {loading && (
            <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
          )}

          <div className="hidden sm:flex items-center space-x-1.5 px-2 py-1 rounded-lg bg-amber-100/70 border border-amber-300 text-[10px] font-mono text-amber-900">
            <span>ESC to close</span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Suggestion Chips if no query */}
        {!query && (
          <div className="p-6 space-y-4">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Quick Evaluator Searches
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleSearch('Somanna')}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition-all flex items-center space-x-1"
              >
                <span>K. Somanna (Compulsory Case)</span>
              </button>
              <button
                onClick={() => handleSearch('Dr. Swapna')}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition-all"
              >
                Dr. Swapna Devi (AH Paderu)
              </button>
              <button
                onClick={() => handleSearch('Madugula')}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition-all"
              >
                CHC G. Madugula
              </button>
              <button
                onClick={() => handleSearch('Biopsy')}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition-all"
              >
                Biopsy Orders & Barcodes
              </button>
            </div>
          </div>
        )}

        {/* Results Container */}
        {results && (
          <div className="p-4 sm:p-5 overflow-y-auto space-y-4 divide-y divide-amber-100">
            <div className="text-xs font-bold text-slate-500 flex justify-between items-center pb-1">
              <span>Results Found: {totalResults}</span>
              <span className="font-mono text-[10px] text-amber-700 font-bold">Query: "{query}"</span>
            </div>

            {/* 1. Patients */}
            {results.patients?.length > 0 && (
              <div className="pt-3 space-y-2">
                <div className="text-xs font-bold text-amber-900 flex items-center space-x-1.5">
                  <User className="w-3.5 h-3.5 text-amber-600" />
                  <span>Tribal Patients</span>
                </div>
                <div className="space-y-1.5">
                  {results.patients.map((p: any) => (
                    <div
                      key={p.uidn}
                      onClick={() => {
                        onSelectPatient(p.uidn);
                        onClose();
                      }}
                      className="p-3 rounded-2xl hover:bg-amber-50 cursor-pointer flex items-center justify-between transition-colors border border-transparent hover:border-amber-300 group"
                    >
                      <div>
                        <div className="font-bold text-sm text-slate-900 flex items-center space-x-2">
                          <span>{p.name}</span>
                          <span className="text-[10px] font-mono bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-bold">
                            {p.uidn}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Age: {p.age} • Mandal: <strong>{p.mandal}</strong> • Village: {p.village}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 text-xs font-bold text-amber-700 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span>Authenticate</span>
                        <CornerDownLeft className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Doctors */}
            {results.doctors?.length > 0 && (
              <div className="pt-3 space-y-2">
                <div className="text-xs font-bold text-amber-900 flex items-center space-x-1.5">
                  <Stethoscope className="w-3.5 h-3.5 text-amber-600" />
                  <span>Specialist Doctors</span>
                </div>
                <div className="space-y-1.5">
                  {results.doctors.map((d: any) => (
                    <div
                      key={d.uidn}
                      onClick={() => {
                        if (onSelectDoctor) onSelectDoctor(d);
                        onClose();
                      }}
                      className="p-3 rounded-2xl hover:bg-amber-50 cursor-pointer flex items-center justify-between transition-colors border border-transparent hover:border-amber-300 group"
                    >
                      <div>
                        <div className="font-bold text-sm text-slate-900 flex items-center space-x-2">
                          <span>{d.name}</span>
                          <span className="text-[10px] font-mono bg-slate-200 text-slate-800 px-2 py-0.5 rounded font-bold">
                            {d.uidn}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {d.designation} • {d.hospitalDuty} ({d.experienceYears}y exp)
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-amber-600 group-hover:translate-x-1 transition-transform" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Hospitals */}
            {results.hospitals?.length > 0 && (
              <div className="pt-3 space-y-2">
                <div className="text-xs font-bold text-amber-900 flex items-center space-x-1.5">
                  <Hospital className="w-3.5 h-3.5 text-amber-600" />
                  <span>11 Mandals Facilities</span>
                </div>
                <div className="space-y-1.5">
                  {results.hospitals.map((h: any) => (
                    <div
                      key={h.abdmFacilityCode}
                      onClick={() => {
                        if (onSelectHospital) onSelectHospital(h);
                        onClose();
                      }}
                      className="p-3 rounded-2xl hover:bg-amber-50 cursor-pointer flex items-center justify-between transition-colors border border-transparent hover:border-amber-300 group"
                    >
                      <div>
                        <div className="font-bold text-sm text-slate-900">{h.name}</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Mandal: <strong>{h.mandal}</strong> • MO: {h.moInCharge} • Biopsy: {h.biopsyEquipStatus}
                        </div>
                      </div>
                      <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                        {h.facilityType}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Prescriptions & Biopsy Referrals */}
            {results.prescriptions?.length > 0 && (
              <div className="pt-3 space-y-2">
                <div className="text-xs font-bold text-amber-900 flex items-center space-x-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-600" />
                  <span>Prescriptions & Biopsy Slips</span>
                </div>
                <div className="space-y-1.5">
                  {results.prescriptions.map((rx: any) => (
                    <div
                      key={rx.rxId}
                      onClick={() => {
                        if (onSelectPrescription) onSelectPrescription(rx);
                        onClose();
                      }}
                      className="p-3 rounded-2xl hover:bg-amber-50 cursor-pointer flex items-center justify-between transition-colors border border-transparent hover:border-amber-300 group"
                    >
                      <div>
                        <div className="font-bold text-sm text-slate-900 flex items-center space-x-2">
                          <span>{rx.rxId}</span>
                          <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                            UIDN: {rx.patientUidn}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Status: {rx.trackingStatus} • Barcode: {rx.printableBarcodeId}
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-amber-600 group-hover:translate-x-1 transition-transform" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {totalResults === 0 && (
              <div className="text-center py-8 text-slate-400 text-xs">
                No matching records found for "{query}". Try searching by patient name or mandal.
              </div>
            )}
          </div>
        )}

        {/* Footer shortcuts */}
        <div className="p-3 bg-[#FCFBF7] border-t border-amber-200/80 px-5 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center space-x-3">
            <span>Press <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono font-bold text-[10px] text-slate-700">ESC</kbd> to exit</span>
            <span>Press <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono font-bold text-[10px] text-slate-700">/</kbd> anytime to open</span>
          </div>
          <span className="font-bold text-amber-900">ITDA Paderu Healthcare Engine</span>
        </div>
      </div>
    </div>
  );
};

export default UniversalOmnibarModal;
