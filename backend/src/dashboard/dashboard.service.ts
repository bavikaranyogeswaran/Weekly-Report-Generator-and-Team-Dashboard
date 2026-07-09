import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Project } from '../projects/entities/project.entity';
import { Report } from '../reports/entities/report.entity';
import { ReportStatus } from '../common/enums/report-status.enum';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,

    @InjectRepository(Project)
    private readonly projectsRepo: Repository<Project>,

    @InjectRepository(Report)
    private readonly reportsRepo: Repository<Report>,

    // Used to read APP_TIMEZONE — never hardcode the timezone
    private readonly config: ConfigService,
  ) {}

  // Returns five headline numbers for the top stat tiles on the manager dashboard
  async getSummary() {
    const weekStart = this.getCurrentWeekMonday();

    const [totalUsers, totalProjects, submittedThisWeek, openBlockers] = await Promise.all([
      this.usersRepo.count(),
      this.projectsRepo.count(),
      this.reportsRepo.count({
        where: { weekStart, status: ReportStatus.SUBMITTED },
      }),
      // Count submitted reports this week where the blockers field is non-empty
      this.reportsRepo
        .createQueryBuilder('report')
        .where('report.weekStart = :weekStart', { weekStart })
        .andWhere('report.status = :status', { status: ReportStatus.SUBMITTED })
        .andWhere("TRIM(report.blockers) != ''")
        .getCount(),
    ]);

    // Percentage of members who submitted a report this week (0 if no users yet)
    const submissionRate =
      totalUsers > 0 ? Math.round((submittedThisWeek / totalUsers) * 100) : 0;

    return {
      totalUsers,
      totalProjects,
      submittedThisWeek,
      submissionRate, // 0–100 percentage
      openBlockers,   // submitted reports this week with non-empty blockers field
    };
  }

  // For every user shows whether they have SUBMITTED, have a DRAFT, or are MISSING
  // for the given week. Defaults to the current week when weekStart is omitted.
  async getSubmissionStatus(weekStart?: string) {
    const tz = this.config.get<string>('APP_TIMEZONE') ?? 'Asia/Colombo';

    // Use the provided date or fall back to this week's Monday in the configured timezone
    const targetDate = weekStart
      ? this.parseDateString(weekStart)
      : this.getCurrentWeekMonday();

    // Fetch all users and all reports for the target week in parallel
    const [users, reports] = await Promise.all([
      this.usersRepo.find({ order: { name: 'ASC' } }),
      this.reportsRepo.find({
        where: { weekStart: targetDate },
        select: { userId: true, status: true },
      }),
    ]);

    // Build a userId → status map for O(1) lookup per user
    const reportMap = new Map(reports.map((r) => [r.userId, r.status]));

    return users.map(({ passwordHash: _pw, ...safeUser }) => ({
      user: safeUser,
      // SUBMITTED / DRAFT come from the report; no report at all = MISSING
      status: reportMap.get(safeUser.id) ?? 'MISSING',
      weekStart: targetDate.toLocaleDateString('en-CA', { timeZone: tz }),
    }));
  }

  // Returns the most recently submitted reports with nested user and project info.
  // Drives the activity feed on the manager dashboard.
  async getActivityFeed(limit = 10) {
    const reports = await this.reportsRepo.find({
      where: { status: ReportStatus.SUBMITTED },
      relations: { user: true, project: true },
      order: { submittedAt: 'DESC' },
      take: limit, // cap results — default 10, caller can request more
    });

    // Strip passwordHash from every nested user before returning
    return reports.map((r) => {
      if (r.user) {
        const { passwordHash: _pw, ...safeUser } = r.user as any;
        (r as any).user = safeUser;
      }
      return r;
    });
  }

  // Returns total hours worked, grouped by either project or user.
  // Drives the workload bar chart; callers toggle groupBy at query time.
  async getWorkload(groupBy: 'project' | 'user' = 'project') {
    return groupBy === 'user'
      ? this.workloadByUser()
      : this.workloadByProject();
  }

  // Hours per project — each row gets the project's own hex colour for the bar
  private async workloadByProject() {
    const rows = await this.projectsRepo
      .createQueryBuilder('project')
      .leftJoin(
        'project.reports',
        'report',
        'report.status = :status',
        { status: ReportStatus.SUBMITTED },
      )
      .select('project.name', 'name')
      .addSelect('project.color', 'color')
      .addSelect('COALESCE(SUM(report.hoursWorked), 0)', 'totalHours')
      .groupBy('project.id')
      .orderBy('COALESCE(SUM(report.hoursWorked), 0)', 'DESC')
      .addOrderBy('project.name', 'ASC')
      .getRawMany<{ name: string; color: string; totalHours: string }>();

    return rows
      .filter((r) => Number(r.totalHours) > 0)
      .map((r) => ({ name: r.name, color: r.color, totalHours: Number(r.totalHours) }));
  }

  // Hours per user — color is null (frontend applies a uniform palette for users)
  private async workloadByUser() {
    const rows = await this.usersRepo
      .createQueryBuilder('user')
      .leftJoin(
        'user.reports',
        'report',
        'report.status = :status',
        { status: ReportStatus.SUBMITTED },
      )
      .select('user.name', 'name')
      .addSelect('COALESCE(SUM(report.hoursWorked), 0)', 'totalHours')
      .groupBy('user.id')
      .orderBy('COALESCE(SUM(report.hoursWorked), 0)', 'DESC')
      .addOrderBy('user.name', 'ASC')
      .getRawMany<{ name: string; totalHours: string }>();

    return rows
      .filter((r) => Number(r.totalHours) > 0)
      .map((r) => ({ name: r.name, color: null, totalHours: Number(r.totalHours) }));
  }

  // Returns the last N weeks with submitted-report counts — drives the trend line chart.
  // Weeks with zero submissions are included so the chart has a continuous x-axis.
  async getWeeklyTrends(weeks = 8) {
    const tz = this.config.get<string>('APP_TIMEZONE') ?? 'Asia/Colombo';

    const currentMonday = this.getCurrentWeekMonday();

    // Build YYYY-MM-DD labels for the last N weeks, oldest first
    const weekLabels: string[] = [];
    for (let i = weeks - 1; i >= 0; i--) {
      const monday = new Date(currentMonday);
      monday.setDate(currentMonday.getDate() - i * 7);
      weekLabels.push(monday.toLocaleDateString('en-CA', { timeZone: tz }));
    }

    // Single GROUP BY query for the whole date range — avoids N round trips
    // TO_CHAR ensures the key format matches our weekLabels strings exactly
    const rows = await this.reportsRepo
      .createQueryBuilder('report')
      .select("TO_CHAR(report.weekStart, 'YYYY-MM-DD')", 'weekLabel')
      .addSelect('COUNT(*)', 'submitted')
      // Sum non-empty lines in tasksCompleted across all reports for this week.
      // regexp_replace collapses consecutive newlines so blank lines don't inflate the count.
      .addSelect(
        `COALESCE(SUM(
          CASE WHEN TRIM(report.tasksCompleted) = '' THEN 0
          ELSE array_length(
            string_to_array(
              regexp_replace(TRIM(report.tasksCompleted), E'\\n+', E'\\n', 'g'),
              E'\\n'
            ), 1
          ) END
        ), 0)`,
        'tasksCompleted',
      )
      .where('report.status = :status', { status: ReportStatus.SUBMITTED })
      .andWhere('report.weekStart >= :startDate', { startDate: weekLabels[0] })
      .groupBy('report.weekStart')
      .orderBy('report.weekStart', 'ASC')
      .getRawMany<{ weekLabel: string; submitted: string; tasksCompleted: string }>();

    // Map weekLabel → row for O(1) lookup when filling in zero weeks
    const rowMap = new Map(rows.map((r) => [r.weekLabel, r]));

    return weekLabels.map((weekStart) => ({
      weekStart,
      submitted:      parseInt(rowMap.get(weekStart)?.submitted      ?? '0', 10),
      tasksCompleted: parseInt(rowMap.get(weekStart)?.tasksCompleted ?? '0', 10),
    }));
  }

  // Parses a YYYY-MM-DD string into a local-midnight Date (avoids UTC shift from new Date(str))
  private parseDateString(dateStr: string): Date {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  // Returns the Date of the Monday that started the current week, in the configured timezone.
  // Using APP_TIMEZONE ensures week boundaries align with the team's local calendar.
  protected getCurrentWeekMonday(): Date {
    const tz = this.config.get<string>('APP_TIMEZONE') ?? 'Asia/Colombo';

    // Get today's date as YYYY-MM-DD in the configured timezone (en-CA locale gives this format)
    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: tz });

    // Parse the date parts and build a local-midnight Date
    const [year, month, day] = todayStr.split('-').map(Number);
    const today = new Date(year, month - 1, day);

    // Shift back to the most recent Monday (Sunday = 0, so Sunday goes back 6 days)
    const dayOfWeek = today.getDay();
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    return new Date(year, month - 1, day + daysToMonday);
  }
}
