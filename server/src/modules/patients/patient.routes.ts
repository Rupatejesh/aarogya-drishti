
import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { authorizeRoles } from "../../middleware/role.middleware";
import {
  createPatient,
  getPatients,
  getPatient,
} from "../../controllers/patient.controller";

const router = Router();

router.use(authenticate);

// Register patients
router.post(
  "/",
  authorizeRoles("ASHA_WORKER", "MEDICAL_OFFICER"),
  createPatient
);

// List patients
router.get(
  "/",
  authorizeRoles(
    "ASHA_WORKER",
    "MEDICAL_OFFICER",
    "SPECIALIST"
  ),
  getPatients
);

// Retrieve an individual patient's record
router.get(
  "/:id",
  authorizeRoles(
    "PATIENT",
    "ASHA_WORKER",
    "MEDICAL_OFFICER",
    "SPECIALIST"
  ),
  getPatient
);

export default router;
