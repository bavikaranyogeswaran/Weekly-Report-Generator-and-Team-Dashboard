import { ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { ALLOW_PASSWORD_CHANGE_PENDING } from '../../common/decorators/allow-password-change-pending.decorator';
import type { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

// A named wrapper around Passport's AuthGuard('jwt').
// Beyond validating the JWT, it enforces mustChangePassword server-side: an admin-invited
// user with a temporary password can only reach the allowlisted routes (view profile,
// change password) until they set their own. This backs up the frontend redirect so the
// rule can't be bypassed by calling the API directly.
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Run the JWT auth first — this populates req.user (including mustChangePassword)
    const authed = (await super.canActivate(context)) as boolean;
    if (!authed) return false;

    // Some routes must stay reachable while a password change is pending —
    // namely viewing your own profile and the change-password endpoint itself
    const allowPending = this.reflector.getAllAndOverride<boolean>(
      ALLOW_PASSWORD_CHANGE_PENDING,
      [context.getHandler(), context.getClass()],
    );
    if (allowPending) return true;

    // Block every other authenticated route until the temporary password is changed
    const { user } = context
      .switchToHttp()
      .getRequest<{ user?: AuthenticatedUser }>();
    if (user?.mustChangePassword) {
      throw new ForbiddenException(
        'You must change your temporary password before using the app',
      );
    }

    return true;
  }
}
