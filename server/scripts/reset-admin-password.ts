import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../src/models/User";
import { hashPassword } from "../src/services/auth.service";

dotenv.config();

const resetAdminPassword = async (): Promise<void> => {
    try {
        const mongoUri = process.env.MONGO_URI;
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!mongoUri || !adminEmail || !adminPassword) {
            throw new Error("Required admin configuration is missing.");
        }

        if (adminPassword.length < 16) {
            throw new Error("Admin password must contain at least 16 characters.");
        }

        await mongoose.connect(mongoUri);

        const passwordHash = await hashPassword(adminPassword);

        const admin = await User.findOneAndUpdate(
            {
                email: adminEmail.toLowerCase(),
                role: "ADMIN"
            },
            { $set: { passwordHash } },
            { new: true, runValidators: true }
        );

        if (!admin) {
            throw new Error("Existing administrator account was not found.");
        }

        console.log("Administrator password updated successfully.");
    } catch (error) {
        console.error("Admin password update failed:", error);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
};

void resetAdminPassword();