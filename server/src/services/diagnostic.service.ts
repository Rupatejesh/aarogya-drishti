
import mongoose from "mongoose";

import DiagnosticOrder from "../models/DiagnosticOrder";
import Patient from "../models/Patient";
import Screening from "../models/Screening";
import Referral from "../models/Referral";

interface CreateDiagnosticInput {
    patientId: string;
    screeningId?: string;
    referralId?: string;
    orderedBy: string;

    diagnosticType:
        | "BIOPSY"
        | "HISTOPATHOLOGY"
        | "CT_SCAN"
        | "MRI"
        | "OTHER";

    clinicalReason: string;
    facilityName?: string;
    appointmentDate?: string;
    notes?: string;
}

interface UpdateDiagnosticStatusInput {
    status:
        | "SCHEDULED"
        | "PERFORMED"
        | "SAMPLE_COLLECTED"
        | "REPORT_PENDING"
        | "REPORT_RECEIVED"
        | "UNDER_CLINICIAN_REVIEW"
        | "REVIEWED"
        | "CANCELLED";

    appointmentDate?: string;
    reportReceivedAt?: string;
    note?: string;
}

type DiagnosticAccessFilter = Record<string, unknown>;

interface DiagnosticActor {
    id: string;
    role: string;
}

const createServiceError = (
    message: string,
    statusCode: number
) => {
    const error = new Error(message) as Error & {
        statusCode: number;
    };

    error.statusCode = statusCode;

    return error;
};

