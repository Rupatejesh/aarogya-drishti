
import dotenv from "dotenv";
import mongoose from "mongoose";
import { createUser } from "../src/services/auth.service";

dotenv.config();

const createAdmin = async (): Promise<void> => {
    try {
        const mongoUri = process.env.MONGO_URI;

        const adminName = process.env.ADMIN_NAME;
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!mongoUri || !adminName || !adminEmail || !adminPassword) {
            throw new Error(
                "MONGO_URI, ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD must be configured."
            );
        }

        if (adminPassword.length < 12) {
            throw new Error("Admin password must contain at least 12 characters.");
        }

        await mongoose.connect(mongoUri);

        const existingAdmin = await mongoose.models.User?.findOne({
            email: adminEmail.toLowerCase()
        });

        if (existingAdmin) {
            console.log("An account with this admin email already exists.");
            return;
        }

        await createUser({
            fullName: adminName,
            email: adminEmail,
            password: adminPassword,
            role: "ADMIN"
        });

        console.log("Synthetic administrator account created successfully.");
        console.log("You can now test the login endpoint.");
    } catch (error) {
        console.error("Admin setup failed:", error);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
};

void createAdmin();
