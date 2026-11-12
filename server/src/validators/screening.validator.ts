import { z } from "zod";
import { ORAL_BODY_SITES } from "../models/Screening";

export const createScreeningSchema = z.object({
    patientId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid patient ID."),

    screeningDate: z.coerce.date().optional(),

    notes: z.string().trim().max(2000).optional(),

    symptoms: z.array(
        z.object({
            name: z.string().trim().min(1).max(100),
            duration: z.string().trim().max(100).optional(),
            bodySite: z.string().trim().max(100).optional()
        })
    ).default([]),

    examinationFindings: z.array(
        z.object({
            bodySite: z.enum(ORAL_BODY_SITES),
            observation: z.string().trim().min(1).max(1000),
            notes: z.string().trim().max(1000).optional()
        })
    ).min(1, "At least one examination finding is required."),

    tobaccoUse: z.enum([
        "NEVER",
        "CURRENT",
        "FORMER",
        "NOT_RECORDED"
    ]).default("NOT_RECORDED"),

    clinicalStatus: z.enum([
        "NO_SUSPICIOUS_FINDING_RECORDED",
        "SUSPICIOUS_FINDING_REQUIRES_REVIEW",
        "INCONCLUSIVE"
    ]).optional()
}).strict().superRefine((data, context) => {
    const now = new Date();
    const endOfToday = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        23,
        59,
        59,
        999
    ));
    if (data.screeningDate && data.screeningDate > endOfToday) {
        context.addIssue({
            code: "custom",
            path: ["screeningDate"],
            message: "Screening date cannot be in the future."
        });
    }
});