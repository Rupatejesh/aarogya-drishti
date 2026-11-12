
import mongoose from "mongoose";
import Referral from "../models/Referral";
import Screening from "../models/Screening";
import Patient from "../models/Patient";
import ClinicalReview from "../models/ClinicalReview";
import User from "../models/User";

interface CreateReferralInput {
    screeningId: string;
    createdBy: string;
    assignedSpecialistId?: string;
    referralReason: string;
    priority: "ROUTINE" | "URGENT" | "EMERGENCY";
    referredTo: string;
    facilityName: string;
    appointmentDate?: string;
    notes?: string;
}

interface UpdateReferralStatusInput {
    referralId: string;
    updatedBy: string;
    status:
        | "SCHEDULED"
        | "CONFIRMED"
        | "RESCHEDULED"
        | "COMPLETION_REVIEW"
        | "CANCELLED"
        | "MISSED";
    appointmentDate?: string;
    note?: string;
}

interface ReferralActor {
    userId: string;
    role: string;
}

const createServiceError = (message: string, statusCode: number) => {
    return Object.assign(new Error(message), { statusCode });
};

export const createReferral = async (
    input: CreateReferralInput,
    accessFilter: Record<string, unknown> = {},
    actor?: ReferralActor
) => {
    if (
        !actor ||
        actor.role !== "MEDICAL_OFFICER" ||
        actor.userId !== input.createdBy
    ) {
        throw createServiceError(
            "Only the authenticated Medical Officer can create a referral.",
            403
        );
    }
    if (!mongoose.isValidObjectId(input.screeningId)) {
        throw createServiceError("Invalid screening ID.", 400);
    }

    if (!mongoose.isValidObjectId(input.createdBy)) {
        throw createServiceError("Invalid user ID.", 400);
    }

    const screening = await Screening.findById(input.screeningId)
        .select("_id patient");

    if (!screening) {
        throw createServiceError("Screening record not found.", 404);
    }

    // Verify the patient belongs to the requester's permitted PHC/mandal.
    const patient = await Patient.findOne({
        ...accessFilter,
        _id: screening.patient,
        registrationStatus: "ACTIVE"
    }).select("_id address.phcId address.mandal address.district");

    if (!patient) {
        throw createServiceError(
            "Patient not found or access denied.",
            404
        );
    }

    // Verify the clinical recommendation belongs to this screening.
    const clinicalRecommendation = await ClinicalReview.findOne({
        screening: screening._id,
        referralRecommended: true
    }).select("_id reviewedBy");

    const recommendingUser = clinicalRecommendation
        ? await User.findOne({
            _id: clinicalRecommendation.reviewedBy,
            role: "MEDICAL_OFFICER",
            isActive: true
        }).select("_id")
        : null;

    if (!clinicalRecommendation || !recommendingUser) {
        throw createServiceError(
            "A clinician recommendation is required before creating a referral.",
            400
        );
    }

    let assignedSpecialistId = input.assignedSpecialistId;

    if (assignedSpecialistId) {
        if (!mongoose.isValidObjectId(assignedSpecialistId)) {
            throw createServiceError("Invalid Specialist ID.", 400);
        }

        const specialist = await User.findOne({
            _id: assignedSpecialistId,
            role: "SPECIALIST",
            isActive: true
        }).select("_id assignedPHCId mandal district");

        if (!specialist) {
            throw createServiceError(
                "The selected Specialist account is not active or does not exist.",
                400
            );
        }

        // A Specialist must belong to the same district (or referral network) as the patient
        if (
            (specialist.district || "Alluri Sitharama Raju") !==
                (patient.address.district || "Alluri Sitharama Raju")
        ) {
            throw createServiceError(
                "The selected Specialist is not assigned to this patient's district.",
                403
            );
        }
    }

    const initialStatus = input.appointmentDate
        ? "SCHEDULED" as const
        : "CREATED" as const;

    if (input.appointmentDate) {
        const appointmentDate = new Date(input.appointmentDate);

        if (
            Number.isNaN(appointmentDate.getTime()) ||
            appointmentDate <= new Date()
        ) {
            throw createServiceError(
                "Appointment date must be a valid future date.",
                400
            );
        }
    }

    const initialStatusDate = new Date();

    const referral = await Referral.create({
        patient: patient._id,
        screening: screening._id,
        createdBy: input.createdBy,
        assignedSpecialist: assignedSpecialistId
            ? new mongoose.Types.ObjectId(assignedSpecialistId)
            : undefined,
        referralReason: input.referralReason,
        priority: input.priority,
        referredTo: input.referredTo,
        facilityName: input.facilityName,
        appointmentDate: input.appointmentDate
            ? new Date(input.appointmentDate)
            : undefined,
        status: initialStatus,
        notes: input.notes,
        statusHistory: [
            {
                status: initialStatus,
                changedBy: input.createdBy,
                changedAt: initialStatusDate,
                note: "Initial referral status."
            }
        ],
        assignmentHistory: assignedSpecialistId
            ? [{
                specialist: new mongoose.Types.ObjectId(assignedSpecialistId),
                changedBy: new mongoose.Types.ObjectId(input.createdBy),
                changedAt: initialStatusDate,
                note: "Initial Specialist assignment."
            }]
            : []
    });

    return referral;
};

