import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import EmailOtp from '@/models/EmailOtp';
import { getEmailConfigError, sendEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, confirmPassword } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: 'Please enter your full name' }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ success: false, error: 'Please enter a valid email address' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ success: false, error: 'Please enter a valid email address' }, { status: 400 });
    }

    if (!password || password.length < 6) {
      return NextResponse.json({ success: false, error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ success: false, error: 'Passwords do not match' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    await dbConnect();

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'This email is already registered. Please login or use Forgot Password.' },
        { status: 400 }
      );
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user in pending / unverified state
    const newUser = new User({
      name: name.trim(),
      email: normalizedEmail,
      password: passwordHash,
      passwordHash: passwordHash,
      emailVerified: false,
      isEmailVerified: false,
      role: 'user',
    });
    await newUser.save();

    // Generate 6-digit OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 60 * 1000); // 1 minute expiration

    // Save OTP to EmailOtp model
    await EmailOtp.findOneAndUpdate(
      { email: normalizedEmail, purpose: 'register' },
      { email: normalizedEmail, otp, purpose: 'register', expiresAt },
      { upsert: true, new: true }
    );

    // Check email config error before sending
    const emailConfigError = getEmailConfigError();
    let emailSent = true;
    if (!emailConfigError) {
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #34a121; margin: 0;">Vivasaya Ulagam</h2>
            <p style="color: #6b7280; font-size: 14px; margin-top: 5px;">Premium Organic Tamil Nadu Products</p>
          </div>
          <hr style="border: 0; border-top: 1px solid #e5e7eb; margin-bottom: 20px;" />
          <p style="font-size: 15px; color: #374151; line-height: 1.5;">Hello ${name},</p>
          <p style="font-size: 15px; color: #374151; line-height: 1.5;">Use the verification code below to verify your email and complete your registration at Vivasaya Ulagam. This code is valid for <strong>1 minute</strong>.</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="display: inline-block; font-size: 32px; font-weight: bold; color: #34a121; letter-spacing: 5px; padding: 12px 30px; background-color: #f3f4f6; border-radius: 6px;">${otp}</span>
          </div>
          <p style="font-size: 13px; color: #9ca3af; line-height: 1.5; text-align: center;">If you did not request this code, you can safely ignore this email.</p>
        </div>
      `;

      emailSent = await sendEmail(
        normalizedEmail,
        'Email Verification Code - Vivasaya Ulagam',
        emailHtml
      );
    }

    const resPayload: any = { success: true, message: 'Verification code sent successfully!' };
    // Include OTP in development payload for easier testing
    if (process.env.NODE_ENV === 'development') {
      resPayload.otp = otp;
    }

    return NextResponse.json(resPayload);
  } catch (error) {
    console.error('Send Register OTP error:', error);
    const message = error instanceof Error ? error.message : 'An unexpected server error occurred';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
