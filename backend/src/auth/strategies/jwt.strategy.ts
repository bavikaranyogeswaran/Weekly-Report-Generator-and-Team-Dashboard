import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly config: ConfigService) {
    super({
      // Pull the token from the "Authorization: Bearer <token>" header
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      // Reject tokens that have passed their expiry time
      ignoreExpiration: false,

      // Read the secret from .env — never hardcode this value
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  // Passport calls this automatically after the token signature is verified.
  // Whatever we return here gets attached to req.user on every protected route.
  validate(payload: JwtPayload) {
    return {
      userId: payload.sub,  // the user's UUID
      role: payload.role,   // MEMBER or MANAGER — used by RolesGuard
    };
  }
}
