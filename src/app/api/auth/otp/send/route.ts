import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Otp from '@/models/Otp';
import { getEmailConfigError, sendEmail } from '@/lib/email';
import User from '@/models/User';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let email = body.email;
    const phone = body.phone;

    if (!email && !phone) {
      return NextResponse.json({ success: false, error: 'Email address or Phone number is required' }, { status: 400 });
    }

    await dbConnect();

    if (phone) {
      const cleanPhone = phone.trim().replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        return NextResponse.json({ success: false, error: 'Please enter a valid 10-digit mobile number' }, { status: 400 });
      }

      // Look up user by phone number
      const existingUser = await User.findOne({ phone: cleanPhone });
      if (existingUser) {
        email = existingUser.email;
      } else {
        email = `${cleanPhone}@vivasayaulagam.com`;
      }
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json({ success: false, error: 'Please enter a valid email address' }, { status: 400 });
      }
    }

    const normalizedEmail = email.toLowerCase().trim();
    const isSimulatedEmail = normalizedEmail.endsWith('@vivasayaulagam.com');

    if (!isSimulatedEmail) {
      const emailConfigError = getEmailConfigError();
      if (emailConfigError) {
        return NextResponse.json({ success: false, error: emailConfigError }, { status: 500 });
      }
    }

    await dbConnect();

    // 1. Generate 6-digit OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiration

    // 2. Save OTP code to database (upsert for that email)
    await Otp.findOneAndUpdate(
      { email: normalizedEmail },
      { email: normalizedEmail, otp, expiresAt },
      { upsert: true, new: true }
    );

    let emailSent = true;
    if (!isSimulatedEmail) {
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #34a121; margin: 0;">Vivasaya Ulagam</h2>
            <p style="color: #6b7280; font-size: 14px; margin-top: 5px;">Premium Organic Tamil Nadu Products</p>
          </div>
          <hr style="border: 0; border-top: 1px solid #e5e7eb; margin-bottom: 20px;" />
          <p style="font-size: 15px; color: #374151; line-height: 1.5;">Hello,</p>
          <p style="font-size: 15px; color: #374151; line-height: 1.5;">Use the verification code below to sign in or register your account at Vivasaya Ulagam. This code is valid for <strong>5 minutes</strong>.</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="display: inline-block; font-size: 32px; font-weight: bold; color: #34a121; letter-spacing: 5px; padding: 12px 30px; background-color: #f3f4f6; border-radius: 6px;">${otp}</span>
          </div>
          <p style="font-size: 13px; color: #9ca3af; line-height: 1.5; text-align: center;">If you did not request this code, you can safely ignore this email.</p>
        </div>
      `;

      emailSent = await sendEmail(
        normalizedEmail,
        'Verification Code - Vivasaya Ulagam',
        emailHtml
      );
    } else {
      console.log(`[SMS OTP Simulation] Phone: ${phone} -> Code: ${otp}`);
    }

    if (!emailSent) {
      await Otp.deleteOne({ email: normalizedEmail });
      return NextResponse.json({ success: false, error: 'Failed to send OTP email. Please try again.' }, { status: 500 });
    }

    const resPayload: any = { success: true, email: normalizedEmail, message: 'Verification code sent successfully!' };
    if (process.env.NODE_ENV !== 'production' || isSimulatedEmail) {
      resPayload.otp = otp;
    }

    return NextResponse.json(resPayload);
  } catch (error) {
    console.error('Send OTP error:', error);
    const message = error instanceof Error ? error.message : 'An unexpected server error occurred';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
