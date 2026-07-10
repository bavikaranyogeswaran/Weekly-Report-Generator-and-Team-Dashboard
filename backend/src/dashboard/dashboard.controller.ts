import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import {
  ActivityFeedQueryDto,
  SubmissionStatusQueryDto,
  WeeklyTrendsQueryDto,
  WorkloadQueryDto,
} from './dto/dashboard-query.dto';

// Dashboard is restricted to MANAGER and ADMIN — members have no access
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.MANAGER, Role.ADMIN)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  // GET /api/dashboard/summary
  // Returns: totalUsers, totalProjects, submittedThisWeek, submissionRate
  @Get('summary')
  getSummary() {
    return this.dashboardService.getSummary();
  }

  // GET /api/dashboard/submission-status?weekStart=2026-07-07
  // Omitting weekStart defaults to the current week in APP_TIMEZONE
  @Get('submission-status')
  getSubmissionStatus(@Query() query: SubmissionStatusQueryDto) {
    return this.dashboardService.getSubmissionStatus(query.weekStart);
  }

  // GET /api/dashboard/weekly-trends?weeks=8
  // Returns the last N weeks of submission counts for the trend chart
  @Get('weekly-trends')
  getWeeklyTrends(@Query() query: WeeklyTrendsQueryDto) {
    return this.dashboardService.getWeeklyTrends(query.weeks ?? 8);
  }

  // GET /api/dashboard/workload?groupBy=project|user
  // groupBy defaults to 'project'; pass 'user' to switch to per-member view
  @Get('workload')
  getWorkload(@Query() query: WorkloadQueryDto) {
    return this.dashboardService.getWorkload(query.groupBy ?? 'project');
  }

  // GET /api/dashboard/activity-feed?limit=10
  // Returns the most recent submitted reports with user and project info
  @Get('activity-feed')
  getActivityFeed(@Query() query: ActivityFeedQueryDto) {
    return this.dashboardService.getActivityFeed(query.limit ?? 10);
  }
}
