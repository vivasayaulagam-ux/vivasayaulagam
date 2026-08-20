import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/authHelper';
import { validateShoppingProducts } from '@/lib/shopping/feedValidation';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    try {
      await requireAdmin();
    } catch (authError: any) {
      return NextResponse.json({ error: authError.message }, { status: authError.status || 401 });
    }

    const summary = await validateShoppingProducts();
    return NextResponse.json({ success: true, summary });
  } catch (error: any) {
    console.error('Fetch shopping integrations validation error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch feed validation' }, { status: 500 });
  }
}
