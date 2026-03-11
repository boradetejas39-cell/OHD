import nodemailer from 'nodemailer';
import MailLog from '@/models/MailLog';

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER;

// Create transporter
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

export interface MailOptions {
  to: string;
  subject: string;
  html: string;
  companyId?: string;
  service?: string;
}

export async function sendEmail(options: MailOptions): Promise<void> {
  try {
    const mailOptions = {
      from: SMTP_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
    };

    await transporter.sendMail(mailOptions);

    // Log successful email
    await MailLog.create({
      companyId: options.companyId,
      recipientEmail: options.to,
      subject: options.subject,
      service: options.service,
      status: 'sent',
      sentAt: new Date(),
    });
  } catch (error: any) {
    // Log failed email
    await MailLog.create({
      companyId: options.companyId,
      recipientEmail: options.to,
      subject: options.subject,
      service: options.service,
      status: 'failed',
      errorMessage: error.message,
    });
    throw error;
  }
}

export async function sendBulkEmails(emails: string[], subject: string, html: string, companyId?: string, service?: string): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (const email of emails) {
    try {
      await sendEmail({ to: email, subject, html, companyId, service });
      sent++;
    } catch (error) {
      failed++;
    }
  }

  return { sent, failed };
}

export function generateSurveyEmail(companyName: string, surveyLink: string, serviceName: string = 'Organization Health Diagnostic'): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .button { display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${serviceName} Survey</h1>
        </div>
        <div class="content">
          <p>Dear Employee,</p>
          <p>You have been invited to participate in the <strong>${serviceName}</strong> survey for <strong>${companyName}</strong>.</p>
          <p>Your feedback is valuable and will help us improve our organization's health and performance.</p>
          <p>Please click the button below to access the survey:</p>
          <div style="text-align: center;">
            <a href="${surveyLink}" class="button">Take Survey</a>
          </div>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all;">${surveyLink}</p>
          <p>Thank you for your participation!</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