export const updateReferralStatus = async (
    input: UpdateReferralStatusInput,
    accessFilter: Record<string, unknown> = {},
    actor?: ReferralActor
) => {
    if (!mongoose.isValidObjectId(input.referralId)) {
        throw createServiceError("Invalid referral ID.", 400);
    }

    if (!mongoose.isValidObjectId(input.updatedBy)) {
        throw createServiceError("Invalid user ID.", 400);
    }

    const referral = await Referral.findById(input.referralId);

    if (!referral) {
        throw createServiceError("Referral not found.", 404);
    }

    const patient = await Patient.findOne({
        $and: [
            accessFilter,
            {
                _id: referral.patient,
                registrationStatus: "ACTIVE"
            }
        ]
    }).select("_id");

    if (!patient) {
        throw createServiceError(
            "Patient not found or access denied.",
            404
        );
    }

    if (
        !actor ||
        actor.userId !== input.updatedBy ||
        !["MEDICAL_OFFICER", "SPECIALIST"].includes(actor.role)
    ) {
        throw createServiceError(
            "The authenticated clinical actor is required.",
            403
        );
    }

    const transitionsByRole: Record<string, Record<string, string[]>> = {
        MEDICAL_OFFICER: {
            CREATED: ["SCHEDULED", "CANCELLED"],
            SCHEDULED: ["CONFIRMED", "RESCHEDULED", "CANCELLED", "MISSED"],
            CONFIRMED: ["RESCHEDULED", "CANCELLED", "MISSED"],
            RESCHEDULED: ["CONFIRMED", "RESCHEDULED", "CANCELLED", "MISSED"],
            MISSED: ["RESCHEDULED", "CANCELLED"],
            COMPLETION_REVIEW: ["CANCELLED"],
            COMPLETED: [],
            CANCELLED: []
        },
        SPECIALIST: {
            CREATED: [],
            SCHEDULED: ["CONFIRMED", "RESCHEDULED", "MISSED"],
            CONFIRMED: ["RESCHEDULED", "MISSED", "COMPLETION_REVIEW"],
            RESCHEDULED: ["CONFIRMED", "RESCHEDULED", "MISSED", "COMPLETION_REVIEW"],
            MISSED: ["RESCHEDULED"],
            COMPLETION_REVIEW: [],
            COMPLETED: [],
            CANCELLED: []
        }
    };

    const allowed =
        transitionsByRole[actor.role]?.[referral.status] ?? [];

    if (!allowed.includes(input.status)) {
        throw createServiceError(
            `Cannot change referral status from ${referral.status} to ${input.status}.`,
            400
        );
    }

    if (
        ["SCHEDULED", "RESCHEDULED"].includes(input.status) &&
        !input.appointmentDate
    ) {
        throw createServiceError(
            "Appointment date is required for scheduling or rescheduling.",
            400
        );
    }

    if (input.appointmentDate) {
        const newAppointmentDate = new Date(input.appointmentDate);

        if (Number.isNaN(newAppointmentDate.getTime())) {
            throw createServiceError("Invalid appointment date.", 400);
        }

        if (
            ["SCHEDULED", "RESCHEDULED"].includes(input.status) &&
            newAppointmentDate <= new Date()
        ) {
            throw createServiceError(
                "Appointment date must be in the future.",
                400
            );
        }

        referral.appointmentDate = newAppointmentDate;
    }

    const updatedReferral = await Referral.findOneAndUpdate(
        {
            _id: referral._id,
            status: referral.status,
            ...(actor.role === "SPECIALIST"
                ? { assignedSpecialist: new mongoose.Types.ObjectId(actor.userId) }
                : {})
        },
        {
            $set: {
                status: input.status,
                ...(input.appointmentDate
                    ? { appointmentDate: new Date(input.appointmentDate) }
                    : {})
            },
            $push: {
                statusHistory: {
                    status: input.status,
                    changedBy: new mongoose.Types.ObjectId(input.updatedBy),
                    changedAt: new Date(),
                    note: input.note
                }
            }
        },
        { new: true, runValidators: true }
    );
    if (!updatedReferral) {
        throw createServiceError(
            "Referral changed during this update. Reload and retry.",
            409
        );
    }
    return updatedReferral;
};

