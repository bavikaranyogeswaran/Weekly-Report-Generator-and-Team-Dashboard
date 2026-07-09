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

  // Sends login credentials to a user whose account was created by the admin.
  // If SMTP is not configured, prints the credentials to the console instead.
  async sendWelcomeEmail(
    to: string,
    name: string,
    role: Role,
    temporaryPassword: string,
  ): Promise<void> {
    if (!this.transporter) {
      console.log(
        `\n[Email] No SMTP configured. Welcome credentials for ${to}:\n  Password: ${temporaryPassword}\n`,
      );
      return;
    }

    const from = this.config.get<string>('SMTP_FROM') ?? 'noreply@weeklyreports.dev';

    await this.transporter.sendMail({
      from: `"Weekly Reports" <${from}>`,
      to,
      subject: 'Your Weekly Reports account is ready',
      html: this.buildWelcomeHtml(name, to, role, temporaryPassword),
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

  // HTML template for the admin-created welcome email
  private buildWelcomeHtml(
    name: string,
    email: string,
    role: Role,
    temporaryPassword: string,
  ): string {
    // FRONTEND_URL points at the React app — the sign-in link should go there, not the API
    const appUrl = this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:5173';
    const roleLabel = role === Role.MANAGER ? 'Manager' : 'Member';

    return `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px; margin: 0;">
          <div style="max-width: 520px; margin: 0 auto; background: white; border-radius: 10px; padding: 32px;">
            <h2 style="color: #4f46e5; margin-top: 0;">Weekly Report Generator</h2>
            <p>Hi <strong>${name}</strong>,</p>
            <p>Your account has been created by an administrator. You have been assigned the role of <strong>${roleLabel}</strong>.</p>
            <div style="background: #f8f7ff; border: 1px solid #e0e7ff; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <p style="margin: 0 0 8px; font-size: 13px; color: #555;">Your login credentials:</p>
              <p style="margin: 4px 0; font-size: 14px;"><strong>Email:</strong> ${email}</p>
              <p style="margin: 4px 0; font-size: 14px;"><strong>Password:</strong> ${temporaryPassword}</p>
            </div>
            <a href="${appUrl}/login"
               style="display: inline-block; background: #4f46e5; color: white; padding: 12px 28px;
                      border-radius: 6px; text-decoration: none; font-weight: bold; margin: 8px 0;">
              Sign in
            </a>
            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
            <p style="color: #999; font-size: 12px; margin: 0;">
              Please keep your credentials safe. Contact your administrator if you need a password reset.
            </p>
          </div>
        </body>
      </html>
    `;
  }

  // HTML template for the password-reset email
  private buildPasswordResetHtml(name: string, resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px; margin: 0;">
          <div style="max-width: 520px; margin: 0 auto; background: white; border-radius: 10px; padding: 32px;">
            <h2 style="color: #4f46e5; margin-top: 0;">Weekly Report Generator</h2>
            <p>Hi <strong>${name}</strong>,</p>
            <p>We received a request to reset your password. Click the button below to set a new one.</p>
            <a href="${resetUrl}"
               style="display: inline-block; background: #4f46e5; color: white; padding: 12px 28px;
                      border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0;">
              Reset password
            </a>
            <p style="color: #555; font-size: 13px; margin-top: 24px;">
              This link expires in 1 hour. If you did not request a password reset, you can safely ignore this email.
            </p>
            <p style="color: #555; font-size: 13px;">
              Or paste this URL into your browser:<br/>
              <a href="${resetUrl}" style="color: #4f46e5; word-break: break-all;">${resetUrl}</a>
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
