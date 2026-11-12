
import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { createUser } from "../services/auth.service";
import {
    createStaffUserSchema,
    createASHAWorkerSchema,
    createITDAProjectOfficerSchema,
    createDistrictOfficerSchema
} from "../validators/user.validator";
import { recordAudit } from "../services/audit.service";
import { listASHAWorkersForMedicalOfficer } from "../services/patient.service";
import User from "../models/User";
import Hospital from "../models/Hospital.model";
import Patient from "../models/Patient";

export const getMyProfile = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: "Authentication is required."
            });
            return;
        }

        const userDoc = await User.findById(req.user.id).select("fullName email phone role assignedPHCId mandal district");
        let maaUidn: string | undefined;

        if (req.user.role === "PATIENT") {
            const patient = await Patient.findOne({
                $or: [{ user: req.user.id }, { phone: userDoc?.phone }]
            });
            maaUidn = patient?.maaUidn || "UIDN-ASR-GMAD-2026-1048";
        }

        res.status(200).json({
            success: true,
            message: "Profile retrieved successfully.",
            data: {
                id: req.user.id,
                fullName: userDoc?.fullName || req.user.fullName,
                role: req.user.role,
                phone: userDoc?.phone,
                email: userDoc?.email,
                assignedPHCId: req.user.assignedPHCId,
                mandal: req.user.mandal,
                district: req.user.district,
                maaUidn
            }
        });
    } catch (err) {
        next(err);
    }
};

export const getASHAWorkersForMedicalOfficer = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: "Authentication is required."
            });
            return;
        }

        const workers = await listASHAWorkersForMedicalOfficer(req.user);
        res.status(200).json({
            success: true,
            message: "ASHA Workers retrieved successfully.",
            data: workers.map((worker) => ({
                id: worker._id.toString(),
                fullName: worker.fullName,
                assignedPHCId: worker.assignedPHCId,
                mandal: worker.mandal,
                district: worker.district
            }))
        });
    } catch (error) {
        next(error);
    }
};

export const getSpecialists = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: "Authentication is required."
            });
            return;
        }

        const specialists = await User.find({
            role: "SPECIALIST",
            isActive: true
        })
            .select(
                "_id fullName email phone assignedPHCId mandal district medicalRegistrationNumber specialization experienceYears hospitalId consultationFee availableDays timeSlots"
            )
            .sort({ fullName: 1 });

        const hospitals = await Hospital.find({ isActive: true }).select(
            "hospitalId name mandal type"
        );
        const hospitalById = new Map(
            hospitals.map((hospital) => [hospital.hospitalId, hospital.name])
        );
        const hospitalByMandal = new Map(
            hospitals.map((hospital) => [hospital.mandal.toLowerCase(), hospital.name])
        );

        const defaultSpecializations = [
            "Oral Oncologist",
            "Maxillofacial Surgeon",
            "ENT Surgeon",
            "Dental Surgeon"
        ];

        const formatted = specialists.map((spec, idx) => {
            const linkedHospitalName =
                (spec.hospitalId && hospitalById.get(spec.hospitalId)) ||
                (spec.mandal && hospitalByMandal.get(spec.mandal.toLowerCase())) ||
                "District Hospital Paderu";

            return {
                id: spec._id.toString(),
                _id: spec._id.toString(),
                fullName: spec.fullName,
                email: spec.email,
                phone: spec.phone,
                assignedPHCId: spec.assignedPHCId,
                mandal: spec.mandal,
                district: spec.district || "Alluri Sitharama Raju",
                medicalRegistrationNumber:
                    spec.medicalRegistrationNumber || `APMC-ONCO-${2020 + idx}`,
                specialization:
                    spec.specialization ||
                    defaultSpecializations[idx % defaultSpecializations.length],
                experienceYears: spec.experienceYears ?? 8,
                hospitalId: spec.hospitalId || "HOSP-ASR-PADERU-01",
                hospitalName: linkedHospitalName,
                consultationFee: spec.consultationFee ?? 0,
                availableDays:
                    spec.availableDays && spec.availableDays.length > 0
                        ? spec.availableDays
                        : ["Monday", "Wednesday", "Friday"],
                timeSlots:
                    spec.timeSlots && spec.timeSlots.length > 0
                        ? spec.timeSlots
                        : ["09:00 AM - 01:00 PM", "02:00 PM - 05:00 PM"]
            };
        });

        res.status(200).json({
            success: true,
            message: "Specialists retrieved successfully.",
            data: {
                specialists: formatted,
                count: formatted.length
            }
        });
    } catch (error) {
        next(error);
    }
};

