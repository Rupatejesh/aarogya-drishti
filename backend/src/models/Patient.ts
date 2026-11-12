import mongoose, { Document, Schema } from 'mongoose';

export const ASR_MANDALS = [
  'Paderu',
  'Araku Valley',
  'Dumbriguda',
  'Ananthagiri',
  'Hukumpeta',
  'Pedabayalu',
  'Munchingi Puttu',
  'G. Madugula',
  'Chintapalle',
  'G.K. Veedhi',
  'Koyyuru'
] as const;

export type ASRMandal = typeof ASR_MANDALS[number];

export interface IPatient extends Document {
  patientId?: string;
  uidn: string;
  name: string;
  dob: Date;
  age: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  bloodGroup?: string;
  phone: string;
  aadhar: string;
  mandal: ASRMandal;
  village: string;
  habitation: string;
  photoUrl?: string;
  cloudinaryPhotoId?: string;
  consentTimestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PatientSchema = new Schema<IPatient>(
  {
    patientId: {
      type: String,
      sparse: true,
      index: true
    },
    uidn: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    dob: {
      type: Date,
      required: true
    },
    age: {
      type: Number,
      required: true,
      min: 0,
      max: 125
    },
    gender: {
      type: String,
      enum: ['MALE', 'FEMALE', 'OTHER'],
      required: true
    },
    bloodGroup: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    aadhar: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    mandal: {
      type: String,
      enum: ASR_MANDALS,
      required: true,
      index: true
    },
    village: {
      type: String,
      required: true,
      trim: true
    },
    habitation: {
      type: String,
      required: true,
      trim: true
    },
    photoUrl: {
      type: String,
      trim: true
    },
    cloudinaryPhotoId: {
      type: String,
      trim: true,
      default: null
    },
    consentTimestamp: {
      type: Date,
      default: Date.now,
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Helper method to compute age from DOB
export const calculateAgeFromDob = (dob: Date | string): number => {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return Math.max(0, age);
};

export const PatientModel = mongoose.models.Patient || mongoose.model<IPatient>('Patient', PatientSchema);
export default PatientModel;
