import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Report } from './entities/report.entity';
import { Project } from '../projects/entities/project.entity';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    // Register both entities — ReportsService queries Project to validate projectId
    TypeOrmModule.forFeature([Report, Project]),

    // Provides JwtAuthGuard used in ReportsController
    AuthModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
