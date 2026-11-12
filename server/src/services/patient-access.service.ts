
import mongoose from "mongoose";
import Patient from "../models/Patient";
import Referral from "../models/Referral";

export interface PatientAccessActor {
    id: string;
    role: string;
    assignedPHCId?: string;
    mandal?: string;
    district?: string;
}

const createAccessError = (message: string): Error & {
    statusCode: number;
} => {
    const error = new Error(message) as Error & {
        statusCode: number;
    };

    error.statusCode = 403;
    return error;
};

export const getPatientAccessFilter = async (
    actor: PatientAccessActor
): Promise<Record<string, unknown>> => {
    if (!mongoose.isValidObjectId(actor.id)) {
        throw createAccessError("Invalid user identity.");
    }

    switch (actor.role) {
        case "PATIENT":
            return {
                user: new mongoose.Types.ObjectId(actor.id)
            };

        case "ASHA_WORKER":
        case "MEDICAL_OFFICER":
        case "SPECIALIST":
        case "DRONE_OPERATOR":
            return {
                registrationStatus: "ACTIVE"
            };

        case "DISTRICT_OFFICER":
        case "ITDA_PROJECT_OFFICER":
        case "ADMIN":
            throw createAccessError(
                "This role cannot access identifiable patient records."
            );

        default:
            throw createAccessError(
                "This role is not authorized for patient records."
            );
    }
};

export const canAccessPatient = async (
    actor: PatientAccessActor,
    patientMongoId: string
): Promise<boolean> => {
    if (!mongoose.isValidObjectId(patientMongoId)) {
        return false;
    }

    const accessFilter = await getPatientAccessFilter(actor);

    const patient = await Patient.exists({
        ...accessFilter,
        _id: new mongoose.Types.ObjectId(patientMongoId),
        registrationStatus: "ACTIVE"
    });

    return Boolean(patient);
};
