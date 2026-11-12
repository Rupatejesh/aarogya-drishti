import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, describe, it } from "node:test";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import ClinicalReview from "../src/models/ClinicalReview";
import Consent from "../src/models/Consent";
import Patient from "../src/models/Patient";
import Screening from "../src/models/Screening";
import User from "../src/models/User";
import {
    assignPatientToASHA,
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
    getPatientScreeningHistory
} from "../src/services/screening.service";
import { createClinicalReview } from "../src/services/clinicalReview.service";
import { createScreeningRecord } from "../src/controllers/screening.controller";

const expectedDatabaseName = "aarogya_drishti_test";
const testUri = process.env.MONGO_TEST_URI;

if (!testUri?.trim()) {
    throw new Error(
        "Integration tests require MONGO_TEST_URI; no database connection was attempted."
    );
}

const getDatabaseName = (uri: string): string => {
    let parsed: URL;
    try {
        parsed = new URL(uri);
    } catch {
        throw new Error("MONGO_TEST_URI is not a valid MongoDB URI.");
    }

    if (parsed.protocol !== "mongodb:" && parsed.protocol !== "mongodb+srv:") {
        throw new Error("MONGO_TEST_URI must use mongodb:// or mongodb+srv://.");
    }

    const databaseName = decodeURIComponent(parsed.pathname.replace(/^\/+/, ""));
    if (
        databaseName !== expectedDatabaseName ||
        (parsed.searchParams.has("dbName") &&
            parsed.searchParams.get("dbName") !== expectedDatabaseName)
    ) {
        throw new Error(
            `Integration tests require database name ${expectedDatabaseName}; no connection was attempted.`
        );
    }

    return databaseName;
};

const databaseName = getDatabaseName(testUri);
const runId = randomUUID();
const created = {
    users: [] as string[],
    patients: [] as string[],
    consents: [] as string[],
    screenings: [] as string[],
    clinicalReviews: [] as string[]
};

let connected = false;
let supportsTransactions = false;
let registrationUser: InstanceType<typeof User>;
let ashaUser: InstanceType<typeof User>;
let unrelatedAshaUser: InstanceType<typeof User>;
let patientUser: InstanceType<typeof User>;
let unrelatedPatientUser: InstanceType<typeof User>;
let unrelatedMedicalOfficer: InstanceType<typeof User>;
let registeredPatientId = "";
const originalPatientCreate = Patient.create;
const originalConsentCreate = Consent.create;

const createSyntheticUser = async (
    role: "PATIENT" | "ASHA_WORKER" | "MEDICAL_OFFICER",
    label: string,
    scope: {
        phcId?: string;
        mandal?: string;
        district?: string;
    } = {}
) => {
    const user = await User.create({
        fullName: `Synthetic ${label} ${runId}`,
        email: `${label.toLowerCase()}-${runId}@example.test`,
        passwordHash: await bcrypt.hash(
            `Synthetic-Only-${runId}-Password!`,
            4
        ),
        role,
        isActive: true,
        ...(role === "ASHA_WORKER" || role === "MEDICAL_OFFICER"
            ? {
                assignedPHCId: scope.phcId ?? `PHC-TEST-${runId}`,
                mandal: scope.mandal ?? "Paderu",
                district: scope.district ?? "Alluri Sitharama Raju"
            }
            : {})
    });
    created.users.push(user._id.toString());
    return user;
};

const createSyntheticPatient = async (
    createdBy: string,
    patientName: string,
    village: string
) => {
    const registrationConsentCreate = Consent.create;
    Consent.create = (async (...args: Parameters<typeof registrationConsentCreate>) => {
        const result = await registrationConsentCreate.apply(Consent, args);
        const consentDocuments = Array.isArray(result) ? result : [result];
        created.consents.push(
            ...consentDocuments.map((consent) => consent._id.toString())
        );
        return result;
    }) as typeof Consent.create;
    let result: Awaited<ReturnType<typeof registerPatient>>;
    try {
        result = await registerPatient(
            {
                fullName: patientName,
                age: 30,
                sex: "NOT_RECORDED",
                address: {
                    village,
                    mandal: "Paderu",
                    phcId: `PHC-TEST-${runId}`
                },
                exposureHistory: { tobaccoUse: "NOT_RECORDED" },
                consent: {
                    purpose: "PATIENT_REGISTRATION",
                    granted: true,
                    consentVersion: "integration-test-v1",
                    language: "ENGLISH"
                }
            },
            createdBy
        );
    } finally {
        Consent.create = registrationConsentCreate;
    }
    assert.equal(result.success, true);
    if (!result.success) {
        throw new Error("Synthetic test registration was reported as a duplicate.");
    }
    created.patients.push(result.patient.id);
    return result.patient;
};

