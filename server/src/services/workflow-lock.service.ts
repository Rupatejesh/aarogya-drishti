import mongoose from "mongoose";
import { randomUUID } from "crypto";
import WorkflowLock from "../models/WorkflowLock";

const lockError = (message: string, statusCode: number) =>
    Object.assign(new Error(message), { statusCode });

export const patientOralConsentLockKey = (
    patientId: string | mongoose.Types.ObjectId
): string =>
    `oral-consent:${new mongoose.Types.ObjectId(patientId).toHexString()}`;

export const withWorkflowLock = async <T>(
    key: string,
    operation: () => Promise<T>
): Promise<T> => {
    const owner = randomUUID();

    try {
        await WorkflowLock.create({ _id: key, owner });
    } catch (error) {
        if (
            typeof error === "object" &&
            error !== null &&
            "code" in error &&
            error.code === 11000
        ) {
            throw lockError(
                "A conflicting workflow operation is in progress. Retry shortly.",
                409
            );
        }
        throw error;
    }

    let result: T | undefined;
    let operationError: unknown;
    let operationFailed = false;
    try {
        result = await operation();
    } catch (error) {
        operationFailed = true;
        operationError = error;
    }

    try {
        const released = await WorkflowLock.deleteOne({ _id: key, owner });
        if (released.deletedCount !== 1) {
            throw new Error("The workflow lock could not be released.");
        }
    } catch (releaseError) {
        if (operationFailed) {
            throw new AggregateError(
                [operationError, releaseError],
                "Workflow operation failed and its lock could not be released."
            );
        }
        throw releaseError;
    }

    if (operationFailed) {
        throw operationError;
    }

    return result as T;
};
