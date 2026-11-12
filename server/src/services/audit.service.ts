
import mongoose from "mongoose";
import AuditLog, { AuditAction } from "../models/AuditLog";

interface RecordAuditInput {
    actorId?: string;
    actorRole?: string;
    action: AuditAction;
    purpose: string;
    outcome?: "SUCCESS" | "FAILURE" | "DENIED";
    resourceType?: string;
    resourceId?: string;
    patientId?: string;
    ipAddress?: string;
    userAgent?: string;
}

export const recordAudit = async (
    input: RecordAuditInput
): Promise<void> => {
    if (input.actorId && !mongoose.isValidObjectId(input.actorId)) {
        throw new Error("Invalid audit actor.");
    }

    if (input.actorRole && !input.actorId) {
        throw new Error("An audit actor role requires an actor.");
    }

    if (
        input.patientId &&
        !mongoose.isValidObjectId(input.patientId)
    ) {
        throw new Error("Invalid audit patient.");
    }

    await AuditLog.create({
        actor: input.actorId
            ? new mongoose.Types.ObjectId(input.actorId)
            : undefined,
        actorRole: input.actorRole,
        patient: input.patientId
            ? new mongoose.Types.ObjectId(input.patientId)
            : undefined,
        action: input.action,
        outcome: input.outcome,
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        purpose: input.purpose,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent
    });
};
