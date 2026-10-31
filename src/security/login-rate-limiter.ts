interface RateLimitRecord {
  attempts: number[];
  consecutiveFailures: number;
  lockoutUntil: number;
}

const records = new Map<string, RateLimitRecord>();

const MAX_ATTEMPTS_PER_MINUTE = 5;
const WINDOW_MS = 60 * 1000;
const LOCKOUT_THRESHOLD = 10;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

export function checkLoginRateLimit(ip: string): { allowed: boolean; reason?: string; status?: number } {
  const now = Date.now();
  const record = records.get(ip);

  if (!record) {
    return { allowed: true };
  }

  // Check 15 minute lockout
  if (record.lockoutUntil > now) {
    const remainingMins = Math.ceil((record.lockoutUntil - now) / 60000);
    return {
      allowed: false,
      status: 429,
      reason: `Account locked out due to multiple failed login attempts. Please try again in ${remainingMins} minutes.`,
    };
  }

  // Filter attempts to the last 60 seconds
  record.attempts = record.attempts.filter((timestamp) => now - timestamp < WINDOW_MS);

  if (record.attempts.length >= MAX_ATTEMPTS_PER_MINUTE) {
    return {
      allowed: false,
      status: 429,
      reason: 'Too many login attempts. Please wait a minute before trying again.',
    };
  }

  return { allowed: true };
}

export function recordLoginFailure(ip: string): void {
  const now = Date.now();
  let record = records.get(ip);
  if (!record) {
    record = { attempts: [], consecutiveFailures: 0, lockoutUntil: 0 };
    records.set(ip, record);
  }

  record.attempts.push(now);
  record.consecutiveFailures += 1;

  if (record.consecutiveFailures >= LOCKOUT_THRESHOLD) {
    record.lockoutUntil = now + LOCKOUT_DURATION_MS;
  }
}

export function recordLoginSuccess(ip: string): void {
  const record = records.get(ip);
  if (record) {
    record.consecutiveFailures = 0;
    record.lockoutUntil = 0;
    record.attempts = [];
  }
}

export function resetLoginRateLimiter(): void {
  records.clear();
}
