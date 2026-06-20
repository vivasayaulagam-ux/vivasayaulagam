import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Otp from '@/models/Otp';
import { sendAdminNotification } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const { name, email, password, otp } = await req.json();

    if (!name || !email || !password || !otp) {
      return NextResponse.json(
        { message: 'Please provide all required fields (name, email, password, otp)' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    await dbConnect();

    // 1. Verify OTP first
    const otpRecord = await Otp.findOne({ email: normalizedEmail });
    if (!otpRecord) {
      return NextResponse.json(
        { message: 'OTP expired. Please request a new OTP' },
        { status: 400 }
      );
    }

    // Check expiry
    if (new Date() > otpRecord.expiresAt) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return NextResponse.json(
        { message: 'OTP expired. Please request a new OTP' },
        { status: 400 }
      );
    }

    // Check code match
    if (otpRecord.otp !== otp.trim()) {
      return NextResponse.json(
        { message: 'Invalid OTP. Please check and try again' },
        { status: 400 }
      );
    }

    // OTP is valid. Delete the OTP document so it cannot be reused.
    await Otp.deleteOne({ _id: otpRecord._id });

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return NextResponse.json(
        { message: 'This email is already registered. Please login' },
        { status: 400 }
      );
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      emailVerified: true,
    });

    // Send Admin Notification
    try {
      await sendAdminNotification(
        'New User Registration - Vivasaya Ulagam',
        `<h1>New User Registered</h1><p>A new user has signed up!</p><p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${normalizedEmail}</p>`
      );
    } catch (emailError) {
      console.error('Failed to send admin notification email:', emailError);
    }

    return NextResponse.json(
      { message: 'User registered successfully', userId: user._id },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json(
      { message },
      { status: 500 }
    );
  }
}
