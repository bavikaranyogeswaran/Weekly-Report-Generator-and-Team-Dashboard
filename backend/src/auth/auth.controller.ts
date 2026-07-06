import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthenticatedUser } from './interfaces/authenticated-user.interface';

// Type for the Express request object after JwtStrategy attaches req.user
interface RequestWithUser extends Request {
  user: AuthenticatedUser;
}

@Controller('auth') // all routes here are prefixed with /api/auth
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // POST /api/auth/register — open to everyone, no token required
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  // POST /api/auth/login — returns a JWT access token on valid credentials
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // GET /api/auth/me — returns the logged-in user's profile
  // AuthGuard('jwt') verifies the Bearer token and populates req.user via JwtStrategy
  // Step 3.7 replaces AuthGuard('jwt') with the custom JwtAuthGuard class
  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  getMe(@Request() req: RequestWithUser) {
    // req.user.userId comes from JwtStrategy.validate() — it's the UUID from the token
    return this.authService.getMe(req.user.userId);
  }
}
