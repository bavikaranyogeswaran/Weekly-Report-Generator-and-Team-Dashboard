import { IsHexColor, IsNotEmpty, IsOptional, IsString } from 'class-validator';

// Body accepted by POST /projects
export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  // Description is optional — projects can exist with just a name
  @IsString()
  @IsOptional()
  description?: string;

  // Hex color used to visually distinguish projects on the dashboard
  // Defaults to indigo (#6366f1) in the entity if not provided
  @IsHexColor()
  @IsOptional()
  color?: string;
}
