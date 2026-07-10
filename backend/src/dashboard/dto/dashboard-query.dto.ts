import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

// Query params for GET /dashboard/submission-status
export class SubmissionStatusQueryDto {
  // Defaults to the current week's Monday when omitted
  @IsOptional()
  @IsDateString()
  weekStart?: string;
}

// Query params for GET /dashboard/weekly-trends
export class WeeklyTrendsQueryDto {
  // Number of past weeks to include in the trend chart — capped at 52 (one year)
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(52)
  weeks?: number;
}

// Query params for GET /dashboard/workload
export class WorkloadQueryDto {
  @IsOptional()
  @IsIn(['project', 'user'])
  groupBy?: 'project' | 'user';
}

// Query params for GET /dashboard/activity-feed
export class ActivityFeedQueryDto {
  // Max rows returned — capped at 100 to prevent unbounded queries
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
