import { PartialType } from '@nestjs/mapped-types';
import { CreateProjectDto } from './create-project.dto';

// All fields from CreateProjectDto become optional for PATCH /projects/:id
export class UpdateProjectDto extends PartialType(CreateProjectDto) {}
