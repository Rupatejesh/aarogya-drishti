import { Router, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { randomUUID } from "crypto";
import Appointment, {
    APPOINTMENT_MODES,
    APPOINTMENT_STATUSES,
    AppointmentMode,
    AppointmentStatus
} from "../models/Appointment.model";
import Patient from "../models/Patient";
import { authenticate, AuthenticatedRequest } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";
import { getPatientAccessFilter } from "../services/patient-access.service";
import { recordAudit } from "../services/audit.service";

const router = Router();

router.get(
    "/patient/:patientId",
    authenticate,
    authorizeRoles("PATIENT", "ASHA_WORKER", "MEDICAL_OFFICER", "SPECIALIST"),
    async (
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: "Authentication required."
                });
                return;
            }

            const patientId = String(req.params.patientId ?? "");
            if (!mongoose.isValidObjectId(patientId)) {
                res.status(400).json({
                    success: false,
                    message: "Invalid patient ID."
                });
                return;
            }

            const accessFilter = await getPatientAccessFilter(req.user);
            const patient = await Patient.findOne({
                $and: [
                    accessFilter,
                    {
                        _id: new mongoose.Types.ObjectId(patientId),
                        registrationStatus: "ACTIVE"
                    }
                ]
            }).select("_id");

            if (!patient) {
                res.status(404).json({
                    success: false,
                    message: "Patient not found or access denied."
                });
                return;
            }

            const appointments = await Appointment.find({
                patient: patient._id
            })
                .sort({ scheduledAt: -1 })
                .lean();

            res.status(200).json({
                success: true,
                message: "Appointments retrieved successfully.",
                data: appointments
            });
        } catch (error) {
            next(error);
        }
    }
);

router.post(
    "/",
    authenticate,
    authorizeRoles("ASHA_WORKER", "MEDICAL_OFFICER", "SPECIALIST"),
    async (
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: "Authentication required."
                });
                return;
            }

            const {
                patientId,
                referralId,
                specialistId,
                specialistName,
                hospitalName,
                mode,
                scheduledAt,
                lowBandwidthAudioOnly,
                consultationNotes
            } = req.body ?? {};

            if (
                typeof patientId !== "string" ||
                !mongoose.isValidObjectId(patientId) ||
                typeof specialistName !== "string" ||
                !specialistName.trim() ||
                typeof hospitalName !== "string" ||
                !hospitalName.trim() ||
                typeof scheduledAt !== "string" ||
                Number.isNaN(new Date(scheduledAt).getTime())
            ) {
                res.status(400).json({
                    success: false,
                    message:
                        "Valid patientId, specialistName, hospitalName, and scheduledAt are required."
                });
                return;
            }

            const accessFilter = await getPatientAccessFilter(req.user);
            const patient = await Patient.findOne({
                $and: [
                    accessFilter,
                    {
                        _id: new mongoose.Types.ObjectId(patientId),
                        registrationStatus: "ACTIVE"
                    }
                ]
            }).select("_id");

            if (!patient) {
                res.status(404).json({
                    success: false,
                    message: "Patient not found or access denied."
                });
                return;
            }

            const resolvedMode: AppointmentMode = APPOINTMENT_MODES.includes(
                mode as AppointmentMode
            )
                ? (mode as AppointmentMode)
                : "TELEMEDICINE";

            const roomCode =
                resolvedMode === "TELEMEDICINE"
                    ? `TELE-ASR-${randomUUID().slice(0, 6).toUpperCase()}`
                    : undefined;

            const appointment = await Appointment.create({
                patient: patient._id,
                ...(typeof referralId === "string" &&
                mongoose.isValidObjectId(referralId)
                    ? { referral: new mongoose.Types.ObjectId(referralId) }
                    : {}),
                scheduledBy: new mongoose.Types.ObjectId(req.user.id),
                ...(typeof specialistId === "string" &&
                mongoose.isValidObjectId(specialistId)
                    ? { specialist: new mongoose.Types.ObjectId(specialistId) }
                    : {}),
                specialistName: specialistName.trim(),
                hospitalName: hospitalName.trim(),
                mode: resolvedMode,
                scheduledAt: new Date(scheduledAt),
                status: "SCHEDULED",
                telemedicineRoomCode: roomCode,
                lowBandwidthAudioOnly: Boolean(lowBandwidthAudioOnly),
                ...(typeof consultationNotes === "string" &&
                consultationNotes.trim()
                    ? { consultationNotes: consultationNotes.trim() }
                    : {})
            });

            await recordAudit({
                actorId: req.user.id,
                actorRole: req.user.role,
                patientId: patient._id.toString(),
                action: "REFERRAL_STATUS_UPDATED",
                outcome: "SUCCESS",
                resourceType: "Appointment",
                resourceId: appointment.id,
                purpose: `Scheduled ${resolvedMode} consultation appointment.`,
                ipAddress: req.ip,
                userAgent: req.get("user-agent")
            });

            res.status(201).json({
                success: true,
                message: "Appointment scheduled successfully.",
                data: appointment
            });
        } catch (error) {
            next(error);
        }
    }
);

router.patch(
    "/:appointmentId",
    authenticate,
    authorizeRoles("ASHA_WORKER", "MEDICAL_OFFICER", "SPECIALIST"),
    async (
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: "Authentication required."
                });
                return;
            }

            const appointmentId = String(req.params.appointmentId ?? "");
            if (!mongoose.isValidObjectId(appointmentId)) {
                res.status(400).json({
                    success: false,
                    message: "Invalid appointment ID."
                });
                return;
            }

            const appointment = await Appointment.findById(appointmentId);
            if (!appointment) {
                res.status(404).json({
                    success: false,
                    message: "Appointment not found."
                });
                return;
            }

            const accessFilter = await getPatientAccessFilter(req.user);
            const patient = await Patient.findOne({
                $and: [
                    accessFilter,
                    {
                        _id: appointment.patient,
                        registrationStatus: "ACTIVE"
                    }
                ]
            }).select("_id");

            if (!patient) {
                res.status(404).json({
                    success: false,
                    message: "Patient not found or access denied."
                });
                return;
            }

            const {
                status,
                lowBandwidthAudioOnly,
                consultationNotes,
                clinicalRecommendations
            } = req.body ?? {};

            if (
                typeof status === "string" &&
                APPOINTMENT_STATUSES.includes(status as AppointmentStatus)
            ) {
                appointment.status = status as AppointmentStatus;
            }
            if (typeof lowBandwidthAudioOnly === "boolean") {
                appointment.lowBandwidthAudioOnly = lowBandwidthAudioOnly;
            }
            if (typeof consultationNotes === "string") {
                appointment.consultationNotes = consultationNotes.trim();
            }
            if (typeof clinicalRecommendations === "string") {
                appointment.clinicalRecommendations =
                    clinicalRecommendations.trim();
            }

            await appointment.save();

            res.status(200).json({
                success: true,
                message: "Appointment updated successfully.",
                data: appointment
            });
        } catch (error) {
            next(error);
        }
    }
);

export default router;
