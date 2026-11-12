import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import mongoose from "mongoose";
import AuditLog from "../src/models/AuditLog";
import Consent from "../src/models/Consent";
import ClinicalReview from "../src/models/ClinicalReview";
import Patient from "../src/models/Patient";
import Referral from "../src/models/Referral";
import Screening from "../src/models/Screening";
import User from "../src/models/User";
import WorkflowLock from "../src/models/WorkflowLock";
import {
    assignPatientToASHA,
    listPatients,
    registerPatient
} from "../src/services/patient.service";
import {
    getPatientConsents,
    hasCurrentOralScreeningConsent,
    recordOralScreeningConsent,
    withdrawOralScreeningConsent
} from "../src/services/consent.service";
import { getPatientAccessFilter } from "../src/services/patient-access.service";
import {
    createScreening,
    getPatientScreeningHistory,
    getMedicalOfficerReviewQueue
} from "../src/services/screening.service";
import { createClinicalReview } from "../src/services/clinicalReview.service";
import { registerPatientSchema } from "../src/validators/patient.validator";
import { createPatient } from "../src/controllers/patient.controller";
import { authorizeRoles } from "../src/middleware/role.middleware";

const originalPatientFind = Patient.find;
const originalPatientFindOne = Patient.findOne;
const originalPatientCountDocuments = Patient.countDocuments;
const originalPatientCreate = Patient.create;
const originalPatientDeleteOne = Patient.deleteOne;
const originalPatientFindByIdAndUpdate = Patient.findByIdAndUpdate;
const originalAuditCreate = AuditLog.create;
const originalUserFindOne = User.findOne;
const originalConsentCreate = Consent.create;
const originalConsentFind = Consent.find;
const originalConsentFindOne = Consent.findOne;
const originalScreeningCreate = Screening.create;
const originalScreeningFind = Screening.find;
const originalScreeningCountDocuments = Screening.countDocuments;
const originalScreeningFindById = Screening.findById;
const originalScreeningFindByIdAndUpdate = Screening.findByIdAndUpdate;
const originalClinicalReviewCreate = ClinicalReview.create;
const originalClinicalReviewFindOne = ClinicalReview.findOne;
const originalClinicalReviewFind = ClinicalReview.find;
const originalClinicalReviewDeleteOne = ClinicalReview.deleteOne;
const originalReferralExists = Referral.exists;
const originalConnectionDb = mongoose.connection.db;
const originalStartSession = mongoose.startSession;
const originalWorkflowLockCreate = WorkflowLock.create;
const originalWorkflowLockDeleteOne = WorkflowLock.deleteOne;
const inMemoryLocks = new Map<string, string>();
const workflowLockKeys: string[] = [];

beforeEach(() => {
    inMemoryLocks.clear();
    workflowLockKeys.length = 0;
    WorkflowLock.create = (async (input: { _id: string; owner: string }) => {
        workflowLockKeys.push(input._id);
        if (inMemoryLocks.has(input._id)) {
            throw Object.assign(new Error("Duplicate workflow lock."), { code: 11000 });
        }
        inMemoryLocks.set(input._id, input.owner);
        return input;
    }) as typeof WorkflowLock.create;
    WorkflowLock.deleteOne = (async (filter: { _id: string; owner: string }) => {
        const owner = inMemoryLocks.get(filter._id);
        if (owner !== filter.owner) return { deletedCount: 0 };
        inMemoryLocks.delete(filter._id);
        return { deletedCount: 1 };
    }) as typeof WorkflowLock.deleteOne;
});

afterEach(() => {
    Patient.find = originalPatientFind;
    Patient.findOne = originalPatientFindOne;
    Patient.countDocuments = originalPatientCountDocuments;
    Patient.create = originalPatientCreate;
    Patient.deleteOne = originalPatientDeleteOne;
    Patient.findByIdAndUpdate = originalPatientFindByIdAndUpdate;
    AuditLog.create = originalAuditCreate;
    User.findOne = originalUserFindOne;
    Consent.create = originalConsentCreate;
    Consent.find = originalConsentFind;
    Consent.findOne = originalConsentFindOne;
    Screening.create = originalScreeningCreate;
    Screening.find = originalScreeningFind;
    Screening.countDocuments = originalScreeningCountDocuments;
    Screening.findById = originalScreeningFindById;
    Screening.findByIdAndUpdate = originalScreeningFindByIdAndUpdate;
    ClinicalReview.create = originalClinicalReviewCreate;
    ClinicalReview.findOne = originalClinicalReviewFindOne;
    ClinicalReview.find = originalClinicalReviewFind;
    ClinicalReview.deleteOne = originalClinicalReviewDeleteOne;
    Referral.exists = originalReferralExists;
    mongoose.connection.db = originalConnectionDb;
    mongoose.startSession = originalStartSession;
    WorkflowLock.create = originalWorkflowLockCreate;
    WorkflowLock.deleteOne = originalWorkflowLockDeleteOne;
});

