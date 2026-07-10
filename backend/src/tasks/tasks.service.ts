import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { Report } from '../reports/entities/report.entity';
import { ReportStatus } from '../common/enums/report-status.enum';
import { DateUtilsService } from '../common/date-utils.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectRepository(Report)
    private readonly reportsRepo: Repository<Report>,

    private readonly dateUtils: DateUtilsService,
  ) {}

  // Runs every Monday at 09:00 in the app timezone (default Asia/Colombo).
  // Any DRAFT report from a week that has already ended is marked LATE.
  @Cron('0 9 * * 1', { timeZone: 'Asia/Colombo' })
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
