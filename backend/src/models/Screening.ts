import mongoose, { Document, Schema } from 'mongoose';

export const ORAL_REGIONS = [
  'Right Buccal Mucosa',
  'Left Cheek',
  'Tongue Dorsum',
  'Floor of Mouth',
  'Palate'
] as const;

export type OralRegion = typeof ORAL_REGIONS[number];

export const AI_CONDITIONS = [
  'Low',
  'Medium',
  'Serious',
  'Urgent Clinical Evaluation'
] as const;

export type AICondition = typeof AI_CONDITIONS[number];

export interface IHabitExposure {
  tobacco: boolean;
  gutkha: boolean;
  reverseSmoking: boolean;
  areca: boolean;
  years: number;
  frequency: string;
}

export interface IBoundingBox {
  xmin: number;
  ymin: number;
  xmax: number;
  ymax: number;
}

export interface IScreening extends Document {
  screeningId: string;
  patientUidn: string;
  oralRegion: OralRegion;
  imageUrl: string;
  cloudinaryPublicId?: string;
  cloudinarySecureUrl?: string;
  symptomsChecklist: string[];
  habitExposure: IHabitExposure;
  aiCondition: AICondition;
  aiConfidenceScore: number;
  aiLesionType: string;
  boundingBoxCoordinates?: IBoundingBox;
  clinicalRemarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const HabitExposureSchema = new Schema<IHabitExposure>(
  {
    tobacco: { type: Boolean, default: false },
    gutkha: { type: Boolean, default: false },
    reverseSmoking: { type: Boolean, default: false },
    areca: { type: Boolean, default: false },
    years: { type: Number, default: 0 },
    frequency: { type: String, default: 'None' }
  },
  { _id: false }
);

const BoundingBoxSchema = new Schema<IBoundingBox>(
  {
    xmin: { type: Number, required: true },
    ymin: { type: Number, required: true },
    xmax: { type: Number, required: true },
    ymax: { type: Number, required: true }
  },
  { _id: false }
);

const ScreeningSchema = new Schema<IScreening>(
  {
    screeningId: {
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
    oralRegion: {
      type: String,
      enum: ORAL_REGIONS,
      required: true
    },
    imageUrl: {
      type: String,
      required: true
    },
    cloudinaryPublicId: {
      type: String,
      default: null
    },
    cloudinarySecureUrl: {
      type: String,
      default: null
    },
    symptomsChecklist: {
      type: [String],
      default: []
    },
    habitExposure: {
      type: HabitExposureSchema,
      required: true
    },
    aiCondition: {
      type: String,
      enum: AI_CONDITIONS,
      required: true,
      index: true
    },
    aiConfidenceScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    aiLesionType: {
      type: String,
      required: true,
      trim: true
    },
    boundingBoxCoordinates: {
      type: BoundingBoxSchema
    },
    clinicalRemarks: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

export const ScreeningModel = mongoose.models.Screening || mongoose.model<IScreening>('Screening', ScreeningSchema);
export default ScreeningModel;

