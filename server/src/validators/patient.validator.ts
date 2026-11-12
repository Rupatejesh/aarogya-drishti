
import { z } from "zod";
import { ASR_MANDALS } from "../models/Patient";

const optionalPhone = z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number.")
    .optional()
    .or(z.literal(""));

export const registerPatientSchema = z.object({
    fullName: z.string().trim().min(2).max(100),

    dateOfBirth: z.coerce.date().optional(),
    age: z.number().int().min(0).max(120).optional(),

    sex: z.enum([
        "MALE",
        "FEMALE",
        "OTHER",
        "NOT_RECORDED"
    ]).default("NOT_RECORDED"),

    phone: optionalPhone,
    alternateContact: optionalPhone,

    address: z.object({
        village: z.string().trim().min(1).max(100),
        habitation: z.string().trim().max(100).optional(),
        gramPanchayat: z.string().trim().max(100).optional(),
        mandal: z.enum(ASR_MANDALS),
        phcId: z.string().trim().min(1).max(100)
    }),

    exposureHistory: z.object({
        tobaccoUse: z.enum([
            "NEVER",
            "CURRENT",
            "FORMER",
            "NOT_RECORDED"
        ]).default("NOT_RECORDED"),

        tobaccoTypes: z.array(z.string().trim().min(1).max(50)).default([]),

        tobaccoDurationYears: z.number().min(0).max(100).optional(),

        alcoholUse: z.enum([
            "YES",
            "NO",
            "NOT_RECORDED"
        ]).optional(),

        otherExposures: z.array(z.string().trim().min(1).max(100)).default([])
        }),

    symptoms: z.array(
        z.object({
            name: z.string().trim().min(1).max(100),
            bodySite: z.string().trim().max(100).optional(),
            duration: z.string().trim().max(100).optional()
        })
    ).default([]),

    previousScreening: z.object({
        screenedBefore: z.boolean(),
        lastScreeningDate: z.coerce.date().optional(),
        previousFindings: z.string().trim().max(1000).optional(),
        previousReferral: z.boolean().optional()
    }).strict().optional(),

    consent: z.object({
        purpose: z.literal("PATIENT_REGISTRATION"),
        granted: z.literal(true),
        consentVersion: z.string().trim().min(1).max(30),
        language: z.enum([
            "TELUGU",
            "ENGLISH",
            "HINDI"
        ])
    }).strict()
}).strict().superRefine((data, context) => {
    if (data.dateOfBirth) {
        const now = new Date();
        const today = new Date(
            Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
        );
        const dateOfBirth = new Date(data.dateOfBirth);
        dateOfBirth.setUTCHours(0, 0, 0, 0);

        if (dateOfBirth > today) {
            context.addIssue({
                code: "custom",
                path: ["dateOfBirth"],
                message: "Date of birth cannot be in the future."
            });
        }

        let derivedAge = today.getUTCFullYear() - dateOfBirth.getUTCFullYear();
        const monthDifference = today.getUTCMonth() - dateOfBirth.getUTCMonth();
        if (
            monthDifference < 0 ||
            (monthDifference === 0 &&
                today.getUTCDate() < dateOfBirth.getUTCDate())
        ) {
            derivedAge -= 1;
        }

        if (derivedAge > 120) {
            context.addIssue({
                code: "custom",
                path: ["dateOfBirth"],
                message: "Date of birth is outside the supported age range."
            });
        }

        if (data.age !== undefined && data.age !== derivedAge) {
            context.addIssue({
                code: "custom",
                path: ["age"],
                message: "Age does not match the date of birth."
            });
        }
    }

    if (data.previousScreening?.lastScreeningDate) {
        const today = new Date();
        today.setUTCHours(23, 59, 59, 999);
        if (data.previousScreening.lastScreeningDate > today) {
            context.addIssue({
                code: "custom",
                path: ["previousScreening", "lastScreeningDate"],
                message: "Previous screening date cannot be in the future."
            });
        }
    }
}).refine(
    (data) => data.age !== undefined || data.dateOfBirth !== undefined,
    {
        message: "Provide either age or date of birth.",
        path: ["age"]
    }
);

export type RegisterPatientData = z.infer<
    typeof registerPatientSchema
>;