const actorId = new mongoose.Types.ObjectId().toString();
const patientId = new mongoose.Types.ObjectId();
const ashaId = new mongoose.Types.ObjectId();
const activePatient = {
    _id: patientId,
    id: patientId.toString(),
    patientId: "AD-TEST-1",
    fullName: "Synthetic Patient",
    registrationStatus: "ACTIVE",
    address: {
        village: "Synthetic Village",
        mandal: "Paderu",
        phcId: "PHC-1",
        district: "Alluri Sitharama Raju"
    },
    save: async () => undefined
};

const validRegistration = (overrides: Record<string, unknown> = {}) => ({
    fullName: "Synthetic Patient",
    age: 30,
    sex: "NOT_RECORDED",
    address: {
        village: "Synthetic Village",
        mandal: "Paderu",
        phcId: "PHC-1"
    },
    exposureHistory: {},
    consent: {
        purpose: "PATIENT_REGISTRATION",
        granted: true,
        consentVersion: "registration-v1",
        language: "ENGLISH"
    },
    ...overrides
});

const setStandaloneMongoMock = () => {
    mongoose.connection.db = {
        admin: () => ({
            command: async () => ({ setName: undefined })
        })
    } as never;
};

describe("patient registration", () => {
    it("generates a distinct server-side patient ID for each new model", async () => {
        const first = new Patient({
            fullName: "Synthetic One",
            sex: "NOT_RECORDED",
            address: {
                village: "Village One",
                mandal: "Paderu",
                phcId: "PHC-1"
            },
            createdBy: new mongoose.Types.ObjectId()
        });
        const second = new Patient({
            fullName: "Synthetic Two",
            sex: "NOT_RECORDED",
            address: {
                village: "Village Two",
                mandal: "Paderu",
                phcId: "PHC-1"
            },
            createdBy: new mongoose.Types.ObjectId()
        });

        await Promise.all([first.validate(), second.validate()]);
        assert.match(first.patientId, /^AD-[A-F0-9-]+$/);
        assert.notEqual(first.patientId, second.patientId);
    });

    it("rejects missing registration fields, invalid contacts, future birth dates, and role injection", () => {
        assert.equal(registerPatientSchema.safeParse({}).success, false);
        assert.equal(
            registerPatientSchema.safeParse(
                validRegistration({
                    phone: "555",
                    dateOfBirth: "2099-01-01"
                })
            ).success,
            false
        );
        assert.equal(
            registerPatientSchema.safeParse(
                validRegistration({ role: "ADMIN" })
            ).success,
            false
        );
        assert.equal(
            registerPatientSchema.safeParse(
                validRegistration({
                    age: 30,
                    dateOfBirth: new Date("1980-01-01")
                })
            ).success,
            false
        );
    });

    it("denies patient accounts from registering other patients", async () => {
        let responseCode = 0;
        let responseBody: unknown;
        const response = {
            status(code: number) {
                responseCode = code;
                return this;
            },
            json(body: unknown) {
                responseBody = body;
                return this;
            }
        };
        await createPatient(
            {
                body: validRegistration(),
                user: { id: actorId, role: "PATIENT" },
                ip: "127.0.0.1",
                get: () => undefined
            } as never,
            response as never,
            (() => undefined) as never
        );
        assert.equal(responseCode, 403, JSON.stringify(responseBody));
    });

    it("denies Admin patient registration before any patient write", async () => {
        let responseCode = 0;
        const response = {
            status(code: number) {
                responseCode = code;
                return this;
            },
            json() {
                return this;
            }
        };
        let forwardedError: unknown;

        await createPatient(
            {
                body: validRegistration(),
                user: { id: actorId, role: "ADMIN" },
                ip: "127.0.0.1",
                get: () => undefined
            } as never,
            response as never,
            ((error: unknown) => {
                forwardedError = error;
            }) as never
        );

        assert.equal(responseCode, 403);
        assert.equal(forwardedError, undefined);
    });

    it("detects possible duplicates using demographics, not phone equality alone", async () => {
        setStandaloneMongoMock();
        let query: Record<string, unknown> | undefined;
        Patient.find = ((filter: Record<string, unknown>) => {
            query = filter;
            return {
                select: () => ({
                    limit: () => ({
                        lean: async () => [{
                            patientId: "AD-EXISTING",
                            fullName: "Synthetic Patient",
                            address: {
                                village: "Synthetic Village",
                                mandal: "Paderu"
                            }
                        }]
                    })
                })
            };
        }) as typeof Patient.find;
        let created = false;
        Patient.create = (async () => {
            created = true;
            return activePatient;
        }) as typeof Patient.create;

        const result = await registerPatient(
            validRegistration({
                dateOfBirth: new Date("1990-01-01"),
                phone: "9876543210"
            }) as never,
            actorId
        );

        assert.equal(result.success, false);
        assert.equal(created, false);
        assert.equal(
            (query?.$or as Record<string, unknown>[])[0]["address.village"],
            "Synthetic Village"
        );
        assert.equal(
            "phone" in (query?.$or as Record<string, unknown>[])[0],
            false
        );
    });

    it("preserves and audits a patient when standalone consent persistence fails", async () => {
        setStandaloneMongoMock();
        const newPatientId = new mongoose.Types.ObjectId();
        Patient.find = (() => ({
            select: () => ({
                limit: () => ({ lean: async () => [] })
            })
        })) as typeof Patient.find;
        Patient.create = (async () => ({
            ...activePatient,
            _id: newPatientId,
            id: newPatientId.toString()
        })) as typeof Patient.create;
        let deleteCalls = 0;
        Patient.deleteOne = (async () => {
            deleteCalls += 1;
            return { deletedCount: 1 };
        }) as typeof Patient.deleteOne;
        Consent.create = (async () => {
            throw new Error("Simulated consent persistence failure.");
        }) as typeof Consent.create;
        let auditRecord: Record<string, unknown> | undefined;
        AuditLog.create = (async (input: Record<string, unknown>) => {
            auditRecord = input;
            return input;
        }) as typeof AuditLog.create;
        let forwardedError: unknown;

        await createPatient(
            {
                body: validRegistration(),
                user: {
                    id: actorId,
                    role: "MEDICAL_OFFICER",
                    assignedPHCId: "PHC-1",
                    mandal: "Paderu"
                },
                ip: "127.0.0.1",
                get: () => undefined
            } as never,
            {} as never,
            ((error: unknown) => {
                forwardedError = error;
            }) as never
        );

        assert.equal(deleteCalls, 0);
        assert.equal(
            (forwardedError as { patientId?: string }).patientId,
            newPatientId.toString()
        );
        assert.equal(
            (forwardedError as { statusCode?: number }).statusCode,
            503
        );
        assert.equal(auditRecord?.action, "PATIENT_REGISTRATION_CONSENT_FAILED");
        assert.equal(auditRecord?.outcome, "FAILURE");
        assert.equal(
            (auditRecord?.patient as mongoose.Types.ObjectId).toString(),
            newPatientId.toString()
        );
    });

    it("creates the patient and registration consent together on standalone MongoDB", async () => {
        setStandaloneMongoMock();
        Patient.find = (() => ({
            select: () => ({
                limit: () => ({ lean: async () => [] })
            })
        })) as typeof Patient.find;
        const newPatientId = new mongoose.Types.ObjectId();
        Patient.create = (async () => ({
            ...activePatient,
            _id: newPatientId,
            id: newPatientId.toString(),
            patientId: "AD-SYNTHETIC"
        })) as typeof Patient.create;
        let consent: Record<string, unknown> | undefined;
        Consent.create = (async (input: Record<string, unknown>) => {
            consent = input;
            return input;
        }) as typeof Consent.create;

        const result = await registerPatient(validRegistration() as never, actorId);

        assert.equal(result.success, true);
        assert.equal(consent?.patient, newPatientId);
        assert.equal(consent?.purpose, "PATIENT_REGISTRATION");
        assert.equal(consent?.recordedBy?.toString(), actorId);
    });

    it("serializes concurrent registrations with matching demographics without a demographic unique index", async () => {
        setStandaloneMongoMock();
        const newPatientId = new mongoose.Types.ObjectId();
        let patientCreateCount = 0;
        Patient.find = (() => ({
            select: () => ({
                limit: () => ({ lean: async () => [] })
            })
        })) as typeof Patient.find;
        Patient.create = (async () => {
            patientCreateCount += 1;
            return {
                ...activePatient,
                _id: newPatientId,
                id: newPatientId.toString(),
                patientId: "AD-CONCURRENT-SYNTHETIC"
            };
        }) as typeof Patient.create;
        Consent.create = (async (input: Record<string, unknown>) => input) as typeof Consent.create;

        const attempts = await Promise.allSettled([
            registerPatient(validRegistration() as never, actorId),
            registerPatient(validRegistration() as never, actorId)
        ]);
        const successfulRegistrations = attempts.filter(
            (attempt) => attempt.status === "fulfilled" && attempt.value.success
        );

        assert.equal(patientCreateCount, 1);
        assert.equal(successfulRegistrations.length, 1);
        assert.equal(inMemoryLocks.size, 0);
    });
});

