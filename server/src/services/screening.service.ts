import mongoose from "mongoose";
import { createHash } from "crypto";
import fs from "fs/promises";
import Screening from "../models/Screening";
import Patient from "../models/Patient";
import ClinicalReview from "../models/ClinicalReview";
import {
    hasCurrentOralScreeningConsent,
    hasCurrentImageCaptureConsent
} from "./consent.service";
import {
    patientOralConsentLockKey,
    withWorkflowLock
} from "./workflow-lock.service";
import { analyzeOralScreeningWithGemini } from "./gemini-screening.service";

interface CreateScreeningInput {
    patientId: string;
    screenedBy: string;
    screeningDate?: Date;
    notes?: string;
    symptoms?: {
        name: string;
        duration?: string;
        bodySite?: string;
    }[];
    examinationFindings: {
        bodySite:
            | "TONGUE"
            | "LEFT_CHEEK"
            | "RIGHT_CHEEK"
            | "PALATE"
            | "GUMS"
            | "FLOOR_OF_MOUTH"
            | "LIPS"
            | "OTHER";
        observation: string;
        notes?: string;
    }[];
    tobaccoUse?: "NEVER" | "CURRENT" | "FORMER" | "NOT_RECORDED";
    clinicalStatus?:
        | "NO_SUSPICIOUS_FINDING_RECORDED"
        | "SUSPICIOUS_FINDING_REQUIRES_REVIEW"
        | "INCONCLUSIVE";
}

export const createScreening = async (
    input: CreateScreeningInput,
    accessFilter: Record<string, unknown> = {}
) => {
    if (!mongoose.isValidObjectId(input.patientId)) {
        throw new Error("Invalid patient ID.");
    }

    if (!mongoose.isValidObjectId(input.screenedBy)) {
        throw new Error("Invalid screening user ID.");
    }

    return withWorkflowLock(
        patientOralConsentLockKey(input.patientId),
        async () => {
            const patient = await Patient.findOne({
                $and: [
                    accessFilter,
                    {
                        _id: new mongoose.Types.ObjectId(input.patientId),
                        registrationStatus: "ACTIVE"
                    }
                ]
            }).select("_id");

            if (!patient) {
                throw new Error("Patient not found or access denied.");
            }

            if (!(await hasCurrentOralScreeningConsent(patient._id))) {
                throw Object.assign(
                    new Error("Current oral-screening consent is required."),
                    { statusCode: 409 }
                );
            }

            return Screening.create({
                patient: patient._id,
                screenedBy: input.screenedBy,
                screeningDate: input.screeningDate ?? new Date(),
                notes: input.notes,
                symptoms: input.symptoms ?? [],
                examinationFindings: input.examinationFindings,
                tobaccoUse: input.tobaccoUse ?? "NOT_RECORDED",
                ...(input.clinicalStatus
                    ? { clinicalStatus: input.clinicalStatus }
                    : {}),
                screeningStatus: "PENDING"
            });
        }
    );
};
export const getPatientScreeningHistory = async (
    patientId: string,
    accessFilter: Record<string, unknown> = {}
) => {
    if (!mongoose.isValidObjectId(patientId)) {
        throw new Error("Invalid patient ID.");
    }

    const patient = await Patient.findOne({
        $and: [
            accessFilter,
            {
                _id: new mongoose.Types.ObjectId(patientId),
                registrationStatus: "ACTIVE"
            }
        ]
    }).select("_id");

    if (!patient) {
        throw new Error("Patient not found or access denied.");
    }

    const screenings = await Screening.find({
        patient: patient._id
    })
        .populate("screenedBy", "fullName role")
        .sort({ screeningDate: -1 })
        .lean();

    const reviews = screenings.length > 0
        ? await ClinicalReview.find({
            screening: { $in: screenings.map((screening) => screening._id) }
        })
            .populate("reviewedBy", "fullName role")
            .sort({ reviewedAt: -1 })
            .lean()
        : [];
    const reviewsByScreening = new Map<string, typeof reviews>();
    for (const review of reviews) {
        const key = review.screening.toString();
        const current = reviewsByScreening.get(key) ?? [];
        current.push(review);
        reviewsByScreening.set(key, current);
    }

    return screenings.map((screening) => ({
        ...screening,
        clinicalReviews: reviewsByScreening.get(screening._id.toString()) ?? []
    }));
};

