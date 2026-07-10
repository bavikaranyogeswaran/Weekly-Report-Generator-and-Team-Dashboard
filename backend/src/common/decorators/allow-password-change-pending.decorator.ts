import { SetMetadata } from '@nestjs/common';

// The key used to mark routes that stay reachable while mustChangePassword is true.
export const ALLOW_PASSWORD_CHANGE_PENDING = 'allowPasswordChangePending';

// Marks a route as accessible even when the user still has a temporary password.
// Only the endpoints needed to view the profile and set a new password use this;
// JwtAuthGuard blocks every other authenticated route until the flag is cleared.
//
// Usage:
//   @AllowPasswordChangePending()
//   @Patch('password')
//   changePassword() { ... }
export const AllowPasswordChangePending = () =>
  SetMetadata(ALLOW_PASSWORD_CHANGE_PENDING, true);
