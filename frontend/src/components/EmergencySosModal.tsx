import React, { useState } from 'react';
import {
  PhoneCall,
  AlertTriangle,
  MapPin,
  Ambulance,
  CheckCircle,
  X,
  Radio,
  Clock,
  ShieldAlert
} from 'lucide-react';
import { Language, translations } from '../i18n/translations.ts';

interface EmergencySosModalProps {
  onClose: () => void;
  lang: Language;
  patientMandal?: string;
  patientVillage?: string;
}

export const EmergencySosModal: React.FC<EmergencySosModalProps> = ({
  onClose,
  lang,
  patientMandal = 'G. Madugula',
  patientVillage = 'Nurmati'
}) => {
  const t = translations[lang];
  const [dispatched, setDispatched] = useState(false);

  const handleDispatch = () => {
    setDispatched(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white max-w-lg w-full rounded-3xl border-2 border-red-500 shadow-2xl overflow-hidden animate-scaleIn">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-700 via-red-600 to-red-800 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6 text-white animate-bounce" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-wide font-serif-royal">
                TRIBAL EMERGENCY 108 / 104 DISPATCH
              </h3>
              <p className="text-xs text-red-100">
                ITDA Paderu Tribal Agency Quick-Response Network
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/20 transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-red-50 rounded-2xl p-4 border border-red-200 text-xs text-red-900 space-y-2">
            <div className="font-bold flex items-center space-x-1.5 text-sm">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>Urgent Clinical Evacuation Protocol</span>
            </div>
            <p className="leading-relaxed">
              Initiates priority emergency ambulance dispatch for acute oral malignant ulceration, profuse bleeding, or severe trismus in ITDA Paderu agency areas.
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-700">
              <span className="font-semibold flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-amber-600" />
                <span>GPS Location:</span>
              </span>
              <span className="font-mono font-bold">{patientVillage}, {patientMandal} (ASR)</span>
            </div>

            <div className="flex justify-between items-center text-slate-700">
              <span className="font-semibold flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Estimated Response Time:</span>
              </span>
              <span className="font-bold text-emerald-700">8 - 12 Minutes (Ghat Section)</span>
            </div>

            <div className="flex justify-between items-center text-slate-700">
              <span className="font-semibold flex items-center space-x-1">
                <Radio className="w-3.5 h-3.5 text-emerald-600" />
                <span>Nearest Critical Casualty:</span>
              </span>
              <span className="font-bold text-slate-900">Area Hospital Paderu / CHC {patientMandal}</span>
            </div>
          </div>

          {/* Dispatch Confirmation Card */}
          {dispatched ? (
            <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 text-center space-y-2 animate-fadeIn">
              <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto" />
              <div className="font-bold text-sm text-emerald-950">
                108 Tribal Ambulance Unit Dispatched
              </div>
              <p className="text-xs text-emerald-800">
                Vehicle #AP-31-TX-108 is en route to {patientVillage}. Mobile Medical Officer alerted.
              </p>
            </div>
          ) : (
            <button
              onClick={handleDispatch}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-extrabold text-xs shadow-lg shadow-red-600/30 flex items-center justify-center space-x-2 transition-all active:scale-95"
            >
              <PhoneCall className="w-4 h-4 animate-bounce" />
              <span>DISPATCH 108 AMBULANCE NOW</span>
            </button>
          )}

          <div className="flex justify-between items-center pt-2">
            <a
              href="tel:108"
              className="text-xs font-bold text-amber-800 hover:underline flex items-center space-x-1"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Direct Dial 108 Helpline</span>
            </a>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencySosModal;