export const assignReferralSpecialist = async (
    referralId: string,
    specialistId: string,
    actor: ReferralActor,
    accessFilter: Record<string, unknown>,
    note?: string
) => {
    if (
        !mongoose.isValidObjectId(referralId) ||
        !mongoose.isValidObjectId(specialistId) ||
        !actor ||
        actor.role !== "MEDICAL_OFFICER" ||
        !mongoose.isValidObjectId(actor.userId)
    ) {
        throw createServiceError(
            "Only the authenticated Medical Officer can assign a Specialist.",
            403
        );
    }

    const referral = await Referral.findById(referralId);
    if (!referral) throw createServiceError("Referral not found.", 404);
    if (["COMPLETED", "CANCELLED"].includes(referral.status)) {
        throw createServiceError(
            "A completed or cancelled referral cannot be reassigned.",
            409
        );
    }

    const patient = await Patient.findOne({
        $and: [
            accessFilter,
            { _id: referral.patient, registrationStatus: "ACTIVE" }
        ]
    }).select("_id address");
    if (!patient) {
        throw createServiceError("Patient not found or access denied.", 404);
    }

    const specialist = await User.findOne({
        _id: specialistId,
        role: "SPECIALIST",
        isActive: true
    }).select("_id");
    if (!specialist) {
        throw createServiceError(
            "The Specialist must be an active Specialist account.",
            403
        );
    }

    const updatedReferral = await Referral.findOneAndUpdate(
        {
            _id: referral._id,
            status: referral.status,
            ...(referral.assignedSpecialist
                ? { assignedSpecialist: referral.assignedSpecialist }
                : { assignedSpecialist: { $exists: false } })
        },
        {
            $set: { assignedSpecialist: specialist._id },
            $push: {
                assignmentHistory: {
                    specialist: specialist._id,
                    changedBy: new mongoose.Types.ObjectId(actor.userId),
                    changedAt: new Date(),
                    note
                }
            }
        },
        { new: true, runValidators: true }
    );
    if (!updatedReferral) {
        throw createServiceError(
            "Referral assignment changed during this update. Reload and retry.",
            409
        );
    }
    return updatedReferral;
};

