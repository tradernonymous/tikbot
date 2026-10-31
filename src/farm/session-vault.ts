import { encryptJson, decryptJson } from '../security/crypto';

export interface CookieItem {
  name: string;
  value: string;
  domain: string;
  path?: string;
  expires?: number; // unix timestamp in seconds
  httpOnly?: boolean;
  secure?: boolean;
}

export interface AccountSessionPackage {
  accountId: string;
  platform: 'TIKTOK' | 'DOUYIN' | 'INSTAGRAM';
  cookies: CookieItem[];
  localStorage: Record<string, string>;
  userAgent: string;
  capturedAt: string;
}

export function packAndEncryptSession(
  session: AccountSessionPackage,
  masterKey: string | Buffer
): string {
  return encryptJson(session, masterKey);
}

export function decryptAndUnpackSession(
  encryptedEnvelope: string,
  masterKey: string | Buffer
): AccountSessionPackage {
  return decryptJson<AccountSessionPackage>(encryptedEnvelope, masterKey);
}

export function isSessionExpired(cookies: CookieItem[], nowSeconds = Date.now() / 1000): boolean {
  for (const cookie of cookies) {
    if (cookie.expires !== undefined && cookie.expires > 0) {
      if (cookie.expires <= nowSeconds) {
        return true;
      }
    }
  }
  return false;
}
