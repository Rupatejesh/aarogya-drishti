import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";
import { getAggregateDashboardRecord } from "../controllers/aggregate-dashboard.controller";

const router = Router();

router.get(
    "/aggregate",
    authenticate,
    authorizeRoles("DISTRICT_OFFICER", "ITDA_PROJECT_OFFICER"),
    getAggregateDashboardRecord
);

export default router;
