import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import User from '@/models/User';

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
    console.error('Error fetching default address:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { fullName, phone, email, addressLine1, addressLine2, city, state, pincode, country } = body;

    if (!fullName || !phone || !addressLine1 || !city || !state || !pincode) {
      return NextResponse.json({
        success: false,
        error: 'fullName, phone, addressLine1, city, state, and pincode are required fields.'
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
  } catch (error) {
    console.error('Error saving default address:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
