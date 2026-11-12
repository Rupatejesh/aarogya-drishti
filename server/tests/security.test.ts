import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import express from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { Response, NextFunction } from "express";
import AuditLog from "../src/models/AuditLog";
import ClinicalReview from "../src/models/ClinicalReview";
import DiagnosticOrder from "../src/models/DiagnosticOrder";
import Patient from "../src/models/Patient";
import Referral from "../src/models/Referral";
import Screening from "../src/models/Screening";
import User from "../src/models/User";
import { authenticate } from "../src/middleware/auth.middleware";
import { csrfProtection } from "../src/middleware/csrf.middleware";
import { getSessionCookieOptions, readCookie } from "../src/config/session";
import { canSetClinicalStatus } from "../src/middleware/role.middleware";
import { createCorsOptions, getAllowedOrigins } from "../src/config/cors";
import { createClinicalReview } from "../src/services/clinicalReview.service";
import { createDiagnosticOrder } from "../src/services/diagnostic.service";
import { getPatientAccessFilter } from "../src/services/patient-access.service";
import { recordAudit } from "../src/services/audit.service";
import { createASHAWorkerSchema, createStaffUserSchema } from "../src/validators/user.validator";
import { createScreeningSchema } from "../src/validators/screening.validator";
import patientRoutes from "../src/routes/patient.routes";
import screeningRoutes from "../src/routes/screening.routes";
import clinicalReviewRoutes from "../src/routes/clinicalReview.routes";
import referralRoutes from "../src/routes/referral.routes";
import diagnosticRoutes from "../src/routes/diagnostic.routes";
import followUpRoutes from "../src/routes/follow-up.routes";

const originalJwtSecret = process.env.JWT_SECRET;
const originalUserFindById = User.findById;
const originalUserFindByIdAndUpdate = User.findByIdAndUpdate;
const originalReferralFind = Referral.find;
const originalReferralExists = Referral.exists;
const originalReferralFindOne = Referral.findOne;
const originalScreeningFindById = Screening.findById;
const originalPatientFindOne = Patient.findOne;
const originalClinicalReviewCreate = ClinicalReview.create;
const originalDiagnosticOrderCreate = DiagnosticOrder.create;
const originalAuditCreate = AuditLog.create;
const originalCorsOrigins = process.env.CORS_ORIGINS;
const originalNodeEnv = process.env.NODE_ENV;

afterEach(() => {
    User.findById = originalUserFindById;
    User.findByIdAndUpdate = originalUserFindByIdAndUpdate;
    Referral.find = originalReferralFind;
    Referral.exists = originalReferralExists;
    Referral.findOne = originalReferralFindOne;
    Screening.findById = originalScreeningFindById;
    Patient.findOne = originalPatientFindOne;
    ClinicalReview.create = originalClinicalReviewCreate;
    DiagnosticOrder.create = originalDiagnosticOrderCreate;
    AuditLog.create = originalAuditCreate;
    if (originalCorsOrigins === undefined) delete process.env.CORS_ORIGINS;
    else process.env.CORS_ORIGINS = originalCorsOrigins;
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;

    if (originalJwtSecret === undefined) {
        delete process.env.JWT_SECRET;
    } else {
        process.env.JWT_SECRET = originalJwtSecret;
    }
});

const makeResponse = () => {
    const response = {
        statusCode: 0,
        body: undefined as unknown,
        cookies: [] as { name: string; value: string }[],
        status(code: number) {
            this.statusCode = code;
            return this;
        },
        json(body: unknown) {
            this.body = body;
            return this;
        },
        cookie(name: string, value: string) {
            this.cookies.push({ name, value });
            return this;
        },
        clearCookie(name: string) {
            this.cookies.push({ name, value: "" });
            return this;
        }
    };

    return response;
};

const makeToken = (userId: string, version: number, role = "PATIENT") =>
    jwt.sign(
        { sub: userId, ver: version, role },
        process.env.JWT_SECRET!,
        { issuer: "aarogya-drishti", expiresIn: "1h" }
    );

