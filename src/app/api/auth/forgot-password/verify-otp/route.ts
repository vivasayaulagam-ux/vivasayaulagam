import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import EmailOtp from '@/models/EmailOtp';

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ success: false, error: 'Email and OTP are required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    await dbConnect();

    const otpRecord = await EmailOtp.findOne({ email: normalizedEmail, purpose: 'forgot_password' });
    if (!otpRecord) {
      return NextResponse.json({ success: false, error: 'Verification code has expired or is invalid' }, { status: 400 });
    }

    // Check expiry
    if (new Date() > otpRecord.expiresAt) {
      await EmailOtp.deleteOne({ _id: otpRecord._id });
      return NextResponse.json({ success: false, error: 'Verification code has expired. Please request a new OTP' }, { status: 400 });
    }

    // Check code match
    if (otpRecord.otp !== otp.trim()) {
      return NextResponse.json({ success: false, error: 'Invalid verification code. Please check and try again' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Verification code is valid' });
  } catch (error) {
    console.error('Verify forgot password OTP error:', error);
    const message = error instanceof Error ? error.message : 'An unexpected server error occurred';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
