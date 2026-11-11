import mongoose, { Document, Schema } from 'mongoose';
import { ASR_MANDALS, ASRMandal } from './Patient.js';

export type AppointmentType = 'General Oral Consultation' | 'Biopsy Procedure Appointment';
export type AppointmentStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface IAppointment extends Document {
  appointmentId: string;
  patientUidn: string;
  doctorUidn?: string;
  mandal: ASRMandal;
  hospitalName: string;
  apptType: AppointmentType;
  appointmentDate: Date;
  dayOfWeek: string;
  timeSlot: string;
  status: AppointmentStatus;
  doctorRemarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AppointmentSchema = new Schema<IAppointment>(
  {
    appointmentId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    patientUidn: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    doctorUidn: {
      type: String,
      trim: true,
      index: true
    },
    mandal: {
      type: String,
      enum: ASR_MANDALS,
      required: true,
      index: true
    },
    hospitalName: {
      type: String,
      required: true,
      trim: true
    },
    apptType: {
      type: String,
      enum: ['General Oral Consultation', 'Biopsy Procedure Appointment'],
      required: true
    },
    appointmentDate: {
      type: Date,
      required: true,
      index: true
    },
    dayOfWeek: {
      type: String,
      required: true
    },
    timeSlot: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
      index: true
    },
    doctorRemarks: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

export const AppointmentModel = mongoose.models.Appointment || mongoose.model<IAppointment>('Appointment', AppointmentSchema);
export default AppointmentModel;

