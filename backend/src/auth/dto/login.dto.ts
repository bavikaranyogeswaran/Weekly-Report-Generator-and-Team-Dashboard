import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  // Must be a valid email format
  @IsEmail()
  email: string;

  // Must not be blank — actual strength is validated at registration
  @IsString()
  @IsNotEmpty()
  password: string;
}
