
import { Response, NextFunction } from "express";
import {
    AuthenticatedRequest
} from "./auth.middleware";
import { UserRole } from "../models/User";

export const canSetClinicalStatus = (role: string): boolean =>
    role === "MEDICAL_OFFICER";

// Allow only the roles explicitly listed for a route
export const authorizeRoles = (...allowedRoles: UserRole[]) => {
    return (
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): void => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: "Authentication is required."
            });
            return;
        }

        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                message: "You do not have permission to access this resource."
            });
            return;
        }

        next();
    };
};
 