
import { createHash } from "crypto";
import mongoose from "mongoose";
import ClinicalReview, { IClinicalReview } from "../models/ClinicalReview";
import Screening from "../models/Screening";
import Patient from "../models/Patient";
import Referral from "../models/Referral";

interface CreateClinicalReviewInput {
    screeningId: string;
    reviewedBy: string;
    reviewerRole: "MEDICAL_OFFICER" | "SPECIALIST";
    decision: "AGREE" | "DISAGREE" | "DEFER";
    clinicalObservations: string;
    notes?: string;
    referralRecommended: boolean;
    referralReason?: string;
}

export const createClinicalReview = async (
    input: CreateClinicalReviewInput,
    accessFilter: Record<string, unknown> = {}
) => {
    if (!["MEDICAL_OFFICER", "SPECIALIST"].includes(input.reviewerRole)) {
        throw Object.assign(
            new Error("Only authorized clinicians can record a clinical review."),
            { statusCode: 403 }
        );
    }

    if (!mongoose.isValidObjectId(input.screeningId)) {
        throw new Error("Invalid screening ID.");
    }

    if (!mongoose.isValidObjectId(input.reviewedBy)) {
        throw new Error("Invalid reviewing user ID.");
    }

    if (
        input.referralRecommended &&
        !input.referralReason?.trim()
    ) {
        throw new Error("A referral reason is required when referral is recommended.");
    }

    const screening = await Screening.findById(input.screeningId)
        .select("_id patient");

    if (!screening) {
        throw new Error("Screening record not found.");
    }

    const patient = await Patient.findOne({
        $and: [
            accessFilter,
            {
                _id: screening.patient,
                registrationStatus: "ACTIVE"
            }
        ]
    }).select("_id");

    if (!patient) {
        throw new Error("Patient not found or access denied.");
    }

    if (input.reviewerRole === "SPECIALIST") {
        const assignedReferral = await Referral.exists({
            patient: patient._id,
            screening: screening._id,
            assignedSpecialist: new mongoose.Types.ObjectId(input.reviewedBy),
            status: { $ne: "CANCELLED" }
        });

        if (!assignedReferral) {
            throw Object.assign(
                new Error("This case is not assigned to your Specialist account."),
                { statusCode: 403 }
            );
        }
    }

    const duplicateReview = await ClinicalReview.findOne({
        screening: screening._id,
        reviewedBy: new mongoose.Types.ObjectId(input.reviewedBy)
    }).select("_id");
    if (duplicateReview) {
        throw Object.assign(
            new Error("You have already reviewed this screening."),
            { statusCode: 409 }
        );
    }

    const reviewObjectId = new mongoose.Types.ObjectId(
        createHash("sha256")
            .update(`${screening._id.toString()}:${input.reviewedBy}`)
            .digest("hex")
            .slice(0, 24)
    );
    const reviewValues = {
        _id: reviewObjectId,
        screening: screening._id,
        patient: patient._id,
        reviewedBy: input.reviewedBy,
        decision: input.decision,
        clinicalObservations: input.clinicalObservations,
        notes: input.notes,
        referralRecommended: input.referralRecommended,
        referralReason: input.referralRecommended
            ? input.referralReason?.trim()
            : undefined
    };
    const screeningStatus =
        input.decision === "DEFER" ? "REQUIRES_REVIEW" : "COMPLETED";

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
            let clinicalReview: IClinicalReview | undefined;
            await session.withTransaction(async () => {
                [clinicalReview] = await ClinicalReview.create(
                    [reviewValues],
                    { session }
                );
                const updatedScreening = await Screening.findByIdAndUpdate(
                    screening._id,
                    { screeningStatus },
                    { runValidators: true, session }
                );
                if (!updatedScreening) {
                    throw new Error("Screening record could not be updated.");
                }
            });
            if (!clinicalReview) {
                throw new Error("Clinical review could not be completed.");
            }
            return clinicalReview;
        } finally {
            await session.endSession();
        }
    }

    const clinicalReview = await ClinicalReview.create(reviewValues);
    try {
        const updatedScreening = await Screening.findByIdAndUpdate(
            screening._id,
            { screeningStatus },
            { runValidators: true }
        );
        if (!updatedScreening) {
            throw new Error("Screening record could not be updated.");
        }
    } catch (error) {
        try {
            const rollback = await ClinicalReview.deleteOne({ _id: reviewObjectId });
            if (rollback.deletedCount !== 1) {
                throw new Error("The new clinical review could not be rolled back.");
            }
        } catch (rollbackError) {
            throw new AggregateError(
                [error, rollbackError],
                "Clinical review failed and rollback could not be completed."
            );
        }
        throw error;
    }

    return clinicalReview;
};
