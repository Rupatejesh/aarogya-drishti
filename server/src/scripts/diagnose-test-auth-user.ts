import { createInterface } from "node:readline/promises";
import { stdin, stderr, stdout } from "node:process";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "../models/User";

const expectedDatabaseName = "aarogya_drishti_test";

const readHiddenPassword = async (): Promise<string> => {
    if (!stdin.isTTY || typeof stdin.setRawMode !== "function") {
        throw new Error("A terminal is required to enter the test-only password safely.");
    }

    stderr.write("Test-only password: ");
    const previousRawMode = stdin.isRaw;
    stdin.setRawMode(true);
    stdin.resume();

    try {
        return await new Promise<string>((resolve, reject) => {
            let password = "";
            const cleanup = () => {
                stdin.off("data", onData);
                stdin.off("end", onEnd);
            };

            const onData = (chunk: Buffer) => {
                for (const byte of chunk) {
                    if (byte === 3) {
                        cleanup();
                        reject(new Error("Password entry cancelled."));
                        return;
                    }
                    if (byte === 13 || byte === 10) {
                        cleanup();
                        stderr.write("\n");
                        resolve(password);
                        return;
                    }
                    if (byte === 8 || byte === 127) {
                        password = password.slice(0, -1);
                        continue;
                    }
                    if (byte >= 32 && byte <= 126) {
                        password += String.fromCharCode(byte);
                    }
                }
            };
            const onEnd = () => {
                cleanup();
                reject(new Error("Input ended before password entry completed."));
            };

            stdin.on("data", onData);
            stdin.on("end", onEnd);
        });
    } finally {
        stdin.setRawMode(previousRawMode);
    }
};

const run = async (): Promise<void> => {
    const uri = process.env.MONGO_TEST_URI;
    if (!uri?.trim()) {
        throw new Error("MONGO_TEST_URI is required; no database connection was attempted.");
    }

    let parsedUri: URL;
    try {
        parsedUri = new URL(uri);
    } catch {
        throw new Error("MONGO_TEST_URI is not a valid MongoDB URI.");
    }

    const databaseName = decodeURIComponent(parsedUri.pathname.replace(/^\/+/, ""));
    if (
        (parsedUri.protocol !== "mongodb:" && parsedUri.protocol !== "mongodb+srv:") ||
        databaseName !== expectedDatabaseName ||
        (parsedUri.searchParams.has("dbName") &&
            parsedUri.searchParams.get("dbName") !== expectedDatabaseName)
    ) {
        throw new Error(
            `Only the ${expectedDatabaseName} database is allowed; no connection was attempted.`
        );
    }

    let email: string;
    const prompt = createInterface({ input: stdin, output: stderr });
    try {
        email = (await prompt.question("Synthetic account email: ")).trim().toLowerCase();
    } finally {
        prompt.close();
    }
    const password = await readHiddenPassword();

    try {
        await mongoose.connect(uri);
        if (mongoose.connection.name !== expectedDatabaseName) {
            throw new Error("Connected database name does not match the test database.");
        }

        const user = await User.findOne({ email }).select("+passwordHash");
        const accountFound = Boolean(user);
        const accountActive = user?.isActive === true;
        const passwordMatches = user
            ? await bcrypt.compare(password, user.passwordHash)
            : false;

        stdout.write(`Account found: ${accountFound}\n`);
        stdout.write(`Account active: ${accountActive}\n`);
        stdout.write(`Password matches: ${passwordMatches}\n`);
    } finally {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
    }
};

run().catch((error: unknown) => {
    void error;
    stderr.write("Diagnostic failed; no credentials or connection details were displayed.\n");
    process.exitCode = 1;
});
