import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

// Body accepted by POST /reports
export class CreateReportDto {
  // ISO date string e.g. "2026-07-07" — the Monday of the report week
  @IsDateString()
  weekStart: string;

  // ISO date string e.g. "2026-07-13" — the Sunday of the report week
  @IsDateString()
  weekEnd: string;

  @IsString()
  @IsNotEmpty()
  tasksCompleted: string;

  @IsString()
  @IsNotEmpty()
  tasksPlanned: string;

  @IsString()
  @IsNotEmpty()
  blockers: string;

  // Optional — hours worked that week (0–168 covers any realistic work week)
  @IsInt()
  @Min(0)
  @Max(168)
  @IsOptional()
  hoursWorked?: number;

  // Optional — any additional notes or context
  @IsString()
  @IsOptional()
  notes?: string;

  // Optional — links the report to a specific project
  @IsUUID('4', { message: 'projectId must be a valid UUID' })
  @IsOptional()
  projectId?: string;
}
