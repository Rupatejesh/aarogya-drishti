import mongoose, { Document, Schema } from "mongoose";

export const HOSPITAL_TYPES = [
    "PHC",
    "CHC",
    "DISTRICT_HOSPITAL",
    "TERTIARY_REFERRAL",
    "GGH",
    "AREA_HOSPITAL",
    "SUBCENTRE"
] as const;

export type HospitalType = (typeof HOSPITAL_TYPES)[number];

export interface IHospital extends Document {
    hospitalId: string;
    name: string;
    type: HospitalType;
    mandal: string;
    district: string;
    address: string;
    contactPhone: string;
    facilities: string[];
    workingHours: string;
    totalBedCapacity?: number;
    activeBedsAvailable?: number;
    activeAmbulancesAvailable?: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const hospitalSchema = new Schema<IHospital>(
    {
        hospitalId: {
            type: String,
            unique: true,
            required: true,
            trim: true,
            maxlength: 80
        },
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200
        },
        type: {
            type: String,
            enum: HOSPITAL_TYPES,
            required: true
        },
        mandal: {
            type: String,
            required: true,
            trim: true,
            maxlength: 120
        },
        district: {
            type: String,
            default: "Alluri Sitharama Raju",
            trim: true,
            maxlength: 120
        },
        address: {
            type: String,
            required: true,
            trim: true,
            maxlength: 300
        },
        contactPhone: {
            type: String,
            required: true,
            trim: true,
            maxlength: 30
        },
        facilities: [
            {
                type: String,
                trim: true
            }
        ],
        workingHours: {
            type: String,
            default: "24x7 / 9 AM - 5 PM",
            trim: true,
            maxlength: 120
        },
        totalBedCapacity: {
            type: Number,
            default: 30,
            min: 0
        },
        activeBedsAvailable: {
            type: Number,
            default: 12,
            min: 0
        },
        activeAmbulancesAvailable: {
            type: Number,
            default: 2,
            min: 0
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

hospitalSchema.index({ mandal: 1, type: 1, isActive: 1 });

const Hospital = mongoose.model<IHospital>("Hospital", hospitalSchema);

export default Hospital;

