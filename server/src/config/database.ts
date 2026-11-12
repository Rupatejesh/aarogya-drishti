
import mongoose from "mongoose";

const connectDatabase = async (): Promise<void> => {
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/aarogya_drishti";
    try {
        await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2500 });
        console.log("MongoDB connected successfully!");
        console.log(`Database: ${mongoose.connection.name}`);
        return;
    } catch (primaryError) {
        // If URI had replicaSet=rs0, retry with plain standalone URI
        if (mongoUri.includes("replicaSet=")) {
            const standaloneUri = mongoUri.replace(/[?&]replicaSet=[^&]+/, "").replace(/\?$/, "");
            try {
                console.log(`Retrying MongoDB connection in standalone mode at: ${standaloneUri}`);
                await mongoose.connect(standaloneUri, { serverSelectionTimeoutMS: 2500 });
                console.log("MongoDB connected successfully (standalone mode)!");
                console.log(`Database: ${mongoose.connection.name}`);
                return;
            } catch (fallbackError) {
                console.warn("MongoDB standalone connection also failed:", fallbackError);
            }
        }
        console.warn("MongoDB is offline or unreachable. Continuing in resilient autonomous mode.");
    }
};

export default connectDatabase;