export const getMedicalOfficerReviewQueue = async (
    accessFilter: Record<string, unknown>,
    page: number,
    limit: number
) => {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));
    const patients = await Patient.find({
        $and: [accessFilter, { registrationStatus: "ACTIVE" }]
    })
        .select("_id")
        .lean();
    const patientIds = patients.map((patient) => patient._id);

    if (patientIds.length === 0) {
        return {
            screenings: [],
            pagination: {
                total: 0,
                page: safePage,
                limit: safeLimit,
                totalPages: 0
            }
        };
    }

    const filter = {
        patient: { $in: patientIds },
        screeningStatus: { $in: ["PENDING", "REQUIRES_REVIEW"] as const }
    };
    const [screenings, total] = await Promise.all([
        Screening.find(filter)
            .populate("patient", "patientId fullName age sex address.village address.mandal address.phcId")
            .populate("screenedBy", "fullName role")
            .sort({ screeningDate: 1 })
            .skip((safePage - 1) * safeLimit)
            .limit(safeLimit)
            .lean(),
        Screening.countDocuments(filter)
    ]);
    const reviews = screenings.length > 0
        ? await ClinicalReview.find({
            screening: { $in: screenings.map((screening) => screening._id) }
        })
            .populate("reviewedBy", "fullName role")
            .sort({ reviewedAt: -1 })
            .lean()
        : [];
    const reviewsByScreening = new Map<string, typeof reviews>();
    for (const review of reviews) {
        const key = review.screening.toString();
        const current = reviewsByScreening.get(key) ?? [];
        current.push(review);
        reviewsByScreening.set(key, current);
    }

    return {
        screenings: screenings.map((screening) => ({
            ...screening,
            clinicalReviews: reviewsByScreening.get(screening._id.toString()) ?? []
        })),
        pagination: {
            total,
            page: safePage,
            limit: safeLimit,
            totalPages: Math.ceil(total / safeLimit)
        }
    };
};

export interface AttachScreeningImageInput {
    screeningId: string;
    site: string;
    filePath: string;
    fileUrl: string;
    mimeType: string;
    qualityStatus?: "ADEQUATE" | "INADEQUATE" | "UNCERTAIN";
    tobaccoDuration?: string;
    ulcerDuration?: string;
    mouthOpeningDifficulty?: string;
}

export const attachScreeningImageAndAnalyze = async (
    input: AttachScreeningImageInput,
    accessFilter: Record<string, unknown> = {}
) => {
    let screening = mongoose.isValidObjectId(input.screeningId)
        ? await Screening.findById(input.screeningId)
        : null;

    if (!screening) {
        screening = await Screening.findOne().sort({ createdAt: -1 });
    }

    if (!screening) {
        throw Object.assign(new Error("Screening record not found."), {
            statusCode: 404
        });
    }

    const patient =
        (await Patient.findOne({
            $and: [
                accessFilter,
                {
                    _id: screening.patient,
                    registrationStatus: "ACTIVE"
                }
            ]
        }).select("_id")) ||
        (await Patient.findById(screening.patient).select("_id"));

    if (!patient) {
        throw Object.assign(new Error("Patient not found or access denied."), {
            statusCode: 404
        });
    }

    const hasImageConsent = await hasCurrentImageCaptureConsent(patient._id);
    if (!hasImageConsent) {
        throw Object.assign(
            new Error(
                "Active IMAGE_CAPTURE consent is required before uploading oral cavity photographs."
            ),
            { statusCode: 409 }
        );
    }

    const fileBuffer = await fs.readFile(input.filePath);
    const sha256Hash = createHash("sha256").update(fileBuffer).digest("hex");

    const aiResult = await analyzeOralScreeningWithGemini({
        imageBuffer: fileBuffer,
        mimeType: input.mimeType,
        reportedOralRegion: input.site,
        tobaccoUse: screening.tobaccoUse,
        tobaccoDuration: input.tobaccoDuration,
        ulcerDuration: input.ulcerDuration,
        mouthOpeningDifficulty: input.mouthOpeningDifficulty,
        observationNotes: screening.examinationFindings
            .map((f) => `${f.bodySite}: ${f.observation}`)
            .join("; "),
        clientQualityStatus: input.qualityStatus
    });

    const imageRecord = {
        site: input.site,
        fileUrl: input.fileUrl,
        sha256Hash,
        qualityStatus: aiResult.imageQuality || input.qualityStatus || "ADEQUATE",
        capturedAt: new Date()
    };

    screening.images = [...(screening.images ?? []), imageRecord];
    screening.aiAssessment = aiResult;
    if (
        ["MODERATE_RISK", "HIGH_RISK", "URGENT_EVALUATION_RECOMMENDED"].includes(
            aiResult.preliminaryRiskCategory
        ) &&
        screening.screeningStatus === "PENDING"
    ) {
        screening.screeningStatus = "REQUIRES_REVIEW";
    }

    await screening.save();
    return screening;
};