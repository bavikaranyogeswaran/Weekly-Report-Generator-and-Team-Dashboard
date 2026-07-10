import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { CronJob } from 'cron';
import { LessThan, Repository } from 'typeorm';
import { Report } from '../reports/entities/report.entity';
import { ReportStatus } from '../common/enums/report-status.enum';
import { DateUtilsService } from '../common/date-utils.service';

@Injectable()
export class TasksService implements OnModuleInit {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectRepository(Report)
    private readonly reportsRepo: Repository<Report>,

    private readonly dateUtils: DateUtilsService,

    // Read APP_TIMEZONE so the job's trigger time follows the team's timezone
    private readonly config: ConfigService,

    // Lets us register the cron job at runtime with a timezone from config.
    // The static @Cron decorator can't do this — its options are fixed at class-load,
    // which forced a hardcoded timezone here before.
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  // Register the weekly "mark overdue reports LATE" job on startup.
  // Fires every Monday at 09:00 in APP_TIMEZONE (never hardcoded).
  onModuleInit(): void {
    const tz = this.config.get<string>('APP_TIMEZONE') ?? 'Asia/Colombo';

    const job = CronJob.from({
      cronTime: '0 9 * * 1', // every Monday at 09:00
      timeZone: tz,
      onTick: () => {
        // CronJob expects a sync tick — kick off the async work and log any failure
        this.markLateReports().catch((err) =>
          this.logger.error(
            'markLateReports failed',
            err instanceof Error ? err.stack : String(err),
          ),
        );
      },
    });

    this.schedulerRegistry.addCronJob('markLateReports', job);
    job.start();

    this.logger.log(`Scheduled markLateReports for Mondays 09:00 (${tz})`);
  }

  // Any DRAFT report from a week that has already ended is marked LATE.
  async markLateReports(): Promise<void> {
    const thisMonday = this.dateUtils.getCurrentWeekMonday();

    // Any DRAFT report whose week started before this Monday is now overdue
    const result = await this.reportsRepo.update(
      { status: ReportStatus.DRAFT, weekStart: LessThan(thisMonday) },
      { status: ReportStatus.LATE },
    );

    this.logger.log(`Marked ${result.affected ?? 0} overdue reports as LATE`);
  }
}
