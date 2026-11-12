import { createHash, randomBytes } from "crypto";
import mongoose from "mongoose";
import OwnershipClaim from "../models/OwnershipClaim";
import Patient from "../models/Patient";
import { withWorkflowLock } from "./workflow-lock.service";

const CLAIM_LIFETIME_MS = 10 * 60 * 1000;

const ownershipError = (message: string, statusCode: number) =>
    Object.assign(new Error(message), { statusCode });

const hashClaimCode = (code: string) =>
    createHash("sha256").update(code).digest("hex");

export const issueOwnershipClaim = async (
    patientId: string,
    actorId: string,
    role: string,
    accessFilter: Record<string, unknown>
) => {
    if (role !== "MEDICAL_OFFICER") {
        throw ownershipError(
            "Only a Medical Officer can record in-person ownership verification.",
            403
        );
    }
    if (!mongoose.isValidObjectId(patientId) || !mongoose.isValidObjectId(actorId)) {
        throw ownershipError("Invalid patient or Medical Officer ID.", 400);
    }

    return withWorkflowLock(`patient-ownership:${patientId}`, async () => {
        const patient = await Patient.findOne({
            $and: [
                accessFilter,
                {
                    _id: new mongoose.Types.ObjectId(patientId),
                    registrationStatus: "ACTIVE"
                }
            ]
        }).select("_id user");
        if (!patient) {
            throw ownershipError("Patient not found or access denied.", 404);
        }
        if (patient.user) {
            throw ownershipError(
                "This patient record is already linked to an account.",
                409
            );
        }

        const now = new Date();
        await OwnershipClaim.updateMany(
            {
                patient: patient._id,
                claimedAt: { $exists: false },
                revokedAt: { $exists: false }
            },
            { $set: { revokedAt: now } }
        );

        const claimCode = randomBytes(32).toString("base64url");
        const expiresAt = new Date(now.getTime() + CLAIM_LIFETIME_MS);
        await OwnershipClaim.create({
            patient: patient._id,
            codeHash: hashClaimCode(claimCode),
            verifiedBy: new mongoose.Types.ObjectId(actorId),
            verificationMethod: "IN_PERSON",
            verifiedAt: now,
            expiresAt
        });

        return { claimCode, expiresAt };
    });
};

export const claimPatientAccount = async (
    claimCode: string,
    patientUserId: string,
    expectedPatientId: string
) => {
    if (!mongoose.isValidObjectId(patientUserId)) {
        throw ownershipError("Invalid patient or patient account.", 400);
    }

    let resolvedPatientId = expectedPatientId.trim();
    if (!mongoose.isValidObjectId(resolvedPatientId)) {
        const patientByPublicId = await Patient.findOne({
            patientId: resolvedPatientId,
            registrationStatus: "ACTIVE"
        }).select("_id");
        if (!patientByPublicId) {
            throw ownershipError("Invalid patient or patient account.", 400);
        }
        resolvedPatientId = patientByPublicId._id.toString();
    }

    const codeHash = hashClaimCode(claimCode);
    const candidate = await OwnershipClaim.findOne({ codeHash }).select(
        "_id patient"
    );
    if (
        !candidate ||
        candidate.patient.toString() !== resolvedPatientId
    ) {
        throw ownershipError("Claim code is invalid or unavailable.", 404);
    }

    return withWorkflowLock(
        `patient-ownership:${candidate.patient.toString()}`,
        async () => {
            const now = new Date();
            const claim = await OwnershipClaim.findOne({
                _id: candidate._id,
                codeHash,
                claimedAt: { $exists: false },
                revokedAt: { $exists: false },
                expiresAt: { $gt: now }
            });
            if (!claim) {
                throw ownershipError(
                    "Claim code has expired, been revoked, or was already used.",
                    409
                );
            }

            const patient = await Patient.findOne({
                _id: claim.patient,
                registrationStatus: "ACTIVE"
            }).select("_id user");
            if (!patient) {
                throw ownershipError("Patient record is unavailable.", 404);
            }
            if (patient.user) {
                throw ownershipError(
                    "This patient record is already linked to an account.",
                    409
                );
            }

            const claimedAt = new Date();
            const claimed = await OwnershipClaim.updateOne(
                {
                    _id: claim._id,
                    claimedAt: { $exists: false },
                    revokedAt: { $exists: false },
                    expiresAt: { $gt: claimedAt }
                },
                {
                    $set: {
                        claimedBy: new mongoose.Types.ObjectId(patientUserId),
                        claimedAt
                    }
                }
            );
            if (claimed.modifiedCount !== 1) {
                throw ownershipError(
                    "Claim code has expired, been revoked, or was already used.",
                    409
                );
            }

            try {
                const linkedPatient = await Patient.findOneAndUpdate(
                    {
                        _id: patient._id,
                        registrationStatus: "ACTIVE",
                        user: { $exists: false }
                    },
                    { $set: { user: new mongoose.Types.ObjectId(patientUserId) } },
                    { new: true, runValidators: true }
                ).select("_id patientId");
                if (!linkedPatient) {
                    throw ownershipError(
                        "Patient record could not be linked to this account.",
                        409
                    );
                }
                return linkedPatient;
            } catch (error) {
                await OwnershipClaim.updateOne(
                    { _id: claim._id, claimedBy: patientUserId },
                    { $unset: { claimedBy: 1, claimedAt: 1 } }
                );
                throw error;
            }
        }
    );
};
