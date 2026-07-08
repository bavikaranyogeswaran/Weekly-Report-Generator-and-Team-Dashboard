import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

// All dashboard endpoints are manager-only — members have no access
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.MANAGER)
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
  getSubmissionStatus(@Query('weekStart') weekStart?: string) {
    return this.dashboardService.getSubmissionStatus(weekStart);
  }

  // GET /api/dashboard/weekly-trends?weeks=8
  // Returns the last N weeks of submission counts for the trend chart
  @Get('weekly-trends')
  getWeeklyTrends(@Query('weeks') weeks?: string) {
    // Parse the string query param to a number — default to 8 weeks
    const weeksNum = weeks ? parseInt(weeks, 10) : 8;
    return this.dashboardService.getWeeklyTrends(weeksNum);
  }

  // GET /api/dashboard/workload
  // Returns total hours worked per user across all submitted reports
  @Get('workload')
  getWorkload() {
    return this.dashboardService.getWorkload();
  }

  // GET /api/dashboard/activity-feed?limit=10
  // Returns the most recent submitted reports with user and project info
  @Get('activity-feed')
  getActivityFeed(@Query('limit') limit?: string) {
    // Parse the string query param to a number — default to 10 items
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.dashboardService.getActivityFeed(limitNum);
  }
}
