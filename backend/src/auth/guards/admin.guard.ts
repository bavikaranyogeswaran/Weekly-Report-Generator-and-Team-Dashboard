import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Role } from '../../common/enums/role.enum';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

// Allows only ADMIN users to access a route.
// Must always be used AFTER JwtAuthGuard — it relies on req.user being populated.
//
// Usage:
//   @UseGuards(JwtAuthGuard, AdminGuard)
//   @Controller('admin')
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user: AuthenticatedUser }>();

    // Only the ADMIN role passes — MANAGER and MEMBER are both rejected
    return request.user?.role === Role.ADMIN;
  }
}
