import { IsUUID } from 'class-validator';

// Body accepted by POST /projects/:id/members
export class AddMemberDto {
  @IsUUID('4', { message: 'userId must be a valid UUID' })
  userId: string;
}
