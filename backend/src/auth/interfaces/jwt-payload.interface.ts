import { Role } from '../../common/enums/role.enum';

// Defines the data we encode inside every JWT token.
// Keep it small — the user's identity is all we need; authorization is decided from
// the CURRENT role loaded from the DB in JwtStrategy, not from this claim.
export interface JwtPayload {
  sub: string; // standard JWT "subject" field — holds the user's UUID
  role: Role;  // snapshot of the role at sign-in time; kept for debugging, NOT trusted by guards
}
