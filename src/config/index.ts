import { z } from 'zod';

const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  REDIS_URL: z.string().optional(),
  MASTER_ENCRYPTION_KEY: z
    .string()
    .length(64, 'MASTER_ENCRYPTION_KEY must be a 64-character hex string (32 bytes)'),
  OPERATOR_PASSWORD_HASH: z.string().min(1, 'OPERATOR_PASSWORD_HASH is required'),
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

export function loadConfig(env = process.env): AppConfig {
  const result = configSchema.safeParse(env);
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
