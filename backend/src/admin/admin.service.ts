import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Role } from '../common/enums/role.enum';
import { EmailService } from '../email/email.service';
import { AssignRoleDto } from './dto/assign-role.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,

    // Send a notification email when a user's role changes
    private readonly emailService: EmailService,
  ) {}

  // Returns every user, newest first, with passwordHash stripped
  async findAllUsers() {
    const users = await this.usersRepo.find({ order: { createdAt: 'DESC' } });

    return users.map(({ passwordHash: _pw, ...safe }) => safe);
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
