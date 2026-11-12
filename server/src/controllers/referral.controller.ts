
import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import {
    createReferralSchema,
    updateReferralStatusSchema,
    assignReferralSpecialistSchema,
    reviewReferralCompletionSchema,
    updateReferralPrioritySchema
} from "../validators/referral.validator";
import {
    createReferral,
    getReferrals,
    updateReferralStatus,
    assignReferralSpecialist,
    reviewReferralCompletion,
    updateReferralPriority
} from "../services/referral.service";
import { getPatientAccessFilter } from "../services/patient-access.service";
import { recordAudit } from "../services/audit.service";

export const createReferralRecord = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const validation = createReferralSchema.safeParse(req.body);

        if (!validation.success) {
            res.status(400).json({
                success: false,
                message: "Invalid referral information.",
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

        const user = req.user;
        const accessFilter = await getPatientAccessFilter(user);

        const referral = await createReferral(
            {
                ...validation.data,
                createdBy: user.id
            },
            accessFilter,
            {
                userId: user.id,
                role: user.role
            }
        );

        await recordAudit({
            actorId: user.id,
            actorRole: user.role,
            patientId: referral.patient.toString(),
            action: "REFERRAL_CREATED",
            outcome: "SUCCESS",
            resourceType: "Referral",
            resourceId: referral.id,
            purpose: "An authorized clinician created a patient referral.",
            ipAddress: req.ip,
            userAgent: req.get("user-agent")
        });

        res.status(201).json({
            success: true,
            message: "Referral created successfully.",
            data: referral
        });
    } catch (error) {
        next(error);
    }
};

export const getReferralRecords = async (
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

        const user = req.user;
        const accessFilter = await getPatientAccessFilter(user);

        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 20;

        const result = await getReferrals(
            accessFilter,
            page,
            limit,
            {
                userId: user.id,
                role: user.role
            }
        );

        res.status(200).json({
            success: true,
            message: "Referrals retrieved successfully.",
            data: result
        });
    } catch (error) {
        next(error);
    }
};

export const updateReferralStatusRecord = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const validation = updateReferralStatusSchema.safeParse(req.body);

        if (!validation.success) {
            res.status(400).json({
                success: false,
                message: "Invalid referral status information.",
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

        const user = req.user;
        const accessFilter = await getPatientAccessFilter(user);

        const referral = await updateReferralStatus(
            {
                ...validation.data,
                referralId: String(req.params.referralId),
                updatedBy: user.id
            },
            accessFilter,
            {
                userId: user.id,
                role: user.role
            }
        );

        await recordAudit({
            actorId: user.id,
            actorRole: user.role,
            patientId: referral.patient.toString(),
            action: "REFERRAL_STATUS_UPDATED",
            outcome: "SUCCESS",
            resourceType: "Referral",
            resourceId: referral.id,
            purpose: "An authorized user updated referral status.",
            ipAddress: req.ip,
            userAgent: req.get("user-agent")
        });

        res.status(200).json({
            success: true,
            message: "Referral status updated successfully.",
            data: referral
        });
    } catch (error) {
        next(error);
    }
};

export const assignReferralSpecialistRecord = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const validation = assignReferralSpecialistSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({
                success: false,
                message: "Invalid Specialist assignment.",
                errors: validation.error.flatten()
            });
            return;
        }
        if (!req.user || req.user.role !== "MEDICAL_OFFICER") {
            res.status(403).json({
                success: false,
                message: "Only Medical Officers can assign a Specialist."
            });
            return;
        }

        const accessFilter = await getPatientAccessFilter(req.user);
        const referral = await assignReferralSpecialist(
            String(req.params.referralId),
            validation.data.specialistId,
            { userId: req.user.id, role: req.user.role },
            accessFilter,
            validation.data.note
        );
        await recordAudit({
            actorId: req.user.id,
            actorRole: req.user.role,
            patientId: referral.patient.toString(),
            action: "REFERRAL_SPECIALIST_ASSIGNED",
            outcome: "SUCCESS",
            resourceType: "Referral",
            resourceId: referral.id,
            purpose: "Medical Officer assigned or reassigned the Specialist for this referral.",
            ipAddress: req.ip,
            userAgent: req.get("user-agent")
        });

        res.status(200).json({
            success: true,
            message: "Specialist assignment updated.",
            data: referral
        });
    } catch (error) {
        next(error);
    }
};

export const reviewReferralCompletionRecord = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const validation = reviewReferralCompletionSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({
                success: false,
                message: "Invalid referral completion review.",
                errors: validation.error.flatten()
            });
            return;
        }
        if (!req.user || req.user.role !== "MEDICAL_OFFICER") {
            res.status(403).json({
                success: false,
                message: "Only Medical Officers can review referral completion."
            });
            return;
        }

        const accessFilter = await getPatientAccessFilter(req.user);
        const referral = await reviewReferralCompletion(
            String(req.params.referralId),
            req.user.id,
            req.user.role,
            accessFilter,
            validation.data.approved,
            validation.data.note
        );
        await recordAudit({
            actorId: req.user.id,
            actorRole: req.user.role,
            patientId: referral.patient.toString(),
            action: "REFERRAL_COMPLETION_REVIEWED",
            outcome: "SUCCESS",
            resourceType: "Referral",
            resourceId: referral.id,
            purpose: "Medical Officer recorded a referral completion review.",
            ipAddress: req.ip,
            userAgent: req.get("user-agent")
        });

        res.status(200).json({
            success: true,
            message: "Referral completion review recorded.",
            data: referral
        });
    } catch (error) {
        next(error);
    }
};

export const updateReferralPriorityRecord = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const validation = updateReferralPrioritySchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({
                success: false,
                message: "Invalid referral priority.",
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
        const referral = await updateReferralPriority(
            String(req.params.referralId),
            validation.data.priority,
            { userId: req.user.id, role: req.user.role },
            accessFilter
        );

        await recordAudit({
            actorId: req.user.id,
            actorRole: req.user.role,
            patientId: referral.patient.toString(),
            action: "REFERRAL_STATUS_UPDATED",
            outcome: "SUCCESS",
            resourceType: "Referral",
            resourceId: referral.id,
            purpose: "Authorized clinician updated referral triage priority.",
            ipAddress: req.ip,
            userAgent: req.get("user-agent")
        });

        res.status(200).json({
            success: true,
            message: "Referral priority updated.",
            data: referral
        });
    } catch (error) {
        next(error);
    }
};
