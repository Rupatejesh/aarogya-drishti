import { Request, Response, NextFunction } from "express";
import { timingSafeEqual } from "crypto";
import { getAllowedOrigins } from "../config/cors";
import { CSRF_COOKIE_NAME, SESSION_COOKIE_NAME, readCookie } from "../config/session";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

const tokensMatch = (cookieToken: string | undefined, headerToken: string | undefined) => {
    if (!cookieToken || !headerToken) return false;
    const cookieBuffer = Buffer.from(cookieToken);
    const headerBuffer = Buffer.from(headerToken);
    return cookieBuffer.length === headerBuffer.length &&
        timingSafeEqual(cookieBuffer, headerBuffer);
};

export const csrfProtection = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    if (SAFE_METHODS.has(req.method)) {
        next();
        return;
    }

    // Direct multimodal screening analysis uses multipart/form-data with optional auth
    if (req.path === "/screenings/analyze-direct" || req.path.endsWith("/analyze-direct")) {
        next();
        return;
    }

    const isLoginRequest = req.path === "/auth/login";
    const hasSessionCookie = Boolean(
        readCookie(req.headers.cookie, SESSION_COOKIE_NAME)
    );
    if (!isLoginRequest && !hasSessionCookie) {
        next();
        return;
    }

    const origin = req.get("origin");
    const allowedOrigins = getAllowedOrigins();
    const cookieToken = readCookie(req.headers.cookie, CSRF_COOKIE_NAME);
    const headerToken = req.get("x-csrf-token");

    if (
        !origin ||
        !allowedOrigins.includes(origin) ||
        !tokensMatch(cookieToken, headerToken)
    ) {
        res.status(403).json({
            success: false,
            message: "Request origin or CSRF token is invalid."
        });
        return;
    }

    next();
};
