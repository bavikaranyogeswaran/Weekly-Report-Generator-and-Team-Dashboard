import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';

@Controller('auth') // all routes here are prefixed with /api/auth
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // POST /api/auth/register — open to everyone, no token required
  @Post('register')
  @HttpCode(HttpStatus.CREATED) // respond with 201 instead of the default 200
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }
}