export const reviewReferralCompletion = async (
    referralId: string,
    reviewedBy: string,
    role: string,
    accessFilter: Record<string, unknown>,
    approved: boolean,
    note: string
) => {
    if (role !== "MEDICAL_OFFICER") {
        throw createServiceError(
            "Only a Medical Officer can review referral completion.",
            403
        );
    }
    if (!mongoose.isValidObjectId(referralId) || !mongoose.isValidObjectId(reviewedBy)) {
        throw createServiceError("Invalid referral or reviewer ID.", 400);
    }

    const referral = await Referral.findById(referralId).select("patient status");
    if (!referral || referral.status !== "COMPLETION_REVIEW") {
        throw createServiceError(
            "Referral is not awaiting Medical Officer completion review.",
            409
        );
    }
    const patient = await Patient.findOne({
        $and: [
            accessFilter,
            { _id: referral.patient, registrationStatus: "ACTIVE" }
        ]
    }).select("_id");
    if (!patient) {
        throw createServiceError("Patient not found or access denied.", 404);
    }

    const nextStatus = approved ? "COMPLETED" : "CONFIRMED";
    const now = new Date();
    const updatedReferral = await Referral.findOneAndUpdate(
        { _id: referralId, status: "COMPLETION_REVIEW" },
        {
            $set: { status: nextStatus },
            $push: {
                completionReviews: {
                    reviewedBy: new mongoose.Types.ObjectId(reviewedBy),
                    reviewedAt: now,
                    approved,
                    note
                },
                statusHistory: {
                    status: nextStatus,
                    changedBy: new mongoose.Types.ObjectId(reviewedBy),
                    changedAt: now,
                    note: `Medical Officer completion review: ${note}`
                }
            }
        },
        { new: true, runValidators: true }
    );
    if (!updatedReferral) {
        throw createServiceError(
            "Referral changed during completion review. Reload and retry.",
            409
        );
    }
    return updatedReferral;
};

export const updateReferralPriority = async (
    referralId: string,
    priority: "ROUTINE" | "URGENT" | "EMERGENCY",
    actor: ReferralActor,
    accessFilter: Record<string, unknown>
) => {
    if (
        !mongoose.isValidObjectId(referralId) ||
        !mongoose.isValidObjectId(actor.userId)
    ) {
        throw createServiceError("Invalid referral or actor account.", 400);
    }
    if (!["MEDICAL_OFFICER", "SPECIALIST"].includes(actor.role)) {
        throw createServiceError(
            "Only Medical Officers and Specialists can update referral priority.",
            403
        );
    }

    const referral = await Referral.findById(referralId);
    if (!referral) {
        throw createServiceError("Referral not found.", 404);
    }

    const patient = await Patient.findOne({
        $and: [
            accessFilter,
            { _id: referral.patient, registrationStatus: "ACTIVE" }
        ]
    }).select("_id");
    if (!patient) {
        throw createServiceError("Patient not found or access denied.", 404);
    }

    referral.priority = priority;
    await referral.save();
    return referral;
};

export const getReferrals = async (
    accessFilter: Record<string, unknown> = {},
    page = 1,
    limit = 20,
    actor?: ReferralActor
) => {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));

    if (
        actor?.role === "SPECIALIST" &&
        !mongoose.isValidObjectId(actor.userId)
    ) {
        throw createServiceError("Invalid Specialist account.", 400);
    }

    const patients = await Patient.find({
        $and: [
            accessFilter,
            { registrationStatus: "ACTIVE" }
        ]
    })
        .select("_id")
        .lean();

    const patientIds = patients.map((patient) => patient._id);

    const filter: Record<string, unknown> =
        actor?.role === "SPECIALIST"
            ? { status: { $ne: "CANCELLED" } }
            : { patient: { $in: patientIds } };

    const [referrals, total] = await Promise.all([
        Referral.find(filter)
            .populate("patient", "patientId fullName age sex address exposureHistory")
            .populate("createdBy", "fullName role")
            .populate("assignedSpecialist", "fullName role")
            .sort({ createdAt: -1 })
            .skip((safePage - 1) * safeLimit)
            .limit(safeLimit)
            .lean(),

        Referral.countDocuments(filter)
    ]);

    return {
        referrals,
        pagination: {
            total,
            page: safePage,
            limit: safeLimit,
            totalPages: Math.ceil(total / safeLimit)
        }
    };
};
