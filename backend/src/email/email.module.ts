import { Module } from '@nestjs/common';
import { EmailService } from './email.service';

// Provides email sending capability (SMTP or console fallback).
// Import this module in any feature module that needs to send emails.
@Module({
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
