import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";
import {
    createReferralRecord,
    getReferralRecords,
    updateReferralStatusRecord,
    assignReferralSpecialistRecord,
    reviewReferralCompletionRecord,
    updateReferralPriorityRecord
} from "../controllers/referral.controller";

const router = Router();

router.get(
    "/",
    authenticate,
    authorizeRoles("MEDICAL_OFFICER", "SPECIALIST"),
    getReferralRecords
);

router.post(
    "/",
    authenticate,
    authorizeRoles("MEDICAL_OFFICER"),
    createReferralRecord
);
router.patch(
    "/:referralId/specialist",
    authenticate,
    authorizeRoles("MEDICAL_OFFICER"),
    assignReferralSpecialistRecord
);
router.post(
    "/:referralId/completion-review",
    authenticate,
    authorizeRoles("MEDICAL_OFFICER"),
    reviewReferralCompletionRecord
);
router.patch(
    "/:referralId/status",
    authenticate,
    authorizeRoles("MEDICAL_OFFICER", "SPECIALIST"),
    updateReferralStatusRecord
);
router.patch(
    "/:referralId/priority",
    authenticate,
    authorizeRoles("MEDICAL_OFFICER", "SPECIALIST"),
    updateReferralPriorityRecord
);
export default router;