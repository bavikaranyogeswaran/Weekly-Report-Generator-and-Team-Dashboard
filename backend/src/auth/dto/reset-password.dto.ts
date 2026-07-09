import { IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  // The opaque token from the password-reset email link
  @IsString()
  token: string;

  @IsString()
  @MinLength(8)
  newPassword: string;
}
