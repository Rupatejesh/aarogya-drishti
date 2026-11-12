import mongoose from "mongoose";
import FollowUp from "../models/FollowUp";
import Patient from "../models/Patient";
import User from "../models/User";
import Screening from "../models/Screening";
import Referral from "../models/Referral";

interface FollowUpActor {
    id: string;
    role: string;
}

const followUpError = (message: string, statusCode: number) =>
    Object.assign(new Error(message), { statusCode });

const findPatientInScope = async (
    patientId: string,
    accessFilter: Record<string, unknown>
) => {
    if (!mongoose.isValidObjectId(patientId)) {
        throw followUpError("Invalid patient ID.", 400);
    }
    const patient = await Patient.findOne({
        $and: [
            accessFilter,
            {
                _id: new mongoose.Types.ObjectId(patientId),
                registrationStatus: "ACTIVE"
            }
        ]
    }).select("_id address");
    if (!patient) throw followUpError("Patient not found or access denied.", 404);
    return patient;
};

const validateWorkerAssignment = async (
    workerId: string,
    actor: FollowUpActor,
    address: { phcId: string; mandal: string; district: string }
) => {
    if (!mongoose.isValidObjectId(workerId)) {
        throw followUpError("Invalid assigned worker ID.", 400);
    }
    if (actor.role === "ASHA_WORKER" && actor.id !== workerId) {
        throw followUpError("An ASHA Worker can assign follow-up only to themselves.", 403);
    }
    const worker = await User.findOne({
        _id: workerId,
        role: "ASHA_WORKER",
        isActive: true,
        assignedPHCId: address.phcId,
        mandal: address.mandal,
        district: address.district
    }).select("_id");
    if (!worker) {
        throw followUpError(
            "Assigned worker must be active and scoped to the patient's PHC, mandal, and district.",
            403
        );
    }
    return worker;
};

export const createFollowUp = async (
    input: {
        patientId: string;
        screeningId?: string;
        referralId?: string;
        assignedWorkerId: string;
        dueAt: string;
        note?: string;
    },
    actor: FollowUpActor,
    accessFilter: Record<string, unknown>
) => {
    if (!["ASHA_WORKER", "MEDICAL_OFFICER"].includes(actor.role)) {
        throw followUpError("Your role cannot schedule follow-up.", 403);
    }
    if (!mongoose.isValidObjectId(actor.id)) {
        throw followUpError("Invalid authenticated user.", 400);
    }
    const patient = await findPatientInScope(input.patientId, accessFilter);
    const dueAt = new Date(input.dueAt);
    if (Number.isNaN(dueAt.getTime()) || dueAt <= new Date()) {
        throw followUpError("Follow-up date must be a valid future date.", 400);
    }
    await validateWorkerAssignment(input.assignedWorkerId, actor, patient.address);

    if (actor.role === "ASHA_WORKER" && input.assignedWorkerId !== actor.id) {
        throw followUpError("An ASHA Worker may schedule only assigned follow-up.", 403);
    }
    if (input.screeningId) {
        const screening = await Screening.findOne({
            _id: input.screeningId,
            patient: patient._id
        }).select("_id");
        if (!screening) throw followUpError("Screening not found for this patient.", 404);
    }
    if (input.referralId) {
        const referral = await Referral.findOne({
            _id: input.referralId,
            patient: patient._id
        }).select("_id");
        if (!referral) throw followUpError("Referral not found for this patient.", 404);
    }

    const now = new Date();
    return FollowUp.create({
        patient: patient._id,
        ...(input.screeningId
            ? { screening: new mongoose.Types.ObjectId(input.screeningId) }
            : {}),
        ...(input.referralId
            ? { referral: new mongoose.Types.ObjectId(input.referralId) }
            : {}),
        assignedWorker: new mongoose.Types.ObjectId(input.assignedWorkerId),
        createdBy: new mongoose.Types.ObjectId(actor.id),
        dueAt,
        status: "PLANNED",
        statusHistory: [{
            status: "PLANNED",
            changedBy: new mongoose.Types.ObjectId(actor.id),
            changedAt: now,
            note: input.note
        }]
    });
};

export const getPatientFollowUps = async (
    patientId: string,
    accessFilter: Record<string, unknown>
) => {
    const patient = await findPatientInScope(patientId, accessFilter);
    return FollowUp.find({ patient: patient._id })
        .populate("assignedWorker", "fullName role")
        .populate("createdBy", "fullName role")
        .populate("statusHistory.changedBy", "fullName role")
        .populate("visitNotes.recordedBy", "fullName role")
        .sort({ dueAt: -1 })
        .lean();
};

