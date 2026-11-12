
import mongoose, { Schema, Document } from "mongoose";
import { randomUUID } from "crypto";

export const ASR_MANDALS = [
    "Ananthagiri",
    "Araku Valley",
    "Chinthapalli",
    "Dumbriguda",
    "G. Madugula",
    "Gudem Kotha Veedhi",
    "Hukumpeta",
    "Koyyuru",
    "Munchingi Puttu",
    "Paderu",
    "Peda Bayalu"
] as const;

export type PatientSex = "MALE" | "FEMALE" | "OTHER" | "NOT_RECORDED";

export type TobaccoUseStatus =
    | "NEVER"
    | "CURRENT"
    | "FORMER"
    | "NOT_RECORDED";

export interface IPatient extends Document {
    patientId: string;
    maaUidn?: string;
    fullName: string;
    fatherName?: string;
    aadhaarNumber?: string;
    dateOfBirth?: Date;
    age?: number;
    sex: PatientSex;
    phone?: string;
    alternateContact?: string;

    // Optional linked login account. One account per patient.
    user?: mongoose.Types.ObjectId;

    // ASHA Worker responsible for coordinating this patient's care.
    assignedASHAWorker?: mongoose.Types.ObjectId;

    address: {
        village: string;
        habitation?: string;
        gramPanchayat?: string;
        mandal: string;
        phcId: string;
        district: string;
    };

    exposureHistory: {
        tobaccoUse: TobaccoUseStatus;
        tobaccoTypes: string[];
        tobaccoDurationYears?: number;
        alcoholUse?: "YES" | "NO" | "NOT_RECORDED";
        otherExposures?: string[];
    };

    symptoms: {
        name: string;
        bodySite?: string;
        duration?: string;
    }[];

    previousScreening?: {
        screenedBefore: boolean;
        lastScreeningDate?: Date;
        previousFindings?: string;
        previousReferral?: boolean;
    };

    habits?: {
        substance: string;
        frequency: string;
        durationYears?: number;
        burningScore?: number;
    }[];

    registrationStatus: "ACTIVE" | "INACTIVE";
    createdBy: mongoose.Types.ObjectId;
}

const patientSchema = new Schema<IPatient>(
    {
        patientId: {
            type: String,
            unique: true,
            index: true,
            immutable: true
        },

        maaUidn: {
            type: String,
            unique: true,
            sparse: true,
            index: true
        },

        fullName: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 120
        },

        fatherName: {
            type: String,
            trim: true,
            maxlength: 120
        },

        aadhaarNumber: {
            type: String,
            trim: true,
            sparse: true
        },

        dateOfBirth: {
            type: Date
        },

        age: {
            type: Number,
            min: 0,
            max: 120
        },

        sex: {
            type: String,
            enum: ["MALE", "FEMALE", "OTHER", "NOT_RECORDED"],
            required: true,
            default: "NOT_RECORDED"
        },

        phone: {
            type: String,
            trim: true
        },

        alternateContact: {
            type: String,
            trim: true
        },

        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            unique: true,
            sparse: true
        },

        assignedASHAWorker: {
            type: Schema.Types.ObjectId,
            ref: "User",
            index: true
        },

        address: {
            village: {
                type: String,
                required: true,
                trim: true
            },
            habitation: {
                type: String,
                trim: true
            },
            gramPanchayat: {
                type: String,
                trim: true
            },
            mandal: {
                type: String,
                required: true,
                enum: ASR_MANDALS
            },
            phcId: {
                type: String,
                required: true,
                trim: true
            },
            district: {
                type: String,
                required: true,
                default: "Alluri Sitharama Raju"
            }
        },

        exposureHistory: {
            tobaccoUse: {
                type: String,
                enum: ["NEVER", "CURRENT", "FORMER", "NOT_RECORDED"],
                default: "NOT_RECORDED"
            },
            tobaccoTypes: {
                type: [String],
                default: []
            },
            tobaccoDurationYears: {
                type: Number,
                min: 0,
                max: 100
            },
            alcoholUse: {
                type: String,
                enum: ["YES", "NO", "NOT_RECORDED"],
                default: "NOT_RECORDED"
            },
            otherExposures: {
                type: [String],
                default: []
            }
        },

        symptoms: {
            type: [
                {
                    name: {
                        type: String,
                        required: true,
                        trim: true
                    },
                    bodySite: {
                        type: String,
                        trim: true
                    },
                    duration: {
                        type: String,
                        trim: true
                    }
                }
            ],
            default: []
        },

        previousScreening: {
            screenedBefore: {
                type: Boolean,
                default: false
            },
            lastScreeningDate: Date,
            previousFindings: {
                type: String,
                trim: true
            },
            previousReferral: {
                type: Boolean,
                default: false
            }
        },

        habits: [
            {
                substance: { type: String, required: true },
                frequency: { type: String, default: "Daily" },
                durationYears: { type: Number, default: 0 },
                burningScore: { type: Number, default: 0 }
            }
        ],

        registrationStatus: {
            type: String,
            enum: ["ACTIVE", "INACTIVE"],
            default: "ACTIVE"
        },

        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    {
        timestamps: true
    }
);

patientSchema.pre("validate", function () {
    const now = new Date();
    const dateStamp = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}${String(now.getUTCDate()).padStart(2, "0")}`;
    const randHex = randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase();
    if (!this.patientId) {
        this.patientId = `PT-${dateStamp}-${randHex}`;
    }
    if (!this.maaUidn) {
        const rawMandal = (this.address?.mandal || "GMAD").replace(/[^A-Za-z]/g, "").toUpperCase();
        const mandalCode = (rawMandal.slice(0, 4) || "GMAD").padEnd(4, "X");
        const numCode = String(Math.floor(1000 + Math.random() * 9000));
        this.maaUidn = `UIDN-ASR-${mandalCode}-2026-${numCode}`;
    }
});

const Patient = mongoose.model<IPatient>("Patient", patientSchema);

export default Patient;
