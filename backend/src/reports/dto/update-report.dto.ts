import { PartialType } from '@nestjs/mapped-types';
import { CreateReportDto } from './create-report.dto';

// All fields from CreateReportDto become optional for PATCH /reports/:id
export class UpdateReportDto extends PartialType(CreateReportDto) {}
