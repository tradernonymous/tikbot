import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import {
  runStealthViewSession,
  classifyViewError,
  ViewRunOptions,
  ViewErrorCategory,
} from '../stealth-runner';
import { ProxyPoolManager, ManagedProxy } from '../proxy-manager';
import puppeteer from 'puppeteer-extra';

vi.mock('puppeteer-extra', () => {
  const mockPage = {
    setUserAgent: vi.fn().mockResolvedValue(undefined),
    setViewport: vi.fn().mockResolvedValue(undefined),
    setCookie: vi.fn().mockResolvedValue(undefined),
    authenticate: vi.fn().mockResolvedValue(undefined),
    goto: vi.fn().mockResolvedValue(undefined),
    evaluate: vi.fn().mockResolvedValue({ type: 'video', hasVideo: true, isComfortRestricted: false }),
    mouse: {
      move: vi.fn().mockResolvedValue(undefined),
    },
    keyboard: {
      press: vi.fn().mockResolvedValue(undefined),
    },
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

describe('Stealth Runner Hardening (R3.1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Fast-fail on missing Chrome binary', () => {
    it('throws immediately when specified chromePath does not exist', async () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(false);

      await expect(
        runStealthViewSession({
          url: 'https://www.tiktok.com/@test/video/1234567890',
          chromePath: '/opt/custom/nonexistent-chrome',
        })
      ).rejects.toThrow(/Chrome binary not found/i);

      expect(puppeteer.launch).not.toHaveBeenCalled();
    });
  });

  describe('Repeated-run process listener cleanup', () => {
    it('does not leak SIGINT/SIGTERM listeners across 15 sequential runs', async () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      const initialSigintCount = process.listenerCount('SIGINT');
      const initialSigtermCount = process.listenerCount('SIGTERM');

      for (let i = 0; i < 15; i++) {
        await runStealthViewSession({
          url: 'https://www.tiktok.com/@test/video/123',
          targetViews: 1,
          settleDelayMs: 0,
          minDwellSeconds: 0,
          maxDwellSeconds: 0,
          jitterPauseMs: 0,
        });
      }

      expect(process.listenerCount('SIGINT')).toBe(initialSigintCount);
      expect(process.listenerCount('SIGTERM')).toBe(initialSigtermCount);
    });
  });

  describe('Cancellation token (AbortSignal)', () => {
    it('aborts early when signal is already aborted', async () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      const controller = new AbortController();
      controller.abort();

      const result = await runStealthViewSession({
        url: 'https://www.tiktok.com/@test/video/123',
        targetViews: 5,
        signal: controller.signal,
      });

      expect(result.successfulViews).toBe(0);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].category).toBe('ABORTED');
      expect(puppeteer.launch).not.toHaveBeenCalled();
    });
  });

  describe('Error taxonomy classification', () => {
    it('classifies error strings into exact categories', () => {
      expect(classifyViewError(new Error('Navigation timeout of 35000 ms exceeded'))).toBe('TIMEOUT');
      expect(classifyViewError(new Error('net::ERR_PROXY_CONNECTION_FAILED'))).toBe('PROXY_ERROR');
      expect(classifyViewError(new Error('net::ERR_NAME_NOT_RESOLVED'))).toBe('NETWORK_ERROR');
      expect(classifyViewError(new Error('verify your identity captcha required'))).toBe('CAPTCHA');
      expect(classifyViewError(new Error('Target closed / session destroyed'))).toBe('BROWSER_CRASH');
      expect(classifyViewError(new Error('Operation cancelled by operator'))).toBe('ABORTED');
      expect(classifyViewError(new Error('Something completely unexpected'))).toBe('UNKNOWN');
    });
  });

  describe('Per-view proxy from ProxyPoolManager', () => {
    it('resolves healthy proxy from pool when proxyPool is supplied', async () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      const pool = new ProxyPoolManager([
        {
          id: 'proxy-1',
          host: '192.168.1.100',
          port: 8080,
          protocol: 'HTTP',
          country: 'US',
          status: 'HEALTHY',
          latencyMs: 45,
          consecutiveErrors: 0,
        },
      ]);

      const result = await runStealthViewSession({
        url: 'https://www.tiktok.com/@test/video/123',
        targetViews: 1,
        proxyPool: pool,
        settleDelayMs: 0,
        minDwellSeconds: 0,
        maxDwellSeconds: 0,
      });

      expect(puppeteer.launch).toHaveBeenCalledWith(
        expect.objectContaining({
          args: expect.arrayContaining(['--proxy-server=http://192.168.1.100:8080']),
        })
      );
      expect(result.successfulViews).toBe(1);
    });
  });
});
