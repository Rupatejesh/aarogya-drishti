import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid record ID.");

export const createFollowUpSchema = z.object({
    patientId: objectId,
    screeningId: objectId.optional(),
    referralId: objectId.optional(),
    assignedWorkerId: objectId,
    dueAt: z.string().datetime({ offset: true }),
    note: z.string().trim().max(1000).optional()
}).strict();

export const updateFollowUpSchema = z.object({
    status: z.enum(["PLANNED", "CONTACTED", "COMPLETED", "MISSED", "CANCELLED"]).optional(),
    dueAt: z.string().datetime({ offset: true }).optional(),
    assignedWorkerId: objectId.optional(),
    visitNote: z.string().trim().min(1).max(2000).optional(),
    missedReason: z.string().trim().min(1).max(1000).optional()
}).strict().refine(
    (data) => Object.keys(data).length > 0,
    { message: "At least one follow-up update is required." }
).refine(
    (data) => data.status !== "MISSED" || Boolean(data.missedReason),
    {
        message: "A reason is required when a follow-up is missed.",
        path: ["missedReason"]
    }
).refine(
    (data) => data.status !== "PLANNED" || Boolean(data.dueAt),
    {
        message: "A new date is required when reopening a missed follow-up.",
        path: ["dueAt"]
    }
);
