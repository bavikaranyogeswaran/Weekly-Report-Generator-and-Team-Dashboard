import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateRoleDto } from './dto/update-role.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

// All routes in this controller require a valid JWT — applied at the class level
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // GET /api/users — manager only; lists every registered user
  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.MANAGER)
  findAll() {
    return this.usersService.findAll();
  }

  // GET /api/users/:id — managers can view any profile; members can only view their own
  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    // Block a member from reading someone else's profile
    if (currentUser.role !== Role.MANAGER && currentUser.userId !== id) {
      throw new ForbiddenException('You can only view your own profile');
    }
    return this.usersService.findOne(id);
  }

  // PATCH /api/users/:id/role — manager only; changes a user's role and sends them an email
  @Patch(':id/role')
  @UseGuards(RolesGuard)
  @Roles(Role.MANAGER)
  updateRole(
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.usersService.updateRole(id, dto, currentUser.userId);
  }
}
