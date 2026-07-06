import { SetMetadata } from '@nestjs/common';
import { Role } from '../enums/role.enum';

// The key used to store role metadata on a route handler
export const ROLES_KEY = 'roles';

// Attach one or more allowed roles to a route.
// RolesGuard reads this metadata at request time to decide whether to allow access.
//
// Usage:
//   @UseGuards(JwtAuthGuard, RolesGuard)
//   @Roles(Role.MANAGER)
//   getTeamReports() { ... }
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
