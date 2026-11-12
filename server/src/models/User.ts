import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

export const USER_ROLES = [
    "PATIENT",
    "ASHA_WORKER",
    "MEDICAL_OFFICER",
    "SPECIALIST",
    "DRONE_OPERATOR",
    "DISTRICT_OFFICER",
    "ITDA_PROJECT_OFFICER",
    "ADMIN"
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export interface IUser extends Document {
    fullName: string;
    title?: string;
    email?: string;
    phone?: string;
    passwordHash: string;
    role: UserRole;
    isActive: boolean;
    assignedPHCId?: string;
    mandal?: string;
    district?: string;
    medicalRegistrationNumber?: string;
    specialization?: string;
    degrees?: string[];
    almaMater?: string;
    practiceType?: "GOVERNMENT" | "PRIVATE_VISITING";
    activeCaseload?: number;
    privateClinicAffiliation?: string;
    experienceYears?: number;
    hospitalId?: string;
    consultationFee?: number;
    availableDays?: string[];
    timeSlots?: string[];
    lastLoginAt?: Date;
    tokenVersion: number;

    comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
    {
        fullName: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 100
        },
        title: {
            type: String,
            trim: true,
            maxlength: 120
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
            sparse: true,
            unique: true
        },
        phone: {
            type: String,
            trim: true,
            sparse: true,
            unique: true
        },
        passwordHash: {
            type: String,
            required: true,
            select: false
        },
        role: {
            type: String,
            enum: USER_ROLES,
            required: true
        },
        isActive: {
            type: Boolean,
            default: true
        },
        assignedPHCId: {
            type: String,
            trim: true
        },
        mandal: {
            type: String,
            trim: true
        },
        district: {
            type: String,
            trim: true,
            default: "Alluri Sitharama Raju"
        },
        medicalRegistrationNumber: {
            type: String,
            trim: true,
            maxlength: 80
        },
        specialization: {
            type: String,
            trim: true,
            maxlength: 120
        },
        degrees: [
            {
                type: String,
                trim: true
            }
        ],
        almaMater: {
            type: String,
            trim: true,
            maxlength: 150
        },
        practiceType: {
            type: String,
            enum: ["GOVERNMENT", "PRIVATE_VISITING"],
            default: "GOVERNMENT"
        },
        activeCaseload: {
            type: Number,
            default: 0,
            min: 0
        },
        privateClinicAffiliation: {
            type: String,
            trim: true,
            maxlength: 150
        },
        experienceYears: {
            type: Number,
            min: 0,
            max: 70
        },
        hospitalId: {
            type: String,
            trim: true,
            maxlength: 80
        },
        consultationFee: {
            type: Number,
            min: 0
        },
        availableDays: [
            {
                type: String,
                trim: true
            }
        ],
        timeSlots: [
            {
                type: String,
                trim: true
            }
        ],
        tokenVersion: {
            type: Number,
            default: 0,
            min: 0
        },
        lastLoginAt: {
            type: Date
        }
    },
    {
        timestamps: true
    }
);

userSchema.methods.comparePassword = async function (
    candidatePassword: string
): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.passwordHash);
};

const User = mongoose.model<IUser>("User", userSchema);

export default User;