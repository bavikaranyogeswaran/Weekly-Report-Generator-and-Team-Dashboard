import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    // Inject the User repository to query the users table
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
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
}
