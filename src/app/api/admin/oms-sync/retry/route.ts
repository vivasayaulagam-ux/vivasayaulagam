import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/authHelper';
import { syncPendingOrders } from '@/lib/services/omsSync';

export async function POST(req: Request) {
  try {
    let isAuthenticated = false;
    
    // 1. Try Cron Token first (Authorization Header)
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'test-cron-secret-123';
    
    if (authHeader && authHeader === `Bearer ${cronSecret}`) {
      isAuthenticated = true;
    }
    
    // 2. Fall back to admin session check
    if (!isAuthenticated) {
      try {
        await requireAdmin();
        isAuthenticated = true;
      } catch (authError) {
        // Not authenticated
      }
    }

    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await syncPendingOrders();
    return NextResponse.json({ success: true, ...result });

  } catch (error: any) {
    console.error('OMS manual sync retry error:', error);
    return NextResponse.json({ 
      error: `Failed to trigger sync: ${error.message || error}` 
    }, { status: 500 });
  }
}