describe("seven-role patient access policy", () => {
    const actorId = new mongoose.Types.ObjectId().toString();

    it("scopes patient and ASHA access to their own linked or assigned records", async () => {
        const patientFilter = await getPatientAccessFilter({
            id: actorId,
            role: "PATIENT"
        });
        const ashaFilter = await getPatientAccessFilter({
            id: actorId,
            role: "ASHA_WORKER"
        });

        assert.equal(
            (patientFilter.user as mongoose.Types.ObjectId).toString(),
            actorId
        );
        assert.equal(
            (ashaFilter.assignedASHAWorker as mongoose.Types.ObjectId).toString(),
            actorId
        );
    });

    it("limits Medical Officers to their assigned PHC, mandal, and district", async () => {
        const filter = await getPatientAccessFilter({
            id: actorId,
            role: "MEDICAL_OFFICER",
            assignedPHCId: "PHC-1",
            mandal: "Paderu",
            district: "Alluri Sitharama Raju"
        });

        assert.deepEqual(filter, {
            "address.phcId": "PHC-1",
            "address.mandal": "Paderu",
            "address.district": "Alluri Sitharama Raju"
        });
        await assert.rejects(
            getPatientAccessFilter({ id: actorId, role: "MEDICAL_OFFICER" }),
            { statusCode: 403 }
        );
    });

    it("limits Specialists to patients on their non-cancelled assigned referrals", async () => {
        const assignedPatientId = new mongoose.Types.ObjectId();
        let query: unknown;
        Referral.find = ((filter: unknown) => {
            query = filter;
            return {
                select: () => ({
                    lean: async () => [{ patient: assignedPatientId }]
                })
            };
        }) as typeof Referral.find;

        const filter = await getPatientAccessFilter({
            id: actorId,
            role: "SPECIALIST"
        });

        assert.deepEqual(query, {
            assignedSpecialist: new mongoose.Types.ObjectId(actorId),
            status: { $ne: "CANCELLED" }
        });
        assert.deepEqual(
            (filter._id as { $in: mongoose.Types.ObjectId[] }).$in.map(
                (id) => id.toString()
            ),
            [assignedPatientId.toString()]
        );
    });

    it("denies District Officer, ITDA Project Officer, and Admin individual-record access", async () => {
        for (const role of [
            "DISTRICT_OFFICER",
            "ITDA_PROJECT_OFFICER",
            "ADMIN"
        ]) {
            await assert.rejects(
                getPatientAccessFilter({ id: actorId, role }),
                { statusCode: 403 }
            );
        }
    });

    it("enforces patient-record and clinical-mutation denial through mounted Express routes", async () => {
        const testActorId = new mongoose.Types.ObjectId().toString();
        let currentRole = "ADMIN";
        process.env.JWT_SECRET = "unit-test-secret-with-at-least-thirty-two-characters";
        User.findById = (async () => ({
            id: testActorId,
            fullName: "Synthetic authorization test",
            role: currentRole,
            isActive: true,
            tokenVersion: 0
        })) as typeof User.findById;

        const app = express();
        app.use(express.json());
        app.use("/api/patients", patientRoutes);
        app.use("/api/screenings", screeningRoutes);
        app.use("/api/clinical-reviews", clinicalReviewRoutes);
        app.use("/api/referrals", referralRoutes);
        app.use("/api/diagnostics", diagnosticRoutes);
        app.use("/api/follow-ups", followUpRoutes);

        const server = createServer(app);
        await new Promise<void>((resolve, reject) => {
            server.once("error", reject);
            server.listen(0, "127.0.0.1", resolve);
        });

        try {
            const address = server.address() as AddressInfo;
            const baseUrl = `http://127.0.0.1:${address.port}`;
            const patientRecordId = new mongoose.Types.ObjectId().toString();
            const workflowId = new mongoose.Types.ObjectId().toString();
            const request = async (
                role: string,
                method: "GET" | "POST" | "PATCH",
                path: string
            ): Promise<number> => {
                currentRole = role;
                const token = makeToken(testActorId, 0, role);
                const response = await fetch(`${baseUrl}${path}`, {
                    method,
                    headers: {
                        authorization: `Bearer ${token}`,
                        "content-type": "application/json"
                    },
                    ...(method === "GET"
                        ? {}
                        : { body: JSON.stringify({}) })
                });
                await response.arrayBuffer();
                return response.status;
            };

            for (const role of [
                "ADMIN",
                "DISTRICT_OFFICER",
                "ITDA_PROJECT_OFFICER"
            ]) {
                const status = await request(
                    role,
                    "GET",
                    `/api/patients/${patientRecordId}`
                );
                assert.equal(status, 403, `${role} patient-record route`);
            }

            const deniedAdminMutations: Array<{
                method: "POST" | "PATCH";
                path: string;
            }> = [
                { method: "POST", path: "/api/patients/" },
                { method: "PATCH", path: `/api/patients/${patientRecordId}/assign-asha` },
                { method: "POST", path: `/api/patients/${patientRecordId}/ownership-claims` },
                { method: "POST", path: `/api/patients/${patientRecordId}/consents` },
                {
                    method: "POST",
                    path: `/api/patients/${patientRecordId}/consents/ORAL_SCREENING/withdraw`
                },
                { method: "POST", path: "/api/screenings/" },
                { method: "POST", path: "/api/clinical-reviews/" },
                { method: "POST", path: "/api/referrals/" },
                { method: "PATCH", path: `/api/referrals/${workflowId}/specialist` },
                { method: "PATCH", path: `/api/referrals/${workflowId}/status` },
                { method: "POST", path: `/api/referrals/${workflowId}/completion-review` },
                { method: "POST", path: "/api/diagnostics/" },
                { method: "PATCH", path: `/api/diagnostics/${workflowId}/status` },
                { method: "POST", path: `/api/diagnostics/${workflowId}/result` },
                { method: "POST", path: "/api/follow-ups/" },
                { method: "PATCH", path: `/api/follow-ups/${workflowId}` }
            ];

            for (const route of deniedAdminMutations) {
                const status = await request(
                    "ADMIN",
                    route.method,
                    route.path
                );
                assert.equal(
                    status,
                    403,
                    `ADMIN ${route.method} ${route.path}`
                );
            }
        } finally {
            await new Promise<void>((resolve, reject) => {
                server.close((error) => error ? reject(error) : resolve());
            });
        }
    });
});

