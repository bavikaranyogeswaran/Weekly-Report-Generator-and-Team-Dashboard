import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { User } from '../users/entities/user.entity';
import { EmailService } from '../email/email.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

// Number of bcrypt hashing rounds — higher = more secure but slower
const BCRYPT_ROUNDS = 10;

// Generic message returned for both found and not-found emails — prevents email enumeration
const FORGOT_PASSWORD_RESPONSE =
  'If that email is registered, you will receive a reset link shortly.';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,

    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  // Validates credentials and returns a signed JWT token
  async login(dto: LoginDto) {
    const user = await this.usersRepo.findOne({ where: { email: dto.email } });

    // Same error for wrong email AND wrong password — prevents user enumeration
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload: JwtPayload = { sub: user.id, role: user.role };
    const accessToken = await this.jwtService.signAsync(payload);
    return {
      access_token: accessToken,
      emailVerified: user.isVerified,
    };
  }

  // Marks a user's email as verified using the token from the verification email
  async verifyEmail(token: string) {
    if (!token) {
      throw new BadRequestException('Verification token is required');
    }

    // verificationToken has select:false — must re-include it via QueryBuilder
    const user = await this.usersRepo
      .createQueryBuilder('user')
      .addSelect('user.verificationToken')
      .where('user.verificationToken = :token', { token })
      .getOne();

    if (!user) {
      throw new BadRequestException('Invalid or already-used verification token');
    }

    user.isVerified = true;
    user.verificationToken = null;
    await this.usersRepo.save(user);

    return { message: 'Email verified successfully. You can now log in.' };
  }

  // Returns the full profile of the currently logged-in user (without the password hash)
  async getMe(userId: string) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });

    if (!user) {
      throw new UnauthorizedException('User account no longer exists');
    }

    const { passwordHash: _removed, ...safeUser } = user;
    return safeUser;
  }

  // Allows a logged-in user to update their own password by supplying the current one
  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });

    if (!user) {
      throw new UnauthorizedException('User account no longer exists');
    }

    // Require proof of the existing password before accepting the new one
    const passwordMatches = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!passwordMatches) {
      throw new BadRequestException('Current password is incorrect');
    }

    user.passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
    await this.usersRepo.save(user);

    return { message: 'Password changed successfully' };
  }

  // Generates a reset token and emails a reset link to the given address.
  // Always returns the same generic message so callers cannot tell if the email exists.
  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.usersRepo.findOne({ where: { email: dto.email } });

    // Return early with the same message — no information is leaked either way
    if (!user) {
      return { message: FORGOT_PASSWORD_RESPONSE };
    }

    // 32 random bytes gives a 256-bit token — safe against brute-force guessing
    const token = randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    user.passwordResetToken = token;
    user.passwordResetExpiry = expiry;
    await this.usersRepo.save(user);

    await this.emailService.sendPasswordResetEmail(user.email, user.name, token);

    return { message: FORGOT_PASSWORD_RESPONSE };
  }

  // Validates the reset token and sets the new password if the token is still valid
  async resetPassword(dto: ResetPasswordDto) {
    // passwordResetToken has select:false — must re-include it via QueryBuilder
    const user = await this.usersRepo
      .createQueryBuilder('user')
      .addSelect('user.passwordResetToken')
      .where('user.passwordResetToken = :token', { token: dto.token })
      .andWhere('user.passwordResetExpiry > :now', { now: new Date() })
      .getOne();

    // Null means token not found or already expired
    if (!user) {
      throw new BadRequestException('Reset link is invalid or has expired');
    }

    user.passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
    // Clear the token so it cannot be reused
    user.passwordResetToken = null;
    user.passwordResetExpiry = null;
    await this.usersRepo.save(user);

    return { message: 'Password reset successfully. You can now log in with your new password.' };
  }
}
