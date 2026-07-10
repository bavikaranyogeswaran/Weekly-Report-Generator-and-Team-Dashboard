import { IsIn } from 'class-validator';

// Body accepted by PATCH /users/:id/role.
// Deliberately excludes ADMIN — @IsEnum(Role) used to accept "ADMIN", which let a
// manager grant themselves or anyone else the admin role. Only MEMBER/MANAGER are valid here.
export class UpdateRoleDto {
  @IsIn(['MEMBER', 'MANAGER'], { message: 'role must be MEMBER or MANAGER' })
  role: 'MEMBER' | 'MANAGER';
}
