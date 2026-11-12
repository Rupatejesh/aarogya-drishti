
import mongoose, { Schema, Document } from "mongoose";

export const AUDIT_ACTIONS = [
    "LOGIN_SUCCEEDED",
    "LOGIN_FAILED",
    "LOGOUT",
    "USER_PROVISIONED",
    "PATIENT_REGISTERED",
    "PATIENT_REGISTRATION_CONSENT_FAILED",
    "PATIENT_RECORD_VIEWED",
    "PATIENT_LIST_VIEWED",
    "PATIENT_ACCOUNT_LINKED",
    "PATIENT_OWNERSHIP_VERIFIED",
    "CONSENT_VIEWED",
    "CONSENT_RECORDED",
    "CONSENT_WITHDRAWN",
    "ASHA_WORKER_ASSIGNED",
    "PATIENT_RECORD_UPDATED",
    "PATIENT_INSPECTION_ACCESS",
    "SCREENING_CREATED",
    "CLINICAL_REVIEW_CREATED",
    "REFERRAL_CREATED",
    "REFERRAL_SPECIALIST_ASSIGNED",
    "REFERRAL_STATUS_UPDATED",
    "REFERRAL_COMPLETION_REVIEWED",
    "DIAGNOSTIC_ORDER_CREATED",
    "DIAGNOSTIC_STATUS_UPDATED",
    "DIAGNOSTIC_RESULT_RECORDED",
    "FOLLOW_UP_CREATED",
    "FOLLOW_UP_UPDATED",
    "FOLLOW_UP_VIEWED",
    "AGGREGATE_REPORT_VIEWED"
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];
export type AuditOutcome = "SUCCESS" | "FAILURE" | "DENIED";

export interface IAuditLog extends Document {
    actor?: mongoose.Types.ObjectId;
    actorRole?: string;
    patient?: mongoose.Types.ObjectId;
    action: AuditAction;
    outcome?: AuditOutcome;
    resourceType?: string;
    resourceId?: string;
    purpose: string;
    ipAddress?: string;
    userAgent?: string;
    createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
    {
        actor: {
            type: Schema.Types.ObjectId,
            ref: "User",
            index: true
        },
        actorRole: {
            type: String,
            trim: true
        },
        patient: {
            type: Schema.Types.ObjectId,
            ref: "Patient",
            index: true
        },
        action: {
            type: String,
            enum: AUDIT_ACTIONS,
            required: true
        },
        outcome: {
            type: String,
            enum: ["SUCCESS", "FAILURE", "DENIED"]
        },
        resourceType: {
            type: String,
            trim: true,
            maxlength: 100
        },
        resourceId: {
            type: String,
            trim: true,
            maxlength: 200
        },
        purpose: {
            type: String,
            required: true,
            trim: true,
            maxlength: 300
        },
        ipAddress: {
            type: String,
            maxlength: 100
        },
        userAgent: {
            type: String,
            maxlength: 500
        }
    },
    {
        timestamps: {
            createdAt: true,
            updatedAt: false
        }
    }
);

auditLogSchema.index({ patient: 1, createdAt: -1 });
auditLogSchema.index({ actor: 1, createdAt: -1 });

const AuditLog = mongoose.model<IAuditLog>(
    "AuditLog",
    auditLogSchema
);

export default AuditLog;
