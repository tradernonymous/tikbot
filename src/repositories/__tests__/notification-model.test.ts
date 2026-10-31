import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('F1.1 Notification Model Schema & Validation', () => {
  const schemaPath = path.join(process.cwd(), 'prisma/schema.prisma');
  const schemaContent = fs.readFileSync(schemaPath, 'utf8');

  it('defines the Notification model in schema.prisma', () => {
    expect(schemaContent).toContain('model Notification {');
    expect(schemaContent).toContain('dedupeKey');
    expect(schemaContent).toContain('readAt');
    expect(schemaContent).toContain('@@index([readAt, createdAt])');
    expect(schemaContent).toContain('@@index([dedupeKey])');
  });
});
