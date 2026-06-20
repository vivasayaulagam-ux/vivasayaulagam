import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Contact from '@/models/Contact';
import { sendEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { name, email, phone, subject, message } = await req.json();
    
    if (!name || !email || !message) {
      return NextResponse.json({ success: false, error: 'Name, email, and message are required' }, { status: 400 });
    }
    
    const submission = await Contact.create({
      name,
      email,
      phone,
      subject: subject || 'New Contact Form Submission',
      message
    });
    
    // Attempt to send email
    try {
      const emailSubject = `Vivasaya Ulagam Contact: ${subject || 'New Submission'}`;
      const emailHtml = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1a202c;">
          <div style="text-align: center; margin-bottom: 25px;">
            <h2 style="color: #34a121; margin: 0; font-size: 24px; font-weight: 800;">Vivasaya Ulagam</h2>
            <p style="color: #718096; font-size: 14px; margin: 5px 0 0 0;">New Contact Form Submission Received</p>
          </div>
          <hr style="border: 0; border-top: 1px solid #edf2f7; margin-bottom: 25px;" />
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 14px;">
            <tr>
              <td style="padding: 10px 0; font-weight: bold; color: #4a5568; width: 140px; border-bottom: 1px solid #edf2f7;">Sender Name:</td>
              <td style="padding: 10px 0; color: #2d3748; border-bottom: 1px solid #edf2f7;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; font-weight: bold; color: #4a5568; border-bottom: 1px solid #edf2f7;">Sender Email:</td>
              <td style="padding: 10px 0; color: #2d3748; border-bottom: 1px solid #edf2f7;"><a href="mailto:${email}" style="color: #34a121; text-decoration: none;">${email}</a></td>
            </tr>
            <tr>
              <td style="padding: 10px 0; font-weight: bold; color: #4a5568; border-bottom: 1px solid #edf2f7;">Sender Phone:</td>
              <td style="padding: 10px 0; color: #2d3748; border-bottom: 1px solid #edf2f7;">${phone || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; font-weight: bold; color: #4a5568; border-bottom: 1px solid #edf2f7;">Subject:</td>
              <td style="padding: 10px 0; color: #2d3748; border-bottom: 1px solid #edf2f7;">${subject || 'N/A'}</td>
            </tr>
          </table>
          
          <div style="background-color: #f7fafc; padding: 20px; border-radius: 12px; border: 1px solid #edf2f7; margin-bottom: 15px;">
            <h4 style="color: #4a5568; margin: 0 0 10px 0; font-size: 14px; font-weight: bold;">Message Content:</h4>
            <p style="font-size: 14px; color: #2d3748; line-height: 1.6; margin: 0; white-space: pre-wrap;">${message}</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #a0aec0;">
            <p style="margin: 0;">This email was generated automatically by the Vivasaya Ulagam Contact Form.</p>
          </div>
        </div>
      `;
      
      await sendEmail('support@vivasayauallagam.com', emailSubject, emailHtml);
    } catch (emailErr) {
      console.error('Email notification failed, but contact submission was saved to DB:', emailErr);
    }
    
    return NextResponse.json({ success: true, message: 'Message sent successfully!', submission });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to submit form' }, { status: 400 });
  }
}
