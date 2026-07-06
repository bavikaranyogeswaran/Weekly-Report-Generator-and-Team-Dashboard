import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// A named wrapper around Passport's AuthGuard('jwt').
// Using this class instead of AuthGuard('jwt') directly gives us:
//  - a single import across the whole app
//  - a place to add custom behaviour later (e.g. token blacklisting)
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
