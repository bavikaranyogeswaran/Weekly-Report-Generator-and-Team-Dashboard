import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Project } from '../projects/entities/project.entity';
import { Report } from '../reports/entities/report.entity';

// Builds the TypeORM connection options entirely from environment variables.
// Called by TypeOrmModule.forRootAsync — never hardcode credentials here.
export const databaseConfig = (config: ConfigService): TypeOrmModuleOptions => ({
  type: 'postgres',

  // Read every connection value from .env
  host: config.getOrThrow<string>('DB_HOST'),
  port: config.getOrThrow<number>('DB_PORT'),
  username: config.getOrThrow<string>('DB_USER'),
  password: config.getOrThrow<string>('DB_PASS'),
  database: config.getOrThrow<string>('DB_NAME'),

  // Explicitly list every entity so TypeORM always finds them in both dev and prod
  entities: [User, Project, Report],

  // autoLoadEntities also picks up any entity registered via TypeOrmModule.forFeature()
  // inside a feature module — used in Steps 3-7 when we build each module
  autoLoadEntities: true,

  // Automatically create/update tables in development — never enable in production
  synchronize: config.get<string>('NODE_ENV') !== 'production',

  // Log SQL queries only in development to help with debugging
  logging: config.get<string>('NODE_ENV') === 'development',
});
