import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { getPatientAccessFilter } from "../services/patient-access.service";
import {
    createFollowUpSchema,
    updateFollowUpSchema
} from "../validators/follow-up.validator";
import {
    createFollowUp,
    getPatientFollowUps,
    updateFollowUp
} from "../services/follow-up.service";
import { recordAudit } from "../services/audit.service";

const requestMetadata = (req: AuthenticatedRequest) => ({
    ipAddress: req.ip,
    userAgent: req.get("user-agent")
});

export const createFollowUpRecord = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const validation = createFollowUpSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({
                success: false,
                message: "Invalid follow-up information.",
                errors: validation.error.flatten()
            });
            return;
        }
        if (!req.user) {
            res.status(401).json({ success: false, message: "Authentication required." });
            return;
        }

        const accessFilter = await getPatientAccessFilter(req.user);
        const followUp = await createFollowUp(
            validation.data,
            req.user,
            accessFilter
        );
        await recordAudit({
            actorId: req.user.id,
            actorRole: req.user.role,
            patientId: followUp.patient.toString(),
            action: "FOLLOW_UP_CREATED",
            outcome: "SUCCESS",
            resourceType: "FollowUp",
            resourceId: followUp.id,
            purpose: "Authorized care-team member scheduled patient follow-up.",
            ...requestMetadata(req)
        });
        res.status(201).json({
            success: true,
            message: "Follow-up scheduled.",
            data: followUp
        });
    } catch (error) {
        next(error);
    }
};

export const getPatientFollowUpRecords = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: "Authentication required." });
            return;
        }
        const accessFilter = await getPatientAccessFilter(req.user);
        const followUps = await getPatientFollowUps(
            String(req.params.patientId),
            accessFilter
        );
        await recordAudit({
            actorId: req.user.id,
            actorRole: req.user.role,
            patientId: String(req.params.patientId),
            action: "FOLLOW_UP_VIEWED",
            outcome: "SUCCESS",
            resourceType: "FollowUp",
            purpose: "Authorized access to patient follow-up history.",
            ...requestMetadata(req)
        });
        res.status(200).json({
            success: true,
            message: "Follow-up history retrieved.",
            data: followUps
        });
    } catch (error) {
        next(error);
    }
};

export const updateFollowUpRecord = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const validation = updateFollowUpSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({
                success: false,
                message: "Invalid follow-up update.",
                errors: validation.error.flatten()
            });
            return;
        }
        if (!req.user) {
            res.status(401).json({ success: false, message: "Authentication required." });
            return;
        }

        const accessFilter = await getPatientAccessFilter(req.user);
        const followUp = await updateFollowUp(
            String(req.params.followUpId),
            validation.data,
            req.user,
            accessFilter
        );
        await recordAudit({
            actorId: req.user.id,
            actorRole: req.user.role,
            patientId: followUp.patient.toString(),
            action: "FOLLOW_UP_UPDATED",
            outcome: "SUCCESS",
            resourceType: "FollowUp",
            resourceId: followUp.id,
            purpose: "Authorized care-team member updated follow-up status or details.",
            ...requestMetadata(req)
        });
        res.status(200).json({
            success: true,
            message: "Follow-up updated.",
            data: followUp
        });
    } catch (error) {
        next(error);
    }
};
