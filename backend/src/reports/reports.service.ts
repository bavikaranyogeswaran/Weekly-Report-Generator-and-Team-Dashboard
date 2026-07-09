import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from './entities/report.entity';
import { Project } from '../projects/entities/project.entity';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { ReportQueryDto } from './dto/report-query.dto';
import { ReportStatus } from '../common/enums/report-status.enum';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private readonly reportsRepo: Repository<Report>,

    // Needed to validate that projectId exists when creating a report
    @InjectRepository(Project)
    private readonly projectsRepo: Repository<Project>,
  ) {}

  // Creates a new DRAFT report linked to the calling user
  async create(userId: string, dto: CreateReportDto) {
    // Validate the project exists before saving to give a clear 404 instead of a DB error
    if (dto.projectId) {
      const project = await this.projectsRepo.findOne({ where: { id: dto.projectId } });
      if (!project) {
        throw new NotFoundException('Project not found');
      }
    }

    const report = this.reportsRepo.create({
      ...dto,
      userId,
      status: ReportStatus.DRAFT,
    });

    const saved = await this.reportsRepo.save(report);
    return saved;
  }

  // Returns reports with optional filters.
  // MEMBERs are always scoped to their own reports — the userId filter cannot be overridden.
  // MANAGERs see all reports and can filter by any combination of fields.
  async findAll(userId: string, role: Role, query: ReportQueryDto) {
    const qb = this.reportsRepo
      .createQueryBuilder('report')
      .leftJoinAndSelect('report.user', 'user')
      .leftJoinAndSelect('report.project', 'project')
      .orderBy('report.createdAt', 'DESC');

    // Hard-scope members to their own data regardless of query params
    if (role === Role.MEMBER) {
      qb.andWhere('report.userId = :userId', { userId });
    } else {
      // Manager can optionally filter by a specific user
      if (query.userId) {
        qb.andWhere('report.userId = :userId', { userId: query.userId });
      }
    }

    if (query.projectId) {
      qb.andWhere('report.projectId = :projectId', { projectId: query.projectId });
    }
    if (query.status) {
      qb.andWhere('report.status = :status', { status: query.status });
    }
    if (query.weekStartFrom) {
      qb.andWhere('report.weekStart >= :weekStartFrom', { weekStartFrom: query.weekStartFrom });
    }
    if (query.weekStartTo) {
      qb.andWhere('report.weekStart <= :weekStartTo', { weekStartTo: query.weekStartTo });
    }

    const reports = await qb.getMany();

    // Strip passwordHash from every loaded user before returning
    return reports.map((r) => this.stripUserPassword(r));
  }

  // Returns a single report — MEMBER can only view their own (403 otherwise)
  async findOne(id: string, userId: string, role: Role) {
    const report = await this.reportsRepo.findOne({
      where: { id },
      relations: { user: true, project: true },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    // Members must not be able to read other members' reports
    if (role === Role.MEMBER && report.userId !== userId) {
      throw new ForbiddenException('You can only view your own reports');
    }

    return this.stripUserPassword(report);
  }

  // Applies a partial update — only DRAFT reports can be edited, and only by their owner
  async update(id: string, userId: string, dto: UpdateReportDto) {
    const report = await this.findOne(id, userId, Role.MEMBER); // ownership check built-in

    if (report.status !== ReportStatus.DRAFT) {
      throw new BadRequestException('Only DRAFT reports can be edited');
    }

    // Validate new projectId if it is being changed
    if (dto.projectId && dto.projectId !== report.projectId) {
      const project = await this.projectsRepo.findOne({ where: { id: dto.projectId } });
      if (!project) {
        throw new NotFoundException('Project not found');
      }
    }

    Object.assign(report, dto);
    const saved = await this.reportsRepo.save(report);
    return this.stripUserPassword(saved);
  }

  // Submits a DRAFT report — sets status to SUBMITTED and records the timestamp
  async submit(id: string, userId: string) {
    const report = await this.findOne(id, userId, Role.MEMBER); // ownership check built-in

    if (report.status !== ReportStatus.DRAFT) {
      throw new BadRequestException('Only DRAFT reports can be submitted');
    }

    report.status = ReportStatus.SUBMITTED;
    report.submittedAt = new Date();
    const saved = await this.reportsRepo.save(report);
    return this.stripUserPassword(saved);
  }

  // Deletes a report — only the owner can delete, and only while it is still a DRAFT
  async remove(id: string, userId: string) {
    const report = await this.findOne(id, userId, Role.MEMBER); // ownership check built-in

    if (report.status !== ReportStatus.DRAFT) {
      throw new BadRequestException('Only DRAFT reports can be deleted');
    }

    await this.reportsRepo.remove(report);
    return { message: 'Report deleted successfully' };
  }

  // Removes passwordHash from the nested user object on a report
  private stripUserPassword(report: Report): Report {
    if (report.user) {
      const { passwordHash: _pw, ...safeUser } = report.user as any;
      (report as any).user = safeUser;
    }
    return report;
  }
}
