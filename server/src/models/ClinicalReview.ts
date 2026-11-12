
import mongoose, { Document, Schema } from "mongoose";

export const CLINICAL_REVIEW_DECISIONS = [
    "AGREE",
    "DISAGREE",
    "DEFER"
] as const;

export interface IClinicalReview extends Document {
    screening: mongoose.Types.ObjectId;
    patient: mongoose.Types.ObjectId;
    reviewedBy: mongoose.Types.ObjectId;
    reviewedAt: Date;

    decision: typeof CLINICAL_REVIEW_DECISIONS[number];
    clinicalObservations: string;
    notes?: string;

    referralRecommended: boolean;
    referralReason?: string;
}

const ClinicalReviewSchema = new Schema<IClinicalReview>(
    {
        screening: {
            type: Schema.Types.ObjectId,
            ref: "Screening",
            required: true,
            index: true
        },

        patient: {
            type: Schema.Types.ObjectId,
            ref: "Patient",
            required: true,
            index: true
        },

        reviewedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        reviewedAt: {
            type: Date,
            default: Date.now,
            required: true
        },

        decision: {
            type: String,
            enum: CLINICAL_REVIEW_DECISIONS,
            required: true
        },

        clinicalObservations: {
            type: String,
            required: true,
            trim: true,
            maxlength: 3000
        },

        notes: {
            type: String,
            trim: true,
            maxlength: 3000
        },

        referralRecommended: {
            type: Boolean,
            default: false,
            required: true
        },

        referralReason: {
            type: String,
            trim: true,
            maxlength: 1000
        }
    },
    {
        timestamps: true
    }
);

ClinicalReviewSchema.index({ patient: 1, reviewedAt: -1 });
ClinicalReviewSchema.index({ reviewedBy: 1, reviewedAt: -1 });

export default mongoose.model<IClinicalReview>(
    "ClinicalReview",
    ClinicalReviewSchema
);
