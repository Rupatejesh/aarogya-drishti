import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { getPatientAccessFilter } from "../services/patient-access.service";
import {
    getPatientConsents,
    recordOralScreeningConsent,
    withdrawOralScreeningConsent
} from "../services/consent.service";
import {
    recordOralScreeningConsentSchema,
    withdrawOralScreeningConsentSchema
} from "../validators/consent.validator";
import { recordAudit } from "../services/audit.service";

const requestMetadata = (req: AuthenticatedRequest) => ({
    ipAddress: req.ip,
    userAgent: req.get("user-agent")
});

export const getPatientConsentRecords = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: "Authentication required."
            });
            return;
        }

        const accessFilter = await getPatientAccessFilter(req.user);
        const consents = await getPatientConsents(
            String(req.params.id),
            accessFilter
        );
        await recordAudit({
            actorId: req.user.id,
            actorRole: req.user.role,
            patientId: String(req.params.id),
            action: "CONSENT_VIEWED",
            outcome: "SUCCESS",
            resourceType: "Consent",
            purpose: "Authorized access to patient consent history.",
            ...requestMetadata(req)
        });

        res.status(200).json({
            success: true,
            message: "Consent history retrieved successfully.",
            data: consents
        });
    } catch (error) {
        next(error);
    }
};

export const recordPatientOralScreeningConsent = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const validation = recordOralScreeningConsentSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({
                success: false,
                message: "Invalid oral-screening consent information.",
                errors: validation.error.flatten()
            });
            return;
        }
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: "Authentication required."
            });
            return;
        }

        const accessFilter = await getPatientAccessFilter(req.user);
        const consent = await recordOralScreeningConsent(
            String(req.params.id),
            validation.data,
            accessFilter,
            req.user
        );
        await recordAudit({
            actorId: req.user.id,
            actorRole: req.user.role,
            patientId: consent.patient.toString(),
            action: "CONSENT_RECORDED",
            outcome: "SUCCESS",
            resourceType: "Consent",
            resourceId: consent.id,
            purpose: "Oral-screening consent was recorded.",
            ...requestMetadata(req)
        });

        res.status(201).json({
            success: true,
            message: "Oral-screening consent recorded successfully.",
            data: consent
        });
    } catch (error) {
        next(error);
    }
};

export const withdrawPatientOralScreeningConsent = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const validation = withdrawOralScreeningConsentSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({
                success: false,
                message: "Invalid consent withdrawal information.",
                errors: validation.error.flatten()
            });
            return;
        }
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: "Authentication required."
            });
            return;
        }

        if (req.params.purpose !== "ORAL_SCREENING") {
            res.status(400).json({
                success: false,
                message: "Only oral-screening consent withdrawal is supported in this phase."
            });
            return;
        }

        const accessFilter = await getPatientAccessFilter(req.user);
        const consent = await withdrawOralScreeningConsent(
            String(req.params.id),
            validation.data.reason,
            accessFilter,
            req.user
        );
        await recordAudit({
            actorId: req.user.id,
            actorRole: req.user.role,
            patientId: consent.patient.toString(),
            action: "CONSENT_WITHDRAWN",
            outcome: "SUCCESS",
            resourceType: "Consent",
            resourceId: consent.id,
            purpose: "Oral-screening consent withdrawal was recorded.",
            ...requestMetadata(req)
        });

        res.status(201).json({
            success: true,
            message: "Oral-screening consent withdrawal recorded.",
            data: consent
        });
    } catch (error) {
        next(error);
    }
};
