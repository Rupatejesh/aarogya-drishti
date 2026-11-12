import mongoose from "mongoose";
import Consent from "../models/Consent";
import Patient from "../models/Patient";
import {
    patientOralConsentLockKey,
    withWorkflowLock
} from "./workflow-lock.service";

type PatientFilter = Record<string, unknown>;

interface ConsentActor {
    id: string;
    role: string;
}

interface OralScreeningConsentInput {
    purpose?:
        | "ORAL_SCREENING"
        | "IMAGE_CAPTURE"
        | "IMAGE_CAPTURE_AND_STORAGE"
        | "AI_ASSISTED_DEMONSTRATION";
    consentVersion: string;
    language: "TELUGU" | "ENGLISH" | "HINDI";
    notes?: string;
}

const serviceError = (message: string, statusCode: number) =>
    Object.assign(new Error(message), { statusCode });

const findAccessiblePatient = async (
    patientId: string,
    accessFilter: PatientFilter
) => {
    if (!mongoose.isValidObjectId(patientId)) {
        throw serviceError("Invalid patient ID.", 400);
    }

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
        throw serviceError("Patient not found or access denied.", 404);
    }
    return patient;
};

export const getPatientConsents = async (
    patientId: string,
    accessFilter: PatientFilter
) => {
    const patient = await findAccessiblePatient(patientId, accessFilter);
    return Consent.find({ patient: patient._id })
        .sort({ recordedAt: -1, _id: -1 })
        .lean();
};

export const recordOralScreeningConsent = async (
    patientId: string,
    input: OralScreeningConsentInput,
    accessFilter: PatientFilter,
    actor: ConsentActor
) => {
    if (!["ASHA_WORKER", "MEDICAL_OFFICER"].includes(actor.role)) {
        throw serviceError(
            "Only assigned care-team members can record screening consent.",
            403
        );
    }
    if (!mongoose.isValidObjectId(actor.id)) {
        throw serviceError("Invalid consent recorder.", 400);
    }
    if (!mongoose.isValidObjectId(patientId)) {
        throw serviceError("Invalid patient ID.", 400);
    }

    return withWorkflowLock(patientOralConsentLockKey(patientId), async () => {
        const patient = await findAccessiblePatient(patientId, accessFilter);
        const targetPurpose = input.purpose ?? "ORAL_SCREENING";
        const latestConsent = await Consent.findOne({
            patient: patient._id,
            purpose: targetPurpose
        }).sort({ recordedAt: -1, _id: -1 });

        if (latestConsent?.granted && !latestConsent.withdrawnAt) {
            throw serviceError(
                "Current oral-screening consent is already recorded.",
                409
            );
        }

        return Consent.create({
            patient: patient._id,
            purpose: targetPurpose,
            granted: true,
            consentVersion: input.consentVersion,
            language: input.language,
            notes: input.notes,
            recordedBy: new mongoose.Types.ObjectId(actor.id),
            recordedAt: new Date()
        });
    });
};

export const withdrawOralScreeningConsent = async (
    patientId: string,
    reason: string | undefined,
    accessFilter: PatientFilter,
    actor: ConsentActor
) => {
    if (!["PATIENT", "ASHA_WORKER", "MEDICAL_OFFICER"].includes(actor.role)) {
        throw serviceError(
            "Your role is not authorized to record consent withdrawal.",
            403
        );
    }
    if (!mongoose.isValidObjectId(actor.id)) {
        throw serviceError("Invalid consent recorder.", 400);
    }
    if (!mongoose.isValidObjectId(patientId)) {
        throw serviceError("Invalid patient ID.", 400);
    }

    return withWorkflowLock(patientOralConsentLockKey(patientId), async () => {
        const patient = await findAccessiblePatient(patientId, accessFilter);
        const latestConsent = await Consent.findOne({
            patient: patient._id,
            purpose: "ORAL_SCREENING"
        }).sort({ recordedAt: -1, _id: -1 });

        if (!latestConsent?.granted || latestConsent.withdrawnAt) {
            throw serviceError(
                "There is no active oral-screening consent to withdraw.",
                409
            );
        }

        const withdrawnAt = new Date();
        return Consent.create({
            patient: patient._id,
            purpose: "ORAL_SCREENING",
            granted: false,
            consentVersion: latestConsent.consentVersion,
            language: latestConsent.language,
            recordedBy: new mongoose.Types.ObjectId(actor.id),
            recordedAt: withdrawnAt,
            withdrawnAt,
            withdrawalReason: reason,
            notes: reason
        });
    });
};

export const hasCurrentOralScreeningConsent = async (
    patientId: mongoose.Types.ObjectId
): Promise<boolean> => {
    const latestConsent = await Consent.findOne({
        patient: patientId,
        purpose: "ORAL_SCREENING"
    }).sort({ recordedAt: -1, _id: -1 }).select("granted withdrawnAt");

    return Boolean(
        latestConsent?.granted && !latestConsent.withdrawnAt
    );
};

export const hasCurrentImageCaptureConsent = async (
    patientId: mongoose.Types.ObjectId
): Promise<boolean> => {
    const latestConsent = await Consent.findOne({
        patient: patientId,
        purpose: { $in: ["IMAGE_CAPTURE", "IMAGE_CAPTURE_AND_STORAGE"] }
    }).sort({ recordedAt: -1, _id: -1 }).select("granted withdrawnAt");

    return Boolean(
        latestConsent?.granted && !latestConsent.withdrawnAt
    );
};
