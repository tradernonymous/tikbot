import { describe, it, expect } from 'vitest';
import { MediaLibrary, MediaAssetInput } from '../media-library';

describe('MediaLibrary', () => {
  let library: MediaLibrary;

  beforeEach(() => {
    library = new MediaLibrary();
  });

  it('adds and indexes media assets with folder and metadata', () => {
    const asset = library.addAsset({
      filename: 'viral_hook_01.mp4',
      folder: 'hooks/q4',
      mimeType: 'video/mp4',
      sizeBytes: 15_400_000,
      width: 1080,
      height: 1920,
      durationSec: 15.4,
      tags: ['hook', 'fitness', 'high_energy'],
    });

    expect(asset.id).toBeDefined();
    expect(asset.aspectRatio).toBe('9:16');
    expect(asset.variants).toEqual([]);

    const retrieved = library.getAsset(asset.id);
    expect(retrieved?.filename).toBe('viral_hook_01.mp4');
  });

  it('filters assets by folder and tags', () => {
    library.addAsset({
      filename: 'a.mp4',
      folder: 'promo',
      mimeType: 'video/mp4',
      sizeBytes: 1000,
      tags: ['promo', 'tech'],
    });
    library.addAsset({
      filename: 'b.mp4',
      folder: 'hooks',
      mimeType: 'video/mp4',
      sizeBytes: 1000,
      tags: ['hook', 'tech'],
    });

    const promoAssets = library.listAssets({ folder: 'promo' });
    expect(promoAssets).toHaveLength(1);
    expect(promoAssets[0].filename).toBe('a.mp4');

    const techAssets = library.listAssets({ tag: 'tech' });
    expect(techAssets).toHaveLength(2);
  });

  it('creates asset variants for different formats or crops', () => {
    const asset = library.addAsset({
      filename: 'source.mp4',
      folder: 'raw',
      mimeType: 'video/mp4',
      sizeBytes: 50_000_000,
      width: 1920,
      height: 1080,
    });

    const variant = library.createVariant(asset.id, {
      variantType: 'PORTRAIT_CROP',
      width: 1080,
      height: 1920,
      url: 'https://storage.tikbot.internal/variants/source_9_16.mp4',
    });

    expect(variant.id).toBeDefined();
    expect(variant.variantType).toBe('PORTRAIT_CROP');

    const updated = library.getAsset(asset.id);
    expect(updated?.variants).toHaveLength(1);
  });
});
