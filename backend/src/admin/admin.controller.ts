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
import { AdminService } from './admin.service';
import { AssignRoleDto } from './dto/assign-role.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

// All routes here require a valid JWT AND the ADMIN role
@Controller('admin/users')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // GET /api/admin/users — returns all users with role, email, createdAt
  @Get()
  findAll() {
    return this.adminService.findAllUsers();
  }

  // POST /api/admin/users — creates a new user with a chosen role; sends welcome email
  @Post()
  createUser(@Body() dto: CreateUserDto) {
    return this.adminService.createUser(dto);
  }

  // DELETE /api/admin/users/:id — permanently removes a user; self-delete and ADMIN-delete blocked
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  deleteUser(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.adminService.deleteUser(id, currentUser.userId);
  }

  // PATCH /api/admin/users/:id/role — assigns MEMBER or MANAGER; ADMIN cannot be assigned
  @Patch(':id/role')
  assignRole(
    @Param('id') id: string,
    @Body() dto: AssignRoleDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.adminService.assignRole(id, dto, currentUser.userId);
  }
}
