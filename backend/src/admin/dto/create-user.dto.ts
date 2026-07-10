import { IsEmail, IsIn, IsString } from 'class-validator';

// Payload for POST /admin/users — admin creates an account with a chosen role.
// No password field: the user sets their own via the invite link sent to their email.
export class CreateUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  // Only MEMBER or MANAGER can be assigned; ADMIN is reserved for the seeded account
  @IsIn(['MEMBER', 'MANAGER'])
  role: 'MEMBER' | 'MANAGER';
}
