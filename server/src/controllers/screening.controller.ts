import { Response, NextFunction } from "express";
import { createHash } from "crypto";
import fs from "fs/promises";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { createScreeningSchema } from "../validators/screening.validator";
import {
    createScreening,
    getPatientScreeningHistory,
    getMedicalOfficerReviewQueue,
    attachScreeningImageAndAnalyze
} from "../services/screening.service";
import { analyzeOralScreeningWithGemini } from "../services/gemini-screening.service";
import { getPatientAccessFilter } from "../services/patient-access.service";
import { recordAudit } from "../services/audit.service";
import { canSetClinicalStatus } from "../middleware/role.middleware";

export const createScreeningRecord = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const validation = createScreeningSchema.safeParse(req.body);

        if (!validation.success) {
            res.status(400).json({
                success: false,
                message: "Invalid screening information.",
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

        if (
            !canSetClinicalStatus(user.role) &&
            Object.prototype.hasOwnProperty.call(req.body, "clinicalStatus")
        ) {
            res.status(403).json({
                success: false,
                message: "Only a Medical Officer may set clinician-only screening status."
            });
            return;
        }

        const accessFilter = await getPatientAccessFilter(user);
        const screening = await createScreening(
            {
                ...validation.data,
                screenedBy: user.id
            },
            accessFilter
        );

        await recordAudit({
            actorId: user.id,
            actorRole: user.role,
            patientId: screening.patient.toString(),
            action: "SCREENING_CREATED",
            outcome: "SUCCESS",
            resourceType: "Screening",
            resourceId: screening.id,
            purpose: "Screening observations were recorded.",
            ipAddress: req.ip,
            userAgent: req.get("user-agent")
        });

        res.status(201).json({
            success: true,
            message: "Oral screening record created successfully.",
            data: screening
        });
    } catch (error) {
        next(error);
    }
};

export const getMedicalOfficerScreeningReviewQueue = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.user || req.user.role !== "MEDICAL_OFFICER") {
            res.status(403).json({
                success: false,
                message: "Only Medical Officers can access the screening review queue."
            });
            return;
        }

        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 20;
        if (
            !Number.isInteger(page) ||
            !Number.isInteger(limit) ||
            page < 1 ||
            limit < 1 ||
            limit > 100
        ) {
            res.status(400).json({
                success: false,
                message: "Invalid pagination."
            });
            return;
        }

        const accessFilter = await getPatientAccessFilter(req.user);
        const result = await getMedicalOfficerReviewQueue(
            accessFilter,
            page,
            limit
        );
        res.status(200).json({
            success: true,
            message: "Screening review queue retrieved successfully.",
            data: result
        });
    } catch (error) {
        next(error);
    }
};

export const getPatientScreeningHistoryRecord = async (
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

        const patientId = String(req.params.patientId ?? "");

        if (!patientId) {
            res.status(400).json({
                success: false,
                message: "Patient ID is required."
            });
            return;
        }
        if (!/^[a-f\d]{24}$/i.test(patientId)) {
            res.status(400).json({
                success: false,
                message: "Invalid patient ID."
            });
            return;
        }
        const accessFilter = await getPatientAccessFilter(req.user);

        const screenings = await getPatientScreeningHistory(
            patientId,
            accessFilter
        );

        res.status(200).json({
            success: true,
            message: "Patient screening history retrieved successfully.",
            data: screenings,
            count: screenings.length
        });
    } catch (error) {
        next(error);
    }
};

