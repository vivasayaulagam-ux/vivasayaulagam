import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import EmailOtp from '@/models/EmailOtp';

export async function POST(req: NextRequest) {
  try {
    const { email, otp, password, confirmPassword } = await req.json();

    if (!email || !otp || !password || !confirmPassword) {
      return NextResponse.json({ success: false, error: 'Please fill in all fields' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ success: false, error: 'Password must be at least 6 characters long' }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ success: false, error: 'Passwords do not match' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    await dbConnect();

    // Verify OTP first
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
      return NextResponse.json({ success: false, error: 'Invalid verification code' }, { status: 400 });
    }

    // OTP is valid. Delete the OTP document so it cannot be reused.
    await EmailOtp.deleteOne({ _id: otpRecord._id });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Update user password and passwordHash
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return NextResponse.json({ success: false, error: 'User account not found' }, { status: 400 });
    }

    user.password = passwordHash;
    user.passwordHash = passwordHash;
    user.emailVerified = true;
    user.isEmailVerified = true;
    await user.save();

    return NextResponse.json({ success: true, message: 'Password reset successfully! You can now login with your new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
    const message = error instanceof Error ? error.message : 'An unexpected server error occurred';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
