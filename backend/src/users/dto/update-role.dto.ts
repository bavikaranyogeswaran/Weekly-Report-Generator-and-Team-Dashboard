import { IsEnum } from 'class-validator';
import { Role } from '../../common/enums/role.enum';

// Body accepted by PATCH /users/:id/role — only a valid Role enum value is allowed
export class UpdateRoleDto {
  @IsEnum(Role, { message: 'role must be MEMBER or MANAGER' })
  role: Role;
}
