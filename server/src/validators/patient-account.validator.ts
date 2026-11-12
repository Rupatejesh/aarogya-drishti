
import { z } from "zod";

export const linkPatientAccountSchema = z.object({
    claimCode: z.string().regex(/^[A-Za-z0-9_-]{40,60}$/, "Invalid claim code.")
}).strict();

export const createOwnershipClaimSchema = z.object({}).strict();

export const claimCodeParamSchema = z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid patient ID.")
});

export const assignASHAWorkerSchema = z.object({
    ashaWorkerId: z
        .string()
        .regex(/^[0-9a-fA-F]{24}$/, "Invalid ASHA Worker account ID.")
});
