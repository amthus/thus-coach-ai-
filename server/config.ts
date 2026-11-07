import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const bool = z
  .string()
  .optional()
  .transform((v) => v === 'true' || v === '1');

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  APP_URL: z.string().url().default('http://localhost:3000'),

  /** PostgreSQL connection string. When absent, a local SQLite file is used (dev/test only). */
  DATABASE_URL: z.string().optional(),
  SQLITE_PATH: z.string().default('.data/thusstride.db'),
  DATABASE_SSL: bool,

  /** Comma separated list of e-mails that receive the admin role when they sign up. */
  ADMIN_EMAILS: z.string().default(''),

  SESSION_TTL_DAYS: z.coerce.number().int().positive().default(30),

  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-2.5-flash'),
  IBM_WATSONX_API_KEY: z.string().optional(),
  IBM_WATSONX_PROJECT_ID: z.string().optional(),
  IBM_WATSONX_URL: z.string().url().default('https://us-south.ml.cloud.ibm.com'),
  IBM_WATSONX_MODEL: z.string().default('ibm/granite-3-8b-instruct'),

  SMTP_URL: z.string().optional(),
  MAIL_FROM: z.string().default('ThusStride <no-reply@thusstride.app>'),

  TRUST_PROXY: z.coerce.number().int().min(0).default(1),
});

const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment configuration');
}

export const config = {
  ...parsed.data,
  isProd: parsed.data.NODE_ENV === 'production',
  isTest: parsed.data.NODE_ENV === 'test',
  adminEmails: parsed.data.ADMIN_EMAILS.split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
};

if (config.isProd && !config.DATABASE_URL && !process.env.ALLOW_SQLITE_IN_PROD) {
  throw new Error('DATABASE_URL (PostgreSQL) is required in production.');
}

export type AppConfig = typeof config;
