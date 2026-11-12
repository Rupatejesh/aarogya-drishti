
import { Response, NextFunction } from "express";
import mongoose from "mongoose";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { registerPatientSchema } from "../validators/patient.validator";
import {
    assignASHAWorkerSchema,
    createOwnershipClaimSchema,
    linkPatientAccountSchema
} from "../validators/patient-account.validator";
import {
    registerPatient,
    PatientRegistrationConsentError,
    listPatients,
    getPatientById,
    assignPatientToASHA
} from "../services/patient.service";
import {
    getPatientAccessFilter,
} from "../services/patient-access.service";
import { recordAudit } from "../services/audit.service";
import Patient from "../models/Patient";
import {
    claimPatientAccount,
    issueOwnershipClaim
} from "../services/ownership-claim.service";

const auditRequestDetails = (req: AuthenticatedRequest) => ({
    ipAddress: req.ip,
    userAgent: req.get("user-agent")
});

export const createPatient = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const validation = registerPatientSchema.safeParse(req.body);

        if (!validation.success) {
            res.status(400).json({
                success: false,
                message: "Patient registration validation failed.",
                errors: validation.error.issues.map((issue) => ({
                    field: issue.path.join("."),
                    message: issue.message
                }))
            });
            return;
        }

        if (!req.user) {
            res.status(401).json({
                success: false,
                message: "Authentication required."
            });
            return;
        }

        if (!["ASHA_WORKER", "MEDICAL_OFFICER", "SPECIALIST", "ADMIN"].includes(req.user.role)) {
            res.status(403).json({
                success: false,
                message: "Your role is not authorized to register patients."
            });
            return;
        }

        // Preserve user-selected PHC/mandal or auto-populate from clinician jurisdiction without 403 blocks
        const assignedPhc = validation.data.address.phcId || req.user.assignedPHCId || "PHC-GMADUGULA-01";
        const assignedMandal = (validation.data.address.mandal || req.user.mandal || "G. Madugula") as typeof validation.data.address.mandal;
        validation.data.address.phcId = assignedPhc;
        validation.data.address.mandal = assignedMandal;

        const result = await registerPatient(
            validation.data,
            req.user.id,
            req.user.role
        );

        if (!result.success) {
            res.status(409).json({
                success: false,
                message: "Possible duplicate patient records found. Please review before proceeding.",
                data: {
                    reason: result.reason,
                    possibleDuplicates: result.possibleDuplicates
                }
            });
            return;
        }

        await recordAudit({
            actorId: req.user.id,
            actorRole: req.user.role,
            patientId: result.patient.id,
            action: "PATIENT_REGISTERED",
            outcome: "SUCCESS",
            resourceType: "Patient",
            resourceId: result.patient.id,
            purpose: "Patient and registration consent were created.",
            ...auditRequestDetails(req)
        });

        res.status(201).json({
            success: true,
            message: "Patient registered successfully.",
            data: result.patient
        });
    } catch (error) {
        if (error instanceof PatientRegistrationConsentError && req.user) {
            try {
                await recordAudit({
                    actorId: req.user.id,
                    actorRole: req.user.role,
                    patientId: error.patientId,
                    action: "PATIENT_REGISTRATION_CONSENT_FAILED",
                    outcome: "FAILURE",
                    resourceType: "Patient",
                    resourceId: error.patientId,
                    purpose: "Patient record was created but registration consent persistence failed.",
                    ...auditRequestDetails(req)
                });
            } catch (auditError) {
                next(new AggregateError(
                    [error, auditError],
                    "Patient registration is incomplete and its failure audit could not be recorded."
                ));
                return;
            }
        }
        next(error);
    }
};

export const getMyPatientRecord = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.user || req.user.role !== "PATIENT") {
            res.status(403).json({
                success: false,
                message: "This endpoint is available to patient accounts only."
            });
            return;
        }

        const patient = await Patient.findOne({
            user: new mongoose.Types.ObjectId(req.user.id),
            registrationStatus: "ACTIVE"
        }).select("-__v").lean();

        if (!patient) {
            res.status(404).json({
                success: false,
                message: "No patient record is linked to this account."
            });
            return;
        }

        await recordAudit({
            actorId: req.user.id,
            actorRole: req.user.role,
            patientId: patient._id.toString(),
            action: "PATIENT_RECORD_VIEWED",
            purpose: "Patient viewing their own linked record.",
            ...auditRequestDetails(req)
        });

        res.status(200).json({
            success: true,
            message: "Your patient record was retrieved successfully.",
            data: patient
        });
    } catch (error) {
        next(error);
    }
};

export const getPatient = async (
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

        const patientId = Array.isArray(req.params.id)
            ? req.params.id[0]
            : req.params.id;

        if (!patientId) {
            res.status(400).json({
                success: false,
                message: "Patient ID is required."
            });
            return;
        }

        const accessFilter = await getPatientAccessFilter(req.user);

        const patient = await getPatientById(patientId, accessFilter);

        if (!patient) {
            res.status(404).json({
                success: false,
                message: "Patient not found or access is not authorized."
            });
            return;
        }

        await recordAudit({
            actorId: req.user.id,
            actorRole: req.user.role,
            patientId: patient._id.toString(),
            action: "PATIENT_RECORD_VIEWED",
            purpose: req.user.role === "PATIENT"
                ? "Patient viewing their own record."
                : "Authorized care-team patient record access.",
            ...auditRequestDetails(req)
        });

        res.status(200).json({
            success: true,
            message: "Patient record retrieved successfully.",
            data: patient
        });
    } catch (error) {
        next(error);
    }
};

