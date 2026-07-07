import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity';
import { User } from '../users/entities/user.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    // Inject the Project repository to query the projects table
    @InjectRepository(Project)
    private readonly projectsRepo: Repository<Project>,

    // Inject the User repository to look up users when assigning members
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  // Creates a new project — rejects duplicate names with 409
  async create(dto: CreateProjectDto) {
    const exists = await this.projectsRepo.findOne({ where: { name: dto.name } });
    if (exists) {
      throw new ConflictException(`A project named "${dto.name}" already exists`);
    }

    const project = this.projectsRepo.create(dto);
    return this.projectsRepo.save(project);
  }

  // Returns all projects sorted by newest first, members relation not loaded here (list view)
  findAll() {
    return this.projectsRepo.find({ order: { createdAt: 'DESC' } });
  }

  // Returns a single project by ID — throws 404 if not found
  async findOne(id: string) {
    const project = await this.projectsRepo.findOne({
      where: { id },
      relations: { members: true }, // include assigned members on the detail view
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  // Applies a partial update — only the fields present in dto are changed
  async update(id: string, dto: UpdateProjectDto) {
    const project = await this.findOne(id);

    // Check for name conflict only when the name is actually being changed
    if (dto.name && dto.name !== project.name) {
      const nameExists = await this.projectsRepo.findOne({ where: { name: dto.name } });
      if (nameExists) {
        throw new ConflictException(`A project named "${dto.name}" already exists`);
      }
    }

    Object.assign(project, dto);
    return this.projectsRepo.save(project);
  }

  // Permanently deletes a project — reports are set to NULL project via onDelete: SET NULL
  async remove(id: string) {
    const project = await this.findOne(id);
    await this.projectsRepo.remove(project);
    return { message: 'Project deleted successfully' };
  }

  // Assigns a user to a project — silently ignores if they are already a member
  async addMember(projectId: string, userId: string) {
    const project = await this.findOne(projectId); // already loads members relation

    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Avoid duplicates in the join table
    const alreadyMember = project.members.some((m) => m.id === userId);
    if (!alreadyMember) {
      project.members.push(user);
      await this.projectsRepo.save(project);
    }

    return this.findOne(projectId); // return the updated project with fresh members list
  }

  // Removes a user from a project — 404 if the project or user does not exist
  async removeMember(projectId: string, userId: string) {
    const project = await this.findOne(projectId); // already loads members relation

    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Filter out the target user from the in-memory members array and persist
    project.members = project.members.filter((m) => m.id !== userId);
    await this.projectsRepo.save(project);

    return this.findOne(projectId); // return the updated project with fresh members list
  }
}
