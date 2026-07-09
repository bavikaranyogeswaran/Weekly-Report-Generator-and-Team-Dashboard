import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  // Full display name — must not be blank
  @IsString()
  @IsNotEmpty()
  name: string;

  // Must be a valid email format (e.g. user@example.com)
  @IsEmail()
  email: string;

  // Minimum 8 characters to encourage reasonably strong passwords
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;

  // No role field — every new user is always registered as MEMBER.
  // The admin assigns MEMBER or MANAGER later via PATCH /admin/users/:id/role
}
