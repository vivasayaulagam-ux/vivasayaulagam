import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, defaultAddress: user.defaultAddress || null });
  } catch (error) {
    console.error('Error fetching customer address:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

async function handleSave(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { fullName, phone, email, addressLine1, addressLine2, city, state, pincode, country } = body;

    // Server-side validation
    if (!fullName || !phone || !addressLine1 || !city || !state || !pincode) {
      return NextResponse.json({
        success: false,
        error: 'fullName, phone, addressLine1, city, state, and pincode are required.'
      }, { status: 400 });
    }

    await dbConnect();
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    user.defaultAddress = {
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: (email || '').trim(),
      addressLine1: addressLine1.trim(),
      addressLine2: (addressLine2 || '').trim(),
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      country: (country || 'India').trim()
    };

    await user.save();

    return NextResponse.json({ success: true, defaultAddress: user.defaultAddress });
  } catch (error: any) {
    console.error('Error saving customer address:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export { handleSave as POST, handleSave as PUT };
