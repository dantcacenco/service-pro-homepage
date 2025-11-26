/**
 * Encryption utility for secure storage of sensitive data
 * Uses AES-256-GCM for authenticated encryption
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits
const SALT_LENGTH = 32;

/**
 * Get encryption key from environment variable
 * Must be set in Vercel: ENCRYPTION_KEY (32 bytes / 64 hex chars)
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    // For development, derive a key from a passphrase
    // In production, ENCRYPTION_KEY should be set in Vercel
    const fallbackPassphrase = process.env.SUPABASE_SERVICE_ROLE_KEY || 'development-key';
    return crypto.scryptSync(fallbackPassphrase, 'service-pro-salt', 32);
  }

  // If key is hex string, convert to buffer
  if (key.length === 64) {
    return Buffer.from(key, 'hex');
  }

  // If key is base64
  if (key.length === 44) {
    return Buffer.from(key, 'base64');
  }

  // Derive key from passphrase
  return crypto.scryptSync(key, 'service-pro-salt', 32);
}

/**
 * Encrypt a string value
 * Returns base64 encoded string: iv:authTag:encryptedData
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  const authTag = cipher.getAuthTag();

  // Combine iv + authTag + encrypted data
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
}

/**
 * Decrypt a string value
 * Expects format: iv:authTag:encryptedData (all base64)
 */
export function decrypt(encryptedValue: string): string {
  const key = getEncryptionKey();

  const parts = encryptedValue.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted value format');
  }

  const iv = Buffer.from(parts[0], 'base64');
  const authTag = Buffer.from(parts[1], 'base64');
  const encrypted = parts[2];

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'base64', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Encrypt an object (converts to JSON first)
 */
export function encryptObject<T extends object>(obj: T): string {
  return encrypt(JSON.stringify(obj));
}

/**
 * Decrypt to an object (parses JSON)
 */
export function decryptObject<T extends object>(encryptedValue: string): T {
  const decrypted = decrypt(encryptedValue);
  return JSON.parse(decrypted) as T;
}

/**
 * Check if a value appears to be encrypted (has correct format)
 */
export function isEncrypted(value: string): boolean {
  if (!value) return false;
  const parts = value.split(':');
  return parts.length === 3 && parts.every(p => p.length > 0);
}

/**
 * Generate a new random encryption key (for initial setup)
 * Run: npx ts-node -e "import { generateEncryptionKey } from './lib/encryption'; console.log(generateEncryptionKey())"
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex');
}
