import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { Role } from '../common/enums/role.enum';

// Same number of rounds used everywhere else in the app
const BCRYPT_ROUNDS = 10;

@Injectable()
export class AdminSeederService implements OnModuleInit {
  private readonly logger = new Logger(AdminSeederService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,

    // Read ADMIN_* env vars via ConfigService — no hardcoded credentials
    private readonly config: ConfigService,
  ) {}

  // Runs once automatically when the NestJS app finishes initialising
  async onModuleInit() {
    await this.seedAdmin();
  }

  private async seedAdmin() {
    const email    = this.config.get<string>('ADMIN_EMAIL');
    const password = this.config.get<string>('ADMIN_PASSWORD');
    const name     = this.config.get<string>('ADMIN_NAME');

    // All three must be set — skip silently with a warning if any are missing
    if (!email || !password || !name) {
      this.logger.warn(
        'ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_NAME not set — skipping admin seed',
      );
      return;
    }

    // Only one ADMIN account is allowed — abort if one already exists
    const existing = await this.usersRepo.findOne({ where: { role: Role.ADMIN } });
    if (existing) {
      this.logger.log(`Admin account already exists (${existing.email}) — skipping seed`);
      return;
    }

    // Hash the password before storing — never save plain text
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const admin = this.usersRepo.create({
      name,
      email,
      passwordHash,
      role: Role.ADMIN,
      isVerified: true, // admin skips email verification
      verificationToken: null,
    });

    await this.usersRepo.save(admin);
    this.logger.log(`Admin account seeded successfully (${email})`);
  }
}