describe("authorization and request validation", () => {
    it("allows clinician-only screening status only for Medical Officers", () => {
        assert.equal(canSetClinicalStatus("MEDICAL_OFFICER"), true);
        assert.equal(canSetClinicalStatus("ASHA_WORKER"), false);
        assert.equal(canSetClinicalStatus("ADMIN"), false);
    });

    describe("cookie session and CSRF transport", () => {
        it("uses HttpOnly SameSite cookies and Secure only in production", () => {
            const development = getSessionCookieOptions({
                NODE_ENV: "development"
            } as NodeJS.ProcessEnv);
            const production = getSessionCookieOptions({
                NODE_ENV: "production"
            } as NodeJS.ProcessEnv);

            assert.equal(development.httpOnly, true);
            assert.equal(development.sameSite, "lax");
            assert.equal(development.secure, false);
            assert.equal(production.secure, true);
            assert.equal(production.path, "/api");
        });

        it("parses cookies without accepting malformed encodings", () => {
            assert.equal(readCookie("other=x; aarogya_csrf=a%2Fb", "aarogya_csrf"), "a/b");
            assert.equal(readCookie("aarogya_csrf=%ZZ", "aarogya_csrf"), undefined);
        });

        it("requires a matching CSRF cookie/header and exact allowed Origin for browser mutations", () => {
            delete process.env.CORS_ORIGINS;
            process.env.NODE_ENV = "development";
            const makeRequest = (csrfCookie?: string, csrfHeader?: string, origin?: string) => ({
                method: "POST",
                path: "/auth/login",
                headers: { cookie: csrfCookie ? `aarogya_csrf=${csrfCookie}` : "" },
                get(name: string) {
                    if (name === "origin") return origin;
                    if (name === "x-csrf-token") return csrfHeader;
                    return undefined;
                }
            });

            let allowed = false;
            const allowedResponse = makeResponse();
            csrfProtection(
                makeRequest("same-token", "same-token", "http://localhost:5173") as never,
                allowedResponse as never,
                (() => { allowed = true; }) as never
            );
            assert.equal(allowed, true);

            const deniedResponse = makeResponse();
            let deniedNext = false;
            csrfProtection(
                makeRequest("cookie-token", "different-token", "http://localhost:5173") as never,
                deniedResponse as never,
                (() => { deniedNext = true; }) as never
            );
            assert.equal(deniedResponse.statusCode, 403);
            assert.equal(deniedNext, false);
        });

        it("requires CSRF protection for cookie sessions but preserves bearer API compatibility", () => {
            const cookieRequest = {
                method: "PATCH",
                path: "/patients/1",
                headers: { cookie: "aarogya_session=signed; aarogya_csrf=token" },
                get: () => undefined
            };
            const cookieResponse = makeResponse();
            let cookieNext = false;
            csrfProtection(
                cookieRequest as never,
                cookieResponse as never,
                (() => { cookieNext = true; }) as never
            );
            assert.equal(cookieResponse.statusCode, 403);
            assert.equal(cookieNext, false);

            const bearerResponse = makeResponse();
            let bearerNext = false;
            csrfProtection(
                {
                    method: "PATCH",
                    path: "/patients/1",
                    headers: { authorization: "Bearer legacy", cookie: "" },
                    get: () => undefined
                } as never,
                bearerResponse as never,
                (() => { bearerNext = true; }) as never
            );
            assert.equal(bearerNext, true);
        });
    });

    it("rejects extra screening fields and prevents staff role escalation", () => {
        const screening = {
            patientId: new mongoose.Types.ObjectId().toString(),
            clinicalStatus: "SUSPICIOUS_FINDING_REQUIRES_REVIEW",
            examinationFindings: [
                { bodySite: "TONGUE", observation: "Synthetic observation" }
            ]
        };

        assert.equal(
            createScreeningSchema.safeParse({
                ...screening,
                role: "ADMIN"
            }).success,
            false
        );
        assert.equal(
            createStaffUserSchema.safeParse({
                fullName: "Demo User",
                email: "demo@example.test",
                password: "A-long-demo-password-1",
                role: "ADMIN",
                assignedPHCId: "PHC-1",
                mandal: "Paderu"
            }).success,
            false
        );

        const ashaAccount = createASHAWorkerSchema.parse({
            fullName: "Demo Worker",
            email: "worker@example.test",
            password: "A-long-demo-password-1",
            role: "ADMIN",
            assignedPHCId: "PHC-1",
            mandal: "Paderu"
        });
        assert.equal("role" in ashaAccount, false);
    });

    it("uses an exact origin allowlist and restricts production defaults", () => {
        const configured = getAllowedOrigins({
            CORS_ORIGINS: "https://demo.example.test, https://admin.example.test",
            NODE_ENV: "production"
        } as NodeJS.ProcessEnv);

        assert.deepEqual(configured, [
            "https://demo.example.test",
            "https://admin.example.test"
        ]);
        assert.deepEqual(getAllowedOrigins({ NODE_ENV: "production" } as NodeJS.ProcessEnv), []);

        const options = createCorsOptions(configured);
        let allowedOrigin: string | boolean | undefined;
        options.origin?.("https://demo.example.test", (error, allowed) => {
            assert.equal(error, null);
            allowedOrigin = allowed;
        });
        assert.equal(allowedOrigin, true);

        let denied = false;
        options.origin?.("https://attacker.example", (error) => {
            denied = error instanceof Error &&
                (error as Error & { statusCode?: number }).statusCode === 403;
        });
        assert.equal(denied, true);
    });
});

