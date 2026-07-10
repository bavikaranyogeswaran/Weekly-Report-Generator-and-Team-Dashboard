import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { AuthenticatedUser } from './interfaces/authenticated-user.interface';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AllowPasswordChangePending } from '../common/decorators/allow-password-change-pending.decorator';

@Controller('auth') // all routes here are prefixed with /api/auth
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // POST /api/auth/login — 5 attempts/min per IP to block brute-force attacks
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // GET /api/auth/verify-email?token=xxx — verifies a user's email from the link in the email
  @Get('verify-email')
  @HttpCode(HttpStatus.OK)
  verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  // GET /api/auth/me — called on every page load; skip throttle so the default 60/min doesn't interfere.
  // Allowed while a password change is pending so the frontend can load the profile and redirect.
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @AllowPasswordChangePending()
  @SkipThrottle()
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getMe(user.userId);
  }

  // PATCH /api/auth/password — requires a valid JWT; default 60/min limit is sufficient.
  // Allowed while a password change is pending — this is the endpoint that clears the flag.
  @Patch('password')
  @UseGuards(JwtAuthGuard)
  @AllowPasswordChangePending()
  @HttpCode(HttpStatus.OK)
  changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(user.userId, dto);
  }

  // POST /api/auth/forgot-password — 5 req/min to prevent email-flood attacks
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  // POST /api/auth/reset-password — 5 req/min; each attempt burns a one-time token anyway
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}
