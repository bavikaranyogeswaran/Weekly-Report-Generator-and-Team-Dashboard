import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ReportStatus } from '../../common/enums/report-status.enum';

// Query parameters accepted by GET /reports
// All fields are optional — any combination can be used to filter results
export class ReportQueryDto {
  // Filter by a specific user (manager use only — members are always filtered to themselves)
  @IsUUID('4')
  @IsOptional()
  userId?: string;

  // Filter by project
  @IsUUID('4')
  @IsOptional()
  projectId?: string;

  // Filter by report status (DRAFT | SUBMITTED | LATE)
  @IsEnum(ReportStatus)
  @IsOptional()
  status?: ReportStatus;

  // Filter by week start date e.g. "2026-07-07"
  @IsDateString()
  @IsOptional()
  weekStart?: string;
}
