import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { envValidationSchema } from './config/env.validation';
import { databaseConfig } from './config/database.config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProjectsModule } from './projects/projects.module';
import { ReportsModule } from './reports/reports.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AiModule } from './ai/ai.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    // Load .env and validate all required variables at startup
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),

    // Connect to PostgreSQL — all values injected from ConfigService (no hardcoding)
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: databaseConfig,
    }),

    // Global rate limiter — default 60 req/min per IP.
    // Sensitive auth endpoints override this with a stricter 5 req/min limit.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),

    AuthModule,
    UsersModule,
    ProjectsModule,
    ReportsModule,
    DashboardModule,
    AiModule,
    AdminModule, // seeds the ADMIN account from env vars on startup
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Apply ThrottlerGuard to every route in the application
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