describe("verified sessions and patient-linking safety", () => {
    it("uses the database role instead of the JWT role claim", async () => {
        process.env.JWT_SECRET = "unit-test-secret-that-is-at-least-32-characters";
        const actorId = new mongoose.Types.ObjectId().toString();
        const response = makeResponse();
        const request = {
            headers: {
                authorization: `Bearer ${makeToken(actorId, 1, "ADMIN")}`
            }
        } as never;
        let nextCalled = false;

        User.findById = (() => ({
            _id: new mongoose.Types.ObjectId(actorId),
            id: actorId,
            fullName: "Test User",
            role: "PATIENT",
            isActive: true,
            tokenVersion: 1
        })) as typeof User.findById;

        await authenticate(
            request,
            response as unknown as Response,
            (() => {
                nextCalled = true;
            }) as NextFunction
        );

        assert.equal(nextCalled, true);
        assert.equal((request as { user?: { role: string } }).user?.role, "PATIENT");
        assert.equal(response.cookies[0]?.name, "aarogya_session");
    });

    it("loads the database role and rejects a revoked token version", async () => {
        process.env.JWT_SECRET = "unit-test-secret-that-is-at-least-32-characters";
        const actorId = new mongoose.Types.ObjectId().toString();
        const response = makeResponse();
        let nextCalled = false;

        User.findById = (() => ({
            _id: new mongoose.Types.ObjectId(actorId),
            id: actorId,
            fullName: "Test User",
            role: "PATIENT",
            isActive: true,
            tokenVersion: 1
        })) as typeof User.findById;

        await authenticate(
            {
                headers: {
                    authorization: `Bearer ${makeToken(actorId, 0, "ADMIN")}`
                }
            } as never,
            response as unknown as Response,
            (() => {
                nextCalled = true;
            }) as NextFunction
        );

        assert.equal(response.statusCode, 401);
        assert.equal(nextCalled, false);
    });

    it("authenticates HttpOnly cookie sessions and uses database role claims", async () => {
        process.env.JWT_SECRET = "unit-test-secret-that-is-at-least-32-characters";
        const actorId = new mongoose.Types.ObjectId().toString();
        const request = {
            headers: { cookie: `aarogya_session=${makeToken(actorId, 0, "ADMIN")}` }
        } as never;
        const response = makeResponse();
        let nextCalled = false;
        User.findById = (() => ({
            _id: new mongoose.Types.ObjectId(actorId),
            id: actorId,
            fullName: "Cookie Test User",
            role: "ASHA_WORKER",
            isActive: true,
            tokenVersion: 0
        })) as typeof User.findById;

        await authenticate(
            request,
            response as unknown as Response,
            (() => { nextCalled = true; }) as NextFunction
        );

        assert.equal(nextCalled, true);
        assert.equal((request as { user?: { role: string }; authMethod?: string }).user?.role, "ASHA_WORKER");
        assert.equal((request as { authMethod?: string }).authMethod, "cookie");
        assert.equal(response.cookies.length, 0);
    });

    it("requires a single-use claim code for patient account linking", async () => {
        const { linkPatientAccount } = await import("../src/controllers/patient.controller");
        const response = makeResponse();

        await linkPatientAccount(
            {
                user: {
                    id: new mongoose.Types.ObjectId().toString(),
                    fullName: "Synthetic Patient",
                    role: "PATIENT"
                },
                body: {},
                params: { id: new mongoose.Types.ObjectId().toString() }
            } as never,
            response as unknown as Response,
            (() => undefined) as NextFunction
        );

        assert.equal(response.statusCode, 400);
        assert.match(
            (response.body as { message: string }).message,
            /Invalid patient ownership claim/
        );
    });
});

