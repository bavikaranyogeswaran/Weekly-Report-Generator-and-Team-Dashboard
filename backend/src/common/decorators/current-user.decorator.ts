import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';

// Extracts req.user from the request — populated by JwtAuthGuard + JwtStrategy.
// Use this instead of @Request() to keep controllers clean and fully type-safe.
//
// Usage (must be paired with @UseGuards(JwtAuthGuard)):
//   getMe(@CurrentUser() user: AuthenticatedUser) { ... }
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
