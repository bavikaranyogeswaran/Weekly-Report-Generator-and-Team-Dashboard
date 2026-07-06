import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
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

  // Creates a new MEMBER account and returns the saved user (without the password hash)
  async register(dto: RegisterDto) {
    // Reject duplicate emails before we do any hashing work
    const exists = await this.usersRepo.findOne({ where: { email: dto.email } });
    if (exists) {
      throw new ConflictException('An account with this email already exists');
    }

    // Hash the plain-text password — we never store it as-is
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    // Build the user — role defaults to MEMBER as defined in the entity
    const user = this.usersRepo.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
    });

    const saved = await this.usersRepo.save(user);

    // Strip the password hash before sending the response
    const { passwordHash: _removed, ...safeUser } = saved;
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

    // Sign and return the token
    const accessToken = await this.jwtService.signAsync(payload);
    return { access_token: accessToken };
  }
}
