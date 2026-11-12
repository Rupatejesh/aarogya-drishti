import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";

interface AppError extends Error {
    statusCode?: number;
}

const errorMiddleware = (
    error: AppError,
    _req: Request,
    res: Response,
    _next: NextFunction
): void => {
    console.error("API Error:", error.message);

    if (error instanceof mongoose.Error.ValidationError) {
        res.status(400).json({
            success: false,
            message: "Validation failed.",
            errors: error.message
        });
        return;
    }

    if (error instanceof mongoose.Error.CastError) {
        res.status(400).json({
            success: false,
            message: "Invalid data format."
        });
        return;
    }

    if (
        typeof error === "object" &&
        "code" in error &&
        error.code === 11000
    ) {
        res.status(409).json({
            success: false,
            message: "A record with this information already exists."
        });
        return;
    }

    const statusCode = error.statusCode || 500;

    res.status(statusCode).json({
        success: false,
        message:
            statusCode === 500
                ? "Internal server error."
                : error.message
    });
};

export default errorMiddleware;