import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { AdminSeederService } from './admin-seeder.service';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AuthModule } from '../auth/auth.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    // User repository used by both the seeder and the admin service
    TypeOrmModule.forFeature([User]),

    // Provides JwtAuthGuard and AdminGuard used in AdminController
    AuthModule,

    // Provides EmailService so AdminService can email users on role changes
    EmailModule,
  ],
  controllers: [AdminController],
  providers: [AdminSeederService, AdminService],
  exports: [AdminSeederService],
})
export class AdminModule {}
