import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UpdateRoleDto } from './dto/update-role.dto';
import { EmailService } from '../email/email.service';

@Injectable()
export class UsersService {
  constructor(
    // Inject the User repository to query the users table
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,

    // Inject EmailService to notify the user when their role changes
    private readonly emailService: EmailService,
  ) {}

  // Returns all users sorted by newest first, with passwordHash stripped
  async findAll() {
    const users = await this.usersRepo.find({ order: { createdAt: 'DESC' } });

    // Remove passwordHash from every user before returning
    return users.map(({ passwordHash: _pw, ...safe }) => safe);
  }

  // Returns a single user by ID — throws 404 if not found
  async findOne(id: string) {
    const user = await this.usersRepo.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Strip passwordHash before returning
    const { passwordHash: _pw, ...safe } = user;
    return safe;
  }

  // Updates a user's role and sends them an email notification if the role actually changed
  async updateRole(id: string, dto: UpdateRoleDto) {
    const user = await this.usersRepo.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const previousRole = user.role;
    user.role = dto.role;
    const saved = await this.usersRepo.save(user);

    // Only send the email when the role is genuinely different — avoid noise on no-op updates
    if (previousRole !== dto.role) {
      await this.emailService.sendRoleAssignedEmail(saved.email, saved.name, saved.role);
    }

    // Strip passwordHash before returning
    const { passwordHash: _pw, ...safe } = saved;
    return safe;
  }
}
