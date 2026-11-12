
import mongoose from "mongoose";
import { createHash } from "crypto";
import Patient from "../models/Patient";
import Consent from "../models/Consent";
import User from "../models/User";
import { withWorkflowLock } from "./workflow-lock.service";

export interface RegisterPatientInput {
    fullName: string;
    dateOfBirth?: Date;
    age?: number;
    sex?: "MALE" | "FEMALE" | "OTHER" | "NOT_RECORDED";
    phone?: string;
    alternateContact?: string;

    address: {
        village: string;
        habitation?: string;
        gramPanchayat?: string;
        mandal: string;
        phcId: string;
    };

    exposureHistory?: {
        tobaccoUse?: "NEVER" | "CURRENT" | "FORMER" | "NOT_RECORDED";
        tobaccoTypes?: string[];
        tobaccoDurationYears?: number;
        alcoholUse?: "YES" | "NO" | "NOT_RECORDED";
        otherExposures?: string[];
    };

    symptoms?: {
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

    consent: {
        purpose: "PATIENT_REGISTRATION";
        granted: true;
        consentVersion: string;
        language: "TELUGU" | "ENGLISH" | "HINDI";
    };
}

interface DuplicateCandidate {
    patientId: string;
    fullName: string;
    village: string;
    mandal: string;
    matchReason: string;
}

interface RegisteredPatient {
    id: string;
    patientId: string;
    maaUidn?: string;
    fullName: string;
    registrationStatus: string;
}

export type RegisterPatientResult =
    | {
        success: true;
        patient: RegisteredPatient;
    }
    | {
        success: false;
        reason: "POSSIBLE_DUPLICATE";
        possibleDuplicates: DuplicateCandidate[];
    };

export class PatientRegistrationConsentError extends Error {
    readonly statusCode = 503;

    constructor(
        readonly patientId: string,
        cause: unknown
    ) {
        super(
            "Patient registration could not be completed. Staff review is required before retrying.",
            { cause }
        );
        this.name = "PatientRegistrationConsentError";
    }
}

export const registerPatient = async (
    input: RegisterPatientInput,
    createdBy: string,
    actorRole?: string
): Promise<RegisterPatientResult> => {
    const normalizedIdentity = JSON.stringify({
        fullName: input.fullName.trim().normalize("NFKC").toLocaleLowerCase(),
        dateOfBirth: input.dateOfBirth?.toISOString().slice(0, 10),
        age: input.dateOfBirth ? undefined : input.age,
        village: input.address.village.trim().normalize("NFKC").toLocaleLowerCase(),
        mandal: input.address.mandal
    });
    const lockKey = `patient-registration:${createHash("sha256")
        .update(normalizedIdentity)
        .digest("hex")}`;

    return withWorkflowLock(lockKey, () =>
        registerPatientWithLock(input, createdBy, actorRole)
    );
};

const registerPatientWithLock = async (
    input: RegisterPatientInput,
    createdBy: string,
    actorRole?: string
): Promise<RegisterPatientResult> => {
    if (!mongoose.isValidObjectId(createdBy)) {
        throw new Error("Invalid registering user.");
    }

    if (
        input.consent.purpose !== "PATIENT_REGISTRATION" ||
        input.consent.granted !== true
    ) {
        throw new Error(
            "Valid patient registration consent is required."
        );
    }

    const now = new Date();
    const dateOfBirth = input.dateOfBirth;
    let derivedAge = input.age;
    if (dateOfBirth) {
        derivedAge = now.getUTCFullYear() - dateOfBirth.getUTCFullYear();
        if (
            now.getUTCMonth() < dateOfBirth.getUTCMonth() ||
            (now.getUTCMonth() === dateOfBirth.getUTCMonth() &&
                now.getUTCDate() < dateOfBirth.getUTCDate())
        ) {
            derivedAge -= 1;
        }
    }

    const duplicateConditions: Record<string, unknown>[] = [];
    if (dateOfBirth) {
        duplicateConditions.push({
            fullName: {
                $regex: `^${input.fullName.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
                $options: "i"
            },
            dateOfBirth,
            "address.village": input.address.village.trim(),
            "address.mandal": input.address.mandal
        });
    } else if (derivedAge !== undefined) {
        duplicateConditions.push({
            fullName: {
                $regex: `^${input.fullName.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
                $options: "i"
            },
            age: derivedAge,
            "address.village": input.address.village.trim(),
            "address.mandal": input.address.mandal
        });
    }

    const runRegistration = async (
        session?: mongoose.ClientSession
    ): Promise<RegisterPatientResult> => {
        let duplicateQuery = Patient.find({
            $or: duplicateConditions,
            registrationStatus: "ACTIVE"
        }).select("patientId fullName address");
        if (session) {
            duplicateQuery = duplicateQuery.session(session);
        }

        const possibleMatches = duplicateConditions.length > 0
            ? await duplicateQuery.limit(5).lean()
            : [];
        if (possibleMatches.length > 0) {
            return {
                success: false,
                reason: "POSSIBLE_DUPLICATE",
                possibleDuplicates: possibleMatches.map((match) => ({
                    patientId: match.patientId,
                    fullName: match.fullName,
                    village: match.address.village,
                    mandal: match.address.mandal,
                    matchReason: dateOfBirth
                        ? "NAME_DATE_OF_BIRTH_AND_VILLAGE_MATCH"
                        : "NAME_AGE_AND_VILLAGE_MATCH"
                }))
            };
        }

        const { consent, ...patientData } = input;
        const patientValues = {
            ...patientData,
            age: derivedAge,
            phone: input.phone?.trim() || undefined,
            alternateContact: input.alternateContact?.trim() || undefined,
            address: {
                ...patientData.address,
                district: "Alluri Sitharama Raju"
            },
            ...(actorRole === "ASHA_WORKER"
                ? { assignedASHAWorker: new mongoose.Types.ObjectId(createdBy) }
                : {}),
            createdBy: new mongoose.Types.ObjectId(createdBy)
        };
        const patient = session
            ? (await Patient.create([patientValues], { session }))[0]
            : await Patient.create(patientValues);
        const consentValues = {
            patient: patient._id,
            purpose: consent.purpose,
            granted: consent.granted,
            consentVersion: consent.consentVersion,
            language: consent.language,
            recordedBy: new mongoose.Types.ObjectId(createdBy)
        };
        if (session) {
            await Consent.create([consentValues], { session });
        } else {
            try {
                await Consent.create(consentValues);
            } catch (error) {
                throw new PatientRegistrationConsentError(
                    patient._id.toString(),
                    error
                );
            }
        }

        return {
            success: true,
            patient: {
                id: patient.id,
                patientId: patient.patientId,
                maaUidn: patient.maaUidn,
                fullName: patient.fullName,
                registrationStatus: patient.registrationStatus
            }
        };
    };

    const database = mongoose.connection.db;
    if (!database) {
        throw new Error("MongoDB is not connected.");
    }

    const hello = await database.admin().command({ hello: 1 });
    const supportsTransactions =
        typeof hello.setName === "string" || hello.msg === "isdbgrid";

    if (supportsTransactions) {
        const session = await mongoose.startSession();
        try {
            let result: RegisterPatientResult | undefined;
            await session.withTransaction(async () => {
                result = await runRegistration(session);
            });
            if (!result) {
                throw new Error("Patient registration could not be completed.");
            }
            return result;
        } finally {
            await session.endSession();
        }
    }

    return runRegistration();
};

export const listPatients = async (
    filter: Record<string, unknown>,
    page = 1,
    limit = 20
) => {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));

