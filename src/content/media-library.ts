import { randomUUID } from 'node:crypto';

export type AspectRatio = '9:16' | '16:9' | '1:1' | '4:5' | 'CUSTOM';

export type VariantType = 'PORTRAIT_CROP' | 'WATERMARK' | 'THUMBNAIL' | 'COMPRESSED';

export interface MediaVariant {
  id: string;
  variantType: VariantType;
  width?: number;
  height?: number;
  url: string;
  createdAt: Date;
}

export interface MediaAssetInput {
  filename: string;
  folder?: string;
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
  durationSec?: number;
  tags?: string[];
  url?: string;
}

export interface MediaAsset extends MediaAssetInput {
  id: string;
  folder: string;
  aspectRatio: AspectRatio;
  tags: string[];
  variants: MediaVariant[];
  createdAt: Date;
}

export function computeAspectRatio(width?: number, height?: number): AspectRatio {
  if (!width || !height) return 'CUSTOM';
  const ratio = width / height;
  if (Math.abs(ratio - 9 / 16) < 0.05) return '9:16';
  if (Math.abs(ratio - 16 / 9) < 0.05) return '16:9';
  if (Math.abs(ratio - 1) < 0.05) return '1:1';
  if (Math.abs(ratio - 4 / 5) < 0.05) return '4:5';
  return 'CUSTOM';
}

export class MediaLibrary {
  private assets = new Map<string, MediaAsset>();

  addAsset(input: MediaAssetInput): MediaAsset {
    const id = randomUUID();
    const asset: MediaAsset = {
      ...input,
      id,
      folder: input.folder || 'default',
      aspectRatio: computeAspectRatio(input.width, input.height),
      tags: input.tags || [],
      variants: [],
      createdAt: new Date(),
    };

    this.assets.set(id, asset);
    return asset;
  }

  getAsset(id: string): MediaAsset | undefined {
    return this.assets.get(id);
  }

  listAssets(filters: { folder?: string; tag?: string } = {}): MediaAsset[] {
    const list = Array.from(this.assets.values());
    return list.filter((asset) => {
      if (filters.folder && asset.folder !== filters.folder) return false;
      if (filters.tag && !asset.tags.includes(filters.tag)) return false;
      return true;
    });
  }

  createVariant(assetId: string, variantInput: Omit<MediaVariant, 'id' | 'createdAt'>): MediaVariant {
    const asset = this.assets.get(assetId);
    if (!asset) throw new Error(`Media asset ${assetId} not found`);

    const variant: MediaVariant = {
      ...variantInput,
      id: randomUUID(),
      createdAt: new Date(),
    };

    asset.variants.push(variant);
    return variant;
  }
}