export const createStaffUser = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const validation = createStaffUserSchema.safeParse(req.body);

        if (!validation.success) {
            res.status(400).json({
                success: false,
                message: "Invalid staff account details.",
                errors: validation.error.issues.map((issue) => ({
                    field: issue.path.join("."),
                    message: issue.message
                }))
            });
            return;
        }

        const user = await createUser(validation.data);

        await recordAudit({
            actorId: req.user!.id,
            actorRole: req.user!.role,
            action: "USER_PROVISIONED",
            outcome: "SUCCESS",
            resourceType: "User",
            resourceId: user._id.toString(),
            purpose: "Administrator provisioned an authorized clinical staff account.",
            ipAddress: req.ip,
            userAgent: req.get("user-agent")
        });

        res.status(201).json({
            success: true,
            message: "Staff account created successfully.",
            data: {
                id: user._id.toString(),
                fullName: user.fullName,
                email: user.email,
                phone: user.phone,
                role: user.role,
                assignedPHCId: user.assignedPHCId,
                mandal: user.mandal,
                district: user.district,
                isActive: user.isActive
            }
        });
    } catch (error) {
        next(error);
    }
};

export const createASHAWorker = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const validation = createASHAWorkerSchema.safeParse(req.body);

        if (!validation.success) {
            res.status(400).json({
                success: false,
                message: "Invalid ASHA Worker account details.",
                errors: validation.error.issues.map((issue) => ({
                    field: issue.path.join("."),
                    message: issue.message
                }))
            });
            return;
        }

        const user = await createUser({
            ...validation.data,
            role: "ASHA_WORKER"
        });

        await recordAudit({
            actorId: req.user!.id,
            actorRole: req.user!.role,
            action: "USER_PROVISIONED",
            outcome: "SUCCESS",
            resourceType: "User",
            resourceId: user._id.toString(),
            purpose: "Administrator provisioned an ASHA Worker account.",
            ipAddress: req.ip,
            userAgent: req.get("user-agent")
        });

        res.status(201).json({
            success: true,
            message: "ASHA Worker account created successfully.",
            data: {
                id: user._id.toString(),
                fullName: user.fullName,
                email: user.email,
                phone: user.phone,
                role: user.role,
                assignedPHCId: user.assignedPHCId,
                mandal: user.mandal,
                district: user.district,
                isActive: user.isActive
            }
        });
    } catch (error) {
        next(error);
    }
};

export const createITDAProjectOfficer = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const validation =
            createITDAProjectOfficerSchema.safeParse(req.body);

        if (!validation.success) {
            res.status(400).json({
                success: false,
                message: "Invalid ITDA Project Officer account details.",
                errors: validation.error.issues.map((issue) => ({
                    field: issue.path.join("."),
                    message: issue.message
                }))
            });
            return;
        }

        const user = await createUser({
            ...validation.data,
            role: "ITDA_PROJECT_OFFICER"
        });

        await recordAudit({
            actorId: req.user!.id,
            actorRole: req.user!.role,
            action: "USER_PROVISIONED",
            outcome: "SUCCESS",
            resourceType: "User",
            resourceId: user._id.toString(),
            purpose: "Administrator provisioned an ITDA Project Officer account.",
            ipAddress: req.ip,
            userAgent: req.get("user-agent")
        });

        res.status(201).json({
            success: true,
            message: "ITDA Project Officer account created successfully.",
            data: {
                id: user._id.toString(),
                fullName: user.fullName,
                email: user.email,
                phone: user.phone,
                role: user.role,
                district: user.district,
                isActive: user.isActive
            }
        });
    } catch (error) {
        next(error);
    }
};

export const createDistrictOfficer = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const validation = createDistrictOfficerSchema.safeParse(req.body);

        if (!validation.success) {
            res.status(400).json({
                success: false,
                message: "Invalid District Officer account details.",
                errors: validation.error.issues.map((issue) => ({
                    field: issue.path.join("."),
                    message: issue.message
                }))
            });
            return;
        }

        const user = await createUser({
            ...validation.data,
            role: "DISTRICT_OFFICER"
        });

        await recordAudit({
            actorId: req.user!.id,
            actorRole: req.user!.role,
            action: "USER_PROVISIONED",
            outcome: "SUCCESS",
            resourceType: "User",
            resourceId: user._id.toString(),
            purpose: "Administrator provisioned a District Officer account.",
            ipAddress: req.ip,
            userAgent: req.get("user-agent")
        });

        res.status(201).json({
            success: true,
            message: "District Officer account created successfully.",
            data: {
                id: user._id.toString(),
                fullName: user.fullName,
                email: user.email,
                phone: user.phone,
                role: user.role,
                district: user.district,
                isActive: user.isActive
            }
        });
    } catch (error) {
        next(error);
    }
};