describe("auditing", () => {
    it("records actor, resource, action, and outcome without requiring sensitive fields", async () => {
        let captured: Record<string, unknown> | undefined;
        AuditLog.create = (async (input: Record<string, unknown>) => {
            captured = input;
            return input;
        }) as typeof AuditLog.create;

        const actorId = new mongoose.Types.ObjectId().toString();
        await recordAudit({
            actorId,
            actorRole: "MEDICAL_OFFICER",
            action: "CLINICAL_REVIEW_CREATED",
            outcome: "SUCCESS",
            resourceType: "ClinicalReview",
            resourceId: "review-1",
            purpose: "Clinical review was recorded."
        });

        assert.equal(
            (captured?.actor as mongoose.Types.ObjectId).toString(),
            actorId
        );
        assert.equal(captured?.action, "CLINICAL_REVIEW_CREATED");
        assert.equal(captured?.outcome, "SUCCESS");
        assert.equal(captured?.resourceId, "review-1");
    });
});

describe("logout token revocation", () => {
    it("increments the stored token version and records the logout", async () => {
        const { logout } = await import("../src/controllers/auth.controller");
        const actorId = new mongoose.Types.ObjectId().toString();
        const response = makeResponse();
        let update: Record<string, unknown> | undefined;
        let auditAction: string | undefined;

        User.findByIdAndUpdate = ((_id, updateDocument) => {
            update = updateDocument as Record<string, unknown>;
            return {
                select: async () => ({ _id: new mongoose.Types.ObjectId(actorId) })
            };
        }) as typeof User.findByIdAndUpdate;
        AuditLog.create = (async (input: Record<string, unknown>) => {
            auditAction = input.action as string;
            return input;
        }) as typeof AuditLog.create;

        await logout(
            {
                user: { id: actorId, role: "PATIENT" },
                ip: "127.0.0.1",
                get: () => undefined
            } as never,
            response as unknown as Response,
            (() => undefined) as NextFunction
        );

        assert.deepEqual(update, { $inc: { tokenVersion: 1 } });
        assert.equal(auditAction, "LOGOUT");
        assert.equal(response.statusCode, 200);
    });
});

