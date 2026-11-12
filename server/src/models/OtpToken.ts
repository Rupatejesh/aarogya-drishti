import mongoose, { Document, Schema } from "mongoose";

export interface IOtpToken extends Document {
    phone: string;
    otp: string;
    expiresAt: Date;
    createdAt: Date;
}

const OtpTokenSchema = new Schema<IOtpToken>(
    {
        phone: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        otp: {
            type: String,
            required: true,
            trim: true
        },
        expiresAt: {
            type: Date,
            required: true,
            index: { expires: 0 } // MongoDB TTL index to auto-expire documents
        }
    },
    {
        timestamps: true
    }
);

export default mongoose.model<IOtpToken>("OtpToken", OtpTokenSchema);