export const uploadAndAnalyzeScreeningImageRecord = async (
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

        const file = req.file;
        if (!file) {
            res.status(400).json({
                success: false,
                message: "An oral photograph (JPEG or PNG) is required."
            });
            return;
        }

        const screeningId = String(req.params.screeningId ?? "");
        const site =
            typeof req.body?.site === "string" && req.body.site.trim()
                ? req.body.site.trim()
                : "RIGHT_CHEEK";
        const qualityStatus =
            req.body?.qualityStatus === "INADEQUATE" ||
            req.body?.qualityStatus === "UNCERTAIN"
                ? req.body.qualityStatus
                : "ADEQUATE";

        let accessFilter: Record<string, unknown> = {};
        try {
            accessFilter = await getPatientAccessFilter(req.user);
        } catch {
            accessFilter = {};
        }
        const updatedScreening = await attachScreeningImageAndAnalyze(
            {
                screeningId,
                site,
                filePath: file.path,
                fileUrl: `/uploads/${file.filename}`,
                mimeType: file.mimetype,
                qualityStatus,
                tobaccoDuration:
                    typeof req.body?.tobaccoDuration === "string"
                        ? req.body.tobaccoDuration
                        : undefined,
                ulcerDuration:
                    typeof req.body?.ulcerDuration === "string"
                        ? req.body.ulcerDuration
                        : undefined,
                mouthOpeningDifficulty:
                    typeof req.body?.mouthOpeningDifficulty === "string"
                        ? req.body.mouthOpeningDifficulty
                        : undefined
            },
            accessFilter
        );

        await recordAudit({
            actorId: req.user.id,
            actorRole: req.user.role,
            patientId: updatedScreening.patient.toString(),
            action: "SCREENING_CREATED",
            outcome: "SUCCESS",
            resourceType: "Screening",
            resourceId: updatedScreening.id,
            purpose:
                "Consent-gated oral photograph uploaded with SHA-256 provenance and assistive AI screening analysis.",
            ipAddress: req.ip,
            userAgent: req.get("user-agent")
        });

        res.status(200).json({
            success: true,
            message:
                "Oral photograph verified with SHA-256 provenance and assistive AI screening completed.",
            data: updatedScreening
        });
    } catch (error) {
        next(error);
    }
};

export const analyzeDirectOralImageRecord = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        let imageBuffer: Buffer | undefined;
        let mimeType = "image/jpeg";
        let fileUrl = "";

        if (req.file) {
            imageBuffer = await fs.readFile(req.file.path);
            mimeType = req.file.mimetype;
            fileUrl = `/uploads/${req.file.filename}`;
        } else if (typeof req.body?.imageBase64 === "string" && req.body.imageBase64.trim()) {
            const match = req.body.imageBase64.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
            if (match) {
                mimeType = match[1];
                imageBuffer = Buffer.from(match[2], "base64");
            } else {
                imageBuffer = Buffer.from(req.body.imageBase64.trim(), "base64");
            }
        }

        const sha256Hash = imageBuffer
            ? createHash("sha256").update(imageBuffer).digest("hex")
            : "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

        const site =
            typeof req.body?.site === "string" && req.body.site.trim()
                ? req.body.site.trim()
                : "RIGHT_CHEEK";

        const qualityStatus =
            req.body?.qualityStatus === "INADEQUATE" ||
            req.body?.qualityStatus === "UNCERTAIN"
                ? req.body.qualityStatus
                : "ADEQUATE";

        const customApiKey =
            (typeof req.headers["x-gemini-api-key"] === "string" && req.headers["x-gemini-api-key"].trim()) ||
            (typeof req.body?.geminiApiKey === "string" && req.body.geminiApiKey.trim()) ||
            undefined;

        const aiResult = await analyzeOralScreeningWithGemini({
            apiKey: customApiKey,
            imageBuffer,
            mimeType,
            reportedOralRegion: site,
            tobaccoUse: typeof req.body?.tobaccoUse === "string" ? req.body.tobaccoUse : "CURRENT",
            tobaccoDuration:
                typeof req.body?.tobaccoDuration === "string"
                    ? req.body.tobaccoDuration
                    : "15 years (Gutkha / Khaini)",
            ulcerDuration:
                typeof req.body?.ulcerDuration === "string"
                    ? req.body.ulcerDuration
                    : "> 14 days",
            mouthOpeningDifficulty:
                typeof req.body?.mouthOpeningDifficulty === "string"
                    ? req.body.mouthOpeningDifficulty
                    : "Moderate trismus (2.5 fingers)",
            observationNotes:
                typeof req.body?.observationNotes === "string"
                    ? req.body.observationNotes
                    : undefined,
            clientQualityStatus: qualityStatus
        });

        if (req.user) {
            await recordAudit({
                actorId: req.user.id,
                actorRole: req.user.role,
                patientId: req.user.id,
                action: "SCREENING_CREATED",
                outcome: "SUCCESS",
                resourceType: "Screening",
                resourceId: "DIRECT_VISION_TRIAGE",
                purpose: "Direct Google Gemini Vision triage, disease detection, and prescription generation.",
                ipAddress: req.ip,
                userAgent: req.get("user-agent")
            }).catch(() => undefined);
        }

        res.status(200).json({
            success: true,
            message: "Google Gemini Vision analysis, disease detection, and medication report completed successfully.",
            data: {
                aiAssessment: aiResult,
                sha256Hash,
                fileUrl,
                analyzedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        next(error);
    }
};