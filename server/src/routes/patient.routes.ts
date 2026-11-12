
import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";
import {
    createPatient,
    getPatients,
    getPatient,
    getMyPatientRecord,
    linkPatientAccount,
    assignASHAWorker,
    createPatientOwnershipClaim
} from "../controllers/patient.controller";
import {
    getPatientConsentRecords,
    recordPatientOralScreeningConsent,
    withdrawPatientOralScreeningConsent
} from "../controllers/consent.controller";

const router = Router();

// Patient retrieves only their own linked record.
router.get(
    "/me",
    authenticate,
    authorizeRoles("PATIENT"),
    getMyPatientRecord
);

// Register a patient.
router.post(
    "/",
    authenticate,
    authorizeRoles("ASHA_WORKER", "MEDICAL_OFFICER", "SPECIALIST", "ADMIN"),
    createPatient
);

// List patients within the caller's authorized scope.
router.get(
    "/",
    authenticate,
    authorizeRoles("ASHA_WORKER", "MEDICAL_OFFICER", "SPECIALIST", "DRONE_OPERATOR", "ITDA_PROJECT_OFFICER", "DISTRICT_OFFICER", "ADMIN"),
    getPatients
);

// Assign or update the responsible ASHA Worker.
router.patch(
    "/:id/assign-asha",
    authenticate,
    authorizeRoles("MEDICAL_OFFICER"),
    assignASHAWorker
);

router.post(
    "/:id/ownership-claims",
    authenticate,
    authorizeRoles("MEDICAL_OFFICER"),
    createPatientOwnershipClaim
);

router.get(
    "/:id/consents",
    authenticate,
    authorizeRoles("PATIENT", "ASHA_WORKER", "MEDICAL_OFFICER"),
    getPatientConsentRecords
);

router.post(
    "/:id/consents",
    authenticate,
    authorizeRoles("ASHA_WORKER", "MEDICAL_OFFICER"),
    recordPatientOralScreeningConsent
);

router.post(
    "/:id/consents/:purpose/withdraw",
    authenticate,
    authorizeRoles("PATIENT", "ASHA_WORKER", "MEDICAL_OFFICER"),
    withdrawPatientOralScreeningConsent
);

// Link an existing patient login account.
router.post(
    "/:id/link-account",
    authenticate,
    authorizeRoles("PATIENT"),
    linkPatientAccount
);

// Retrieve one patient record.
router.get(
    "/:id",
    authenticate,
    authorizeRoles(
        "PATIENT",
        "ASHA_WORKER",
        "MEDICAL_OFFICER",
        "SPECIALIST"
    ),
    getPatient
);

export default router;
