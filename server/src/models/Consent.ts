
import mongoose, { Schema, Document } from "mongoose";

export const CONSENT_PURPOSES = [
    "PATIENT_REGISTRATION",
    "ORAL_SCREENING",
    "IMAGE_CAPTURE",
    "IMAGE_CAPTURE_AND_STORAGE",
    "AI_ASSISTED_DEMONSTRATION",
    "TELEMEDICINE",
    "DATA_SHARING_FOR_CARE"
] as const;

export type ConsentPurpose = (typeof CONSENT_PURPOSES)[number];

export interface IConsent extends Document {
    patient: mongoose.Types.ObjectId;
    purpose: ConsentPurpose;
    granted: boolean;
    consentVersion: string;
    language: "TELUGU" | "ENGLISH" | "HINDI";
    recordedBy: mongoose.Types.ObjectId;
    recordedAt: Date;
    withdrawnAt?: Date;
    withdrawalReason?: string;
    notes?: string;
}

const consentSchema = new Schema<IConsent>(
    {
        patient: {
            type: Schema.Types.ObjectId,
            ref: "Patient",
            required: true,
            index: true
        },

        purpose: {
            type: String,
            enum: CONSENT_PURPOSES,
            required: true
        },

        granted: {
            type: Boolean,
            required: true
        },

        consentVersion: {
            type: String,
            required: true,
            trim: true
        },

        language: {
            type: String,
            enum: ["TELUGU", "ENGLISH", "HINDI"],
            required: true
        },

        recordedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        recordedAt: {
            type: Date,
            default: Date.now,
            required: true
        },

        withdrawnAt: {
            type: Date
        },

        withdrawalReason: {
            type: String,
            trim: true,
            maxlength: 500
        },

        notes: {
            type: String,
            trim: true,
            maxlength: 1000
        }
    },
    {
        timestamps: true
    }
);

// Preserve each consent event as a separate record.
consentSchema.index({
    patient: 1,
    purpose: 1,
    recordedAt: -1
});

const Consent = mongoose.model<IConsent>("Consent", consentSchema);

export default Consent;
