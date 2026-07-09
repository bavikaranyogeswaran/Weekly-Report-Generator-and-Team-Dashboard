import { Role } from '../../common/enums/role.enum';

// Shape of req.user after JwtAuthGuard has validated the token.
// Controllers use this type when they access the logged-in user's data.
export interface AuthenticatedUser {
  userId: string; // the user's UUID from the token payload
  role: Role;     // MEMBER, MANAGER, or ADMIN
}
