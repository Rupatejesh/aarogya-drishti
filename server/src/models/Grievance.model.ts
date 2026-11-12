import mongoose, { Schema, Document } from "mongoose";

export const GRIEVANCE_CATEGORIES = [
    "TREATMENT_DELAY",
    "MEDICINE_SHORTAGE",
    "TRANSPORT_ISSUE",
    "STAFF_BEHAVIOR",
    "OTHER"
] as const;

export type GrievanceCategory = (typeof GRIEVANCE_CATEGORIES)[number];

export const GRIEVANCE_STATUSES = [
    "SUBMITTED",
    "UNDER_REVIEW",
    "RESOLVED"
] as const;

export type GrievanceStatus = (typeof GRIEVANCE_STATUSES)[number];

export interface IGrievance extends Document {
    grievanceId: string;
    patientId: string;
    patientName: string;
    mandal: string;
    category: GrievanceCategory;
    description: string;
    status: GrievanceStatus;
    actionTaken?: string;
    filedAt: Date;
}

const grievanceSchema = new Schema<IGrievance>(
    {
        grievanceId: {
            type: String,
            unique: true,
            required: true,
            index: true
        },
        patientId: {
            type: String,
            required: true,
            trim: true
        },
        patientName: {
            type: String,
            required: true,
            trim: true
        },
        mandal: {
            type: String,
            required: true,
            trim: true
        },
        category: {
            type: String,
            enum: GRIEVANCE_CATEGORIES,
            required: true,
            default: "OTHER"
        },
        description: {
            type: String,
            required: true,
            trim: true,
            maxlength: 2000
        },
        status: {
            type: String,
            enum: GRIEVANCE_STATUSES,
            default: "SUBMITTED"
        },
        actionTaken: {
            type: String,
            trim: true,
            maxlength: 2000
        },
        filedAt: {
            type: Date,
            default: Date.now
        }
    },
    { timestamps: true }
);

const Grievance = mongoose.model<IGrievance>("Grievance", grievanceSchema);

export default Grievance;

