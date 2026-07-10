import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Report } from '../reports/entities/report.entity';
import { TasksService } from './tasks.service';

@Module({
  imports: [
    // TasksService needs to query and update reports
    TypeOrmModule.forFeature([Report]),
  ],
  providers: [TasksService],
})
export class TasksModule {}
