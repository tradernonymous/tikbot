# ADR-004: Hybrid Storage Abstraction (S3 / Cloudflare R2 / Local Disk)

## Status
Accepted

## Context
Tikbot processes media assets:
1. Video files (TikTok/Douyin MP4s, up to 1080p 60fps).
2. Audio tracks (extracted WAV/MP3 for Whisper transcription).
3. Thumbnails and screenshots (audit logs, captchas, account verification states).

In local development and CI testing, external cloud storage adds unnecessary cost and latency. In production on Railway, ephemeral local container storage will discard media files on restart.

## Decision
We implement a unified `StorageService` interface backed by a pluggable adapter pattern:
- `LocalStorageDriver`: Reads/writes files to the local filesystem (used in development, CI, and scratch work).
- `S3StorageDriver`: S3-compatible client (AWS S3, Cloudflare R2, MinIO, or Wasabi) utilizing AWS SDK v3.

### Interface Specification
```typescript
export interface StorageDriver {
  put(key: string, data: Buffer | Uint8Array, contentType: string): Promise<{ url: string; key: string; size: number }>;
  get(key: string): Promise<{ data: Buffer; contentType: string }>;
  getStream(key: string): Promise<NodeJS.ReadableStream>;
  delete(key: string): Promise<void>;
  getSignedUrl(key: string, expiresInSeconds: number): Promise<string>;
}
```

### Path Organization
- `media/videos/:authorId/:postId.mp4`
- `media/audio/:postId.wav`
- `media/thumbnails/:postId.jpg`
- `media/publish/:jobId/:filename`
- `audit/screenshots/:accountId/:timestamp.png`

## Consequences
- Single configuration switch (`STORAGE_DRIVER=local|s3`) seamlessly transitions between development and cloud production.
- Media files are referenced in the database via stable storage keys rather than direct public URLs, allowing CDN rotation and access policy changes without database migrations.
