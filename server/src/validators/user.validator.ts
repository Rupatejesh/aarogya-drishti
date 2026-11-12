
import { z } from "zod";

const accountCredentialsSchema = {
    fullName: z
        .string()
        .trim()
        .min(2, "Full name must contain at least 2 characters.")
        .max(100, "Full name is too long."),

    email: z
        .string()
        .trim()
        .email("Enter a valid email address.")
        .max(254)
        .optional(),

    phone: z
        .string()
        .trim()
        .regex(/^[0-9]{10}$/, "Enter a valid 10-digit phone number.")
        .optional(),

    password: z
        .string()
        .min(12, "Password must contain at least 12 characters.")
        .max(128, "Password is too long.")
};

const requireContact = (data: {
    email?: string;
    phone?: string;
}) => Boolean(data.email || data.phone);

export const createStaffUserSchema = z.object({
    ...accountCredentialsSchema,

    role: z.enum(["MEDICAL_OFFICER", "SPECIALIST"]),

    assignedPHCId: z
        .string()
        .trim()
        .min(1, "PHC assignment is required.")
        .max(100),

    mandal: z
        .string()
        .trim()
        .min(1, "Mandal assignment is required.")
        .max(100),

    district: z
        .string()
        .trim()
        .min(1)
        .max(100)
        .default("Alluri Sitharama Raju"),

    medicalRegistrationNumber: z.string().trim().max(80).optional(),
    specialization: z.string().trim().max(120).optional(),
    experienceYears: z.number().int().min(0).max(70).optional(),
    hospitalId: z.string().trim().max(80).optional(),
    consultationFee: z.number().min(0).optional(),
    availableDays: z.array(z.string().trim().max(40)).optional(),
    timeSlots: z.array(z.string().trim().max(60)).optional()
}).refine(requireContact, {
    message: "An email address or phone number is required.",
    path: ["email"]
});

export const createASHAWorkerSchema = z.object({
    ...accountCredentialsSchema,

    assignedPHCId: z
        .string()
        .trim()
        .min(1, "PHC assignment is required.")
        .max(100),

    mandal: z
        .string()
        .trim()
        .min(1, "Mandal assignment is required.")
        .max(100),

    district: z
        .string()
        .trim()
        .min(1)
        .max(100)
        .default("Alluri Sitharama Raju"),

    medicalRegistrationNumber: z.string().trim().max(80).optional(),
    specialization: z.string().trim().max(120).optional(),
    experienceYears: z.number().int().min(0).max(70).optional(),
    hospitalId: z.string().trim().max(80).optional(),
    consultationFee: z.number().min(0).optional(),
    availableDays: z.array(z.string().trim().max(40)).optional(),
    timeSlots: z.array(z.string().trim().max(60)).optional()
}).refine(requireContact, {
    message: "An email address or phone number is required.",
    path: ["email"]
});

export const createITDAProjectOfficerSchema = z.object({
    ...accountCredentialsSchema,

    district: z
        .string()
        .trim()
        .min(1, "District assignment is required.")
        .max(100)
        .default("Alluri Sitharama Raju")
}).refine(requireContact, {
    message: "An email address or phone number is required.",
    path: ["email"]
});

export const createDistrictOfficerSchema = z.object({
    ...accountCredentialsSchema,

    district: z
        .string()
        .trim()
        .min(1, "District assignment is required.")
        .max(100)
        .default("Alluri Sitharama Raju")
}).refine(requireContact, {
    message: "An email address or phone number is required.",
    path: ["email"]
});

export type CreateStaffUserInput = z.infer<
    typeof createStaffUserSchema
>;

export type CreateASHAWorkerInput = z.infer<
    typeof createASHAWorkerSchema
>;

export type CreateITDAProjectOfficerInput = z.infer<
    typeof createITDAProjectOfficerSchema
>;
export type CreateDistrictOfficerInput = z.infer<
    typeof createDistrictOfficerSchema
>;
