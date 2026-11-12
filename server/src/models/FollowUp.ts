import mongoose, { Document, Schema } from "mongoose";

export const FOLLOW_UP_STATUSES = [
    "PLANNED",
    "CONTACTED",
    "COMPLETED",
    "MISSED",
    "CANCELLED"
] as const;

export interface IFollowUpStatusHistory {
    status: typeof FOLLOW_UP_STATUSES[number];
    changedBy: mongoose.Types.ObjectId;
    changedAt: Date;
    note?: string;
}

export interface IFollowUpVisitNote {
    text: string;
    recordedBy: mongoose.Types.ObjectId;
    recordedAt: Date;
}

export interface IFollowUp extends Document {
    patient: mongoose.Types.ObjectId;
    screening?: mongoose.Types.ObjectId;
    referral?: mongoose.Types.ObjectId;
    assignedWorker: mongoose.Types.ObjectId;
    createdBy: mongoose.Types.ObjectId;
    dueAt: Date;
    status: typeof FOLLOW_UP_STATUSES[number];
    statusHistory: IFollowUpStatusHistory[];
    visitNotes: IFollowUpVisitNote[];
}

const followUpSchema = new Schema<IFollowUp>(
    {
        patient: {
            type: Schema.Types.ObjectId,
            ref: "Patient",
            required: true,
            index: true
        },
        screening: { type: Schema.Types.ObjectId, ref: "Screening" },
        referral: { type: Schema.Types.ObjectId, ref: "Referral" },
        assignedWorker: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        dueAt: { type: Date, required: true, index: true },
        status: {
            type: String,
            enum: FOLLOW_UP_STATUSES,
            required: true,
            default: "PLANNED"
        },
        statusHistory: {
            type: [
                {
                    status: {
                        type: String,
                        enum: FOLLOW_UP_STATUSES,
                        required: true
                    },
                    changedBy: {
                        type: Schema.Types.ObjectId,
                        ref: "User",
                        required: true
                    },
                    changedAt: { type: Date, required: true },
                    note: { type: String, trim: true, maxlength: 1000 }
                }
            ],
            default: []
        },
        visitNotes: {
            type: [
                {
                    text: {
                        type: String,
                        required: true,
                        trim: true,
                        maxlength: 2000
                    },
                    recordedBy: {
                        type: Schema.Types.ObjectId,
                        ref: "User",
                        required: true
                    },
                    recordedAt: { type: Date, required: true }
                }
            ],
            default: []
        }
    },
    { timestamps: true }
);

followUpSchema.index({ assignedWorker: 1, status: 1, dueAt: 1 });
followUpSchema.index({ patient: 1, dueAt: -1 });

export default mongoose.model<IFollowUp>("FollowUp", followUpSchema);
