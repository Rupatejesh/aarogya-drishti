
import express from "express";
import path from "path";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import connectDatabase from "./config/database";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import patientRoutes from "./routes/patient.routes";
import screeningRoutes from "./routes/screening.routes";
import clinicalReviewRoutes from "./routes/clinicalReview.routes";
import referralRoutes from "./routes/referral.routes";
import errorMiddleware from "./middleware/error.middleware";
import diagnosticRoutes from "./routes/diagnostic.routes";
import { createCorsOptions } from "./config/cors";
import { csrfProtection } from "./middleware/csrf.middleware";
import followUpRoutes from "./routes/follow-up.routes";
import aggregateDashboardRoutes from "./routes/aggregate-dashboard.routes";
import hospitalRoutes from "./routes/hospital.routes";
import appointmentRoutes from "./routes/appointment.routes";
import grievanceRoutes from "./routes/grievance.routes";

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(process.cwd(), "server/.env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const app = express();

const PORT = Number(process.env.PORT) || 5000;

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors(createCorsOptions()));
app.use(express.json());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use("/api", csrfProtection);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/screenings", screeningRoutes);
app.use("/api/diagnostics", diagnosticRoutes);
app.use("/api/clinical-reviews", clinicalReviewRoutes);
app.use("/api/referrals", referralRoutes);
app.use("/api/follow-ups", followUpRoutes);
app.use("/api/dashboards", aggregateDashboardRoutes);
app.use("/api/hospitals", hospitalRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/grievances", grievanceRoutes);
app.use(errorMiddleware);

app.get("/", (_req, res) => {
    res.status(200).json({
        success: true,
        message: "AAROGYA DRISHTI API is running!",
        version: "1.0.0"
    });
});

app.get("/api/health", (_req, res) => {
    res.status(200).json({
        success: true,
        status: "healthy",
        message: "Backend server is working correctly."
    });
});

const startServer = async (): Promise<void> => {
    try {
        await connectDatabase();
    } catch (error) {
        console.warn("Database initialization notice (resilient mode active):", error);
    }
    app.listen(PORT, () => {
        console.log(`AAROGYA DRISHTI server running on port ${PORT}`);
    });
};

void startServer();
