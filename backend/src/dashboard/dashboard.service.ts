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

  // Returns four headline numbers for the top stat tiles on the manager dashboard
  async getSummary() {
    const weekStart = this.getCurrentWeekMonday();

    const [totalUsers, totalProjects, submittedThisWeek] = await Promise.all([
      this.usersRepo.count(),
      this.projectsRepo.count(),
      this.reportsRepo.count({
        where: { weekStart, status: ReportStatus.SUBMITTED },
      }),
    ]);

    // Percentage of members who submitted a report this week (0 if no users yet)
    const submissionRate =
      totalUsers > 0 ? Math.round((submittedThisWeek / totalUsers) * 100) : 0;

    return {
      totalUsers,
      totalProjects,
      submittedThisWeek,
      submissionRate, // 0–100 percentage
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
