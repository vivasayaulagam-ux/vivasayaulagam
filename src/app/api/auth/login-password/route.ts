import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Please provide email and password' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    await dbConnect();

    const user = await User.findOne({ email: normalizedEmail }).select('+password +passwordHash');
    if (!user) {
      return NextResponse.json({ success: false, error: 'No account found with this email' }, { status: 401 });
    }

    const hash = user.passwordHash || user.password;
    if (!hash) {
      return NextResponse.json({ success: false, error: 'No password is set on this account' }, { status: 400 });
    }

    // Verify password match
    const isPasswordMatch = await bcrypt.compare(password, hash);
    if (!isPasswordMatch) {
      return NextResponse.json({ success: false, error: 'Incorrect password' }, { status: 401 });
    }

    // Verify email is verified
    const isVerified = user.isEmailVerified !== undefined ? user.isEmailVerified : user.emailVerified;
    if (isVerified === false) {
      return NextResponse.json({ success: false, error: 'Please verify your email before login' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Credentials valid',
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login credentials check error:', error);
    const message = error instanceof Error ? error.message : 'An unexpected server error occurred';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
