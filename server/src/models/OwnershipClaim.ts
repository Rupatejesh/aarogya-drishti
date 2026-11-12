import mongoose, { Document, Schema } from "mongoose";

export interface IOwnershipClaim extends Document {
    patient: mongoose.Types.ObjectId;
    codeHash: string;
    verifiedBy: mongoose.Types.ObjectId;
    verificationMethod: "IN_PERSON";
    verifiedAt: Date;
    expiresAt: Date;
    revokedAt?: Date;
    claimedBy?: mongoose.Types.ObjectId;
    claimedAt?: Date;
}

const ownershipClaimSchema = new Schema<IOwnershipClaim>(
    {
        patient: {
            type: Schema.Types.ObjectId,
            ref: "Patient",
            required: true,
            index: true
        },
        codeHash: {
            type: String,
            required: true,
            unique: true,
            select: false
        },
        verifiedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        verificationMethod: {
            type: String,
            enum: ["IN_PERSON"],
            required: true
        },
        verifiedAt: { type: Date, required: true },
        expiresAt: { type: Date, required: true, index: true },
        revokedAt: Date,
        claimedBy: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        claimedAt: Date
    },
    {
        timestamps: true
    }
);

ownershipClaimSchema.index({ patient: 1, claimedAt: 1, expiresAt: 1 });

export default mongoose.model<IOwnershipClaim>(
    "OwnershipClaim",
    ownershipClaimSchema
);
