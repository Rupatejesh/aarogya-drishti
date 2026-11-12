
import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { createClinicalReviewSchema } from "../validators/clinicalReview.validator";
import { createClinicalReview } from "../services/clinicalReview.service";
import { getPatientAccessFilter } from "../services/patient-access.service";
import { recordAudit } from "../services/audit.service";

export const createClinicalReviewRecord = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const validation = createClinicalReviewSchema.safeParse(req.body);

        if (!validation.success) {
            res.status(400).json({
                success: false,
                message: "Invalid clinical review information.",
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

        if (user.role !== "MEDICAL_OFFICER" && user.role !== "SPECIALIST") {
            res.status(403).json({
                success: false,
                message: "Only Medical Officers and assigned Specialists can record clinical reviews."
            });
            return;
        }

        const accessFilter = await getPatientAccessFilter(user);
        const clinicalReview = await createClinicalReview(
            {
                ...validation.data,
                reviewedBy: user.id,
                reviewerRole: user.role
            },
            accessFilter
        );

        await recordAudit({
            actorId: user.id,
            actorRole: user.role,
            patientId: clinicalReview.patient.toString(),
            action: "CLINICAL_REVIEW_CREATED",
            outcome: "SUCCESS",
            resourceType: "ClinicalReview",
            resourceId: clinicalReview._id.toString(),
            purpose: "Clinical review was recorded by an authorized clinician.",
            ipAddress: req.ip,
            userAgent: req.get("user-agent")
        });

        res.status(201).json({
            success: true,
            message: "Clinical review recorded successfully.",
            data: clinicalReview
        });
    } catch (error) {
        next(error);
    }
};
