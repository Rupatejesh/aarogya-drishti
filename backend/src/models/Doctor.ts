import mongoose, { Document, Schema } from 'mongoose';

export interface IDoctorSlot {
  date: string;
  dayOfWeek?: string;
  timeSlot: string;
  isAvailable: boolean;
  maxPatients?: number;
}

export interface IDoctor extends Document {
  uidn: string;
  name: string;
  degreeCertificate: string;
  university: string;
  passingYear: number;
  relievingYear?: number;
  experienceYears: number;
  designation: string;
  hospitalDuty: string;
  mandal?: string;
  status?: 'Active' | 'Inactive' | 'On Visit';
  activeStatus: boolean;
  consultationsCount: number;
  abdmCode: string;
  email: string;
  phone: string;
  credentials: string[];
  availabilitySlots?: IDoctorSlot[];
  createdAt: Date;
  updatedAt: Date;
}

const DoctorSchema = new Schema<IDoctor>(
  {
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
    degreeCertificate: {
      type: String,
      required: true,
      trim: true
    },
    university: {
      type: String,
      required: true,
      trim: true
    },
    passingYear: {
      type: Number,
      required: true
    },
    relievingYear: {
      type: Number
    },
    experienceYears: {
      type: Number,
      required: true,
      default: 0
    },
    designation: {
      type: String,
      required: true,
      trim: true
    },
    hospitalDuty: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    mandal: {
      type: String,
      trim: true,
      index: true
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'On Visit'],
      default: 'Active',
      index: true
    },
    activeStatus: {
      type: Boolean,
      default: true
    },
    consultationsCount: {
      type: Number,
      default: 0
    },
    abdmCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    credentials: {
      type: [String],
      default: []
    },
    availabilitySlots: [
      {
        date: { type: String, required: true },
        dayOfWeek: { type: String },
        timeSlot: { type: String, required: true },
        isAvailable: { type: Boolean, default: true },
        maxPatients: { type: Number, default: 1 }
      }
    ]
  },
  {
    timestamps: true
  }
);

export const DoctorModel = mongoose.models.Doctor || mongoose.model<IDoctor>('Doctor', DoctorSchema);
export default DoctorModel;

