import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../../common/enums/role.enum';
import { ROLES_KEY } from '../../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

// Checks whether the logged-in user's role matches the roles set by @Roles() decorator.
// Must always be used AFTER JwtAuthGuard — it relies on req.user being already populated.
//
// Usage:
//   @UseGuards(JwtAuthGuard, RolesGuard)
//   @Roles(Role.MANAGER)
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    // Reflector reads the metadata attached to route handlers by @Roles()
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    // Read the list of roles attached to this route by @Roles()
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(), // check method-level decorator first
      context.getClass(),   // fall back to class-level decorator
    ]);

    // If no @Roles() decorator is present, any authenticated user can access the route
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Get the user object that JwtStrategy attached to the request
    const request = context.switchToHttp().getRequest<{ user: AuthenticatedUser }>();
    const user = request.user;

    // Block access if the user's role is not in the allowed list
    return requiredRoles.includes(user?.role);
  }
}
