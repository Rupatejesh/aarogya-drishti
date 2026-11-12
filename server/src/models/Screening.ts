import mongoose, { Document, Schema } from "mongoose";

export const ORAL_BODY_SITES = [
    "TONGUE",
    "LEFT_CHEEK",
    "RIGHT_CHEEK",
    "PALATE",
    "GUMS",
    "FLOOR_OF_MOUTH",
    "LIPS",
    "OTHER"
] as const;

export const SCREENING_STATUSES = [
    "PENDING",
    "COMPLETED",
    "REQUIRES_REVIEW"
] as const;

export interface IMedicationPrescription {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    route: string;
    instructions: string;
}

export interface IScreeningAiAssessment {
    result: string;
    modelVersion: string;
    disclaimer: "NOT FOR CLINICAL USE";
    assessedAt: Date;
    imageQuality?: "ADEQUATE" | "INADEQUATE" | "UNCERTAIN";
    visibleFeatures?: string[];
    reportedOralRegion?: string;
    preliminaryRiskCategory?:
        | "LOW_RISK"
        | "MODERATE_RISK"
        | "HIGH_RISK"
        | "URGENT_EVALUATION_RECOMMENDED";
    detectedCondition?: string;
    icd10Code?: string;
    severityStage?: string;
    confidenceScore?: number;
    clinicalExplanation?: string;
    differentialDiagnoses?: string[];
    recommendedTests?: string[];
    medications?: IMedicationPrescription[];
    lifestyleAdvice?: string[];
    teluguSummary?: string;
    suggestedNextSteps?: string;
    uncertaintyLimitations?: string;
    boundingBox?: number[];
}

export interface IScreening extends Document {
    patient: mongoose.Types.ObjectId;
    screenedBy: mongoose.Types.ObjectId;
    screeningDate: Date;
    notes?: string;

    symptoms: {
        name: string;
        duration?: string;
        bodySite?: string;
    }[];

    examinationFindings: {
        bodySite: typeof ORAL_BODY_SITES[number];
        observation: string;
        notes?: string;
    }[];

    tobaccoUse: "NEVER" | "CURRENT" | "FORMER" | "NOT_RECORDED";

    clinicalStatus?:
        | "NO_SUSPICIOUS_FINDING_RECORDED"
        | "SUSPICIOUS_FINDING_REQUIRES_REVIEW"
        | "INCONCLUSIVE";

    screeningStatus: typeof SCREENING_STATUSES[number];

    images?: {
        site: string;
        fileUrl: string;
        sha256Hash: string;
        qualityStatus: string;
        capturedAt: Date;
    }[];

    aiAssessment?: IScreeningAiAssessment;
}

const ScreeningSchema = new Schema<IScreening>(
    {
        patient: {
            type: Schema.Types.ObjectId,
            ref: "Patient",
            required: true,
            index: true
        },

        screenedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        screeningDate: {
            type: Date,
            default: Date.now,
            required: true
        },

        notes: {
            type: String,
            trim: true,
            maxlength: 2000
        },

        symptoms: [
            {
                name: { type: String, required: true, trim: true },
                duration: { type: String, trim: true },
                bodySite: { type: String, trim: true }
            }
        ],

        examinationFindings: [
            {
                bodySite: {
                    type: String,
                    enum: ORAL_BODY_SITES,
                    required: true
                },
                observation: {
                    type: String,
                    required: true,
                    trim: true
                },
                notes: { type: String, trim: true }
            }
        ],

        tobaccoUse: {
            type: String,
            enum: ["NEVER", "CURRENT", "FORMER", "NOT_RECORDED"],
            default: "NOT_RECORDED"
        },

        clinicalStatus: {
            type: String,
            enum: [
                "NO_SUSPICIOUS_FINDING_RECORDED",
                "SUSPICIOUS_FINDING_REQUIRES_REVIEW",
                "INCONCLUSIVE"
            ]
        },

        screeningStatus: {
            type: String,
            enum: SCREENING_STATUSES,
            default: "PENDING"
        },

        images: [
            {
                site: { type: String, required: true, trim: true },
                fileUrl: { type: String, required: true, trim: true },
                sha256Hash: { type: String, required: true, trim: true },
                qualityStatus: {
                    type: String,
                    default: "ADEQUATE",
                    trim: true
                },
                capturedAt: { type: Date, default: Date.now }
            }
        ],

        aiAssessment: {
            result: { type: String, trim: true },
            modelVersion: { type: String, trim: true },
            disclaimer: {
                type: String,
                enum: ["NOT FOR CLINICAL USE"],
                default: "NOT FOR CLINICAL USE"
            },
            assessedAt: Date,
            imageQuality: {
                type: String,
                enum: ["ADEQUATE", "INADEQUATE", "UNCERTAIN"]
            },
            visibleFeatures: [{ type: String, trim: true }],
            reportedOralRegion: { type: String, trim: true },
            preliminaryRiskCategory: {
                type: String,
                enum: [
                    "LOW_RISK",
                    "MODERATE_RISK",
                    "HIGH_RISK",
                    "URGENT_EVALUATION_RECOMMENDED"
                ]
            },
            detectedCondition: { type: String, trim: true },
            icd10Code: { type: String, trim: true },
            severityStage: { type: String, trim: true },
            confidenceScore: { type: Number },
            clinicalExplanation: { type: String, trim: true },
            differentialDiagnoses: [{ type: String, trim: true }],
            recommendedTests: [{ type: String, trim: true }],
            medications: [
                {
                    name: { type: String, trim: true },
                    dosage: { type: String, trim: true },
                    frequency: { type: String, trim: true },
                    duration: { type: String, trim: true },
                    route: { type: String, trim: true },
                    instructions: { type: String, trim: true }
                }
            ],
            lifestyleAdvice: [{ type: String, trim: true }],
            teluguSummary: { type: String, trim: true },
            suggestedNextSteps: { type: String, trim: true },
            uncertaintyLimitations: { type: String, trim: true },
            boundingBox: [{ type: Number }]
        }
    },
    {
        timestamps: true,
    }
);

ScreeningSchema.index({ patient: 1, screeningDate: -1 });
ScreeningSchema.index({ screenedBy: 1, screeningDate: -1 });

export default mongoose.model<IScreening>(
    "Screening",
    ScreeningSchema
);