export const updateFollowUp = async (
    followUpId: string,
    input: {
        status?: "PLANNED" | "CONTACTED" | "COMPLETED" | "MISSED" | "CANCELLED";
        dueAt?: string;
        assignedWorkerId?: string;
        visitNote?: string;
        missedReason?: string;
    },
    actor: FollowUpActor,
    accessFilter: Record<string, unknown>
) => {
    if (!mongoose.isValidObjectId(followUpId) || !mongoose.isValidObjectId(actor.id)) {
        throw followUpError("Invalid follow-up or actor ID.", 400);
    }
    const followUp = await FollowUp.findById(followUpId);
    if (!followUp) throw followUpError("Follow-up not found.", 404);
    await findPatientInScope(followUp.patient.toString(), accessFilter);

    const isAssignedWorker =
        actor.role === "ASHA_WORKER" &&
        followUp.assignedWorker.toString() === actor.id;
    if (actor.role !== "MEDICAL_OFFICER" && !isAssignedWorker) {
        throw followUpError("You cannot update this follow-up.", 403);
    }
    if (input.assignedWorkerId && actor.role !== "MEDICAL_OFFICER") {
        throw followUpError("Only a Medical Officer can reassign follow-up.", 403);
    }

    const transitions: Record<string, string[]> = {
        PLANNED: ["CONTACTED", "COMPLETED", "MISSED", "CANCELLED"],
        CONTACTED: ["COMPLETED", "MISSED", "CANCELLED"],
        MISSED: ["PLANNED", "CANCELLED"],
        COMPLETED: [],
        CANCELLED: []
    };
    if (input.status) {
        if (!transitions[followUp.status]?.includes(input.status)) {
            throw followUpError(
                `Cannot change follow-up from ${followUp.status} to ${input.status}.`,
                409
            );
        }
        if (isAssignedWorker && !["CONTACTED", "COMPLETED", "MISSED"].includes(input.status)) {
            throw followUpError(
                "Assigned ASHA Workers can record contact, completion, or missed status only.",
                403
            );
        }
        if (
            input.status === "PLANNED" &&
            followUp.status === "MISSED" &&
            !input.dueAt
        ) {
            throw followUpError(
                "A new date is required when reopening a missed follow-up.",
                400
            );
        }
    }
    if (input.dueAt) {
        const dueAt = new Date(input.dueAt);
        if (Number.isNaN(dueAt.getTime()) || dueAt <= new Date()) {
            throw followUpError("Follow-up date must be a valid future date.", 400);
        }
        if (actor.role !== "MEDICAL_OFFICER" || !["PLANNED", "MISSED"].includes(followUp.status)) {
            throw followUpError("Only a Medical Officer can reschedule an open follow-up.", 403);
        }
    }

    const patient = await Patient.findById(followUp.patient).select("address");
    if (!patient) throw followUpError("Patient record is unavailable.", 404);
    if (input.assignedWorkerId) {
        await validateWorkerAssignment(input.assignedWorkerId, actor, patient.address);
    }

    const now = new Date();
    const update: Record<string, unknown> = {};
    const push: Record<string, unknown> = {};
    if (input.status) {
        update.status = input.status;
        push.statusHistory = {
            status: input.status,
            changedBy: new mongoose.Types.ObjectId(actor.id),
            changedAt: now,
            note: input.status === "MISSED" ? input.missedReason : undefined
        };
    }
    if (input.dueAt) update.dueAt = new Date(input.dueAt);
    if (input.assignedWorkerId) update.assignedWorker = new mongoose.Types.ObjectId(input.assignedWorkerId);
    if (input.visitNote) {
        push.visitNotes = {
            text: input.visitNote,
            recordedBy: new mongoose.Types.ObjectId(actor.id),
            recordedAt: now
        };
    }

    const updated = await FollowUp.findOneAndUpdate(
        {
            _id: followUp._id,
            status: followUp.status,
            assignedWorker: followUp.assignedWorker
        },
        {
            ...(Object.keys(update).length ? { $set: update } : {}),
            ...(Object.keys(push).length ? { $push: push } : {})
        },
        { new: true, runValidators: true }
    );
    if (!updated) {
        throw followUpError("Follow-up changed during this update. Reload and retry.", 409);
    }
    return updated;
};
