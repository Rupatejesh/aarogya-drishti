import mongoose, { Document, Schema } from 'mongoose';
import { ASR_MANDALS, ASRMandal } from './Patient.js';

export type FacilityType = 'PHC' | 'CHC' | 'AH' | 'GGH';

export interface IHospital extends Document {
  hospitalId?: string;
  name: string;
  mandal: ASRMandal;
  abdmFacilityCode: string;
  facilityType: FacilityType;
  moInCharge: string;
  bloodBankAvailable: boolean;
  ambulance108_104_Unit: boolean;
  biopsyEquipStatus: 'AVAILABLE' | 'UNDER_MAINTENANCE' | 'REFERRAL_REQUIRED';
  caseSheetsRunning: number;
  caseSheetsDischarged: number;
  phone: string;
  createdAt: Date;
  updatedAt: Date;
}

const HospitalSchema = new Schema<IHospital>(
  {
    hospitalId: {
      type: String,
      sparse: true,
      index: true
    },
    name: {
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
    abdmFacilityCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    facilityType: {
      type: String,
      enum: ['PHC', 'CHC', 'AH', 'GGH'],
      required: true,
      index: true
    },
    moInCharge: {
      type: String,
      required: true,
      trim: true
    },
    bloodBankAvailable: {
      type: Boolean,
      default: false
    },
    ambulance108_104_Unit: {
      type: Boolean,
      default: true
    },
    biopsyEquipStatus: {
      type: String,
      enum: ['AVAILABLE', 'UNDER_MAINTENANCE', 'REFERRAL_REQUIRED'],
      default: 'AVAILABLE'
    },
    caseSheetsRunning: {
      type: Number,
      default: 0
    },
    caseSheetsDischarged: {
      type: Number,
      default: 0
    },
    phone: {
      type: String,
      required: true,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

export const HospitalModel = mongoose.models.Hospital || mongoose.model<IHospital>('Hospital', HospitalSchema);
export default HospitalModel;
