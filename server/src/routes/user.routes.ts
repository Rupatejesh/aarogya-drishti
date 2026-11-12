
import { Router } from "express";
import {
    getMyProfile,
    getASHAWorkersForMedicalOfficer,
    getSpecialists,
    createStaffUser,
    createASHAWorker,
    createITDAProjectOfficer,
    createDistrictOfficer
} from "../controllers/user.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";

const router = Router();

// GET /api/users/me
// Every authenticated role can view its own profile.
router.get(
    "/me",
    authenticate,
    authorizeRoles(
        "PATIENT",
        "ASHA_WORKER",
        "MEDICAL_OFFICER",
        "SPECIALIST",
        "DISTRICT_OFFICER",
        "ITDA_PROJECT_OFFICER",
        "ADMIN"
    ),
    getMyProfile
);

router.get(
    "/asha-workers",
    authenticate,
    authorizeRoles("MEDICAL_OFFICER"),
    getASHAWorkersForMedicalOfficer
);

router.get(
    "/specialists",
    authenticate,
    authorizeRoles(
        "PATIENT",
        "ASHA_WORKER",
        "MEDICAL_OFFICER",
        "SPECIALIST",
        "DISTRICT_OFFICER",
        "ITDA_PROJECT_OFFICER",
        "ADMIN"
    ),
    getSpecialists
);

// POST /api/users/staff
// Only Admin can create Medical Officer and Specialist accounts.
router.post(
    "/staff",
    authenticate,
    authorizeRoles("ADMIN"),
    createStaffUser
);

// POST /api/users/asha-worker
// Only Admin can create ASHA Worker accounts.
router.post(
    "/asha-worker",
    authenticate,
    authorizeRoles("ADMIN"),
    createASHAWorker
);

// POST /api/users/itda-project-officer
// Only Admin can provision the ITDA Project Officer account.
router.post(
    "/itda-project-officer",
    authenticate,
    authorizeRoles("ADMIN"),
    createITDAProjectOfficer
);

router.post(
    "/district-officer",
    authenticate,
    authorizeRoles("ADMIN"),
    createDistrictOfficer
);

export default router;
