import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto'; // built-in Node.js — no extra package needed
import { User } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { EmailService } from '../email/email.service';

// Number of bcrypt hashing rounds — higher = more secure but slower
const BCRYPT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    // Inject the User repository so we can query the users table
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,

    // Inject JwtService so we can sign tokens on login
    private readonly jwtService: JwtService,

    // Inject EmailService to send the verification email on registration
    private readonly emailService: EmailService,
  ) {}

  // Creates a new MEMBER account, sends a verification email, and returns the saved user
  async register(dto: RegisterDto) {
    // Reject duplicate emails before we do any hashing work
    const exists = await this.usersRepo.findOne({ where: { email: dto.email } });
    if (exists) {
      throw new ConflictException('An account with this email already exists');
    }

    // Hash the plain-text password — we never store it as-is
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    // Generate a 64-character random hex token for email verification
    const verificationToken = randomBytes(32).toString('hex');

    // Build the user — role defaults to MEMBER as defined in the entity
    const user = this.usersRepo.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
      verificationToken,
      isVerified: false,
    });

    const saved = await this.usersRepo.save(user);

    // Send verification email (falls back to console log if SMTP is not configured)
    await this.emailService.sendVerificationEmail(saved.email, saved.name, verificationToken);

    // Strip the password hash and verification token before sending the response
    const { passwordHash: _pw, verificationToken: _vt, ...safeUser } = saved;
    return safeUser;
  }

  // Validates credentials and returns a signed JWT token
  async login(dto: LoginDto) {
    // Look up the user by email
    const user = await this.usersRepo.findOne({ where: { email: dto.email } });

    // Use the same error message for wrong email AND wrong password —
    // this prevents attackers from knowing which one failed (user enumeration)
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Build the JWT payload — only include what guards need to make decisions
    const payload: JwtPayload = { sub: user.id, role: user.role };

    // Sign and return the token, plus the email verification status for the frontend
    const accessToken = await this.jwtService.signAsync(payload);
    return {
      access_token: accessToken,
      emailVerified: user.isVerified, // frontend can show a "please verify" banner if false
    };
  }

  // Marks a user's email as verified using the token from the verification email
  async verifyEmail(token: string) {
    if (!token) {
      throw new BadRequestException('Verification token is required');
    }

    // verificationToken has select:false, so we must explicitly add it back
    const user = await this.usersRepo
      .createQueryBuilder('user')
      .addSelect('user.verificationToken') // re-include the hidden column
      .where('user.verificationToken = :token', { token })
      .getOne();

    if (!user) {
      // Token not found — either already used or invalid
      throw new BadRequestException('Invalid or already-used verification token');
    }

    // Mark as verified and clear the token so it cannot be reused
    user.isVerified = true;
    user.verificationToken = null;
    await this.usersRepo.save(user);

    return { message: 'Email verified successfully. You can now log in.' };
  }

  // Returns the full profile of the currently logged-in user (without the password hash)
  async getMe(userId: string) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });

    // This should never happen if the JWT is valid, but guard against stale tokens
    if (!user) {
      throw new UnauthorizedException('User account no longer exists');
    }

    // Strip the password hash before returning (verificationToken already excluded by select:false)
    const { passwordHash: _removed, ...safeUser } = user;
    return safeUser;
  }
}
