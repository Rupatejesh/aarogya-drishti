import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";
import {
    createFollowUpRecord,
    getPatientFollowUpRecords,
    updateFollowUpRecord
} from "../controllers/follow-up.controller";

const router = Router();

router.post(
    "/",
    authenticate,
    authorizeRoles("ASHA_WORKER", "MEDICAL_OFFICER"),
    createFollowUpRecord
);
router.get(
    "/patient/:patientId",
    authenticate,
    authorizeRoles("PATIENT", "ASHA_WORKER", "MEDICAL_OFFICER", "SPECIALIST"),
    getPatientFollowUpRecords
);
router.patch(
    "/:followUpId",
    authenticate,
    authorizeRoles("ASHA_WORKER", "MEDICAL_OFFICER"),
    updateFollowUpRecord
);

export default router;
