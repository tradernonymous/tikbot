import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

export interface StoragePutResult {
  key: string;
  size: number;
  checksumSha256: string;
  contentType: string;
}

export interface StorageObject {
  data: Buffer;
  contentType: string;
  size: number;
  checksumSha256: string;
}

export interface StorageDriver {
  put(key: string, data: Buffer, contentType: string): Promise<StoragePutResult>;
  get(key: string): Promise<StorageObject | null>;
  exists(key: string): Promise<boolean>;
  delete(key: string): Promise<void>;
  getUrl(key: string, expiresInSeconds?: number): Promise<string>;
}

function assertSafeKey(key: string): void {
  const normalized = path.normalize(key);
  if (normalized.startsWith('..') || key.includes('..') || path.isAbsolute(key)) {
    throw new Error(`Security Exception: Path traversal detected in storage key "${key}"`);
  }
}

function calculateSha256(data: Buffer): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

export class InMemoryStorageDriver implements StorageDriver {
  private map = new Map<string, StorageObject>();

  async put(key: string, data: Buffer, contentType: string): Promise<StoragePutResult> {
    assertSafeKey(key);
    const checksumSha256 = calculateSha256(data);
    const obj: StorageObject = {
      data,
      contentType,
      size: data.length,
      checksumSha256,
    };
    this.map.set(key, obj);
    return {
      key,
      size: data.length,
      checksumSha256,
      contentType,
    };
  }

  async get(key: string): Promise<StorageObject | null> {
    assertSafeKey(key);
    const obj = this.map.get(key);
    return obj ? { ...obj } : null;
  }

  async exists(key: string): Promise<boolean> {
    assertSafeKey(key);
    return this.map.has(key);
  }

  async delete(key: string): Promise<void> {
    assertSafeKey(key);
    this.map.delete(key);
  }

  async getUrl(key: string): Promise<string> {
    assertSafeKey(key);
    return `/api/storage/${key}`;
  }
}

export class LocalStorageDriver implements StorageDriver {
  constructor(private basePath: string = './storage_blobs') {}

  private resolvePath(key: string): string {
    assertSafeKey(key);
    return path.join(this.basePath, key);
  }

  async put(key: string, data: Buffer, contentType: string): Promise<StoragePutResult> {
    const fullPath = this.resolvePath(key);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, data);

    const checksumSha256 = calculateSha256(data);
    // Write metadata file sidecar
    await fs.writeFile(`${fullPath}.meta.json`, JSON.stringify({ contentType, checksumSha256 }));

    return {
      key,
      size: data.length,
      checksumSha256,
      contentType,
    };
  }

  async get(key: string): Promise<StorageObject | null> {
    const fullPath = this.resolvePath(key);
    try {
      const data = await fs.readFile(fullPath);
      let contentType = 'application/octet-stream';
      let checksumSha256 = calculateSha256(data);

      try {
        const meta = JSON.parse(await fs.readFile(`${fullPath}.meta.json`, 'utf8'));
        if (meta.contentType) contentType = meta.contentType;
        if (meta.checksumSha256) checksumSha256 = meta.checksumSha256;
      } catch {
        // meta file absent, use defaults
      }

      return { data, contentType, size: data.length, checksumSha256 };
    } catch {
      return null;
    }
  }

  async exists(key: string): Promise<boolean> {
    const fullPath = this.resolvePath(key);
    try {
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  async delete(key: string): Promise<void> {
    const fullPath = this.resolvePath(key);
    try {
      await fs.unlink(fullPath);
      await fs.unlink(`${fullPath}.meta.json`).catch(() => {});
    } catch {
      // already removed
    }
  }

  async getUrl(key: string): Promise<string> {
    assertSafeKey(key);
    return `/api/storage/${key}`;
  }
}
