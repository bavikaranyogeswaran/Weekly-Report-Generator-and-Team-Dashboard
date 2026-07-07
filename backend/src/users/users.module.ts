import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { EmailModule } from '../email/email.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    // Register the User entity so UsersService can inject the User repository
    TypeOrmModule.forFeature([User]),

    // Provides EmailService used by UsersService to send role-assignment emails
    EmailModule,

    // Provides JwtAuthGuard and RolesGuard (exported by AuthModule) used in UsersController
    AuthModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
