import { z } from "zod";

export const loginSchema = z.object({
    identifier: z
        .string()
        .trim()
        .min(1, "Email or phone number is required.")
        .max(254, "Identifier is too long."),

    password: z
        .string()
        .min(1, "Password is required.")
        .max(128, "Password is too long.")
});

const indianPhoneRegex = /^(?:(?:\+|0{0,2})91(\s*[-]\s*)?|[0]?)?[6789]\d{9}$/;

export const registerSchema = z.object({
    fullName: z
        .string()
        .trim()
        .min(2, "Full name must be at least 2 characters.")
        .max(100, "Full name is too long."),
    phone: z
        .string()
        .trim()
        .regex(indianPhoneRegex, "A valid 10-digit Indian mobile number is required."),
    email: z
        .string()
        .trim()
        .email("Invalid email format.")
        .optional()
        .or(z.literal("")),
    password: z
        .string()
        .min(6, "Password must be at least 6 characters.")
        .max(128, "Password is too long."),
    fatherName: z
        .string()
        .trim()
        .max(120, "Father / Guardian name is too long.")
        .optional(),
    aadhaarNumber: z
        .string()
        .trim()
        .optional(),
    role: z
        .literal("PATIENT")
        .default("PATIENT"),
    mandal: z
        .string()
        .trim()
        .optional()
        .default("G. Madugula"),
    village: z
        .string()
        .trim()
        .optional()
        .default("G. Madugula"),
    age: z
        .coerce
        .number()
        .int()
        .positive()
        .optional()
        .default(46),
    gender: z
        .enum(["MALE", "FEMALE", "OTHER"])
        .optional()
        .default("MALE"),
    district: z
        .string()
        .trim()
        .optional()
        .default("Alluri Sitharama Raju")
});

export const sendOtpSchema = z.object({
    phone: z
        .string()
        .trim()
        .regex(indianPhoneRegex, "A valid 10-digit Indian mobile number is required.")
});

export const verifyOtpSchema = z.object({
    phone: z
        .string()
        .trim()
        .regex(indianPhoneRegex, "A valid 10-digit Indian mobile number is required."),
    otp: z
        .string()
        .trim()
        .regex(/^[0-9]{6}$/, "A valid 6-digit OTP is required.")
});
