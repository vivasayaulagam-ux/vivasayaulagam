import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    return NextResponse.json({
      success: false,
      error: 'Environment variable MONGODB_URI is missing in .env.local'
    }, { status: 500 });
  }

  try {
    // Check if mongoose is connected. If not, trigger a connection attempt via central helper.
    await dbConnect();
    
    // Get database name from active connection
    const dbName = mongoose.connection.db?.databaseName || 'unknown';
    
    return NextResponse.json({
      success: true,
      status: 'Connected successfully',
      database: dbName,
    });
  } catch (err: any) {
    console.error('Database connection test failed:', err);
    let reason = 'Unknown connection error';
    const msg = String(err.message || err);
    
    if (msg.includes('Authentication failed') || msg.includes('auth failed')) {
      reason = 'Authentication failed (incorrect username, password, or authSource config)';
    } else if (msg.includes('ENOTFOUND') || msg.includes('EAI_AGAIN') || msg.includes('timeout') || msg.includes('MongooseServerSelectionError')) {
      reason = 'IP/Network issue (database host is unreachable or connection timed out)';
    } else if (msg.includes('databaseName') || msg.includes('database not found')) {
      reason = 'Wrong database name or database does not exist';
    } else if (msg.includes('authSource')) {
      reason = 'Missing or invalid authSource query parameter (e.g. authSource=admin is required)';
    } else {
      reason = `Connection error: ${msg}`;
    }

    return NextResponse.json({
      success: false,
      error: reason,
      rawError: msg
    }, { status: 500 });
  }
}
