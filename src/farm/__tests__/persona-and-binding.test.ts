import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateDevicePersona,
  type DevicePersona,
} from '../persona-generator';
import {
  BindingMatrixStore,
  type FarmIdentityBinding,
  SubnetCollisionError,
} from '../binding-matrix';

describe('F1.1 Device Persona Generator', () => {
  it('generates coherent, deterministic persona with resolution, GPU, locale, and JA4 TLS fingerprint', () => {
    const persona = generateDevicePersona('acc-101');

    expect(persona.accountId).toBe('acc-101');
    expect(['CAMOUFOX', 'BROWSER_OXIDE', 'CHROMIUM']).toContain(persona.engine);
    expect(persona.screenResolution).toMatch(/^\d+x\d+$/);
    expect(persona.gpuRenderer.length).toBeGreaterThan(0);
    expect(persona.timezone.length).toBeGreaterThan(0);
    expect(persona.locale.length).toBeGreaterThan(0);
    expect(persona.fonts.length).toBeGreaterThan(0);
    expect(persona.ja4TlsFingerprint).toMatch(/^t\d{2}[di]\d{4}.*_/);
    expect(persona.userAgent).toContain('Mozilla/5.0');

    // Deterministic freeze: generating again for same accountId returns identical persona
    const personaAgain = generateDevicePersona('acc-101');
    expect(personaAgain).toEqual(persona);
  });

  it('generates diverse personas for different accounts', () => {
    const p1 = generateDevicePersona('acc-a');
    const p2 = generateDevicePersona('acc-b');

    expect(p1.accountId).not.toBe(p2.accountId);
    expect(p1.canvasNoiseSeed).not.toBe(p2.canvasNoiseSeed);
  });
});

describe('F1.2 Binding Matrix Store', () => {
  let matrix: BindingMatrixStore;

  beforeEach(() => {
    matrix = new BindingMatrixStore();
  });

  it('registers unique binding and detects /24 subnet collisions', () => {
    const binding1: FarmIdentityBinding = {
      accountId: 'acc-1',
      personaId: 'pers-1',
      proxyId: 'prx-1',
      proxyIp: '192.168.1.10',
      emailSlot: 'bot1@domain.com',
      phoneSlot: '+15550001',
    };

    matrix.registerBinding(binding1);

    // Colliding IP in same /24 subnet (192.168.1.x)
    const collidingBinding: FarmIdentityBinding = {
      accountId: 'acc-2',
      personaId: 'pers-2',
      proxyId: 'prx-2',
      proxyIp: '192.168.1.55',
      emailSlot: 'bot2@domain.com',
      phoneSlot: '+15550002',
    };

    expect(() => {
      matrix.registerBinding(collidingBinding);
    }).toThrow(SubnetCollisionError);
  });

  it('allows binding on distinct /24 subnet', () => {
    matrix.registerBinding({
      accountId: 'acc-1',
      personaId: 'pers-1',
      proxyId: 'prx-1',
      proxyIp: '192.168.1.10',
      emailSlot: 'bot1@domain.com',
    });

    const binding2: FarmIdentityBinding = {
      accountId: 'acc-2',
      personaId: 'pers-2',
      proxyId: 'prx-2',
      proxyIp: '10.0.2.20',
      emailSlot: 'bot2@domain.com',
    };

    expect(() => matrix.registerBinding(binding2)).not.toThrow();
    expect(matrix.getBinding('acc-2')?.proxySubnet).toBe('10.0.2.0/24');
  });

  it('generates audit view flagging unlinked assets and collision stats', () => {
    matrix.registerBinding({
      accountId: 'acc-1',
      personaId: 'pers-1',
      proxyId: 'prx-1',
      proxyIp: '172.16.5.12',
      emailSlot: 'b1@domain.com',
    });

    const audit = matrix.getBindingAuditSummary();
    expect(audit.totalBoundAccounts).toBe(1);
    expect(audit.uniqueSubnetsCount).toBe(1);
    expect(audit.collisionsDetected).toBe(0);
  });
});
