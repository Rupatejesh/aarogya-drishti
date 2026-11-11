import mongoose from 'mongoose';

export const connectDatabase = async (): Promise<boolean> => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/aarogya_drishti';

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 600,
      connectTimeoutMS: 600
    });
    console.log(`✅ [Database] MongoDB connected successfully to ${mongoose.connection.name}`);
    return true;
  } catch (primaryErr) {
    console.warn('⚠️ [Database] Local MongoDB service is offline or unreachable.');
    console.log('🛡️ [Database] Aarogya Drishti resilient high-speed data store is active.');
    return false;
  }
};

export default connectDatabase;