describe("oral-screening consent", () => {
    it("preserves patient, ASHA, and Medical Officer scopes when reading consent history", async () => {
        const medicalOfficerId = new mongoose.Types.ObjectId().toString();
        const scopes = [
            {
                actor: { id: actorId, role: "PATIENT" },
                expected: { user: new mongoose.Types.ObjectId(actorId) }
            },
            {
                actor: { id: ashaId.toString(), role: "ASHA_WORKER" },
                expected: {
                    assignedASHAWorker: new mongoose.Types.ObjectId(ashaId)
                }
            },
            {
                actor: {
                    id: medicalOfficerId,
                    role: "MEDICAL_OFFICER",
                    assignedPHCId: "PHC-1",
                    mandal: "Paderu",
                    district: "Alluri Sitharama Raju"
                },
                expected: {
                    "address.phcId": "PHC-1",
                    "address.mandal": "Paderu",
                    "address.district": "Alluri Sitharama Raju"
                }
            }
        ];
        let capturedPatientFilter: Record<string, unknown> | undefined;
        Patient.findOne = ((filter: Record<string, unknown>) => {
            capturedPatientFilter = filter;
            return {
                select: async () => ({ _id: patientId })
            };
        }) as typeof Patient.findOne;
        Consent.find = ((filter: Record<string, unknown>) => ({
            sort: () => ({
                lean: async () => {
                    assert.deepEqual(filter, { patient: patientId });
                    return [];
                }
            })
        })) as typeof Consent.find;

        for (const { actor, expected } of scopes) {
            const accessFilter = await getPatientAccessFilter(actor);
            assert.deepEqual(accessFilter, expected);
            await getPatientConsents(patientId.toString(), accessFilter);
            assert.deepEqual(
                capturedPatientFilter?.$and,
                [
                    expected,
                    {
                        _id: patientId,
                        registrationStatus: "ACTIVE"
                    }
                ]
            );
        }
    });

    it("denies consent read scopes for roles without patient-record access", async () => {
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

    it("blocks unauthorized roles at each consent route role guard", () => {
        const cases = [
            {
                allowed: ["PATIENT", "ASHA_WORKER", "MEDICAL_OFFICER"],
                denied: "SPECIALIST"
            },
            {
                allowed: ["ASHA_WORKER", "MEDICAL_OFFICER"],
                denied: "PATIENT"
            },
            {
                allowed: ["PATIENT", "ASHA_WORKER", "MEDICAL_OFFICER"],
                denied: "ADMIN"
            }
        ] as const;

        for (const { allowed, denied } of cases) {
            let responseCode = 0;
            let proceeded = false;
            const guard = authorizeRoles(...allowed);
            guard(
                { user: { id: actorId, role: denied } } as never,
                {
                    status(code: number) {
                        responseCode = code;
                        return this;
                    },
                    json() {
                        return this;
                    }
                } as never,
                (() => {
                    proceeded = true;
                }) as never
            );
            assert.equal(responseCode, 403);
            assert.equal(proceeded, false);
        }
    });

    it("records consent for an in-scope patient and prevents unauthorized recorders", async () => {
        Patient.findOne = (() => ({
            select: async () => ({ _id: patientId })
        })) as typeof Patient.findOne;
        let storedConsent: Record<string, unknown> | undefined;
        Consent.findOne = (() => ({
            sort: async () => null
        })) as typeof Consent.findOne;
        Consent.create = (async (input: Record<string, unknown>) => {
            storedConsent = input;
            return input;
        }) as typeof Consent.create;

        const consent = await recordOralScreeningConsent(
            patientId.toString(),
            { consentVersion: "oral-v1", language: "TELUGU" },
            { assignedASHAWorker: new mongoose.Types.ObjectId(actorId) },
            { id: actorId, role: "ASHA_WORKER" }
        );

        assert.equal(storedConsent?.purpose, "ORAL_SCREENING");
        assert.equal(storedConsent?.granted, true);
        assert.equal(storedConsent?.recordedBy?.toString(), actorId);
        assert.equal(consent, storedConsent);
        await assert.rejects(
            recordOralScreeningConsent(
                patientId.toString(),
                { consentVersion: "oral-v1", language: "TELUGU" },
                {},
                { id: actorId, role: "ADMIN" }
            ),
            { statusCode: 403 }
        );
        await assert.rejects(
            withdrawOralScreeningConsent(
                patientId.toString(),
                "Unauthorized request",
                {},
                { id: actorId, role: "ADMIN" }
            ),
            { statusCode: 403 }
        );
    });

    it("records withdrawal as a new event and treats missing consent as not granted", async () => {
        Patient.findOne = (() => ({
            select: async () => ({ _id: patientId })
        })) as typeof Patient.findOne;
        Consent.findOne = (() => ({
            sort: () => ({
                granted: true,
                consentVersion: "oral-v1",
                language: "ENGLISH",
                select: async () => null
            })
        })) as typeof Consent.findOne;
        let withdrawal: Record<string, unknown> | undefined;
        Consent.create = (async (input: Record<string, unknown>) => {
            withdrawal = input;
            return input;
        }) as typeof Consent.create;

        await withdrawOralScreeningConsent(
            patientId.toString(),
            "Patient requested withdrawal",
            { assignedASHAWorker: ashaId },
            { id: actorId, role: "ASHA_WORKER" }
        );

        assert.equal(withdrawal?.granted, false);
        assert.equal(withdrawal?.withdrawnAt instanceof Date, true);
        assert.equal(withdrawal?.withdrawalReason, "Patient requested withdrawal");
        assert.equal(
            await hasCurrentOralScreeningConsent(patientId),
            false
        );
    });

    it("serializes concurrent consent grants", async () => {
        const events: Record<string, unknown>[] = [];
        const mixedCasePatientId = "ABCDEF0123456789ABCDEF01";
        Patient.findOne = (() => ({
            select: async () => ({ _id: patientId })
        })) as typeof Patient.findOne;
        Consent.findOne = (() => {
            const query: {
                sort: () => typeof query;
                then: (resolve: (value: unknown) => unknown) => Promise<unknown>;
            } = {
                sort: () => query,
                then: (resolve) => Promise.resolve(events.at(-1)).then(resolve)
            };
            return query as never;
        }) as typeof Consent.findOne;
        Consent.create = (async (input: Record<string, unknown>) => {
            events.push(input);
            return input;
        }) as typeof Consent.create;

        const attempts = await Promise.allSettled([
            recordOralScreeningConsent(
                mixedCasePatientId.toLowerCase(),
                { consentVersion: "race-v1", language: "ENGLISH" },
                {},
                { id: actorId, role: "MEDICAL_OFFICER" }
            ),
            recordOralScreeningConsent(
                mixedCasePatientId.toUpperCase(),
                { consentVersion: "race-v1", language: "ENGLISH" },
                {},
                { id: actorId, role: "MEDICAL_OFFICER" }
            )
        ]);

        assert.equal(attempts.filter((attempt) => attempt.status === "fulfilled").length, 1);
        assert.equal(events.length, 1);
        assert.equal(events[0].granted, true);
        assert.equal(inMemoryLocks.size, 0);
        assert.deepEqual(
            workflowLockKeys,
            [
                `oral-consent:${mixedCasePatientId.toLowerCase()}`,
                `oral-consent:${mixedCasePatientId.toLowerCase()}`
            ]
        );
    });

    it("prevents screening and consent withdrawal from both committing concurrently", async () => {
        const mixedCasePatientId = "ABCDEF0123456789ABCDEF01";
        let currentConsent: Record<string, unknown> = {
            granted: true,
            consentVersion: "race-v1",
            language: "ENGLISH"
        };
        Patient.findOne = (() => ({
            select: async () => ({ _id: patientId })
        })) as typeof Patient.findOne;
        Consent.findOne = (() => {
            const query: {
                sort: () => typeof query;
                select: () => Promise<unknown>;
                then: (resolve: (value: unknown) => unknown) => Promise<unknown>;
            } = {
                sort: () => query,
                select: async () => currentConsent,
                then: (resolve) => Promise.resolve(currentConsent).then(resolve)
            };
            return query as never;
        }) as typeof Consent.findOne;
        Consent.create = (async (input: Record<string, unknown>) => {
            currentConsent = input;
            return input;
        }) as typeof Consent.create;
        let screeningCreateCount = 0;
        Screening.create = (async (input: Record<string, unknown>) => {
            screeningCreateCount += 1;
            return input;
        }) as typeof Screening.create;

        const attempts = await Promise.allSettled([
            createScreening({
                patientId: mixedCasePatientId.toUpperCase(),
                screenedBy: actorId,
                examinationFindings: [{
                    bodySite: "TONGUE",
                    observation: "Synthetic concurrent observation"
                }]
            }),
            withdrawOralScreeningConsent(
                mixedCasePatientId.toLowerCase(),
                "Synthetic concurrent withdrawal",
                {},
                { id: actorId, role: "MEDICAL_OFFICER" }
            )
        ]);
        const screeningCommitted = attempts[0].status === "fulfilled";
        const withdrawalCommitted = attempts[1].status === "fulfilled";

        assert.equal(screeningCommitted && withdrawalCommitted, false);
        assert.equal(screeningCreateCount, screeningCommitted ? 1 : 0);
        if (withdrawalCommitted) {
            assert.equal(currentConsent.granted, false);
            assert.equal(screeningCreateCount, 0);
        }
        assert.equal(inMemoryLocks.size, 0);
        assert.deepEqual(
            workflowLockKeys,
            [
                `oral-consent:${mixedCasePatientId.toLowerCase()}`,
                `oral-consent:${mixedCasePatientId.toLowerCase()}`
            ]
        );
    });

    describe("patient list and geography regressions", () => {
        it("keeps the assigned-ASHA and registration-status projection fields separate", async () => {
            let projection = "";
            Patient.find = (() => ({
                select: (value: string) => {
                    projection = value;
                    return {
                        populate: () => ({
                            sort: () => ({
                                skip: () => ({
                                    limit: () => ({
                                        lean: async () => []
                                    })
                                })
                            })
                        })
                    };
                }
            })) as typeof Patient.find;
            Patient.countDocuments = (async () => 0) as typeof Patient.countDocuments;

            await listPatients({}, 1, 10);

            assert.match(projection, /assignedASHAWorker\s+registrationStatus/);
        });

        it("uses the canonical district fallback for Medical Officer patient access", async () => {
            const filter = await getPatientAccessFilter({
                id: actorId,
                role: "MEDICAL_OFFICER",
                assignedPHCId: "PHC-1",
                mandal: "Paderu"
            });

            assert.equal(filter["address.district"], "Alluri Sitharama Raju");
        });
    });
});

describe("ASHA assignment and screening workflow", () => {
    it("denies ASHA users assigning patients and rejects patients outside the officer's PHC", async () => {
        await assert.rejects(
            assignPatientToASHA(
                patientId.toString(),
                ashaId.toString(),
                { id: actorId, role: "ASHA_WORKER" }
            ),
            { statusCode: 403 }
        );
        Patient.findOne = (async () => null) as typeof Patient.findOne;

        await assert.rejects(
            assignPatientToASHA(
                patientId.toString(),
                ashaId.toString(),
                {
                    id: actorId,
                    role: "MEDICAL_OFFICER",
                    assignedPHCId: "PHC-OTHER",
                    mandal: "Paderu",
                    district: "Alluri Sitharama Raju"
                }
            ),
            { statusCode: 404 }
        );
    });

    it("assigns only an active ASHA Worker from the same PHC, mandal, and district", async () => {
        Patient.findOne = (async () => ({
            ...activePatient,
            assignedASHAWorker: undefined,
            save: async function () {
                return this;
            }
        })) as typeof Patient.findOne;
        let ashaQuery: Record<string, unknown> | undefined;
        User.findOne = ((filter: Record<string, unknown>) => {
            ashaQuery = filter;
            return {
                select: async () => ({
                    _id: ashaId,
                    id: ashaId.toString(),
                    fullName: "Synthetic ASHA",
                    assignedPHCId: "PHC-1",
                    mandal: "Paderu",
                    district: "Alluri Sitharama Raju"
                })
            };
        }) as typeof User.findOne;

        const result = await assignPatientToASHA(
            patientId.toString(),
            ashaId.toString(),
            {
                id: actorId,
                role: "MEDICAL_OFFICER",
                assignedPHCId: "PHC-1",
                mandal: "Paderu",
                district: "Alluri Sitharama Raju"
            }
        );

        assert.equal(result.patient.assignedASHAWorker?.toString(), ashaId.toString());
        assert.equal(ashaQuery?.role, "ASHA_WORKER");
        assert.equal(ashaQuery?.isActive, true);
        assert.equal(ashaQuery?.assignedPHCId, "PHC-1");
        assert.equal(ashaQuery?.mandal, "Paderu");
        assert.equal(ashaQuery?.district, "Alluri Sitharama Raju");

        User.findOne = (() => ({
            select: async () => null
        })) as typeof User.findOne;
        await assert.rejects(
            assignPatientToASHA(
                patientId.toString(),
                ashaId.toString(),
                {
                    id: actorId,
                    role: "MEDICAL_OFFICER",
                    assignedPHCId: "PHC-1",
                    mandal: "Paderu",
                    district: "Alluri Sitharama Raju"
                }
            ),
            { statusCode: 404 }
        );
    });

    it("requires active screening consent and persists observations without image URLs", async () => {
        let patientQuery: Record<string, unknown> | undefined;
        Patient.findOne = ((filter: Record<string, unknown>) => {
            patientQuery = filter;
            return { select: async () => ({ _id: patientId }) };
        }) as typeof Patient.findOne;
        Consent.findOne = (() => ({
            sort: () => ({
                select: async () => ({ granted: true })
            })
        })) as typeof Consent.findOne;
        let screeningDocument: Record<string, unknown> | undefined;
        Screening.create = (async (input: Record<string, unknown>) => {
            screeningDocument = input;
            return input;
        }) as typeof Screening.create;

        await createScreening(
            {
                patientId: patientId.toString(),
                screenedBy: actorId,
                screeningDate: new Date("2026-11-07T10:00:00Z"),
                examinationFindings: [{
                    bodySite: "LEFT_CHEEK",
                    observation: "Synthetic observation"
                }],
                notes: "Synthetic workflow test"
            },
            { assignedASHAWorker: new mongoose.Types.ObjectId(actorId) }
        );
        assert.equal(screeningDocument?.screenedBy, actorId);
        assert.equal(screeningDocument?.clinicalStatus, undefined);
        assert.equal("imageUrl" in (screeningDocument ?? {}), false);
        assert.deepEqual(
            (patientQuery?.$and as Record<string, unknown>[])[0],
            { assignedASHAWorker: new mongoose.Types.ObjectId(actorId) }
        );
    });

    it("keeps Specialist history inside the referral patient scope", async () => {
        let filter: Record<string, unknown> | undefined;
        Patient.findOne = ((query: Record<string, unknown>) => {
            filter = query;
            return {
                select: async () => null
            };
        }) as typeof Patient.findOne;

        await assert.rejects(
            getPatientScreeningHistory(
                patientId.toString(),
                {
                    _id: { $in: [new mongoose.Types.ObjectId(actorId)] },
                    registrationStatus: "ACTIVE"
                }
            ),
            /not found or access denied/
        );
        const andFilter = filter?.$and as Record<string, unknown>[];
        assert.equal("_id" in andFilter[0], true);
        assert.deepEqual(
            (andFilter[0]._id as { $in: mongoose.Types.ObjectId[] }).$in[0].toString(),
            actorId
        );
    });

    it("restricts clinical reviews to authorized roles and assigned Specialist referrals", async () => {
        Screening.findById = (() => ({
            select: async () => ({
                _id: patientId,
                patient: patientId
            })
        })) as typeof Screening.findById;
        Patient.findOne = (() => ({
            select: async () => ({ _id: patientId })
        })) as typeof Patient.findOne;
        let referralQuery: Record<string, unknown> | undefined;
        Referral.exists = (async (filter: Record<string, unknown>) => {
            referralQuery = filter;
            return null;
        }) as typeof Referral.exists;

        await assert.rejects(
            createClinicalReview(
                {
                    screeningId: patientId.toString(),
                    reviewedBy: actorId,
                    reviewerRole: "SPECIALIST",
                    decision: "AGREE",
                    clinicalObservations: "Synthetic observation",
                    referralRecommended: false
                },
                {}
            ),
            { statusCode: 403 }
        );
        assert.equal(
            (referralQuery?.assignedSpecialist as mongoose.Types.ObjectId).toString(),
            actorId
        );
        await assert.rejects(
            createClinicalReview(
                {
                    screeningId: patientId.toString(),
                    reviewedBy: actorId,
                    reviewerRole: "ADMIN"
                } as never,
                {}
            ),
            { statusCode: 403 }
        );
    });

    it("prevents duplicate reviews and atomically updates the screening status", async () => {
        setStandaloneMongoMock();
        Screening.findById = (() => ({
            select: async () => ({
                _id: patientId,
                patient: patientId
            })
        })) as typeof Screening.findById;
        Patient.findOne = (() => ({
            select: async () => ({ _id: patientId })
        })) as typeof Patient.findOne;
        ClinicalReview.findOne = (() => ({
            select: async () => ({ _id: new mongoose.Types.ObjectId() })
        })) as typeof ClinicalReview.findOne;
        let created = false;
        ClinicalReview.create = (async () => {
            created = true;
            return {} as never;
        }) as typeof ClinicalReview.create;

        await assert.rejects(
            createClinicalReview(
                {
                    screeningId: patientId.toString(),
                    reviewedBy: actorId,
                    reviewerRole: "MEDICAL_OFFICER",
                    decision: "AGREE",
                    clinicalObservations: "Synthetic observation",
                    referralRecommended: false
                },
                {}
            ),
            { statusCode: 409 }
        );
        assert.equal(created, false);

        ClinicalReview.findOne = (() => ({
            select: async () => null
        })) as typeof ClinicalReview.findOne;
        let persistedReview: Record<string, unknown> | undefined;
        ClinicalReview.create = (async (input: Record<string, unknown>) => {
            persistedReview = input;
            return input;
        }) as typeof ClinicalReview.create;
        let update: Record<string, unknown> | undefined;
        Screening.findByIdAndUpdate = (async (
            _id: mongoose.Types.ObjectId,
            values: Record<string, unknown>
        ) => {
            update = values;
            return { _id };
        }) as typeof Screening.findByIdAndUpdate;

        await createClinicalReview(
            {
                screeningId: patientId.toString(),
                reviewedBy: actorId,
                reviewerRole: "MEDICAL_OFFICER",
                decision: "DEFER",
                clinicalObservations: "Needs additional review",
                referralRecommended: false
            },
            {}
        );
        assert.equal((persistedReview?._id as mongoose.Types.ObjectId).toString().length, 24);
        assert.equal(update?.screeningStatus, "REQUIRES_REVIEW");

        ClinicalReview.create = (async (input: Record<string, unknown>) => {
            persistedReview = input;
            return input;
        }) as typeof ClinicalReview.create;
        Screening.findByIdAndUpdate = (async () => {
            throw new Error("Simulated screening status failure.");
        }) as typeof Screening.findByIdAndUpdate;
        let rolledBackId: mongoose.Types.ObjectId | undefined;
        ClinicalReview.deleteOne = (async (filter: { _id: mongoose.Types.ObjectId }) => {
            rolledBackId = filter._id;
            return { deletedCount: 1 };
        }) as typeof ClinicalReview.deleteOne;

        await assert.rejects(
            createClinicalReview(
                {
                    screeningId: patientId.toString(),
                    reviewedBy: actorId,
                    reviewerRole: "MEDICAL_OFFICER",
                    decision: "AGREE",
                    clinicalObservations: "Synthetic observation",
                    referralRecommended: false
                },
                {}
            ),
            /Simulated screening status failure/
        );
        assert.equal(
            rolledBackId?.toString(),
            (persistedReview?._id as mongoose.Types.ObjectId).toString()
        );
    });

    it("limits the Medical Officer review queue to the caller's patient scope", async () => {
        let patientFilter: Record<string, unknown> | undefined;
        Patient.find = ((filter: Record<string, unknown>) => {
            patientFilter = filter;
            return {
                select: () => ({
                    lean: async () => [{ _id: patientId }]
                })
            };
        }) as typeof Patient.find;
        const screening = {
            _id: new mongoose.Types.ObjectId(),
            patient: patientId,
            screeningStatus: "PENDING"
        };
        Screening.find = (() => ({
            populate: () => ({
                populate: () => ({
                    sort: () => ({
                        skip: () => ({
                            limit: () => ({
                                lean: async () => [screening]
                            })
                        })
                    })
                })
            })
        })) as typeof Screening.find;
        Screening.countDocuments = (async () => 1) as typeof Screening.countDocuments;
        ClinicalReview.find = (() => ({
            populate: () => ({
                sort: () => ({
                    lean: async () => []
                })
            })
        })) as typeof ClinicalReview.find;

        const result = await getMedicalOfficerReviewQueue(
            { "address.phcId": "PHC-1" },
            1,
            20
        );

        assert.deepEqual(
            (patientFilter?.$and as Record<string, unknown>[])[0],
            { "address.phcId": "PHC-1" }
        );
        assert.equal(result.screenings[0].clinicalReviews.length, 0);
    });
});
