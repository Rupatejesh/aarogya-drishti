
import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User";

dotenv.config();

const ADMIN_EMAIL = "admin@aarogyadrishti.demo";
const EXPECTED_DATABASE = "aarogya_drishti";
const SALT_ROUNDS = 12;

async function resetAdminPassword() {
    let password = process.env.ADMIN_RESET_PASSWORD || "";
    let confirmPassword = process.env.ADMIN_RESET_CONFIRM || "";

    try {
        if (password.length < 12) {
            throw new Error("Password must contain at least 12 characters.");
        }

        if (password !== confirmPassword) {
            throw new Error("Passwords do not match.");
        }

        const mongoUri = process.env.MONGO_URI;

        if (!mongoUri) {
            throw new Error("MONGO_URI is missing.");
        }

        const parsedUri = new URL(mongoUri);
        const databaseName = decodeURIComponent(
            parsedUri.pathname.replace(/^\/+/, "").split("/")[0] || ""
        );

        if (databaseName !== EXPECTED_DATABASE) {
            throw new Error("Refusing to run: MONGO_URI does not target the main application database.");
        }

        await mongoose.connect(mongoUri);

        if (mongoose.connection.name !== EXPECTED_DATABASE) {
            throw new Error("Connected database verification failed.");
        }

        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

        const result = await User.updateOne(
            { email: ADMIN_EMAIL, role: "ADMIN", isActive: true },
            { $set: { passwordHash } }
        );

        if (result.matchedCount !== 1) {
            throw new Error("Active admin account was not found.");
        }

        console.log("Admin password reset successfully.");
        console.log("Database verified: aarogya_drishti");
        console.log("Only the password hash was updated.");
    } catch (error) {
        console.error(
            "Password reset failed:",
            error instanceof Error ? error.message : "Unknown error"
        );
        process.exitCode = 1;
    } finally {
        password = "";
        confirmPassword = "";

        delete process.env.ADMIN_RESET_PASSWORD;
        delete process.env.ADMIN_RESET_CONFIRM;

        await mongoose.disconnect().catch(() => undefined);
    }
}

void resetAdminPassword();
