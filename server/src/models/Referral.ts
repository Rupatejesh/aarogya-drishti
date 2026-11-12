
import mongoose, { Document, Schema } from "mongoose";

export const REFERRAL_PRIORITIES = [
    "ROUTINE",
    "URGENT",
    "EMERGENCY"
] as const;

export const REFERRAL_STATUSES = [
    "CREATED",
    "SCHEDULED",
    "CONFIRMED",
    "RESCHEDULED",
    "COMPLETION_REVIEW",
    "COMPLETED",
    "CANCELLED",
    "MISSED"
] as const;

export interface IReferralStatusHistory {
    status: typeof REFERRAL_STATUSES[number];
    changedBy: mongoose.Types.ObjectId;
    changedAt: Date;
    note?: string;
}

export interface IReferralAssignmentHistory {
    specialist?: mongoose.Types.ObjectId;
    changedBy: mongoose.Types.ObjectId;
    changedAt: Date;
    note?: string;
}

export interface IReferralCompletionReview {
    reviewedBy: mongoose.Types.ObjectId;
    reviewedAt: Date;
    approved: boolean;
    note: string;
}

export interface IReferral extends Document {
    patient: mongoose.Types.ObjectId;
    screening: mongoose.Types.ObjectId;
    createdBy: mongoose.Types.ObjectId;
    assignedSpecialist?: mongoose.Types.ObjectId;
    referralReason: string;
    priority: typeof REFERRAL_PRIORITIES[number];
    referredTo: string;
    facilityName: string;
    appointmentDate?: Date;
    status: typeof REFERRAL_STATUSES[number];
    notes?: string;
    statusHistory: IReferralStatusHistory[];
    assignmentHistory: IReferralAssignmentHistory[];
    completionReviews: IReferralCompletionReview[];
}

const referralStatusHistorySchema = new Schema<IReferralStatusHistory>(
    {
        status: {
            type: String,
            enum: REFERRAL_STATUSES,
            required: true
        },
        changedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        changedAt: {
            type: Date,
            default: Date.now,
            required: true
        },
        note: {
            type: String,
            trim: true,
            maxlength: 1000
        }
    },
    { _id: false }
);

const referralAssignmentHistorySchema = new Schema<IReferralAssignmentHistory>(
    {
        specialist: { type: Schema.Types.ObjectId, ref: "User" },
        changedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        changedAt: { type: Date, required: true },
        note: { type: String, trim: true, maxlength: 1000 }
    },
    { _id: false }
);

const referralCompletionReviewSchema = new Schema<IReferralCompletionReview>(
    {
        reviewedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        reviewedAt: { type: Date, required: true },
        approved: { type: Boolean, required: true },
        note: { type: String, required: true, trim: true, maxlength: 1000 }
    },
    { _id: false }
);

const referralSchema = new Schema<IReferral>(
    {
        patient: {
            type: Schema.Types.ObjectId,
            ref: "Patient",
            required: true,
            index: true
        },
        screening: {
            type: Schema.Types.ObjectId,
            ref: "Screening",
            required: true
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        assignedSpecialist: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: false,
            index: true
        },
        referralReason: {
            type: String,
            required: true,
            trim: true,
            maxlength: 2000
        },
        priority: {
            type: String,
            enum: REFERRAL_PRIORITIES,
            required: true,
            default: "ROUTINE"
        },
        referredTo: {
            type: String,
            required: true,
            trim: true,
            maxlength: 150
        },
        facilityName: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200
        },
        appointmentDate: {
            type: Date
        },
        status: {
            type: String,
            enum: REFERRAL_STATUSES,
            default: "CREATED",
            required: true
        },
        notes: {
            type: String,
            trim: true,
            maxlength: 2000
        },
        statusHistory: {
            type: [referralStatusHistorySchema],
            default: []
        },
        assignmentHistory: {
            type: [referralAssignmentHistorySchema],
            default: []
        },
        completionReviews: {
            type: [referralCompletionReviewSchema],
            default: []
        }
    },
    {
        timestamps: true
    }
);

referralSchema.index({ patient: 1, createdAt: -1 });
referralSchema.index({ status: 1, priority: 1 });
referralSchema.index({ assignedSpecialist: 1, status: 1 });

const Referral = mongoose.model<IReferral>(
    "Referral",
    referralSchema
);

export default Referral;
