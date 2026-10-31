export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

const SENSITIVE_KEY_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /key/i,
  /cookie/i,
  /auth/i,
  /credential/i,
  /proxy/i,
];

export function redactSensitiveData(data: any): any {
  if (data === null || data === undefined) return data;
  if (typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return data.map((item) => redactSensitiveData(item));
  }

  const result: Record<string, any> = {};
  for (const [key, val] of Object.entries(data)) {
    const isSensitive = SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
    if (isSensitive && typeof val === 'string') {
      result[key] = '[REDACTED]';
    } else if (typeof val === 'object' && val !== null) {
      result[key] = redactSensitiveData(val);
    } else {
      result[key] = val;
    }
  }

  return result;
}

export interface LoggerOptions {
  serviceName?: string;
  sink?: (line: string) => void;
  minLevel?: LogLevel;
}

const LEVEL_SEVERITY: Record<LogLevel, number> = {
  DEBUG: 10,
  INFO: 20,
  WARN: 30,
  ERROR: 40,
};

export class StructuredLogger {
  private serviceName: string;
  private sink: (line: string) => void;
  private minLevel: LogLevel;

  constructor(options: LoggerOptions = {}) {
    this.serviceName = options.serviceName || 'tikbot';
    this.sink = options.sink || ((line: string) => console.log(line));
    this.minLevel = options.minLevel || 'DEBUG';
  }

  private log(level: LogLevel, message: string, meta: Record<string, any> = {}): void {
    if (LEVEL_SEVERITY[level] < LEVEL_SEVERITY[this.minLevel]) return;

    const { traceId, ...restMeta } = meta;
    const cleanMeta = redactSensitiveData(restMeta);

    const record = {
      timestamp: new Date().toISOString(),
      level,
      service: this.serviceName,
      message,
      ...(traceId ? { traceId } : {}),
      ...cleanMeta,
    };

    this.sink(JSON.stringify(record));
  }

  debug(message: string, meta?: Record<string, any>): void {
    this.log('DEBUG', message, meta);
  }

  info(message: string, meta?: Record<string, any>): void {
    this.log('INFO', message, meta);
  }

  warn(message: string, meta?: Record<string, any>): void {
    this.log('WARN', message, meta);
  }

  error(message: string, meta?: Record<string, any>): void {
    this.log('ERROR', message, meta);
  }
}
