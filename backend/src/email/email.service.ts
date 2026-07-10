import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type Mail from 'nodemailer/lib/mailer';
import { Role } from '../common/enums/role.enum';

// Escapes user-supplied strings before embedding them in HTML to prevent XSS
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

@Injectable()
export class EmailService {
  // null when SMTP_HOST is not configured — we fall back to console logging
  private readonly transporter: Mail | null = null;

  constructor(private readonly config: ConfigService) {
    const smtpHost = config.get<string>('SMTP_HOST');

    // Only create the transporter if SMTP credentials are provided in .env
    if (smtpHost) {
      const smtpPort = config.get<number>('SMTP_PORT') ?? 587;
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        // Port 465 uses SSL/TLS directly; all other ports (587, 25) use STARTTLS
        secure: smtpPort === 465,
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

  // Sends an invite link to a user whose account was created by the admin.
  // The link points to the existing reset-password page — the user sets their own
  // password there. No plain-text password is ever sent via email.
  // If SMTP is not configured, prints the link to the console (dev convenience).
  async sendInviteEmail(
    to: string,
    name: string,
    role: Role,
    token: string,
  ): Promise<void> {
    const frontendUrl = this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:5173';
    // Reuse the existing /reset-password page — it already handles setting a new password
    const inviteUrl = `${frontendUrl}/reset-password?token=${token}`;

    if (!this.transporter) {
      console.log(
        `\n[Email] No SMTP configured. Invite link for ${to}:\n  ${inviteUrl}\n`,
      );
      return;
    }

    const from = this.config.get<string>('SMTP_FROM') ?? 'noreply@weeklyreports.dev';

    await this.transporter.sendMail({
      from: `"Weekly Reports" <${from}>`,
      to,
      subject: 'You have been invited to Weekly Reports',
      html: this.buildInviteHtml(name, role, inviteUrl),
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

  // Sends a password-reset link to the user.
  // If SMTP is not configured, prints the link to the console (dev convenience).
  async sendPasswordResetEmail(to: string, name: string, token: string): Promise<void> {
    const frontendUrl = this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    if (!this.transporter) {
      console.log(
        `\n[Email] No SMTP configured. Password reset link for ${to}:\n  ${resetUrl}\n`,
      );
      return;
    }

    const from = this.config.get<string>('SMTP_FROM') ?? 'noreply@weeklyreports.dev';

    await this.transporter.sendMail({
      from: `"Weekly Reports" <${from}>`,
      to,
      subject: 'Reset your password',
      html: this.buildPasswordResetHtml(name, resetUrl),
    });
  }

  // Simple HTML template for the verification email
  private buildVerificationHtml(name: string, verifyUrl: string): string {
    const safeName = escapeHtml(name);
    const safeUrl  = escapeHtml(verifyUrl);

    return `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px; margin: 0;">
          <div style="max-width: 520px; margin: 0 auto; background: white; border-radius: 10px; padding: 32px;">
            <h2 style="color: #4f46e5; margin-top: 0;">Weekly Report Generator</h2>
            <p>Hi <strong>${safeName}</strong>,</p>
            <p>Thanks for registering! Click the button below to verify your email address and activate your account.</p>
            <a href="${safeUrl}"
               style="display: inline-block; background: #4f46e5; color: white; padding: 12px 28px;
                      border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0;">
              Verify Email
            </a>
            <p style="color: #555; font-size: 13px; margin-top: 24px;">
              Or paste this link into your browser:<br/>
              <a href="${safeUrl}" style="color: #4f46e5; word-break: break-all;">${safeUrl}</a>
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

  // HTML template for the admin-created invite email.
  // No password is included — the user clicks the button to set their own.
  private buildInviteHtml(name: string, role: Role, inviteUrl: string): string {
    const safeName      = escapeHtml(name);
    const safeUrl       = escapeHtml(inviteUrl);
    const safeRoleLabel = escapeHtml(role === Role.MANAGER ? 'Manager' : 'Member');

    return `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px; margin: 0;">
          <div style="max-width: 520px; margin: 0 auto; background: white; border-radius: 10px; padding: 32px;">
            <h2 style="color: #4f46e5; margin-top: 0;">Weekly Report Generator</h2>
            <p>Hi <strong>${safeName}</strong>,</p>
            <p>
              An administrator has created an account for you with the role of
              <strong>${safeRoleLabel}</strong>.
              Click the button below to set your password and start using the app.
            </p>
            <a href="${safeUrl}"
               style="display: inline-block; background: #4f46e5; color: white; padding: 12px 28px;
                      border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0;">
              Set your password
            </a>
            <p style="color: #555; font-size: 13px; margin-top: 24px;">
              This invite link expires in 7 days. If you did not expect this email, you can safely ignore it.
            </p>
            <p style="color: #555; font-size: 13px;">
              Or paste this URL into your browser:<br/>
              <a href="${safeUrl}" style="color: #4f46e5; word-break: break-all;">${safeUrl}</a>
            </p>
          </div>
        </body>
      </html>
    `;
  }

  // HTML template for the password-reset email
  private buildPasswordResetHtml(name: string, resetUrl: string): string {
    const safeName = escapeHtml(name);
    const safeUrl  = escapeHtml(resetUrl);

    return `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px; margin: 0;">
          <div style="max-width: 520px; margin: 0 auto; background: white; border-radius: 10px; padding: 32px;">
            <h2 style="color: #4f46e5; margin-top: 0;">Weekly Report Generator</h2>
            <p>Hi <strong>${safeName}</strong>,</p>
            <p>We received a request to reset your password. Click the button below to set a new one.</p>
            <a href="${safeUrl}"
               style="display: inline-block; background: #4f46e5; color: white; padding: 12px 28px;
                      border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0;">
              Reset password
            </a>
            <p style="color: #555; font-size: 13px; margin-top: 24px;">
              This link expires in 1 hour. If you did not request a password reset, you can safely ignore this email.
            </p>
            <p style="color: #555; font-size: 13px;">
              Or paste this URL into your browser:<br/>
              <a href="${safeUrl}" style="color: #4f46e5; word-break: break-all;">${safeUrl}</a>
            </p>
          </div>
        </body>
      </html>
    `;
  }

  // HTML template for the role-assignment notification email
  private buildRoleAssignedHtml(name: string, newRole: Role): string {
    const isManager = newRole === Role.MANAGER;
    const safeName      = escapeHtml(name);
    const safeRoleLabel = escapeHtml(isManager ? 'Manager' : 'Member');
    const safeDetail    = escapeHtml(
      isManager
        ? 'You now have access to the team dashboard, can view all submitted reports, and can manage your team.'
        : 'You can submit weekly reports and track your own progress.',
    );

    return `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px; margin: 0;">
          <div style="max-width: 520px; margin: 0 auto; background: white; border-radius: 10px; padding: 32px;">
            <h2 style="color: #4f46e5; margin-top: 0;">Weekly Report Generator</h2>
            <p>Hi <strong>${safeName}</strong>,</p>
            <p>
              Your account role has been updated by a manager.
              You are now a <strong>${safeRoleLabel}</strong>.
            </p>
            <p style="color: #555;">${safeDetail}</p>
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
