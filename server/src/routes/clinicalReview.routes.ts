
import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";
import { createClinicalReviewRecord } from "../controllers/clinicalReview.controller";

const router = Router();

router.post(
    "/",
    authenticate,
    authorizeRoles("MEDICAL_OFFICER", "SPECIALIST"),
    createClinicalReviewRecord
);

export default router;
