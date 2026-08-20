import mongoose from 'mongoose';

let rawUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/vivasaya_ullagam';
if (rawUri.endsWith('/') || rawUri.match(/^mongodb:\/\/[^/]+\/?$/i)) {
  rawUri = rawUri.replace(/\/+$/, '') + '/vivasaya_ullagam';
}
const MONGODB_URI = rawUri;

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
type MongooseCache = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
const globalWithMongoose = globalThis as typeof globalThis & { mongooseCache?: MongooseCache };
const cached: MongooseCache = globalWithMongoose.mongooseCache
  ?? (globalWithMongoose.mongooseCache = { conn: null, promise: null });

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    }).catch((err) => {
      cached.promise = null;
      console.error('MongoDB connection error:', err.message || err);
      throw err;
    });
  }
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }
  return cached.conn;
}

export default dbConnect;
