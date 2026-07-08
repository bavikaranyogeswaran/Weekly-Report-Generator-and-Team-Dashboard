import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Report } from '../reports/entities/report.entity';
import { User } from '../users/entities/user.entity';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    // AiService queries reports and users to build the team context
    TypeOrmModule.forFeature([Report, User]),

    // Provides JwtAuthGuard and RolesGuard used in AiController
    AuthModule,
  ],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}
