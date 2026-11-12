
import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import User, { UserRole } from "../models/User";
import {
    getSessionCookieOptions,
    readCookie,
    SESSION_COOKIE_NAME
} from "../config/session";

export interface AuthenticatedRequest extends Request {
    authMethod?: "bearer" | "cookie";
    user?: {
        id: string;
        fullName: string;
        role: UserRole;
        assignedPHCId?: string;
        mandal?: string;
        district?: string;
    };
}

const getJwtSecret = (): string => {
    const secret = process.env.JWT_SECRET;

    if (!secret || secret.length < 32) {
        throw new Error("JWT_SECRET is missing or invalid.");
    }

    return secret;
};

export const authenticate = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;
        const bearerToken = authHeader?.startsWith("Bearer ")
            ? authHeader.substring(7)
            : undefined;
        const cookieToken = readCookie(req.headers.cookie, SESSION_COOKIE_NAME);
        const token = bearerToken ?? cookieToken;

        if (!token) {
            res.status(401).json({
                success: false,
                message: "Authentication session is required."
            });
            return;
        }

        const decoded = jwt.verify(token, getJwtSecret(), {
            issuer: "aarogya-drishti"
        }) as JwtPayload;

        if (typeof decoded.sub !== "string") {
            res.status(401).json({
                success: false,
                message: "Invalid authentication token."
            });
            return;
        }

        const user = await User.findById(decoded.sub);

        if (!user || !user.isActive) {
            if (cookieToken) {
                res.clearCookie(SESSION_COOKIE_NAME, getSessionCookieOptions());
            }
            res.status(401).json({
                success: false,
                message: "User account is unavailable."
            });
            return;
        }

        const tokenVersion =
            typeof decoded.ver === "number" ? decoded.ver : 0;

        if (tokenVersion !== (user.tokenVersion ?? 0)) {
            if (cookieToken) {
                res.clearCookie(SESSION_COOKIE_NAME, getSessionCookieOptions());
            }
            res.status(401).json({
                success: false,
                message: "Invalid or revoked authentication token."
            });
            return;
        }

        req.user = {
            id: user.id,
            fullName: user.fullName,
            role: user.role,
            assignedPHCId: user.assignedPHCId,
            mandal: user.mandal,
            district: user.district
        };
        req.authMethod = bearerToken ? "bearer" : "cookie";

        if (bearerToken) {
            res.cookie(
                SESSION_COOKIE_NAME,
                bearerToken,
                getSessionCookieOptions()
            );
        }

        next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError ||
            error instanceof jwt.TokenExpiredError) {
            if (readCookie(req.headers.cookie, SESSION_COOKIE_NAME)) {
                res.clearCookie(SESSION_COOKIE_NAME, getSessionCookieOptions());
            }
            res.status(401).json({
                success: false,
                message: "Invalid or expired authentication token."
            });
            return;
        }

        console.error("Authentication middleware error:", error);

        res.status(500).json({
            success: false,
            message: "Authentication could not be completed."
        });
    }
};

export const optionalAuthenticate = async (
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;
        const bearerToken = authHeader?.startsWith("Bearer ")
            ? authHeader.slice(7)
            : undefined;
        const cookieToken = readCookie(
            req.headers.cookie,
            SESSION_COOKIE_NAME
        );
        const token = bearerToken || cookieToken;

        if (!token) {
            next();
            return;
        }

        const decoded = jwt.verify(token, getJwtSecret()) as JwtPayload & {
            userId?: string;
            role?: UserRole;
        };

        const userId = decoded.userId || decoded.sub;
        if (!userId) {
            next();
            return;
        }

        const user = await User.findById(userId)
            .select("fullName role assignedPHCId mandal district isActive")
            .lean();

        if (user && user.isActive) {
            req.user = {
                id: user._id.toString(),
                fullName: user.fullName,
                role: user.role,
                assignedPHCId: user.assignedPHCId?.toString(),
                mandal: user.mandal,
                district: user.district
            };
            req.authMethod = bearerToken ? "bearer" : "cookie";
        }
        next();
    } catch {
        next();
    }
};

