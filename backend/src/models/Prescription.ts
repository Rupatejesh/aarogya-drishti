import mongoose, { Document, Schema } from 'mongoose';

export type TrackingStatus =
  | 'Screening Completed'
  | 'Prescription Dispensed'
  | 'Biopsy Scheduled'
  | 'Histopathology Review';

export interface IMedicine {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export interface IPrescription extends Document {
  rxId: string;
  patientUidn: string;
  doctorUidn: string;
  date: Date;
  medicines: IMedicine[];
  biopsyRecommended: boolean;
  biopsyProcedureDetails?: string;
  trackingStatus: TrackingStatus;
  printableBarcodeId: string;
  clinicalNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MedicineSchema = new Schema<IMedicine>(
  {
    name: { type: String, required: true, trim: true },
    dosage: { type: String, required: true, trim: true },
    frequency: { type: String, required: true, trim: true },
    duration: { type: String, required: true, trim: true },
    instructions: { type: String, trim: true }
  },
  { _id: false }
);

const PrescriptionSchema = new Schema<IPrescription>(
  {
    rxId: {
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
      required: true,
      trim: true,
      index: true
    },
    date: {
      type: Date,
      default: Date.now,
      required: true
    },
    medicines: {
      type: [MedicineSchema],
      default: []
    },
    biopsyRecommended: {
      type: Boolean,
      default: false
    },
    biopsyProcedureDetails: {
      type: String,
      trim: true
    },
    trackingStatus: {
      type: String,
      enum: [
        'Screening Completed',
        'Prescription Dispensed',
        'Biopsy Scheduled',
        'Histopathology Review'
      ],
      default: 'Prescription Dispensed',
      index: true
    },
    printableBarcodeId: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    clinicalNotes: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

export const PrescriptionModel =
  mongoose.models.Prescription ||
  mongoose.model<IPrescription>('Prescription', PrescriptionSchema);
export default PrescriptionModel;

