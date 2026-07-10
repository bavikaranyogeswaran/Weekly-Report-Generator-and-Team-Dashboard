import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomBytes, createHash } from 'crypto';

// SHA-256 hash stored in DB so a DB leak cannot be used to consume outstanding tokens
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
import { User } from '../users/entities/user.entity';
import { Role } from '../common/enums/role.enum';
import { EmailService } from '../email/email.service';
import { AssignRoleDto } from './dto/assign-role.dto';
import { CreateUserDto } from './dto/create-user.dto';

// Invite links expire after 7 days — longer than the 1-hour forgot-password window
const INVITE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1_000;

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,

    // Send a notification email when a user's role changes
    private readonly emailService: EmailService,
  ) {}

  // Creates a new user with a chosen role. Admin-created accounts are marked
  // isVerified immediately — no email verification step is required.
  // The user sets their own password via a 7-day invite link instead of receiving
  // a plain-text password in email.
  async createUser(dto: CreateUserDto) {
    const existing = await this.usersRepo.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }

    // Lock the account with a random hash the user will never know — they must use
    // the invite link to set their own password before they can sign in.
    const lockedHash = await bcrypt.hash(randomBytes(32).toString('hex'), 10);

    const inviteToken = randomBytes(32).toString('hex'); // raw token — emailed to user
    const inviteExpiry = new Date(Date.now() + INVITE_EXPIRY_MS);

    const user = this.usersRepo.create({
      name: dto.name,
      email: dto.email,
      passwordHash: lockedHash,
      role: dto.role as Role,
      isVerified: true, // admin-created accounts skip email verification
      mustChangePassword: true, // force the user to set their own password on first login
      passwordResetToken: hashToken(inviteToken), // SHA-256 hash stored in DB
      passwordResetExpiry: inviteExpiry,
    });

    const saved = await this.usersRepo.save(user);

    // Send invite email after saving — if it fails, remove the user so the admin
    // can retry without hitting a ConflictException on the same email address.
    try {
      await this.emailService.sendInviteEmail(saved.email, saved.name, saved.role, inviteToken); // raw token in email
    } catch {
      await this.usersRepo.remove(saved);
      throw new InternalServerErrorException(
        'Invite email failed to send. The account was not created. Please try again.',
      );
    }

    // passwordHash excluded automatically by ClassSerializerInterceptor via @Exclude()
    return saved;
  }

  // Returns every user, newest first — passwordHash excluded by ClassSerializerInterceptor
  async findAllUsers() {
    return this.usersRepo.find({ order: { createdAt: 'DESC' } });
  }

  // Permanently deletes a user account.
  // Guards: cannot delete yourself; cannot delete another ADMIN.
  async deleteUser(targetId: string, requestingAdminId: string) {
    if (targetId === requestingAdminId) {
      throw new ForbiddenException('You cannot delete your own account');
    }

    const user = await this.usersRepo.findOne({ where: { id: targetId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === Role.ADMIN) {
      throw new ForbiddenException('The admin account cannot be deleted');
    }

    await this.usersRepo.remove(user);
    return { message: 'User deleted successfully' };
  }

  // Assigns MEMBER or MANAGER to a user.
  // requestingAdminId — prevent an admin from accidentally downgrading their own account.
  async assignRole(
    targetId: string,
    dto: AssignRoleDto,
    requestingAdminId: string,
  ) {
    const user = await this.usersRepo.findOne({ where: { id: targetId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Block self-role-change — admin must stay admin
    if (targetId === requestingAdminId) {
      throw new ForbiddenException('You cannot change your own role');
    }

    // Block changing another admin's role — only one admin is supported
    if (user.role === Role.ADMIN) {
      throw new ForbiddenException('The admin account role cannot be changed');
    }

    const previousRole = user.role;
    user.role = dto.role as Role;
    const saved = await this.usersRepo.save(user);

    // Only email when the role actually changed — skip no-op updates
    if (previousRole !== saved.role) {
      await this.emailService.sendRoleAssignedEmail(saved.email, saved.name, saved.role);
    }

    // passwordHash excluded automatically by ClassSerializerInterceptor via @Exclude()
    return saved;
  }
}
