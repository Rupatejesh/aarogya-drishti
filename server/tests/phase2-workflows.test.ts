import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { afterEach, describe, it } from "node:test";
import mongoose from "mongoose";
import ClinicalReview from "../src/models/ClinicalReview";
import DiagnosticOrder from "../src/models/DiagnosticOrder";
import FollowUp from "../src/models/FollowUp";
import OwnershipClaim from "../src/models/OwnershipClaim";
import Patient from "../src/models/Patient";
import Referral from "../src/models/Referral";
import Screening from "../src/models/Screening";
import User from "../src/models/User";
import WorkflowLock from "../src/models/WorkflowLock";
import { claimPatientAccount, issueOwnershipClaim } from "../src/services/ownership-claim.service";
import { createReferral } from "../src/services/referral.service";
import { recordDiagnosticResult } from "../src/services/diagnostic.service";
import { createFollowUp } from "../src/services/follow-up.service";
import {
    buildSuppressedPeriods,
    getAggregateDashboard,
    getAggregateScope
} from "../src/services/aggregate-dashboard.service";

const originalPatientFindOne = Patient.findOne;
const originalPatientFindOneAndUpdate = Patient.findOneAndUpdate;
const originalScreeningFindById = Screening.findById;
const originalClinicalReviewFindOne = ClinicalReview.findOne;
const originalUserFindOne = User.findOne;
const originalReferralCreate = Referral.create;
const originalDiagnosticOrderFindById = DiagnosticOrder.findById;
const originalDiagnosticOrderFindOneAndUpdate = DiagnosticOrder.findOneAndUpdate;
const originalFollowUpCreate = FollowUp.create;
const originalPatientAggregate = Patient.aggregate;
const originalOwnershipClaimCreate = OwnershipClaim.create;
const originalOwnershipClaimFindOne = OwnershipClaim.findOne;
const originalOwnershipClaimUpdateMany = OwnershipClaim.updateMany;
const originalOwnershipClaimUpdateOne = OwnershipClaim.updateOne;
const originalWorkflowLockCreate = WorkflowLock.create;
const originalWorkflowLockDeleteOne = WorkflowLock.deleteOne;

const lockOwners = new Map<string, string>();

afterEach(() => {
    Patient.findOne = originalPatientFindOne;
    Patient.findOneAndUpdate = originalPatientFindOneAndUpdate;
    Screening.findById = originalScreeningFindById;
    ClinicalReview.findOne = originalClinicalReviewFindOne;
    User.findOne = originalUserFindOne;
    Referral.create = originalReferralCreate;
    DiagnosticOrder.findById = originalDiagnosticOrderFindById;
    DiagnosticOrder.findOneAndUpdate = originalDiagnosticOrderFindOneAndUpdate;
    FollowUp.create = originalFollowUpCreate;
    Patient.aggregate = originalPatientAggregate;
    OwnershipClaim.create = originalOwnershipClaimCreate;
    OwnershipClaim.findOne = originalOwnershipClaimFindOne;
    OwnershipClaim.updateMany = originalOwnershipClaimUpdateMany;
    OwnershipClaim.updateOne = originalOwnershipClaimUpdateOne;
    WorkflowLock.create = originalWorkflowLockCreate;
    WorkflowLock.deleteOne = originalWorkflowLockDeleteOne;
    lockOwners.clear();
});

const patientId = new mongoose.Types.ObjectId();
const clinicianId = new mongoose.Types.ObjectId();
const screeningId = new mongoose.Types.ObjectId();
const workerId = new mongoose.Types.ObjectId();
const patient = {
    _id: patientId,
    address: {
        village: "Synthetic Village",
        mandal: "Paderu",
        phcId: "PHC-TEST",
        district: "Alluri Sitharama Raju"
    }
};

const withSelect = <T>(value: T) => ({
    select: async () => value
});

