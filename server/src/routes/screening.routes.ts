import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";
import { authenticate, optionalAuthenticate } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";
import {
    createScreeningRecord,
    getPatientScreeningHistoryRecord,
    getMedicalOfficerScreeningReviewQueue,
    uploadAndAnalyzeScreeningImageRecord,
    analyzeDirectOralImageRecord
} from "../controllers/screening.controller";

const router = Router();

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (_req, file, cb) => {
        const ext =
            file.mimetype === "image/png" ? ".png" : ".jpg";
        cb(null, `oral-${Date.now()}-${randomUUID().slice(0, 8)}${ext}`);
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 25 * 1024 * 1024
    },
    fileFilter: (_req, file, cb) => {
        if (["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Only JPEG, PNG, and WebP oral photographs are permitted."));
        }
    }
});

router.post(
    "/",
    authenticate,
    authorizeRoles("ASHA_WORKER", "MEDICAL_OFFICER"),
    createScreeningRecord
);

router.post(
    "/analyze-direct",
    optionalAuthenticate,
    upload.single("image"),
    analyzeDirectOralImageRecord
);

router.post(
    "/:screeningId/analyze-image",
    authenticate,
    authorizeRoles(
        "ASHA_WORKER",
        "MEDICAL_OFFICER",
        "SPECIALIST",
        "PATIENT",
        "ITDA_PROJECT_OFFICER",
        "DISTRICT_OFFICER"
    ),
    upload.single("image"),
    uploadAndAnalyzeScreeningImageRecord
);

router.get(
    "/review-queue",
    authenticate,
    authorizeRoles("MEDICAL_OFFICER"),
    getMedicalOfficerScreeningReviewQueue
);

router.get(
    "/patient/:patientId",
    authenticate,
    authorizeRoles(
        "PATIENT",
        "ASHA_WORKER",
        "MEDICAL_OFFICER",
        "SPECIALIST"
    ),
    getPatientScreeningHistoryRecord
);

export default router;
