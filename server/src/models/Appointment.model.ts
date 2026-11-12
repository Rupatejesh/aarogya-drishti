import mongoose, { Document, Schema } from "mongoose";

export const APPOINTMENT_MODES = ["IN_PERSON", "TELEMEDICINE"] as const;
export const APPOINTMENT_STATUSES = [
    "SCHEDULED",
    "CONFIRMED",
    "REQUESTED",
    "IN_PROGRESS",
    "HOLD",
    "PAUSED",
    "COMPLETED",
    "CANCELLED",
    "MISSED",
    "REJECTED"
] as const;

export type AppointmentMode = (typeof APPOINTMENT_MODES)[number];
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export interface IAppointment extends Document {
    appointmentId?: string;
    patient: mongoose.Types.ObjectId;
    patientId?: string;
    doctorId?: mongoose.Types.ObjectId;
    hospitalId?: string;
    referral?: mongoose.Types.ObjectId;
    referralId?: string;
    scheduledBy?: mongoose.Types.ObjectId;
    specialist?: mongoose.Types.ObjectId;
    specialistName?: string;
    doctorName?: string;
    patientName?: string;
    hospitalName: string;
    mode: AppointmentMode;
    appointmentType?: string;
    scheduledAt: Date;
    scheduledDate?: Date;
    timeSlot?: string;
    status: AppointmentStatus;
    telemedicineRoomCode?: string;
    meetingRoomId?: string;
    urgentReason?: string;
    lowBandwidthAudioOnly?: boolean;
    consultationNotes?: string;
    prescription?: string;
    nextAction?: string;
    clinicalRecommendations?: string;
    createdAt: Date;
    updatedAt: Date;
}

const appointmentSchema = new Schema<IAppointment>(
    {
        appointmentId: {
            type: String,
            trim: true,
            index: true
        },
        patient: {
            type: Schema.Types.ObjectId,
            ref: "Patient",
            required: true,
            index: true
        },
        patientId: {
            type: String,
            trim: true
        },
        doctorId: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        hospitalId: {
            type: String,
            trim: true
        },
        referral: {
            type: Schema.Types.ObjectId,
            ref: "Referral"
        },
        referralId: {
            type: String,
            trim: true
        },
        scheduledBy: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        specialist: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        specialistName: {
            type: String,
            trim: true,
            maxlength: 160
        },
        doctorName: {
            type: String,
            trim: true
        },
        patientName: {
            type: String,
            trim: true
        },
        hospitalName: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200
        },
        mode: {
            type: String,
            enum: APPOINTMENT_MODES,
            default: "TELEMEDICINE",
            required: true
        },
        appointmentType: {
            type: String,
            trim: true
        },
        scheduledAt: {
            type: Date,
            default: () => new Date()
        },
        scheduledDate: {
            type: Date
        },
        timeSlot: {
            type: String,
            trim: true
        },
        status: {
            type: String,
            enum: APPOINTMENT_STATUSES,
            default: "SCHEDULED",
            required: true
        },
        telemedicineRoomCode: {
            type: String,
            trim: true,
            maxlength: 80
        },
        meetingRoomId: {
            type: String,
            trim: true
        },
        urgentReason: {
            type: String,
            trim: true
        },
        lowBandwidthAudioOnly: {
            type: Boolean,
            default: false
        },
        consultationNotes: {
            type: String,
            trim: true,
            maxlength: 3000
        },
        prescription: {
            type: String,
            trim: true
        },
        nextAction: {
            type: String,
            trim: true
        },
        clinicalRecommendations: {
            type: String,
            trim: true,
            maxlength: 2000
        }
    },
    {
        timestamps: true
    }
);

appointmentSchema.index({ patient: 1, scheduledAt: -1 });

const Appointment = mongoose.model<IAppointment>(
    "Appointment",
    appointmentSchema
);

export default Appointment;