describe("Phase 2A MongoDB patient workflow integration", () => {
    before(async () => {
        try {
            await mongoose.connect(testUri!, {
                serverSelectionTimeoutMS: 10000
            });
        } catch {
            throw new Error(
                `Could not connect to ${expectedDatabaseName}; MONGO_TEST_URI is withheld.`
            );
        }

        connected = true;
        if (mongoose.connection.name !== expectedDatabaseName) {
            await mongoose.disconnect();
            connected = false;
            throw new Error(
                `Connected database was not ${expectedDatabaseName}; tests aborted.`
            );
        }

        await Promise.all([
            User.init(),
            Patient.init(),
            Consent.init(),
            Screening.init(),
            ClinicalReview.init()
        ]);
        const hello = await mongoose.connection.db!.admin().command({ hello: 1 });
        supportsTransactions =
            typeof hello.setName === "string" || hello.msg === "isdbgrid";
        console.log(
            `MongoDB integration database: ${expectedDatabaseName}; topology: ${
                supportsTransactions ? "transaction-capable" : "standalone"
            }.`
        );
    });

    after(async () => {
        try {
            if (connected) {
                console.log(
                    `Synthetic integration record IDs retained in ${expectedDatabaseName}; no records were deleted:\n${JSON.stringify(created, null, 2)}`
                );
            }
        } finally {
            Patient.create = originalPatientCreate;
            Consent.create = originalConsentCreate;
            if (connected) {
                await mongoose.disconnect();
                connected = false;
            }
        }

    });

    it("persists registration, scoped consent, screening, history, and clinical review", async () => {
        registrationUser = await createSyntheticUser(
            "MEDICAL_OFFICER",
            "medical-officer"
        );
        ashaUser = await createSyntheticUser("ASHA_WORKER", "asha-worker");
        unrelatedAshaUser = await createSyntheticUser(
            "ASHA_WORKER",
            "unrelated-asha-worker"
        );
        patientUser = await createSyntheticUser("PATIENT", "patient");
        unrelatedPatientUser = await createSyntheticUser(
            "PATIENT",
            "unrelated-patient"
        );
        unrelatedMedicalOfficer = await createSyntheticUser(
            "MEDICAL_OFFICER",
            "unrelated-medical-officer",
            { mandal: "Araku Valley" }
        );

        const patient = await createSyntheticPatient(
            registrationUser._id.toString(),
            `Synthetic Patient ${runId}`,
            `Synthetic Village ${runId}`
        );
        registeredPatientId = patient.id;
        const patientDocument = await Patient.findById(registeredPatientId);
        assert.ok(patientDocument);
        assert.match(patientDocument.patientId, /^AD-[A-F0-9-]+$/);

        const registrationConsent = await Consent.findOne({
            patient: patientDocument._id,
            purpose: "PATIENT_REGISTRATION"
        });
        assert.ok(registrationConsent);
        assert.equal(
            registrationConsent.patient.toString(),
            patientDocument._id.toString()
        );
        assert.equal(
            registrationConsent.recordedBy.toString(),
            registrationUser._id.toString()
        );

        patientDocument.user = patientUser._id;
        await patientDocument.save();

        const officerFilter = await getPatientAccessFilter({
            id: registrationUser._id.toString(),
            role: "MEDICAL_OFFICER",
            assignedPHCId: registrationUser.assignedPHCId,
            mandal: registrationUser.mandal,
            district: registrationUser.district
        });
        const patientFilter = await getPatientAccessFilter({
            id: patientUser._id.toString(),
            role: "PATIENT"
        });
        const unrelatedPatientFilter = await getPatientAccessFilter({
            id: unrelatedPatientUser._id.toString(),
            role: "PATIENT"
        });
        const unrelatedAshaFilter = await getPatientAccessFilter({
            id: unrelatedAshaUser._id.toString(),
            role: "ASHA_WORKER"
        });
        const unrelatedOfficerFilter = await getPatientAccessFilter({
            id: unrelatedMedicalOfficer._id.toString(),
            role: "MEDICAL_OFFICER",
            assignedPHCId: unrelatedMedicalOfficer.assignedPHCId,
            mandal: unrelatedMedicalOfficer.mandal,
            district: unrelatedMedicalOfficer.district
        });

        await assert.rejects(
            getPatientConsents(registeredPatientId, unrelatedPatientFilter),
            { statusCode: 404 }
        );
        await assert.rejects(
            getPatientConsents(registeredPatientId, unrelatedAshaFilter),
            { statusCode: 404 }
        );
        await assert.rejects(
            getPatientConsents(registeredPatientId, unrelatedOfficerFilter),
            { statusCode: 404 }
        );
        assert.deepEqual(
            (await getPatientConsents(registeredPatientId, patientFilter)).map(
                (consent) => consent.purpose
            ),
            ["PATIENT_REGISTRATION"]
        );

        await assignPatientToASHA(
            registeredPatientId,
            ashaUser._id.toString(),
            {
                id: registrationUser._id.toString(),
                role: "MEDICAL_OFFICER",
                assignedPHCId: registrationUser.assignedPHCId,
                mandal: registrationUser.mandal,
                district: registrationUser.district
            }
        );
        const ashaFilter = await getPatientAccessFilter({
            id: ashaUser._id.toString(),
            role: "ASHA_WORKER"
        });
        assert.equal(
            (await getPatientConsents(registeredPatientId, ashaFilter)).length,
            1
        );

        const recordedConsent = await recordOralScreeningConsent(
            registeredPatientId,
            {
                consentVersion: "integration-oral-v1",
                language: "ENGLISH"
            },
            officerFilter,
            {
                id: registrationUser._id.toString(),
                role: "MEDICAL_OFFICER"
            }
        );
        created.consents.push(recordedConsent._id.toString());
        assert.equal(recordedConsent.patient.toString(), patientDocument._id.toString());
        assert.equal(
            await hasCurrentOralScreeningConsent(patientDocument._id),
            true
        );
        await assert.rejects(
            recordOralScreeningConsent(
                registeredPatientId,
                {
                    consentVersion: "integration-oral-v1",
                    language: "ENGLISH"
                },
                officerFilter,
                {
                    id: registrationUser._id.toString(),
                    role: "MEDICAL_OFFICER"
                }
            ),
            { statusCode: 409 }
        );

        const withdrawal = await withdrawOralScreeningConsent(
            registeredPatientId,
            "Synthetic integration withdrawal",
            patientFilter,
            { id: patientUser._id.toString(), role: "PATIENT" }
        );
        created.consents.push(withdrawal._id.toString());
        const eventsAfterWithdrawal = await Consent.find({
            patient: patientDocument._id,
            purpose: "ORAL_SCREENING"
        }).sort({ recordedAt: -1, _id: -1 });
        assert.equal(eventsAfterWithdrawal.length, 2);
        assert.equal(eventsAfterWithdrawal[0]._id.toString(), withdrawal._id.toString());
        assert.equal(eventsAfterWithdrawal[0].granted, false);
        assert.equal(eventsAfterWithdrawal[1]._id.toString(), recordedConsent._id.toString());
        assert.equal(eventsAfterWithdrawal[1].granted, true);
        assert.equal(
            await hasCurrentOralScreeningConsent(patientDocument._id),
            false
        );

        await assert.rejects(
            createScreening(
                {
                    patientId: registeredPatientId,
                    screenedBy: ashaUser._id.toString(),
                    examinationFindings: [{
                        bodySite: "TONGUE",
                        observation: "Synthetic integration finding"
                    }]
                },
                ashaFilter
            ),
            { statusCode: 409 }
        );
        const renewedConsent = await recordOralScreeningConsent(
            registeredPatientId,
            {
                consentVersion: "integration-oral-v2",
                language: "ENGLISH"
            },
            officerFilter,
            {
                id: registrationUser._id.toString(),
                role: "MEDICAL_OFFICER"
            }
        );
        created.consents.push(renewedConsent._id.toString());

        await assert.rejects(
            createScreening(
                {
                    patientId: registeredPatientId,
                    screenedBy: ashaUser._id.toString(),
                    examinationFindings: [{
                        bodySite: "TONGUE",
                        observation: "Out-of-scope synthetic finding"
                    }]
                },
                unrelatedPatientFilter
            ),
            /not found or access denied/
        );
        let deniedClinicalStatusCode = 0;
        await createScreeningRecord(
            {
                body: {
                    patientId: registeredPatientId,
                    clinicalStatus: "SUSPICIOUS_FINDING_REQUIRES_REVIEW",
                    examinationFindings: [{
                        bodySite: "TONGUE",
                        observation: "Synthetic attempted clinician status"
                    }]
                },
                user: {
                    id: ashaUser._id.toString(),
                    fullName: ashaUser.fullName,
                    role: "ASHA_WORKER"
                },
                ip: "127.0.0.1",
                get: () => undefined
            } as never,
            {
                status(code: number) {
                    deniedClinicalStatusCode = code;
                    return this;
                },
                json() {
                    return this;
                }
            } as never,
            (() => {
                throw new Error("ASHA clinician-status request unexpectedly continued.");
            }) as never
        );
        assert.equal(deniedClinicalStatusCode, 403);

        const screening = await createScreening(
            {
                patientId: registeredPatientId,
                screenedBy: ashaUser._id.toString(),
                examinationFindings: [{
                    bodySite: "TONGUE",
                    observation: "Synthetic integration finding"
                }],
                symptoms: [{ name: "Synthetic symptom" }]
            },
            ashaFilter
        );
        created.screenings.push(screening._id.toString());
        assert.equal(screening.patient.toString(), patientDocument._id.toString());
        assert.equal(screening.screenedBy.toString(), ashaUser._id.toString());
        assert.equal(screening.screeningStatus, "PENDING");

        const history = await getPatientScreeningHistory(
            registeredPatientId,
            officerFilter
        );
        assert.equal(history.length, 1);
        assert.equal(history[0]._id.toString(), screening._id.toString());
        await assert.rejects(
            getPatientScreeningHistory(
                registeredPatientId,
                unrelatedPatientFilter
            ),
            /not found or access denied/
        );

        const review = await createClinicalReview(
            {
                screeningId: screening._id.toString(),
                reviewedBy: registrationUser._id.toString(),
                reviewerRole: "MEDICAL_OFFICER",
                decision: "AGREE",
                clinicalObservations: "Synthetic clinician assessment",
                referralRecommended: false
            },
            officerFilter
        );
        created.clinicalReviews.push(review._id.toString());
        assert.equal(review.patient.toString(), patientDocument._id.toString());
        assert.equal(review.screening.toString(), screening._id.toString());

        const persistedReview = await ClinicalReview.findById(review._id);
        const persistedScreening = await Screening.findById(screening._id);
        assert.equal(persistedReview?.patient.toString(), patientDocument._id.toString());
        assert.equal(persistedReview?.screening.toString(), screening._id.toString());
        assert.equal(persistedScreening?.screeningStatus, "COMPLETED");
        assert.equal(
            await getPatientConsents(registeredPatientId, officerFilter).then(
                (consents) =>
                    consents.filter((consent) => consent.purpose === "ORAL_SCREENING")
                        .length
            ),
            3
        );
    });

    it("serializes concurrent duplicate registration and oral-consent workflow mutations", async () => {
        const registrationInput = {
            fullName: `Synthetic Race Patient ${runId}`,
            age: 31,
            sex: "NOT_RECORDED" as const,
            address: {
                village: `Synthetic Race Village ${runId}`,
                mandal: "Paderu",
                phcId: `PHC-TEST-${runId}`
            },
            exposureHistory: { tobaccoUse: "NOT_RECORDED" as const },
            consent: {
                purpose: "PATIENT_REGISTRATION" as const,
                granted: true as const,
                consentVersion: "integration-race-v1",
                language: "ENGLISH" as const
            }
        };
        const registrations = await Promise.allSettled([
            registerPatient(registrationInput, registrationUser._id.toString()),
            registerPatient(registrationInput, registrationUser._id.toString())
        ]);
        const successfulRegistrations = registrations.filter(
            (result) => result.status === "fulfilled" && result.value.success
        );
        assert.equal(successfulRegistrations.length, 1);
        const raceRegistration = successfulRegistrations[0];
        if (raceRegistration.status !== "fulfilled" || !raceRegistration.value.success) {
            throw new Error("Concurrent synthetic registration did not persist.");
        }
        created.patients.push(raceRegistration.value.patient.id);
        const registrationConsent = await Consent.findOne({
            patient: raceRegistration.value.patient.id,
            purpose: "PATIENT_REGISTRATION"
        }).select("_id");
        if (registrationConsent) created.consents.push(registrationConsent._id.toString());

        const officerFilter = await getPatientAccessFilter({
            id: registrationUser._id.toString(),
            role: "MEDICAL_OFFICER",
            assignedPHCId: registrationUser.assignedPHCId,
            mandal: registrationUser.mandal,
            district: registrationUser.district
        });
        const patientFilter = await getPatientAccessFilter({
            id: patientUser._id.toString(),
            role: "PATIENT"
        });
        const consentAndScreening = await Promise.allSettled([
            createScreening(
                {
                    patientId: registeredPatientId,
                    screenedBy: ashaUser._id.toString(),
                    examinationFindings: [{
                        bodySite: "TONGUE",
                        observation: "Synthetic concurrent screening observation"
                    }]
                },
                officerFilter
            ),
            withdrawOralScreeningConsent(
                registeredPatientId,
                "Synthetic concurrent withdrawal",
                patientFilter,
                { id: patientUser._id.toString(), role: "PATIENT" }
            )
        ]);
        const screeningResult = consentAndScreening[0];
        const withdrawalResult = consentAndScreening[1];
        assert.equal(
            screeningResult.status === "fulfilled" &&
                withdrawalResult.status === "fulfilled",
            false
        );
        if (screeningResult.status === "fulfilled") {
            created.screenings.push(screeningResult.value._id.toString());
        }
        if (withdrawalResult.status === "fulfilled") {
            created.consents.push(withdrawalResult.value._id.toString());
        }

        if (withdrawalResult.status !== "fulfilled") {
            const withdrawal = await withdrawOralScreeningConsent(
                registeredPatientId,
                "Synthetic sequential withdrawal after concurrency test",
                patientFilter,
                { id: patientUser._id.toString(), role: "PATIENT" }
            );
            created.consents.push(withdrawal._id.toString());
        }

        const grantResults = await Promise.allSettled([
            recordOralScreeningConsent(
                registeredPatientId,
                { consentVersion: "integration-race-v2", language: "ENGLISH" },
                officerFilter,
                { id: registrationUser._id.toString(), role: "MEDICAL_OFFICER" }
            ),
            recordOralScreeningConsent(
                registeredPatientId,
                { consentVersion: "integration-race-v2", language: "ENGLISH" },
                officerFilter,
                { id: registrationUser._id.toString(), role: "MEDICAL_OFFICER" }
            )
        ]);
        const successfulGrants = grantResults.filter(
            (result) => result.status === "fulfilled"
        );
        assert.equal(successfulGrants.length, 1);
        for (const result of successfulGrants) {
            if (result.status === "fulfilled") {
                created.consents.push(result.value._id.toString());
            }
        }
    });

    it("skips destructive standalone rollback verification without cleanup approval", (context) => {
        context.skip(
            "The rollback assertion requires deleting a synthetic patient record; explicit cleanup approval is required."
        );
    });
});
