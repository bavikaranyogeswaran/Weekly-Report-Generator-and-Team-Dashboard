import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { ReportQueryDto } from './dto/report-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

// All routes require a valid JWT — ownership and role checks happen inside the service
@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  // POST /api/reports — any authenticated user creates a DRAFT report
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateReportDto,
  ) {
    return this.reportsService.create(user.userId, dto);
  }

  // GET /api/reports — members see own reports; managers see all with optional filters
  // Query params: ?userId=&projectId=&status=&weekStart=
  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ReportQueryDto,
  ) {
    return this.reportsService.findAll(user.userId, user.role, query);
  }

  // GET /api/reports/:id — member can only read own (403 otherwise); manager reads any
  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.reportsService.findOne(id, user.userId, user.role);
  }

  // PATCH /api/reports/:id — owner can edit own DRAFT report; 400 if already submitted
  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateReportDto,
  ) {
    return this.reportsService.update(id, user.userId, dto);
  }

  // POST /api/reports/:id/submit — owner submits a DRAFT; 400 if already submitted
  @Post(':id/submit')
  @HttpCode(HttpStatus.OK)
  submit(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.reportsService.submit(id, user.userId);
  }

  // DELETE /api/reports/:id — owner deletes own DRAFT; 400 if already submitted
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.reportsService.remove(id, user.userId);
  }
}
