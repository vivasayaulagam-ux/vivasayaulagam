import nodemailer from 'nodemailer';

export const getEmailConfigError = () => {
  const missing = [];
  if (!process.env.EMAIL_USER) missing.push('EMAIL_USER');
  if (!process.env.EMAIL_PASS) missing.push('EMAIL_PASS');
  return missing.length > 0
    ? `Email service is not configured. Missing ${missing.join(' and ')} in .env.local.`
    : null;
};

const createTransporter = () => {
  const configError = getEmailConfigError();
  if (configError) {
    throw new Error(configError);
  }

  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false, // Prevents certificate self-signed issues in local dev
    },
  });
};

export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    if (!to) {
      throw new Error('Recipient email address is required.');
    }

    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: `"Vivasaya Ulagam" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log('Message sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

export const sendAdminNotification = async (subject: string, html: string) => {
  return sendEmail(process.env.ADMIN_EMAIL || process.env.EMAIL_USER || '', subject, html);
};
