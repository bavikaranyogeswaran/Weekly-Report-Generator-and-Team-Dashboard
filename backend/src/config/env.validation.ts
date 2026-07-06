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

  // AI
  GEMINI_API_KEY: Joi.string().required(),

  // App
  PORT: Joi.number().default(3000),
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
});
