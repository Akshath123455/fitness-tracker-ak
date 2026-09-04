import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoMemoryServer = null;

export const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;

    if (mongoUri) {
      console.log(`[DB] Connecting to MongoDB from URI...`);
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
      console.log(`[DB] MongoDB Connected successfully to URI`);
      return;
    }

    // Try default local MongoDB first
    try {
      console.log(`[DB] Attempting connection to local MongoDB at mongodb://127.0.0.1:27017/apexpulse ...`);
      await mongoose.connect('mongodb://127.0.0.1:27017/apexpulse', { serverSelectionTimeoutMS: 2500 });
      console.log(`[DB] Connected to local MongoDB instance`);
      return;
    } catch (localErr) {
      console.warn(`[DB] Local MongoDB not available (${localErr.message}). Initializing In-Memory MongoDB engine...`);
    }

    // Fallback to high-performance MongoMemoryServer
    mongoMemoryServer = await MongoMemoryServer.create();
    const inMemoryUri = mongoMemoryServer.getUri();
    await mongoose.connect(inMemoryUri);
    console.log(`[DB] In-Memory MongoDB engine initialized and connected at: ${inMemoryUri}`);
  } catch (error) {
    console.error(`[DB] Critical MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

export const closeDB = async () => {
  await mongoose.disconnect();
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop();
  }
};
