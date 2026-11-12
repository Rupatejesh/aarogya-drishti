
import { Router } from "express";

import { authenticate } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";

import {
    createDiagnosticOrderRecord,
    getPatientDiagnosticOrderRecords,
    updateDiagnosticOrderStatusRecord,
    recordDiagnosticResultRecord
} from "../controllers/diagnostic.controller";

const router = Router();

// Create diagnostic order
router.post(
    "/",
    authenticate,
    authorizeRoles("MEDICAL_OFFICER", "SPECIALIST"),
    createDiagnosticOrderRecord
);

// Get diagnostic orders for a patient
router.get(
    "/patient/:patientId",
    authenticate,
    authorizeRoles("PATIENT", "MEDICAL_OFFICER", "SPECIALIST"),
    getPatientDiagnosticOrderRecords
);

// Update diagnostic order status
router.patch(
    "/:diagnosticId/status",
    authenticate,
    authorizeRoles("MEDICAL_OFFICER", "SPECIALIST"),
    updateDiagnosticOrderStatusRecord
);

router.post(
    "/:diagnosticId/result",
    authenticate,
    authorizeRoles("MEDICAL_OFFICER", "SPECIALIST"),
    recordDiagnosticResultRecord
);

export default router;
