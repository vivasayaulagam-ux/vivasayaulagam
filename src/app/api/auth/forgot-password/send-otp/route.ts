import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import EmailOtp from '@/models/EmailOtp';
import { getEmailConfigError, sendEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email address is required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    await dbConnect();

    // Verify user exists
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return NextResponse.json({ success: false, error: 'No account found with this email' }, { status: 400 });
    }

    // Generate 6-digit OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiration

    // Save to EmailOtp model for purpose: forgot_password
    await EmailOtp.findOneAndUpdate(
      { email: normalizedEmail, purpose: 'forgot_password' },
      { email: normalizedEmail, otp, purpose: 'forgot_password', expiresAt },
      { upsert: true, new: true }
    );

    // Send email
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
          <p style="font-size: 15px; color: #374151; line-height: 1.5;">Hello,</p>
          <p style="font-size: 15px; color: #374151; line-height: 1.5;">We received a request to reset your password. Use the verification code below to complete the reset process. This code is valid for <strong>5 minutes</strong>.</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="display: inline-block; font-size: 32px; font-weight: bold; color: #34a121; letter-spacing: 5px; padding: 12px 30px; background-color: #f3f4f6; border-radius: 6px;">${otp}</span>
          </div>
          <p style="font-size: 13px; color: #9ca3af; line-height: 1.5; text-align: center;">If you did not request this, you can safely ignore this email.</p>
        </div>
      `;

      emailSent = await sendEmail(
        normalizedEmail,
        'Reset Password Code - Vivasaya Ulagam',
        emailHtml
      );
    }

    const resPayload: any = { success: true, message: 'Password reset code sent to your email!' };
    if (process.env.NODE_ENV === 'development') {
      resPayload.otp = otp;
    }

    return NextResponse.json(resPayload);
  } catch (error) {
    console.error('Send forgot password OTP error:', error);
    const message = error instanceof Error ? error.message : 'An unexpected server error occurred';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
