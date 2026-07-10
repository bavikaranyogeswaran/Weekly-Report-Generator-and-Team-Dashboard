import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DateUtilsService {
  constructor(private readonly config: ConfigService) {}

  // Returns the Date of the Monday that started the current week in the configured timezone.
  // APP_TIMEZONE ensures week boundaries align with the team's local calendar.
  getCurrentWeekMonday(): Date {
    const tz = this.config.get<string>('APP_TIMEZONE') ?? 'Asia/Colombo';

    // Get today's date as YYYY-MM-DD in the configured timezone (en-CA gives this format)
    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: tz });

    // Parse date parts and build a local-midnight Date to avoid UTC shift
    const [year, month, day] = todayStr.split('-').map(Number);
    const today = new Date(year, month - 1, day);

    // Shift back to the most recent Monday (Sunday = 0, so Sunday goes back 6 days)
    const dayOfWeek = today.getDay();
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    return new Date(year, month - 1, day + daysToMonday);
  }
}
