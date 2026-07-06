import { Role } from '../../common/enums/role.enum';

// Defines the data we encode inside every JWT token.
// Keep it small — only what guards need to make access decisions without a DB call.
export interface JwtPayload {
  sub: string; // standard JWT "subject" field — holds the user's UUID
  role: Role;  // included so RolesGuard can check permissions without hitting the DB
}
