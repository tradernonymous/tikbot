import { z } from 'zod';
import crypto from 'node:crypto';

const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  REDIS_URL: z.string().optional(),
  MASTER_ENCRYPTION_KEY: z
    .string()
    .length(64, 'MASTER_ENCRYPTION_KEY must be a 64-character hex string (32 bytes)'),
  ADMIN_PASSWORD: z.string().optional(),
  OPERATOR_PASSWORD_HASH: z.string().default('$scrypt$16b_salt$default_dev_hash'),
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters long'),
  STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().default('auto'),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  INTERNAL_API_SECRET: z.string().default('tikbot-internal-secret-change-in-prod'),
  PYTHON_SIDECAR_URL: z.string().default('http://localhost:8000'),
  KILL_SWITCH_ACTIVE: z
    .union([z.boolean(), z.enum(['true', 'false', '1', '0'])])
    .transform((val) => val === true || val === 'true' || val === '1')
    .default(false),
  WORKER_CONCURRENCY: z.coerce.number().default(3),
});

export type AppConfig = z.infer<typeof configSchema>;

let cachedConfig: AppConfig | null = null;

export function loadConfig(env: Record<string, string | undefined> = process.env): AppConfig {
  const envToParse: Record<string, string | undefined> = { ...env };
  const nodeEnv = envToParse.NODE_ENV || process.env.NODE_ENV || 'development';

  if (nodeEnv === 'development') {
    // In development, generate ephemeral values with loud warnings if missing
    if (!envToParse.MASTER_ENCRYPTION_KEY) {
      console.warn('[SECURITY WARNING] MASTER_ENCRYPTION_KEY missing in development. Generating ephemeral key.');
      envToParse.MASTER_ENCRYPTION_KEY = crypto.randomBytes(32).toString('hex');
    }
    if (!envToParse.SESSION_SECRET) {
      console.warn('[SECURITY WARNING] SESSION_SECRET missing in development. Generating ephemeral secret.');
      envToParse.SESSION_SECRET = crypto.randomBytes(32).toString('hex');
    }
    if (!envToParse.DATABASE_URL) {
      envToParse.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/tikbot';
    }
  }

  const result = configSchema.safeParse(envToParse);
  if (!result.success) {
    const issues = result.error.issues || [];
    const errorMessages = issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    throw new Error(`Configuration Validation Error: ${errorMessages}`);
  }
  cachedConfig = result.data;
  return cachedConfig;
}

export function getConfig(): AppConfig {
  if (!cachedConfig) {
    return loadConfig();
  }
  return cachedConfig;
}
