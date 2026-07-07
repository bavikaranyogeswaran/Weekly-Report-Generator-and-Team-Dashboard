import * as Joi from 'joi';

// Validates all required environment variables at startup.
// The app will throw a clear error immediately if any required variable is missing or wrong.
export const envValidationSchema = Joi.object({
  // Database
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5432),
  DB_USER: Joi.string().required(),
  DB_PASS: Joi.string().required(),
  DB_NAME: Joi.string().required(),

  // Auth
  JWT_SECRET: Joi.string().min(16).required(),
  JWT_EXPIRES_IN: Joi.string().default('7d'), // e.g. 7d, 24h, 3600s

  // AI
  GEMINI_API_KEY: Joi.string().required(),

  // App
  PORT: Joi.number().default(3000),
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  // SMTP — all optional; if SMTP_HOST is absent, verification links are logged to console instead
  SMTP_HOST: Joi.string().optional(),
  SMTP_PORT: Joi.number().default(587),
  SMTP_USER: Joi.string().optional(),
  SMTP_PASS: Joi.string().optional(),
  SMTP_FROM: Joi.string().optional(), // e.g. noreply@yourdomain.com

  // Base URL used to build the verification link (e.g. http://localhost:3000 in dev)
  APP_URL: Joi.string().default('http://localhost:3000'),
});
