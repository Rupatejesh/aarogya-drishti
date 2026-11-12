
import mongoose, { Document, Schema } from "mongoose";

export const DIAGNOSTIC_TYPES = [
    "BIOPSY",
    "HISTOPATHOLOGY",
    "CT_SCAN",
    "MRI",
    "OTHER"
] as const;

export const DIAGNOSTIC_STATUSES = [
    "ADVISED",
    "SCHEDULED",
    "PERFORMED",
    "SAMPLE_COLLECTED",
    "REPORT_PENDING",
    "REPORT_RECEIVED",
    "UNDER_CLINICIAN_REVIEW",
    "REVIEWED",
    "CANCELLED"
] as const;

export interface IDiagnosticStatusHistory {
    status: typeof DIAGNOSTIC_STATUSES[number];
    changedBy: mongoose.Types.ObjectId;
    changedAt: Date;
    note?: string;
}

export interface IDiagnosticResultEntry {
    resultText: string;
    recordedBy: mongoose.Types.ObjectId;
    recordedAt: Date;
}

export interface IDiagnosticOrder extends Document {
    patient: mongoose.Types.ObjectId;
    screening?: mongoose.Types.ObjectId;
    referral?: mongoose.Types.ObjectId;
    orderedBy: mongoose.Types.ObjectId;

    diagnosticType: typeof DIAGNOSTIC_TYPES[number];
    clinicalReason: string;
    facilityName?: string;
    appointmentDate?: Date;

    sampleCollectedAt?: Date;

    status: typeof DIAGNOSTIC_STATUSES[number];
    statusHistory: IDiagnosticStatusHistory[];

    reportReference?: string;
    reportReceivedAt?: Date;

    reviewedBy?: mongoose.Types.ObjectId;
    reviewedAt?: Date;
    reviewNotes?: string;
    results: IDiagnosticResultEntry[];

    notes?: string;
}

const diagnosticOrderSchema = new Schema<IDiagnosticOrder>(
    {
        patient: {
            type: Schema.Types.ObjectId,
            ref: "Patient",
            required: true,
            index: true
        },

        screening: {
            type: Schema.Types.ObjectId,
            ref: "Screening"
        },

        referral: {
            type: Schema.Types.ObjectId,
            ref: "Referral"
        },

        orderedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        diagnosticType: {
            type: String,
            enum: DIAGNOSTIC_TYPES,
            required: true
        },

        clinicalReason: {
            type: String,
            required: true,
            trim: true,
            maxlength: 2000
        },

        facilityName: {
            type: String,
            trim: true,
            maxlength: 200
        },

        appointmentDate: {
            type: Date
        },

        sampleCollectedAt: {
            type: Date
        },

        status: {
            type: String,
            enum: DIAGNOSTIC_STATUSES,
            default: "ADVISED",
            required: true
        },

        statusHistory: {
            type: [
                {
                    status: {
                        type: String,
                        enum: DIAGNOSTIC_STATUSES,
                        required: true
                    },

                    changedBy: {
                        type: Schema.Types.ObjectId,
                        ref: "User",
                        required: true
                    },

                    changedAt: {
                        type: Date,
                        required: true,
                        default: Date.now
                    },

                    note: {
                        type: String,
                        trim: true,
                        maxlength: 2000
                    }
                }
            ],
            default: []
        },

        reportReference: {
            type: String,
            trim: true,
            maxlength: 500
        },

        reportReceivedAt: {
            type: Date
        },

        reviewedBy: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },

        reviewedAt: {
            type: Date
        },

        reviewNotes: {
            type: String,
            trim: true,
            maxlength: 3000
        },

        results: {
            type: [
                {
                    resultText: {
                        type: String,
                        required: true,
                        trim: true,
                        maxlength: 5000
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
        },

        notes: {
            type: String,
            trim: true,
            maxlength: 2000
        }
    },
    {
        timestamps: true
    }
);

diagnosticOrderSchema.index({
    patient: 1,
    createdAt: -1
});

diagnosticOrderSchema.index({
    status: 1,
    createdAt: -1
});

const DiagnosticOrder = mongoose.model<IDiagnosticOrder>(
    "DiagnosticOrder",
    diagnosticOrderSchema
);

export default DiagnosticOrder;
