import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  // The user must supply their current password to authorise the change
  @IsString()
  currentPassword: string;

  @IsString()
  @MinLength(8)
  newPassword: string;
}
