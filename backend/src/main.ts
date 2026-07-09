import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Allow the React frontend to call this API — reads FRONTEND_URL so production deployments
  // don't need a code change, only an env var update
  const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
  });

  // Automatically validate all incoming request bodies using class-validator decorators
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,       // strip unknown fields from request body
      forbidNonWhitelisted: true, // throw error if unknown fields are sent
      transform: true,       // auto-convert types (e.g. string "1" → number 1)
    }),
  );

  // All API routes will be prefixed with /api  (e.g. /api/auth/login)
  app.setGlobalPrefix('api');

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Backend running at http://localhost:${port}/api`);
}
bootstrap();
