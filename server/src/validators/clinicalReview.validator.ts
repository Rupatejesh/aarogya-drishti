
import { z } from "zod";

export const createClinicalReviewSchema = z.object({
    screeningId: z.string().regex(
        /^[a-f\d]{24}$/i,
        "Invalid screening ID."
    ),

    decision: z.enum(["AGREE", "DISAGREE", "DEFER"]),

    clinicalObservations: z.string()
        .trim()
        .min(1, "Clinical observations are required.")
        .max(3000),

    notes: z.string()
        .trim()
        .max(3000)
        .optional(),

    referralRecommended: z.boolean(),

    referralReason: z.string()
        .trim()
        .max(1000)
        .optional()
}).refine(
    (data) =>
        !data.referralRecommended ||
        Boolean(data.referralReason?.trim()),
    {
        message: "A referral reason is required when referral is recommended.",
        path: ["referralReason"]
    }
);
