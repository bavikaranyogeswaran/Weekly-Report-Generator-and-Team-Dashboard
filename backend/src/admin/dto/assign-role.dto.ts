import { IsIn } from 'class-validator';

// Body accepted by PATCH /admin/users/:id/role.
// Deliberately excludes ADMIN — that role cannot be assigned via the API.
export class AssignRoleDto {
  @IsIn(['MEMBER', 'MANAGER'], { message: 'role must be MEMBER or MANAGER' })
  role: 'MEMBER' | 'MANAGER';
}
