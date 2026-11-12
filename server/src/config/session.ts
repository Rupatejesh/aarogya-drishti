import { CookieOptions } from "express";

export const SESSION_COOKIE_NAME = "aarogya_session";
export const CSRF_COOKIE_NAME = "aarogya_csrf";
export const SESSION_MAX_AGE_MS = 8 * 60 * 60 * 1000;

export const getSessionCookieOptions = (
    env: NodeJS.ProcessEnv = process.env
): CookieOptions => ({
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api",
    maxAge: SESSION_MAX_AGE_MS
});

export const getCsrfCookieOptions = (
    env: NodeJS.ProcessEnv = process.env
): CookieOptions => ({
    httpOnly: false,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api",
    maxAge: SESSION_MAX_AGE_MS
});

export const readCookie = (
    cookieHeader: string | undefined,
    name: string
): string | undefined => {
    if (!cookieHeader) return undefined;
    for (const part of cookieHeader.split(";")) {
        const separator = part.indexOf("=");
        if (separator < 0 || part.slice(0, separator).trim() !== name) continue;
        try {
            return decodeURIComponent(part.slice(separator + 1).trim());
        } catch {
            return undefined;
        }
    }
    return undefined;
};
