import mongoose, { Document, Schema } from 'mongoose';

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
  activeStatus: boolean;
  consultationsCount: number;
  abdmCode: string;
  email: string;
  phone: string;
  credentials: string[];
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
    }
  },
  {
    timestamps: true
  }
);

export const DoctorModel = mongoose.models.Doctor || mongoose.model<IDoctor>('Doctor', DoctorSchema);
export default DoctorModel;

