import { CorsOptions } from "cors";

const DEVELOPMENT_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173"
];

export const getAllowedOrigins = (
    env: NodeJS.ProcessEnv = process.env
): string[] => {
    const configuredOrigins = env.CORS_ORIGINS
        ?.split(",")
        .map((origin) => origin.trim())
        .filter(Boolean);

    if (configuredOrigins?.length) {
        return [...new Set([
            ...configuredOrigins,
            ...(env.NODE_ENV === "production" ? [] : DEVELOPMENT_ORIGINS)
        ])];
    }

    return env.NODE_ENV === "production"
        ? []
        : DEVELOPMENT_ORIGINS;
};

export const isAllowedOrigin = (
    origin: string | undefined,
    allowedOrigins: readonly string[]
): boolean => !origin || allowedOrigins.includes(origin);

export const createCorsOptions = (
    allowedOrigins = getAllowedOrigins()
): CorsOptions => ({
    origin(origin, callback) {
        if (isAllowedOrigin(origin, allowedOrigins)) {
            callback(null, true);
            return;
        }

        callback(Object.assign(new Error("Origin is not allowed by CORS."), {
            statusCode: 403
        }));
    },
    credentials: true
});
