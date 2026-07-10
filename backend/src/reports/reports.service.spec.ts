import { ConflictException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { ReportsService } from './reports.service';
import { ReportStatus } from '../common/enums/report-status.enum';

// Regression tests for the duplicate-week fix: a unique (userId, weekStart) violation
// (Postgres code 23505) must surface as a 409 Conflict, while any other DB error is
// rethrown untouched.
describe('ReportsService.create — duplicate week handling', () => {
  let reportsRepo: { create: jest.Mock; save: jest.Mock };
  let projectsRepo: { findOne: jest.Mock };
  let service: ReportsService;

  const dto = {
    weekStart: '2025-01-06',
    weekEnd: '2025-01-12',
    tasksCompleted: 'a',
    tasksPlanned: 'b',
    blockers: 'c',
  };

  // Build an object that passes `instanceof QueryFailedError` without depending on the
  // constructor signature, then stamp on the Postgres error code we care about.
  const pgError = (code: string): QueryFailedError => {
    const err = Object.create(QueryFailedError.prototype) as QueryFailedError & { code: string };
    err.code = code;
    return err;
  };

  beforeEach(() => {
    reportsRepo = {
      create: jest.fn().mockImplementation((r: unknown) => r),
      save: jest.fn(),
    };
    projectsRepo = { findOne: jest.fn() };
    service = new ReportsService(reportsRepo as never, projectsRepo as never);
  });

  it('translates a 23505 unique violation into a 409 Conflict', async () => {
    reportsRepo.save.mockRejectedValue(pgError('23505'));
    await expect(service.create('user-1', dto)).rejects.toBeInstanceOf(ConflictException);
  });

  it('rethrows unrelated DB errors untouched', async () => {
    const other = pgError('23502'); // not-null violation, not a duplicate
    reportsRepo.save.mockRejectedValue(other);
    await expect(service.create('user-1', dto)).rejects.toBe(other);
  });

  it('returns the saved DRAFT report on success', async () => {
    reportsRepo.save.mockImplementation(async (r: Record<string, unknown>) => ({ id: 'r1', ...r }));
    const saved = await service.create('user-1', dto);
    expect(saved.id).toBe('r1');
    expect(saved.status).toBe(ReportStatus.DRAFT);
    expect(saved.userId).toBe('user-1');
  });

  it('rejects an impossible date range before hitting the DB', async () => {
    await expect(
      service.create('user-1', { ...dto, weekStart: '2025-02-10', weekEnd: '2025-02-01' }),
    ).rejects.toThrow('weekEnd must be on or after weekStart');
    expect(reportsRepo.save).not.toHaveBeenCalled();
  });
});
