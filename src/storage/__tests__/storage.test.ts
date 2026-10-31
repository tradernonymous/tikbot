import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { LocalStorageDriver, InMemoryStorageDriver } from '../index';
import fs from 'node:fs/promises';
import path from 'node:path';

describe('Storage Abstraction Subsystem (In-Memory)', () => {
  let storage: InMemoryStorageDriver;

  beforeEach(() => {
    storage = new InMemoryStorageDriver();
  });

  it('stores, retrieves, and checks existence of binary data', async () => {
    const key = 'media/videos/testuser/video-123.mp4';
    const payload = Buffer.from('fake-mp4-binary-content');
    const contentType = 'video/mp4';

    const putResult = await storage.put(key, payload, contentType);
    expect(putResult.key).toBe(key);
    expect(putResult.size).toBe(payload.length);
    expect(putResult.checksumSha256).toBeDefined();

    const exists = await storage.exists(key);
    expect(exists).toBe(true);

    const retrieved = await storage.get(key);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.contentType).toBe('video/mp4');
    expect(retrieved?.data.toString('utf8')).toBe('fake-mp4-binary-content');
  });

  it('generates a URL or signed retrieval path', async () => {
    const key = 'media/thumbnails/thumb-1.jpg';
    await storage.put(key, Buffer.from('img'), 'image/jpeg');

    const url = await storage.getUrl(key);
    expect(url).toBe('/api/storage/media/thumbnails/thumb-1.jpg');
  });

  it('deletes stored assets cleanly', async () => {
    const key = 'to-delete.txt';
    await storage.put(key, Buffer.from('tmp'), 'text/plain');
    expect(await storage.exists(key)).toBe(true);

    await storage.delete(key);
    expect(await storage.exists(key)).toBe(false);
    expect(await storage.get(key)).toBeNull();
  });

  it('rejects keys attempting path traversal attacks', async () => {
    const maliciousKey = '../../etc/passwd';
    await expect(storage.put(maliciousKey, Buffer.from('bad'), 'text/plain')).rejects.toThrow(
      /path traversal/i
    );
  });
});

describe('LocalStorageDriver (Filesystem)', () => {
  const testDir = path.join(process.cwd(), 'tmp_test_storage');
  let storage: LocalStorageDriver;

  beforeEach(async () => {
    await fs.mkdir(testDir, { recursive: true });
    storage = new LocalStorageDriver(testDir);
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('persists file to disk, reads it back with metadata, and deletes it', async () => {
    const key = 'posts/71829/video.mp4';
    const content = Buffer.from('binary-video-payload-data');

    const putRes = await storage.put(key, content, 'video/mp4');
    expect(putRes.key).toBe(key);
    expect(putRes.size).toBe(content.length);

    expect(await storage.exists(key)).toBe(true);
    expect(await storage.exists('nonexistent.mp4')).toBe(false);

    const read = await storage.get(key);
    expect(read).not.toBeNull();
    expect(read?.contentType).toBe('video/mp4');
    expect(read?.data.toString()).toBe('binary-video-payload-data');

    expect(await storage.get('nonexistent.mp4')).toBeNull();

    const url = await storage.getUrl(key);
    expect(url).toBe(`/api/storage/${key}`);

    await storage.delete(key);
    expect(await storage.exists(key)).toBe(false);
    // double delete should not throw
    await expect(storage.delete(key)).resolves.not.toThrow();
  });
});
