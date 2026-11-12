
import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
    issueCsrfToken,
    login,
    logout,
    register,
    sendOtp,
    verifyOtp
} from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// Limit repeated login attempts from the same IP
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 15,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many login attempts. Please try again after 15 minutes."
    }
});

// POST /api/auth/login
router.get("/csrf", issueCsrfToken);
router.post("/login", loginLimiter, login);
router.post("/register", register);
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/logout", authenticate, logout);

export default router;
