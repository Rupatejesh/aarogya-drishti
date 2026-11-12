import mongoose, { Schema } from "mongoose";

interface IWorkflowLock {
    _id: string;
    owner: string;
    createdAt: Date;
    expiresAt: Date;
}

const LOCK_LEASE_MS = 60 * 1000;

const workflowLockSchema = new Schema<IWorkflowLock>(
    {
        _id: { type: String, required: true },
        owner: { type: String, required: true },
        createdAt: {
            type: Date,
            required: true,
            default: Date.now,
            index: { expireAfterSeconds: 60 }
        },
        expiresAt: {
            type: Date,
            required: true,
            default: () => new Date(Date.now() + LOCK_LEASE_MS)
        }
    },
    {
        versionKey: false,
        collection: "workflowlocks"
    }
);

const WorkflowLock = mongoose.model<IWorkflowLock>(
    "WorkflowLock",
    workflowLockSchema
);

export default WorkflowLock;
