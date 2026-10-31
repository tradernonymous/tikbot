import { describe, it, expect } from 'vitest';
import {
  parseAndNormalizeSocialUrl,
  extractUrlsFromShareText,
  InvalidSocialUrlError,
} from '../url-parser';

describe('URL Parser & Normalizer (TikTok & Douyin)', () => {
  it('parses standard TikTok desktop video URL', () => {
    const input = 'https://www.tiktok.com/@creator_name/video/7182910291881729026?is_copy_url=1';
    const result = parseAndNormalizeSocialUrl(input);

    expect(result.platform).toBe('TIKTOK');
    expect(result.authorHandle).toBe('creator_name');
    expect(result.videoId).toBe('7182910291881729026');
    expect(result.canonicalUrl).toBe('https://www.tiktok.com/@creator_name/video/7182910291881729026');
    expect(result.isShortLink).toBe(false);
  });

  it('parses TikTok short links (vm.tiktok.com and vt.tiktok.com)', () => {
    const vmUrl = 'https://vm.tiktok.com/ZM8abcDEF/';
    const vmResult = parseAndNormalizeSocialUrl(vmUrl);
    expect(vmResult.platform).toBe('TIKTOK');
    expect(vmResult.isShortLink).toBe(true);
    expect(vmResult.canonicalUrl).toBe('https://vm.tiktok.com/ZM8abcDEF/');

    const vtUrl = 'https://vt.tiktok.com/ZS8xyz/';
    const vtResult = parseAndNormalizeSocialUrl(vtUrl);
    expect(vtResult.platform).toBe('TIKTOK');
    expect(vtResult.isShortLink).toBe(true);
  });

  it('parses Douyin video URL', () => {
    const input = 'https://www.douyin.com/video/7123456789012345678';
    const result = parseAndNormalizeSocialUrl(input);

    expect(result.platform).toBe('DOUYIN');
    expect(result.videoId).toBe('7123456789012345678');
    expect(result.canonicalUrl).toBe('https://www.douyin.com/video/7123456789012345678');
    expect(result.isShortLink).toBe(false);
  });

  it('parses Douyin short links (v.douyin.com)', () => {
    const input = 'https://v.douyin.com/ieWXYZ/';
    const result = parseAndNormalizeSocialUrl(input);

    expect(result.platform).toBe('DOUYIN');
    expect(result.isShortLink).toBe(true);
    expect(result.canonicalUrl).toBe('https://v.douyin.com/ieWXYZ/');
  });

  it('extracts embedded video URL from mobile clipboard/share text', () => {
    const shareText =
      'Look at this trending dance! 7.12 复制打开抖音，看看【小明同学的作品】https://v.douyin.com/ieWXYZ/ 02/14 a@b.com';
    const extracted = extractUrlsFromShareText(shareText);

    expect(extracted).toHaveLength(1);
    expect(extracted[0]).toBe('https://v.douyin.com/ieWXYZ/');

    expect(extractUrlsFromShareText('No urls here at all')).toEqual([]);
  });

  it('handles general profile or explore pages on TikTok and Douyin', () => {
    const tiktokExplore = parseAndNormalizeSocialUrl('https://www.tiktok.com/explore');
    expect(tiktokExplore.platform).toBe('TIKTOK');
    expect(tiktokExplore.canonicalUrl).toBe('https://www.tiktok.com/explore');

    const douyinLive = parseAndNormalizeSocialUrl('https://www.douyin.com/discover');
    expect(douyinLive.platform).toBe('DOUYIN');
    expect(douyinLive.canonicalUrl).toBe('https://www.douyin.com/discover');
  });

  it('rejects unsupported or malicious SSRF target domains', () => {
    expect(() => parseAndNormalizeSocialUrl('not-a-valid-url')).toThrow(
      InvalidSocialUrlError
    );
    expect(() => parseAndNormalizeSocialUrl('http://169.254.169.254/latest/meta-data/')).toThrow(
      InvalidSocialUrlError
    );
    expect(() => parseAndNormalizeSocialUrl('https://evil-phishing.com/video/123')).toThrow(
      InvalidSocialUrlError
    );
    expect(() => parseAndNormalizeSocialUrl('javascript:alert(1)')).toThrow(
      InvalidSocialUrlError
    );
  });
});
