import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type Mail from 'nodemailer/lib/mailer';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class EmailService {
  // null when SMTP_HOST is not configured — we fall back to console logging
  private readonly transporter: Mail | null = null;

  constructor(private readonly config: ConfigService) {
    const smtpHost = config.get<string>('SMTP_HOST');

    // Only create the transporter if SMTP credentials are provided in .env
    if (smtpHost) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: config.get<number>('SMTP_PORT') ?? 587,
        secure: false, // true for port 465, false for 587 (STARTTLS)
        auth: {
          user: config.get<string>('SMTP_USER'),
          pass: config.get<string>('SMTP_PASS'),
        },
      });
    }
  }

  // Sends a verification email with a one-click verify link.
  // If SMTP is not configured, prints the link to the console (dev convenience).
  async sendVerificationEmail(
    to: string,
    name: string,
    token: string,
  ): Promise<void> {
    const appUrl = this.config.get<string>('APP_URL') ?? 'http://localhost:3000';
    const verifyUrl = `${appUrl}/api/auth/verify-email?token=${token}`;

    if (!this.transporter) {
      // No SMTP configured — log the link so developers can verify manually
      console.log(
        `\n[Email] No SMTP configured. Verification link for ${to}:\n  ${verifyUrl}\n`,
      );
      return;
    }

    const from = this.config.get<string>('SMTP_FROM') ?? 'noreply@weeklyreports.dev';

    await this.transporter.sendMail({
      from: `"Weekly Reports" <${from}>`,
      to,
      subject: 'Verify your email address',
      html: this.buildVerificationHtml(name, verifyUrl),
    });
  }

  // Notifies a user that a manager has changed their role.
  // If SMTP is not configured, prints a message to the console instead.
  async sendRoleAssignedEmail(to: string, name: string, newRole: Role): Promise<void> {
    if (!this.transporter) {
      console.log(
        `\n[Email] No SMTP configured. Role notification for ${to}: role set to ${newRole}\n`,
      );
      return;
    }

    const from = this.config.get<string>('SMTP_FROM') ?? 'noreply@weeklyreports.dev';

    await this.transporter.sendMail({
      from: `"Weekly Reports" <${from}>`,
      to,
      subject: `Your role has been updated to ${newRole}`,
      html: this.buildRoleAssignedHtml(name, newRole),
    });
  }

  // Simple HTML template for the verification email
  private buildVerificationHtml(name: string, verifyUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px; margin: 0;">
          <div style="max-width: 520px; margin: 0 auto; background: white; border-radius: 10px; padding: 32px;">
            <h2 style="color: #4f46e5; margin-top: 0;">Weekly Report Generator</h2>
            <p>Hi <strong>${name}</strong>,</p>
            <p>Thanks for registering! Click the button below to verify your email address and activate your account.</p>
            <a href="${verifyUrl}"
               style="display: inline-block; background: #4f46e5; color: white; padding: 12px 28px;
                      border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0;">
              Verify Email
            </a>
            <p style="color: #555; font-size: 13px; margin-top: 24px;">
              Or paste this link into your browser:<br/>
              <a href="${verifyUrl}" style="color: #4f46e5; word-break: break-all;">${verifyUrl}</a>
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
            <p style="color: #999; font-size: 12px; margin: 0;">
              If you did not create an account, you can safely ignore this email.
            </p>
          </div>
        </body>
      </html>
    `;
  }

  // HTML template for the role-assignment notification email
  private buildRoleAssignedHtml(name: string, newRole: Role): string {
    // Tailor the message depending on which role was assigned
    const isManager = newRole === Role.MANAGER;
    const roleLabel = isManager ? 'Manager' : 'Member';
    const detail = isManager
      ? 'You now have access to the team dashboard, can view all submitted reports, and can manage your team.'
      : 'You can submit weekly reports and track your own progress.';

    return `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px; margin: 0;">
          <div style="max-width: 520px; margin: 0 auto; background: white; border-radius: 10px; padding: 32px;">
            <h2 style="color: #4f46e5; margin-top: 0;">Weekly Report Generator</h2>
            <p>Hi <strong>${name}</strong>,</p>
            <p>
              Your account role has been updated by a manager.
              You are now a <strong>${roleLabel}</strong>.
            </p>
            <p style="color: #555;">${detail}</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
            <p style="color: #999; font-size: 12px; margin: 0;">
              If you believe this was done in error, please contact your manager.
            </p>
          </div>
        </body>
      </html>
    `;
  }
}
