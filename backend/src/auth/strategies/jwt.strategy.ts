import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { User } from '../../users/entities/user.entity';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly config: ConfigService,

    // Used to re-load the user on every request so we never trust a stale token claim
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {
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
  //
  // We re-load the user from the DB on every request instead of trusting the token's
  // role claim. This makes role changes and account deletions take effect immediately:
  //  - a demoted manager loses access on their next request (fresh role, not the stale
  //    role baked into a token that may live for days)
  //  - a deleted user's token stops working at once (no matching row -> 401)
  async validate(payload: JwtPayload) {
    // Only the two fields guards need — keeps the per-request lookup cheap
    const user = await this.usersRepo.findOne({
      where: { id: payload.sub },
      select: { id: true, role: true },
    });

    // Token is valid but the account no longer exists — reject it
    if (!user) {
      throw new UnauthorizedException('User account no longer exists');
    }

    return {
      userId: user.id,
      role: user.role, // CURRENT role from the DB, never the (possibly stale) token claim
    };
  }
}