describe("Phase 2 workflows", () => {
    it("issues hashed in-person claim codes and binds use to the claim's patient", async () => {
        WorkflowLock.create = (async (input: { _id: string; owner: string }) => {
            lockOwners.set(input._id, input.owner);
            return input;
        }) as typeof WorkflowLock.create;
        WorkflowLock.deleteOne = (async (filter: { _id: string; owner: string }) => {
            const matches = lockOwners.get(filter._id) === filter.owner;
            if (matches) lockOwners.delete(filter._id);
            return { deletedCount: matches ? 1 : 0 };
        }) as typeof WorkflowLock.deleteOne;
        Patient.findOne = (() => withSelect(patient)) as typeof Patient.findOne;

        let savedClaim: Record<string, unknown> | undefined;
        OwnershipClaim.updateMany = (async () => ({ modifiedCount: 0 })) as typeof OwnershipClaim.updateMany;
        OwnershipClaim.create = (async (input: Record<string, unknown>) => {
            savedClaim = input;
            return { ...input, _id: new mongoose.Types.ObjectId() };
        }) as typeof OwnershipClaim.create;

        const issued = await issueOwnershipClaim(
            patientId.toString(),
            clinicianId.toString(),
            "MEDICAL_OFFICER",
            {}
        );
        assert.ok(savedClaim);
        assert.equal(savedClaim.verificationMethod, "IN_PERSON");
        assert.equal(
            savedClaim.codeHash,
            createHash("sha256").update(issued.claimCode).digest("hex")
        );
        assert.equal(savedClaim.codeHash === issued.claimCode, false);

        const claimId = new mongoose.Types.ObjectId();
        const claim = {
            _id: claimId,
            patient: patientId,
            claimedBy: undefined,
            claimedAt: undefined
        };
        OwnershipClaim.findOne = ((filter: Record<string, unknown>) => {
            if ("codeHash" in filter) {
                return withSelect({ _id: claimId, patient: patientId });
            }
            return Promise.resolve(claim);
        }) as typeof OwnershipClaim.findOne;
        OwnershipClaim.updateOne = (async () => ({ modifiedCount: 1 })) as typeof OwnershipClaim.updateOne;
        Patient.findOneAndUpdate = (() => withSelect({
            _id: patientId,
            patientId: "AD-SYNTHETIC"
        })) as typeof Patient.findOneAndUpdate;

        await assert.rejects(
            claimPatientAccount(
                issued.claimCode,
                new mongoose.Types.ObjectId().toString(),
                new mongoose.Types.ObjectId().toString()
            ),
            { statusCode: 404 }
        );
        const linked = await claimPatientAccount(
            issued.claimCode,
            new mongoose.Types.ObjectId().toString(),
            patientId.toString()
        );
        assert.equal(linked.patientId, "AD-SYNTHETIC");
    });

    it("creates a referral only from a reviewed clinician recommendation", async () => {
        Screening.findById = (() => withSelect({
            _id: screeningId,
            patient: patientId
        })) as typeof Screening.findById;
        Patient.findOne = (() => withSelect(patient)) as typeof Patient.findOne;
        ClinicalReview.findOne = (() => withSelect({
            _id: new mongoose.Types.ObjectId(),
            reviewedBy: clinicianId
        })) as typeof ClinicalReview.findOne;
        User.findOne = (() => withSelect({ _id: clinicianId })) as typeof User.findOne;
        let created: Record<string, unknown> | undefined;
        Referral.create = (async (input: Record<string, unknown>) => {
            created = input;
            return input;
        }) as typeof Referral.create;

        await createReferral({
            screeningId: screeningId.toString(),
            createdBy: clinicianId.toString(),
            referralReason: "Synthetic clinician recommendation",
            priority: "ROUTINE",
            referredTo: "Synthetic facility",
            facilityName: "Synthetic facility"
        }, {}, {
            userId: clinicianId.toString(),
            role: "MEDICAL_OFFICER"
        });

        assert.ok(created);
        assert.equal(created.status, "CREATED");
        assert.equal((created.statusHistory as { status: string }[])[0].status, "CREATED");
        assert.equal((created.assignmentHistory as unknown[]).length, 0);
    });

    it("records diagnostic results only after report receipt and within patient scope", async () => {
        const diagnosticId = new mongoose.Types.ObjectId();
        DiagnosticOrder.findById = (() => withSelect({
            _id: diagnosticId,
            patient: patientId,
            screening: screeningId,
            referral: undefined,
            status: "REPORT_RECEIVED"
        })) as typeof DiagnosticOrder.findById;
        Patient.findOne = (() => withSelect(patient)) as typeof Patient.findOne;
        let updateFilter: Record<string, unknown> | undefined;
        DiagnosticOrder.findOneAndUpdate = (async (filter: Record<string, unknown>) => {
            updateFilter = filter;
            return { _id: diagnosticId, status: "REPORT_RECEIVED" };
        }) as typeof DiagnosticOrder.findOneAndUpdate;

        const updated = await recordDiagnosticResult(
            diagnosticId.toString(),
            "Synthetic result recorded by an authorized clinician.",
            { id: clinicianId.toString(), role: "MEDICAL_OFFICER" },
            {}
        );
        assert.equal(updated.status, "REPORT_RECEIVED");
        assert.deepEqual(updateFilter?.["results.0"], { $exists: false });

        await assert.rejects(
            recordDiagnosticResult(
                diagnosticId.toString(),
                "Not permitted.",
                { id: clinicianId.toString(), role: "PATIENT" },
                {}
            ),
            { statusCode: 403 }
        );
    });

    it("schedules follow-up with an active, geographically assigned worker", async () => {
        Patient.findOne = (() => withSelect(patient)) as typeof Patient.findOne;
        User.findOne = (() => withSelect({ _id: workerId })) as typeof User.findOne;
        let created: Record<string, unknown> | undefined;
        FollowUp.create = (async (input: Record<string, unknown>) => {
            created = input;
            return input;
        }) as typeof FollowUp.create;

        await createFollowUp({
            patientId: patientId.toString(),
            assignedWorkerId: workerId.toString(),
            dueAt: new Date(Date.now() + 60_000).toISOString()
        }, {
            id: clinicianId.toString(),
            role: "MEDICAL_OFFICER"
        }, {});

        assert.ok(created);
        assert.equal(created.status, "PLANNED");
        assert.equal((created.statusHistory as { status: string }[])[0].status, "PLANNED");
    });

    it("suppresses small aggregate counts and scopes reporting roles geographically", async () => {
        const scope = getAggregateScope({
            role: "DISTRICT_OFFICER",
            district: "Alluri Sitharama Raju",
            mandal: "Paderu",
            assignedPHCId: "PHC-TEST"
        });
        assert.deepEqual(scope, {
            "address.district": "Alluri Sitharama Raju",
            "address.mandal": "Paderu",
            "address.phcId": "PHC-TEST"
        });
        assert.deepEqual(
            buildSuppressedPeriods(["2026-01", "2026-02"], new Map([
                ["2026-01", 4],
                ["2026-02", 5]
            ])),
            [
                { period: "2026-01", count: null, suppressed: true },
                { period: "2026-02", count: 5, suppressed: false }
            ]
        );

        Patient.aggregate = (() => ({
            exec: async () => [{ count: 4 }]
        })) as typeof Patient.aggregate;
        const report = await getAggregateDashboard({
            role: "ITDA_PROJECT_OFFICER",
            district: "Alluri Sitharama Raju"
        });
        assert.equal(report.scopeSuppressed, true);
        assert.deepEqual(report.periods, []);
        assert.throws(
            () => getAggregateScope({ role: "ADMIN", district: "Alluri Sitharama Raju" }),
            { statusCode: 403 }
        );
    });
});
