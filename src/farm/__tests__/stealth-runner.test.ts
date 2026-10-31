import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildSessionCookies, loadSavedCookies, runStealthViewSession } from '../stealth-runner';
import fs from 'fs';
import puppeteer from 'puppeteer-extra';

vi.mock('puppeteer-extra', () => {
  const mockPage = {
    setUserAgent: vi.fn().mockResolvedValue(undefined),
    setViewport: vi.fn().mockResolvedValue(undefined),
    setCookie: vi.fn().mockResolvedValue(undefined),
    evaluateOnNewDocument: vi.fn().mockResolvedValue(undefined),
    goto: vi.fn().mockResolvedValue(undefined),
    evaluate: vi.fn().mockResolvedValue(true),
    mouse: {
      move: vi.fn().mockResolvedValue(undefined),
      wheel: vi.fn().mockResolvedValue(undefined),
    },
    screenshot: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
  };

  const mockContext = {
    newPage: vi.fn().mockResolvedValue(mockPage),
    close: vi.fn().mockResolvedValue(undefined),
  };

  const mockBrowser = {
    createBrowserContext: vi.fn().mockResolvedValue(mockContext),
    close: vi.fn().mockResolvedValue(undefined),
  };

  return {
    default: {
      use: vi.fn(),
      launch: vi.fn().mockResolvedValue(mockBrowser),
    },
  };
});

describe('Stealth Runner Unit & Mock Tests (P11, Coverage Gate)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('buildSessionCookies', () => {
    const sampleCookies = [
      { name: 'sessionid', value: 'secret_user_session' },
      { name: 'ttwid', value: 'visitor_1' },
      { name: 'odin_tt', value: 'old_device_id' },
      { name: 'msToken', value: 'ms_token_abc' },
      { name: 's_v_web_id', value: 'verify_id' },
    ];

    it('returns exact baseCookies when mode is authenticated', () => {
      const result = buildSessionCookies(sampleCookies, 'authenticated');
      expect(result).toEqual(sampleCookies);
    });

    it('filters out single-account cookies and refreshes odin_tt when mode is unique-guest', () => {
      const result = buildSessionCookies(sampleCookies, 'unique-guest');

      const names = result.map((c) => c.name);
      expect(names).not.toContain('sessionid');
      expect(names).not.toContain('ttwid');
      expect(names).toContain('msToken');
      expect(names).toContain('s_v_web_id');

      const odin = result.find((c) => c.name === 'odin_tt');
      expect(odin).toBeDefined();
      expect(odin?.value).not.toBe('old_device_id');
      expect(odin?.value.length).toBe(160); // 80 bytes in hex
    });
  });

  describe('loadSavedCookies', () => {
    it('returns empty array when file does not exist', () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(false);
      const cookies = loadSavedCookies('/nonexistent/path.json');
      expect(cookies).toEqual([]);
    });

    it('returns parsed cookies array when file exists', () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      vi.spyOn(fs, 'readFileSync').mockReturnValue(
        JSON.stringify([{ name: 'test_cookie', value: '123' }])
      );

      const cookies = loadSavedCookies('/valid/cookies.json');
      expect(cookies).toHaveLength(1);
      expect(cookies[0].name).toBe('test_cookie');
    });

    it('returns empty array when file contains invalid JSON', () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      vi.spyOn(fs, 'readFileSync').mockReturnValue('{ broken json');

      const cookies = loadSavedCookies('/broken/cookies.json');
      expect(cookies).toEqual([]);
    });
  });

  describe('runStealthViewSession execution with mocked browser', () => {
    it('executes planned views and invokes onProgress callback', async () => {
      const onProgress = vi.fn();

      const result = await runStealthViewSession({
        url: 'https://www.tiktok.com/@creator/video/123456789',
        targetViews: 2,
        minDwellSeconds: 0,
        maxDwellSeconds: 0,
        settleDelayMs: 0,
        jitterPauseMs: 0,
        headless: true,
        identityMode: 'unique-guest',
        onProgress,
      });

      expect(result.successfulViews).toBe(2);
      expect(result.failedViews).toBe(0);
      expect(onProgress).toHaveBeenCalledTimes(2);
      expect(puppeteer.launch).toHaveBeenCalled();
    });

    it('records failed views when page navigation throws', async () => {
      const mockBrowser = await puppeteer.launch();
      const mockContext = await mockBrowser.createBrowserContext();
      const mockPage = await mockContext.newPage();
      vi.mocked(mockPage.goto).mockRejectedValueOnce(new Error('Navigation timeout'));

      const result = await runStealthViewSession({
        url: 'https://www.tiktok.com/@creator/video/123456789',
        targetViews: 1,
        minDwellSeconds: 0,
        maxDwellSeconds: 0,
        settleDelayMs: 0,
      });

      expect(result.failedViews).toBe(1);
      expect(result.successfulViews).toBe(0);
    });
  });
});