describe("specialist clinical review assignment", () => {
    it("rejects a screening not attached to the Specialist's assigned referral", async () => {
        const patientId = new mongoose.Types.ObjectId();
        const screeningId = new mongoose.Types.ObjectId();
        const specialistId = new mongoose.Types.ObjectId().toString();
        let reviewCreated = false;

        Screening.findById = (() => ({
            select: async () => ({ _id: screeningId, patient: patientId })
        })) as typeof Screening.findById;
        Patient.findOne = (() => ({
            select: async () => ({ _id: patientId })
        })) as typeof Patient.findOne;
        Referral.exists = (async () => null) as typeof Referral.exists;
        ClinicalReview.create = (async () => {
            reviewCreated = true;
            return {};
        }) as typeof ClinicalReview.create;

        await assert.rejects(
            createClinicalReview(
                {
                    screeningId: screeningId.toString(),
                    reviewedBy: specialistId,
                    reviewerRole: "SPECIALIST",
                    decision: "DEFER",
                    clinicalObservations: "Synthetic assessment",
                    referralRecommended: false
                },
                {}
            ),
            { statusCode: 403 }
        );
        assert.equal(reviewCreated, false);
    });
});

describe("specialist diagnostic assignment", () => {
    it("rejects diagnostic orders unless the referral is assigned to that Specialist", async () => {
        const patientId = new mongoose.Types.ObjectId();
        const referralId = new mongoose.Types.ObjectId();
        const specialistId = new mongoose.Types.ObjectId().toString();
        let referralQuery: Record<string, unknown> | undefined;
        let orderCreated = false;

        Patient.findOne = (() => ({
            select: async () => ({ _id: patientId })
        })) as typeof Patient.findOne;
        Referral.findOne = ((filter: Record<string, unknown>) => {
            referralQuery = filter;
            return {
                select: async () =>
                    "assignedSpecialist" in filter
                        ? null
                        : { _id: referralId }
            };
        }) as typeof Referral.findOne;
        DiagnosticOrder.create = (async () => {
            orderCreated = true;
            return {};
        }) as typeof DiagnosticOrder.create;

        await assert.rejects(
            createDiagnosticOrder(
                {
                    patientId: patientId.toString(),
                    referralId: referralId.toString(),
                    orderedBy: specialistId,
                    diagnosticType: "BIOPSY",
                    clinicalReason: "Synthetic test reason"
                },
                {},
                { id: specialistId, role: "SPECIALIST" }
            ),
            { statusCode: 403 }
        );

        assert.deepEqual(referralQuery, {
            _id: referralId.toString(),
            patient: patientId,
            assignedSpecialist: new mongoose.Types.ObjectId(specialistId),
            status: { $ne: "CANCELLED" }
        });
        assert.equal(orderCreated, false);
    });
});