    const [patients, total] = await Promise.all([
        Patient.find(filter)
            .select(
                "patientId fullName age sex address.village address.mandal address.phcId assignedASHAWorker registrationStatus createdAt"
            )
            .populate("assignedASHAWorker", "fullName")
            .sort({ createdAt: -1 })
            .skip((safePage - 1) * safeLimit)
            .limit(safeLimit)
            .lean(),

        Patient.countDocuments(filter)
    ]);

    return {
        patients,
        pagination: {
            total,
            page: safePage,
            limit: safeLimit,
            totalPages: Math.ceil(total / safeLimit)
        }
    };
};

export const getPatientById = async (
    id: string,
    filter: Record<string, unknown> = {}
) => {
    if (!mongoose.isValidObjectId(id)) {
        return null;
    }

    return Patient.findOne({
        $and: [
            { _id: new mongoose.Types.ObjectId(id) },
            { registrationStatus: "ACTIVE" },
            filter
        ]
    })
        .select("-__v")
        .lean();
};

export interface PatientAssignmentActor {
    id: string;
    role: string;
    assignedPHCId?: string;
    mandal?: string;
    district?: string;
}

const assignmentError = (message: string, statusCode: number) =>
    Object.assign(new Error(message), { statusCode });

export const assignPatientToASHA = async (
    patientId: string,
    ashaWorkerId: string,
    actor: PatientAssignmentActor
) => {
    if (actor.role !== "MEDICAL_OFFICER") {
        throw assignmentError(
            "Only Medical Officers can assign ASHA Workers.",
            403
        );
    }
    if (
        !mongoose.isValidObjectId(patientId) ||
        !mongoose.isValidObjectId(ashaWorkerId)
    ) {
        throw assignmentError("Invalid patient or ASHA Worker ID.", 400);
    }
    if (!actor.assignedPHCId || !actor.mandal) {
        throw assignmentError(
            "Your account must have an assigned PHC and mandal.",
            403
        );
    }

    const district = actor.district || "Alluri Sitharama Raju";
    const patient = await Patient.findOne({
        _id: new mongoose.Types.ObjectId(patientId),
        registrationStatus: "ACTIVE",
        "address.phcId": actor.assignedPHCId,
        "address.mandal": actor.mandal,
        "address.district": district
    });
    if (!patient) {
        throw assignmentError(
            "Patient not found within your assigned PHC, mandal, and district.",
            404
        );
    }

    const ashaWorker = await User.findOne({
        _id: new mongoose.Types.ObjectId(ashaWorkerId),
        role: "ASHA_WORKER",
        isActive: true,
        assignedPHCId: patient.address.phcId,
        mandal: patient.address.mandal,
        district: patient.address.district
    }).select("_id fullName assignedPHCId mandal district");
    if (!ashaWorker) {
        throw assignmentError(
            "No active ASHA Worker in the patient's PHC, mandal, and district was found.",
            404
        );
    }

    const previousASHAWorker = patient.assignedASHAWorker?.toString();
    patient.assignedASHAWorker = ashaWorker._id;
    await patient.save();

    return { patient, ashaWorker, previousASHAWorker };
};

export const listASHAWorkersForMedicalOfficer = async (
    actor: PatientAssignmentActor
) => {
    if (
        actor.role !== "MEDICAL_OFFICER" ||
        !actor.assignedPHCId ||
        !actor.mandal
    ) {
        throw assignmentError(
            "Only Medical Officers with an assigned PHC and mandal can list ASHA Workers.",
            403
        );
    }

    return User.find({
        role: "ASHA_WORKER",
        isActive: true,
        assignedPHCId: actor.assignedPHCId,
        mandal: actor.mandal,
        district: actor.district || "Alluri Sitharama Raju"
    })
        .select("_id fullName assignedPHCId mandal district")
        .sort({ fullName: 1 })
        .lean();
};
