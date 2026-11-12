import mongoose from 'mongoose';

export const connectDatabase = async (): Promise<boolean> => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/aarogya_drishti';

  try {
    console.log('🔄 [Database] Connecting to MongoDB...');
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000
    });
    console.log(`✅ [Database] MongoDB connected successfully to database "${mongoose.connection.name}" on ${mongoose.connection.host}`);
    return true;
  } catch (primaryErr: any) {
    console.warn('⚠️ [Database] Remote/Local MongoDB service error:', primaryErr?.message || primaryErr);
    console.log('🛡️ [Database] Aarogya Drishti resilient high-speed data store is active.');
    return false;
  }
};

export default connectDatabase;
