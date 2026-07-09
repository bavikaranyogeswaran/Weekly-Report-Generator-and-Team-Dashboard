import { IsEmail, IsIn, IsString, MinLength } from 'class-validator';

// Payload for POST /admin/users — admin creates an account with a chosen role
export class CreateUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  // Initial password set by the admin — sent to the user via welcome email
  @IsString()
  @MinLength(8)
  password: string;

  // Only MEMBER or MANAGER can be assigned; ADMIN is reserved for the seeded account
  @IsIn(['MEMBER', 'MANAGER'])
  role: 'MEMBER' | 'MANAGER';
}
