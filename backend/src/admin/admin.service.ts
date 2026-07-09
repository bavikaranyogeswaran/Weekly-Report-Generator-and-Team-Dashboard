import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { Role } from '../common/enums/role.enum';
import { EmailService } from '../email/email.service';
import { AssignRoleDto } from './dto/assign-role.dto';
import { CreateUserDto } from './dto/create-user.dto';

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
  async createUser(dto: CreateUserDto) {
    const existing = await this.usersRepo.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = this.usersRepo.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
      role: dto.role as Role,
      isVerified: true, // admin-created accounts skip email verification
    });

    const saved = await this.usersRepo.save(user);

    // Email the new user their login credentials
    await this.emailService.sendWelcomeEmail(saved.email, saved.name, saved.role, dto.password);

    const { passwordHash: _pw, ...safe } = saved;
    return safe;
  }

  // Returns every user, newest first, with passwordHash stripped
  async findAllUsers() {
    const users = await this.usersRepo.find({ order: { createdAt: 'DESC' } });

    return users.map(({ passwordHash: _pw, ...safe }) => safe);
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

    const { passwordHash: _pw, ...safe } = saved;
    return safe;
  }
}
