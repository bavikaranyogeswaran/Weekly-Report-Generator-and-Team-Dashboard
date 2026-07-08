import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Groq from 'groq-sdk';
import { Report } from '../reports/entities/report.entity';
import { User } from '../users/entities/user.entity';
import { ReportStatus } from '../common/enums/report-status.enum';

@Injectable()
export class AiService {
  private readonly groq: Groq;
  private readonly modelName: string;

  constructor(
    private readonly config: ConfigService,

    @InjectRepository(Report)
    private readonly reportsRepo: Repository<Report>,

    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {
    const apiKey = config.getOrThrow<string>('GROQ_API_KEY');

    // Model and key come from env — never hardcoded
    this.modelName = config.get<string>('GROQ_MODEL') ?? 'llama-3.3-70b-versatile';
    this.groq = new Groq({ apiKey });
  }

  // Sends a prompt to the configured Groq model and returns the response text.
  // Throws 500 if the API call fails so the caller always gets a clean error.
  protected async generate(prompt: string): Promise<string> {
    try {
      const completion = await this.groq.chat.completions.create({
        model: this.modelName,
        messages: [{ role: 'user', content: prompt }],
      });

      return completion.choices[0]?.message?.content ?? '';
    } catch (err: any) {
      throw new InternalServerErrorException(
        `Groq API error: ${err?.message ?? 'unknown error'}`,
      );
    }
  }

  // Answers a manager's question using live team report data as context.
  async chat(message: string): Promise<{ reply: string }> {
    const context = await this.buildTeamContext();

    // System prompt tells the model its role, then injects the live team data,
    // then appends the manager's question at the end
    const prompt = [
      `You are a helpful assistant for a team manager using a weekly report dashboard.`,
      `Your job is to answer questions about the team's weekly reports clearly and concisely.`,
      `Use only the data provided below — do not make up information.`,
      `If the data does not contain enough information to answer, say so honestly.`,
      ``,
      context,
      ``,
      `=== MANAGER'S QUESTION ===`,
      message,
    ].join('\n');

    const reply = await this.generate(prompt);
    return { reply };
  }

  // Builds a structured text block from live team data so the model can reason over it.
  // Includes this week's submission status and the last 20 submitted reports.
  async buildTeamContext(): Promise<string> {
    const tz = this.config.get<string>('APP_TIMEZONE') ?? 'Asia/Colombo';
    const weekMonday = this.getCurrentWeekMonday();
    const weekLabel = weekMonday.toLocaleDateString('en-CA', { timeZone: tz });

    // Run both queries in parallel for speed
    const [users, recentReports] = await Promise.all([
      this.usersRepo.find({ order: { name: 'ASC' } }),
      this.reportsRepo.find({
        where: { status: ReportStatus.SUBMITTED },
        relations: { user: true, project: true },
        order: { submittedAt: 'DESC' },
        take: 20,
      }),
    ]);

    // Map userId → submitted report for current week (for submission status section)
    const thisWeekReports = recentReports.filter(
      (r) => new Date(r.weekStart).toLocaleDateString('en-CA', { timeZone: tz }) === weekLabel,
    );
    const thisWeekMap = new Map(thisWeekReports.map((r) => [r.userId, r]));

    // ── Section 1: submission status for the current week ─────────────────────
    const statusLines = users.map((u) => {
      const report = thisWeekMap.get(u.id);
      const status = report ? 'SUBMITTED' : 'MISSING';
      return `  - ${u.name} (${u.email}): ${status}`;
    });

    // ── Section 2: recent submitted reports ───────────────────────────────────
    const reportLines = recentReports.map((r) => {
      const lines = [
        `---`,
        `Member: ${r.user?.name ?? 'Unknown'} (${r.user?.email ?? ''})`,
        `Project: ${r.project?.name ?? 'No project'}`,
        `Week: ${new Date(r.weekStart).toLocaleDateString('en-CA', { timeZone: tz })} to ${new Date(r.weekEnd).toLocaleDateString('en-CA', { timeZone: tz })}`,
        `Tasks Completed: ${r.tasksCompleted}`,
        `Tasks Planned: ${r.tasksPlanned}`,
        `Blockers: ${r.blockers}`,
        r.hoursWorked != null ? `Hours Worked: ${r.hoursWorked}` : null,
        r.notes ? `Notes: ${r.notes}` : null,
      ];
      return lines.filter(Boolean).join('\n');
    });

    return [
      `=== TEAM REPORT CONTEXT (timezone: ${tz}) ===`,
      ``,
      `CURRENT WEEK (${weekLabel}) SUBMISSION STATUS:`,
      ...statusLines,
      ``,
      `RECENT SUBMITTED REPORTS (up to 20, newest first):`,
      ...reportLines,
      `---`,
    ].join('\n');
  }

  // Returns the Monday of the current week in the configured timezone
  private getCurrentWeekMonday(): Date {
    const tz = this.config.get<string>('APP_TIMEZONE') ?? 'Asia/Colombo';
    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: tz });
    const [year, month, day] = todayStr.split('-').map(Number);
    const today = new Date(year, month - 1, day);
    const dayOfWeek = today.getDay();
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    return new Date(year, month - 1, day + daysToMonday);
  }
}
