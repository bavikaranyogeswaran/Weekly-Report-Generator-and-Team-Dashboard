import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

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
  ) {}

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
