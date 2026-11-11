import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Hospital,
  Stethoscope,
  X,
  CheckCircle,
  FileCheck2,
  AlertTriangle
} from 'lucide-react';
import api from '../services/api.ts';
import { Language, translations } from '../i18n/translations.ts';

interface AppointmentRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: any;
  lang: Language;
  onAppointmentBooked: (appt: any) => void;
}

export const AppointmentRequestModal: React.FC<AppointmentRequestModalProps> = ({
  isOpen,
  onClose,
  patient,
  lang,
  onAppointmentBooked
}) => {
  const t = translations[lang];

  const [apptType, setApptType] = useState<'General Oral Consultation' | 'Biopsy Procedure Appointment'>('Biopsy Procedure Appointment');
  const [mandal, setMandal] = useState(patient?.mandal || 'G. Madugula');
  const [hospitalName, setHospitalName] = useState('Community Health Centre G. Madugula');
  const [doctorUidn, setDoctorUidn] = useState('DOC-SWAPNA');
  const [appointmentDate, setAppointmentDate] = useState('2026-11-20');
  const [timeSlot, setTimeSlot] = useState('10:00 AM - 10:30 AM');
  const [doctorRemarks, setDoctorRemarks] = useState('Urgent consultation for persistent indurated buccal patch.');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        patientUidn: patient?.uidn || 'UIDN-ASR-2026-GM046',
        doctorUidn,
        mandal,
        hospitalName,
        apptType,
        appointmentDate: new Date(appointmentDate).toISOString(),
        timeSlot,
        doctorRemarks
      };

      const res = await api.requestAppointment(payload);
      onAppointmentBooked(res.appointment);
      alert(`Appointment queued successfully with ${doctorUidn === 'DOC-SWAPNA' ? 'Dr. Swapna Devi' : 'Specialist'}!`);
      onClose();
    } catch (err: any) {
      alert(`Error booking appointment: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white max-w-lg w-full rounded-3xl border border-amber-300 shadow-2xl overflow-hidden animate-scaleIn">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-950 via-amber-900 to-amber-950 text-white p-5 flex items-center justify-between border-b border-amber-600/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-base font-serif-royal">
                REQUEST TELE-ONCOLOGY APPOINTMENT
              </h3>
              <p className="text-[11px] text-amber-200">
                Patient: {patient?.name} ({patient?.uidn})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/20 text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Radio Toggle: General Consultation vs Biopsy Procedure */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">
              Appointment Category
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`p-3 rounded-2xl border cursor-pointer flex flex-col items-center text-center transition-all ${
                  apptType === 'General Oral Consultation'
                    ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-400 text-amber-950'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="apptType"
                  value="General Oral Consultation"
                  checked={apptType === 'General Oral Consultation'}
                  onChange={() => setApptType('General Oral Consultation')}
                  className="hidden"
                />
                <Stethoscope className="w-5 h-5 text-amber-600 mb-1" />
                <span className="font-bold text-xs">General Oral Consultation</span>
                <span className="text-[10px] text-slate-500 mt-0.5">Clinical Examination</span>
              </label>

              <label
                className={`p-3 rounded-2xl border cursor-pointer flex flex-col items-center text-center transition-all ${
                  apptType === 'Biopsy Procedure Appointment'
                    ? 'bg-red-50 border-red-500 ring-2 ring-red-400 text-red-950'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="apptType"
                  value="Biopsy Procedure Appointment"
                  checked={apptType === 'Biopsy Procedure Appointment'}
                  onChange={() => setApptType('Biopsy Procedure Appointment')}
                  className="hidden"
                />
                <FileCheck2 className="w-5 h-5 text-red-600 mb-1" />
                <span className="font-bold text-xs">Biopsy Procedure</span>
                <span className="text-[10px] text-red-600 font-semibold mt-0.5">Punch Biopsy Protocol</span>
              </label>
            </div>
          </div>

          {/* Mandal & Facility */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Mandal</label>
              <select
                value={mandal}
                onChange={(e) => setMandal(e.target.value)}
                className="w-full bg-[#FAF9F5] border border-amber-300 rounded-xl p-2.5 text-xs font-bold text-amber-950"
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

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Health Facility</label>
              <input
                type="text"
                value={hospitalName}
                onChange={(e) => setHospitalName(e.target.value)}
                className="w-full bg-[#FAF9F5] border border-amber-300 rounded-xl p-2.5 text-xs font-semibold"
                required
              />
            </div>
          </div>

          {/* Specialist Doctor Selector */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Attending Specialist</label>
            <select
              value={doctorUidn}
              onChange={(e) => setDoctorUidn(e.target.value)}
              className="w-full bg-[#FAF9F5] border border-amber-300 rounded-xl p-2.5 text-xs font-bold text-slate-800"
            >
              <option value="DOC-SWAPNA">Dr. Swapna Devi, MDS (Chief Onco-Pathologist - AH / PHC G. Madugula)</option>
              <option value="DOC-RAJESH">Dr. K. Rajesh, MS ENT (Head & Neck Surgeon - Paderu Hub)</option>
              <option value="DOC-ANAND">Dr. Anand Kumar, MDS (Oral Medicine Lead - CHC G. Madugula)</option>
            </select>
          </div>

          {/* Date & Time Slot */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Appointment Date</label>
              <input
                type="date"
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                className="w-full bg-[#FAF9F5] border border-amber-300 rounded-xl p-2.5 text-xs font-mono font-bold"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Time Slot</label>
              <select
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                className="w-full bg-[#FAF9F5] border border-amber-300 rounded-xl p-2.5 text-xs font-bold"
              >
                <option value="09:30 AM - 10:00 AM">09:30 AM - 10:00 AM</option>
                <option value="10:00 AM - 10:30 AM">10:00 AM - 10:30 AM</option>
                <option value="11:30 AM - 12:00 PM">11:30 AM - 12:00 PM</option>
                <option value="02:30 PM - 03:00 PM">02:30 PM - 03:00 PM</option>
              </select>
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Patient Symptoms / Remarks</label>
            <textarea
              value={doctorRemarks}
              onChange={(e) => setDoctorRemarks(e.target.value)}
              rows={2}
              className="w-full bg-[#FAF9F5] border border-amber-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white font-extrabold text-xs shadow-gold-glow hover:brightness-105 active:scale-95 transition-all"
          >
            {loading ? 'Submitting Request...' : 'Confirm Appointment Request'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AppointmentRequestModal;