export const getPatients = async (
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

        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 20;

        if (
            !Number.isInteger(page) ||
            !Number.isInteger(limit) ||
            page < 1 ||
            limit < 1 ||
            limit > 100
        ) {
            res.status(400).json({
                success: false,
                message: "Invalid pagination."
            });
            return;
        }

        if (req.user.role === "PATIENT") {
            res.status(403).json({
                success: false,
                message: "Patient accounts can access their own record through /me."
            });
            return;
        }

        const accessFilter = await getPatientAccessFilter(req.user);

        const filter = {
            ...accessFilter,
            registrationStatus: "ACTIVE"
        };

        const result = await listPatients(filter, page, limit);

        await recordAudit({
            actorId: req.user.id,
            actorRole: req.user.role,
            action: "PATIENT_LIST_VIEWED",
            purpose: "Authorized care-team patient list access.",
            ...auditRequestDetails(req)
        });

        res.status(200).json({
            success: true,
            message: "Patients retrieved successfully.",
            data: result
        });
    } catch (error) {
        next(error);
    }
};

export const linkPatientAccount = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.user || req.user.role !== "PATIENT") {
            res.status(403).json({
                success: false,
                message: "Only a patient account can claim a verified patient record."
            });
            return;
        }

        const validation = linkPatientAccountSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({
                success: false,
                message: "Invalid patient ownership claim.",
                errors: validation.error.flatten()
            });
            return;
        }

        const patient = await claimPatientAccount(
            validation.data.claimCode,
            req.user.id,
            String(req.params.id)
        );
        await recordAudit({
            actorId: req.user.id,
            actorRole: req.user.role,
            patientId: patient._id.toString(),
            action: "PATIENT_ACCOUNT_LINKED",
            outcome: "SUCCESS",
            resourceType: "Patient",
            resourceId: patient._id.toString(),
            purpose: "Patient account linked using a verified single-use claim code.",
            ...auditRequestDetails(req)
        });

        res.status(200).json({
            success: true,
            message: "Patient record linked to your account.",
            data: {
                patientId: patient.patientId
            }
        });
    } catch (error) {
        next(error);
    }
};

export const createPatientOwnershipClaim = async (
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

        const validation = createOwnershipClaimSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({
                success: false,
                message: "Invalid ownership-verification details.",
                errors: validation.error.flatten()
            });
            return;
        }

        const patientId = String(req.params.id ?? "");
        const accessFilter = await getPatientAccessFilter(req.user);
        const issued = await issueOwnershipClaim(
            patientId,
            req.user.id,
            req.user.role,
            accessFilter
        );
        await recordAudit({
            actorId: req.user.id,
            actorRole: req.user.role,
            patientId,
            action: "PATIENT_OWNERSHIP_VERIFIED",
            outcome: "SUCCESS",
            resourceType: "PatientOwnershipClaim",
            purpose: "Medical Officer completed in-person identity verification and issued a one-time claim code.",
            ...auditRequestDetails(req)
        });

        res.status(201).json({
            success: true,
            message: "In-person ownership verification recorded. Hand this code directly to the patient; it is shown only once.",
            data: issued
        });
    } catch (error) {
        next(error);
    }
};

export const assignASHAWorker = async (
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

        if (
            req.user.role !== "MEDICAL_OFFICER"
        ) {
            res.status(403).json({
                success: false,
                message: "Only Medical Officers can assign ASHA Workers."
            });
            return;
        }

        const validation = assignASHAWorkerSchema.safeParse(req.body);

        if (!validation.success) {
            res.status(400).json({
                success: false,
                message: "Invalid ASHA Worker assignment details.",
                errors: validation.error.issues.map((issue) => ({
                    field: issue.path.join("."),
                    message: issue.message
                }))
            });
            return;
        }

        const patientId = Array.isArray(req.params.id)
            ? req.params.id[0]
            : req.params.id;

        if (!patientId || !mongoose.isValidObjectId(patientId)) {
            res.status(400).json({
                success: false,
                message: "Invalid patient record ID."
            });
            return;
        }

        const { patient, ashaWorker, previousASHAWorker } =
            await assignPatientToASHA(
                patientId,
                validation.data.ashaWorkerId,
                req.user
            );

        await recordAudit({
            actorId: req.user.id,
            actorRole: req.user.role,
            patientId: patient._id.toString(),
            action: "ASHA_WORKER_ASSIGNED",
            outcome: "SUCCESS",
            resourceType: "PatientAssignment",
            resourceId: patient._id.toString(),
            purpose: `ASHA assignment changed from ${previousASHAWorker ?? "unassigned"} to ${ashaWorker._id.toString()}.`,
            ...auditRequestDetails(req)
        });

        res.status(200).json({
            success: true,
            message: "ASHA Worker assigned successfully.",
            data: {
                patientId: patient.patientId,
                ashaWorker: {
                    id: ashaWorker.id,
                    fullName: ashaWorker.fullName,
                    assignedPHCId: ashaWorker.assignedPHCId,
                    mandal: ashaWorker.mandal
                }
            }
        });
    } catch (error) {
        next(error);
    }
};
