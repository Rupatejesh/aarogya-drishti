
import { z } from "zod";

export const createReferralSchema = z.object({
    screeningId: z.string().regex(
        /^[a-f\d]{24}$/i,
        "Invalid screening ID."
    ),

    assignedSpecialistId: z.string()
        .regex(/^[a-f\d]{24}$/i, "Invalid Specialist ID.")
        .optional(),

    referralReason: z.string()
        .trim()
        .min(1, "Referral reason is required.")
        .max(2000),

    priority: z.enum(["ROUTINE", "URGENT", "EMERGENCY"]),

    referredTo: z.string()
        .trim()
        .min(2, "Specialist name or department is required.")
        .max(150),

    facilityName: z.string()
        .trim()
        .min(2, "Facility name is required.")
        .max(200),

    appointmentDate: z.string()
        .datetime({ offset: true })
        .optional(),

    notes: z.string().trim().max(2000).optional()
}).strict();

export const updateReferralStatusSchema = z.object({
    status: z.enum([
        "SCHEDULED",
        "CONFIRMED",
        "RESCHEDULED",
        "COMPLETION_REVIEW",
        "CANCELLED",
        "MISSED"
    ]),

    appointmentDate: z.string()
        .datetime({ offset: true })
        .optional(),

    note: z.string()
        .trim()
        .min(1)
        .max(1000)
        .optional()
}).refine(
    (data) =>
        !["SCHEDULED", "RESCHEDULED"].includes(data.status) ||
        Boolean(data.appointmentDate),
    {
        message: "An appointment date is required for scheduling or rescheduling.",
        path: ["appointmentDate"]
    }
).refine(
    (data) =>
        !data.appointmentDate ||
        ["SCHEDULED", "RESCHEDULED"].includes(data.status),
    {
        message: "Appointment date can be changed only while scheduling or rescheduling.",
        path: ["appointmentDate"]
    }
).strict();

export const assignReferralSpecialistSchema = z.object({
    specialistId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid Specialist ID."),
    note: z.string().trim().max(1000).optional()
}).strict();

export const reviewReferralCompletionSchema = z.object({
    approved: z.boolean(),
    note: z.string().trim().min(1).max(1000)
}).strict();

export const updateReferralPrioritySchema = z.object({
    priority: z.enum(["ROUTINE", "URGENT", "EMERGENCY"])
}).strict();
