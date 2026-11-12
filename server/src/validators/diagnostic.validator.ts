
import { z } from "zod";

export const createDiagnosticOrderSchema = z.object({
    patientId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid patient ID."),

    screeningId: z.string()
        .regex(/^[a-f\d]{24}$/i, "Invalid screening ID.")
        .optional(),

    referralId: z.string()
        .regex(/^[a-f\d]{24}$/i, "Invalid referral ID.")
        .optional(),

    diagnosticType: z.enum([
        "BIOPSY",
        "HISTOPATHOLOGY",
        "CT_SCAN",
        "MRI",
        "OTHER"
    ]),

    clinicalReason: z.string()
        .trim()
        .min(5, "Clinical reason is required.")
        .max(2000),

    facilityName: z.string()
        .trim()
        .max(200)
        .optional(),

    appointmentDate: z.string()
        .datetime({ offset: true })
        .optional(),

    notes: z.string()
        .trim()
        .max(2000)
        .optional()
});

export const updateDiagnosticStatusSchema = z.object({
    status: z.enum([
    "SCHEDULED",
    "PERFORMED",
    "SAMPLE_COLLECTED",
    "REPORT_PENDING",
    "REPORT_RECEIVED",
    "UNDER_CLINICIAN_REVIEW",
    "REVIEWED",
    "CANCELLED"
]),

    appointmentDate: z.string()
        .datetime({ offset: true })
        .optional(),

    reportReceivedAt: z.string()
        .datetime({ offset: true })
        .optional(),

    note: z.string()
        .trim()
        .min(1)
        .max(2000)
        .optional()
});

export const recordDiagnosticResultSchema = z.object({
    resultText: z.string().trim().min(1).max(5000)
}).strict();