const verifyPatientAccess = async (
    patientId: string,
    accessFilter: DiagnosticAccessFilter = {}
) => {
    if (!mongoose.isValidObjectId(patientId)) {
        throw createServiceError("Invalid patient ID.", 400);
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

    if (!patient) {
        throw createServiceError(
            "Patient not found or access denied.",
            404
        );
    }

    return patient;
};

// CREATE DIAGNOSTIC ORDER
export const createDiagnosticOrder = async (
    input: CreateDiagnosticInput,
    accessFilter: DiagnosticAccessFilter = {},
    actor?: DiagnosticActor
) => {
    if (
        !actor ||
        !["MEDICAL_OFFICER", "SPECIALIST"].includes(actor.role) ||
        actor.id !== input.orderedBy
    ) {
        throw createServiceError(
            "Only authorized clinicians can create diagnostic orders.",
            403
        );
    }

    if (!mongoose.isValidObjectId(input.orderedBy)) {
        throw createServiceError(
            "Invalid ordering user ID.",
            400
        );
    }

    const patient = await verifyPatientAccess(
        input.patientId,
        accessFilter
    );

    // Verify screening belongs to this patient.
    if (input.screeningId) {
        if (!mongoose.isValidObjectId(input.screeningId)) {
            throw createServiceError(
                "Invalid screening ID.",
                400
            );
        }

        const screening = await Screening.findOne({
            _id: input.screeningId,
            patient: patient._id
        }).select("_id");

        if (!screening) {
            throw createServiceError(
                "Screening not found for this patient.",
                404
            );
        }
    }

    // Verify referral belongs to this patient.
    if (input.referralId) {
        if (!mongoose.isValidObjectId(input.referralId)) {
            throw createServiceError(
                "Invalid referral ID.",
                400
            );
        }

        const referral = await Referral.findOne({
            _id: input.referralId,
            patient: patient._id
        }).select("_id screening");

        if (!referral) {
            throw createServiceError(
                "Referral not found for this patient.",
                404
            );
        }
        if (
            input.screeningId &&
            referral.screening.toString() !== input.screeningId
        ) {
            throw createServiceError(
                "The screening and referral must belong to the same clinical episode.",
                400
            );
        }
    }

    if (actor.role === "SPECIALIST") {
        if (!input.referralId) {
            throw createServiceError(
                "A Specialist must create diagnostic orders through an assigned referral.",
                403
            );
        }

        const assignedReferral = await Referral.findOne({
            _id: input.referralId,
            patient: patient._id,
            assignedSpecialist: new mongoose.Types.ObjectId(actor.id),
            status: { $ne: "CANCELLED" }
        }).select("_id screening");

        if (
            !assignedReferral ||
            (input.screeningId &&
                assignedReferral.screening.toString() !== input.screeningId)
        ) {
            throw createServiceError(
                "The referral is not assigned to your Specialist account.",
                403
            );
        }
    }

    let appointmentDate: Date | undefined;

    if (input.appointmentDate) {
        appointmentDate = new Date(input.appointmentDate);

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

    const orderingUserId = new mongoose.Types.ObjectId(
        input.orderedBy
    );

    const diagnosticOrder = await DiagnosticOrder.create({
        patient: patient._id,
        screening: input.screeningId
            ? new mongoose.Types.ObjectId(input.screeningId)
            : undefined,
        referral: input.referralId
            ? new mongoose.Types.ObjectId(input.referralId)
            : undefined,

        orderedBy: orderingUserId,

        diagnosticType: input.diagnosticType,
        clinicalReason: input.clinicalReason,
        facilityName: input.facilityName,
        appointmentDate,
        notes: input.notes,

        status: "ADVISED",

        // Record the initial status in the audit history.
        statusHistory: [
            {
                status: "ADVISED",
                changedBy: orderingUserId,
                changedAt: new Date(),
                note: "Diagnostic order created."
            }
        ]
    });

    return diagnosticOrder;
};

// GET DIAGNOSTIC ORDERS FOR A PATIENT
export const getPatientDiagnosticOrders = async (
    patientId: string,
    accessFilter: DiagnosticAccessFilter = {},
    actor?: DiagnosticActor
) => {
    const patient = await verifyPatientAccess(
        patientId,
        accessFilter
    );

    const filter: Record<string, unknown> = { patient: patient._id };

    if (actor?.role === "SPECIALIST") {
        const referrals = await Referral.find({
            patient: patient._id,
            assignedSpecialist: new mongoose.Types.ObjectId(actor.id),
            status: { $ne: "CANCELLED" }
        })
            .select("_id")
            .lean();

        filter.referral = {
            $in: referrals.map((referral) => referral._id)
        };
    }

    const orders = await DiagnosticOrder.find(filter)
        .populate("orderedBy", "fullName role")
        .populate("reviewedBy", "fullName role")
        .populate("statusHistory.changedBy", "fullName role")
        .populate("screening")
        .populate("referral")
        .sort({ createdAt: -1 })
        .lean();

    return orders;
};

// UPDATE DIAGNOSTIC ORDER STATUS
export const updateDiagnosticOrderStatus = async (
    diagnosticId: string,
    updatedBy: string,
    updatedByRole: string,
    input: UpdateDiagnosticStatusInput,
    accessFilter: DiagnosticAccessFilter = {},
    actor?: DiagnosticActor
) => {
        // Only authorized clinical roles can update diagnostic status.
if (!["MEDICAL_OFFICER", "SPECIALIST"].includes(updatedByRole)) {
    throw createServiceError(
        "Only authorized clinical staff can update diagnostic orders.",
        403
    );
}
    if (!mongoose.isValidObjectId(diagnosticId)) {
        throw createServiceError(
            "Invalid diagnostic order ID.",
            400
        );
    }

    if (!mongoose.isValidObjectId(updatedBy)) {
        throw createServiceError(
            "Invalid user ID.",
            400
        );
    }

    const order = await DiagnosticOrder.findById(diagnosticId);

    if (!order) {
        throw createServiceError(
            "Diagnostic order not found.",
            404
        );
    }

    if (
        !actor ||
        actor.id !== updatedBy ||
        actor.role !== updatedByRole
    ) {
        throw createServiceError(
            "The authenticated clinical actor is required.",
            403
        );
    }

    // Verify access to the patient's record.
    await verifyPatientAccess(
        order.patient.toString(),
        accessFilter
    );

    if (actor.role === "SPECIALIST") {
        const assignedReferral = order.referral
            ? await Referral.findOne({
                _id: order.referral,
                patient: order.patient,
                assignedSpecialist: new mongoose.Types.ObjectId(actor.id),
                status: { $ne: "CANCELLED" }
            }).select("_id screening")
            : null;

        if (
            !assignedReferral ||
            (order.screening &&
                assignedReferral.screening.toString() !==
                    order.screening.toString())
        ) {
            throw createServiceError(
                "This diagnostic order is not linked to your assigned referral.",
                403
            );
        }
    }

    const allowedTransitions: Record<string, string[]> = {
        ADVISED: ["SCHEDULED", "CANCELLED"],

        SCHEDULED: ["PERFORMED", "CANCELLED"],

        PERFORMED: [
            "SAMPLE_COLLECTED",
            "REPORT_PENDING",
            "CANCELLED"
        ],

        SAMPLE_COLLECTED: [
            "REPORT_PENDING",
            "CANCELLED"
        ],

        REPORT_PENDING: [
            "REPORT_RECEIVED",
            "CANCELLED"
        ],

        REPORT_RECEIVED: [
            "UNDER_CLINICIAN_REVIEW"
        ],

        UNDER_CLINICIAN_REVIEW: [
            "REVIEWED"
        ],

        REVIEWED: [],

        CANCELLED: []
    };

    const allowed = allowedTransitions[order.status] ?? [];

    if (!allowed.includes(input.status)) {
        throw createServiceError(
            `Invalid status transition from ${order.status} to ${input.status}.`,
            400
        );
    }

    if (
        input.status === "REVIEWED" &&
        order.results.length === 0
    ) {
        throw createServiceError(
            "A recorded diagnostic result is required before clinician review.",
            409
        );
    }

    // Only authorized clinical roles can review reports.
   if (
    input.status === "REVIEWED" &&
    !["MEDICAL_OFFICER", "SPECIALIST"].includes(updatedByRole)
) {
        throw createServiceError(
            "Only authorized clinicians can review diagnostic reports.",
            403
        );
    }

    // Scheduling requires a future appointment.
    if (
        input.status === "SCHEDULED" &&
        !input.appointmentDate
    ) {
        throw createServiceError(
            "Appointment date is required when scheduling.",
            400
        );
    }

    if (input.appointmentDate) {
        const appointmentDate = new Date(
            input.appointmentDate
        );

        if (
            Number.isNaN(appointmentDate.getTime()) ||
            appointmentDate <= new Date()
        ) {
            throw createServiceError(
                "Appointment date must be a valid future date.",
                400
            );
        }

        order.appointmentDate = appointmentDate;
    }

    // Record sample collection time.
    if (input.status === "SAMPLE_COLLECTED") {
        order.sampleCollectedAt = new Date();
    }

    // Record report receipt time.
    if (input.status === "REPORT_RECEIVED") {
        const reportReceivedAt = input.reportReceivedAt
            ? new Date(input.reportReceivedAt)
            : new Date();

        if (
            Number.isNaN(reportReceivedAt.getTime()) ||
            reportReceivedAt > new Date()
        ) {
            throw createServiceError(
                "Report receipt date must be valid and cannot be in the future.",
                400
            );
        }

        order.reportReceivedAt = reportReceivedAt;
    }

    // Record clinician review.
    if (input.status === "REVIEWED") {
        if (!input.note?.trim()) {
            throw createServiceError(
                "Clinician review notes are required.",
                400
            );
        }

        order.reviewedBy = new mongoose.Types.ObjectId(
            updatedBy
        );

        order.reviewedAt = new Date();
        order.reviewNotes = input.note.trim();
    } else if (input.note?.trim()) {
        order.notes = input.note.trim();
    }

    // Update current status.
    order.status = input.status;

    // Append a permanent status-history entry.
    order.statusHistory.push({
        status: input.status,
        changedBy: new mongoose.Types.ObjectId(updatedBy),
        changedAt: new Date(),
        note: input.note?.trim()
    });

    await order.save();

    return order;
};

export const recordDiagnosticResult = async (
    diagnosticId: string,
    resultText: string,
    actor: DiagnosticActor,
    accessFilter: DiagnosticAccessFilter
) => {
    if (
        !actor ||
        !["MEDICAL_OFFICER", "SPECIALIST"].includes(actor.role) ||
        !mongoose.isValidObjectId(actor.id)
    ) {
        throw createServiceError(
            "Only authorized clinicians can record diagnostic results.",
            403
        );
    }
    if (!mongoose.isValidObjectId(diagnosticId)) {
        throw createServiceError("Invalid diagnostic order ID.", 400);
    }

    const order = await DiagnosticOrder.findById(diagnosticId).select(
        "patient screening referral status"
    );
    if (!order) throw createServiceError("Diagnostic order not found.", 404);
    await verifyPatientAccess(order.patient.toString(), accessFilter);

    if (actor.role === "SPECIALIST") {
        const assignedReferral = order.referral
            ? await Referral.findOne({
                _id: order.referral,
                patient: order.patient,
                assignedSpecialist: new mongoose.Types.ObjectId(actor.id),
                status: { $nin: ["CANCELLED", "COMPLETED"] }
            }).select("_id screening")
            : null;
        if (
            !assignedReferral ||
            (order.screening &&
                assignedReferral.screening.toString() !==
                    order.screening.toString())
        ) {
            throw createServiceError(
                "This diagnostic order is not linked to your assigned referral.",
                403
            );
        }
    }

    if (!["REPORT_RECEIVED", "UNDER_CLINICIAN_REVIEW"].includes(order.status)) {
        throw createServiceError(
            "A diagnostic result can be recorded only after the report is received.",
            409
        );
    }

    const updated = await DiagnosticOrder.findOneAndUpdate(
        {
            _id: order._id,
            status: order.status,
            "results.0": { $exists: false }
        },
        {
            $push: {
                results: {
                    resultText,
                    recordedBy: new mongoose.Types.ObjectId(actor.id),
                    recordedAt: new Date()
                }
            }
        },
        { new: true, runValidators: true }
    );
    if (!updated) {
        throw createServiceError(
            "A result was already recorded or the diagnostic order changed. Reload and retry.",
            409
        );
    }
    return updated;
};
