import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

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

  // Auto-discover all entity files in any subdirectory
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],

  // Automatically create/update tables in development — disable in production
  synchronize: config.get<string>('NODE_ENV') !== 'production',

  // Log SQL queries in development to help with debugging
  logging: config.get<string>('NODE_ENV') === 'development',
});
