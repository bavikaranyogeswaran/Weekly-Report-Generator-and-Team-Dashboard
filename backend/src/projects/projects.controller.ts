import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

// All routes require a valid JWT — applied at the class level
@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  // POST /api/projects — manager creates a new project
  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.MANAGER)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateProjectDto) {
    return this.projectsService.create(dto);
  }

  // GET /api/projects — any authenticated user can list all projects
  @Get()
  findAll() {
    return this.projectsService.findAll();
  }

  // GET /api/projects/:id — any authenticated user can view a single project (with members)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  // PATCH /api/projects/:id — manager updates project name, description, or color
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.MANAGER)
  update(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.projectsService.update(id, dto);
  }

  // DELETE /api/projects/:id — manager deletes a project
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.MANAGER)
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.projectsService.remove(id);
  }

  // POST /api/projects/:id/members — manager assigns a user to the project
  @Post(':id/members')
  @UseGuards(RolesGuard)
  @Roles(Role.MANAGER)
  @HttpCode(HttpStatus.OK)
  addMember(@Param('id') id: string, @Body() dto: AddMemberDto) {
    return this.projectsService.addMember(id, dto.userId);
  }

  // DELETE /api/projects/:id/members/:userId — manager removes a user from the project
  @Delete(':id/members/:userId')
  @UseGuards(RolesGuard)
  @Roles(Role.MANAGER)
  @HttpCode(HttpStatus.OK)
  removeMember(@Param('id') id: string, @Param('userId') userId: string) {
    return this.projectsService.removeMember(id, userId);
  }
}
