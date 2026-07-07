import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    // Register the User entity so AuthService can inject the User repository
    TypeOrmModule.forFeature([User]),

    // Provides EmailService for sending the verification email on registration
    EmailModule,

    // Passport is required by the JWT strategy added in step 3.3
    PassportModule,

    // Configure JWT signing — secret and expiry come from .env, never hardcoded
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          // Cast needed because @nestjs/jwt expects a branded StringValue type,
          // not a plain string — the runtime value (e.g. "7d") is perfectly valid
          expiresIn: (config.get<string>('JWT_EXPIRES_IN') ?? '7d') as any,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  // JwtStrategy must be a provider so Passport can discover and use it
  providers: [AuthService, JwtStrategy, JwtAuthGuard, RolesGuard],

  // Export both guards so any module that imports AuthModule can use them directly
  exports: [JwtAuthGuard, RolesGuard],
})
export class AuthModule {}
