import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AssignRoleDto } from './dto/assign-role.dto';
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
