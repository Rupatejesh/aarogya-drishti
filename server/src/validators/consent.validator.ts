import { z } from "zod";

export const recordOralScreeningConsentSchema = z.object({
    purpose: z
        .enum([
            "ORAL_SCREENING",
            "IMAGE_CAPTURE",
            "IMAGE_CAPTURE_AND_STORAGE",
            "AI_ASSISTED_DEMONSTRATION"
        ])
        .optional(),
    consentVersion: z.string().trim().min(1).max(30),
    language: z.enum(["TELUGU", "ENGLISH", "HINDI"]),
    notes: z.string().trim().max(1000).optional()
}).strict();

export const withdrawOralScreeningConsentSchema = z.object({
    reason: z.string().trim().max(500).optional()
}).strict();
