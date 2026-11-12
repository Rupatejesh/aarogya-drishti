import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import User from "../models/User";

dotenv.config();

const run = async () => {
    const uri = process.env.MONGO_TEST_URI;

    if (!uri) {
        throw new Error("MONGO_TEST_URI is missing. No connection attempted.");
    }

    const parsed = new URL(uri);
    const databaseName = decodeURIComponent(parsed.pathname.replace(/^\/+/, ""));

    if (
        !["mongodb:", "mongodb+srv:"].includes(parsed.protocol) ||
        databaseName !== "aarogya_drishti_test" ||
        (parsed.searchParams.has("dbName") &&
            parsed.searchParams.get("dbName") !== "aarogya_drishti_test")
    ) {
        throw new Error("Safety check failed. Only aarogya_drishti_test is allowed.");
    }

    await mongoose.connect(uri);

    if (mongoose.connection.name !== "aarogya_drishti_test") {
        throw new Error("Connected database name does not match the test database.");
    }

    const runId = randomUUID();
    const email = `http-test-mo-${runId}@example.test`;
    const password = `TestOnly-${runId.slice(0, 12)}!`;

    const user = await User.create({
        fullName: `Synthetic HTTP Test MO ${runId.slice(0, 8)}`,
        email,
        passwordHash: await bcrypt.hash(password, 12),
        role: "MEDICAL_OFFICER",
        isActive: true,
        assignedPHCId: "PHC-HTTP-TEST",
        mandal: "Paderu",
        district: "Alluri Sitharama Raju",
        tokenVersion: 0
    });

    console.log("Synthetic account created successfully.");
    console.log("Database:", mongoose.connection.name);
    console.log("Role:", user.role);
    console.log("Email:", email);
    console.log("Test-only password:", password);
    console.log("User ID:", user._id.toString());
};

run()
    .catch((error) => {
        console.error("Test account creation failed:", error.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        await mongoose.disconnect();
    });
