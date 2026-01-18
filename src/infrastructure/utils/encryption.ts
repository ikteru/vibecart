/**
 * Token Encryption Utilities
 *
 * Uses AES-256-GCM for secure token storage.
 * Encryption key should be a 32-byte hex string stored in environment variables.
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits

export type EncryptionKeyType = 'instagram' | 'whatsapp';

const KEY_ENV_VARS: Record<EncryptionKeyType, string> = {
  instagram: 'INSTAGRAM_TOKEN_ENCRYPTION_KEY',
  whatsapp: 'WHATSAPP_TOKEN_ENCRYPTION_KEY',
};

/**
 * Get encryption key from environment
 * @throws Error if key is not set or invalid length
 */
function getEncryptionKey(type: EncryptionKeyType = 'instagram'): Buffer {
  const envVar = KEY_ENV_VARS[type];
  const key = process.env[envVar];

  if (!key) {
    throw new Error(`${envVar} is not set`);
  }

  const keyBuffer = Buffer.from(key, 'hex');

  if (keyBuffer.length !== 32) {
    throw new Error(
      `${envVar} must be a 32-byte (64 character) hex string`
    );
  }

  return keyBuffer;
}

/**
 * Encrypt a token for secure storage (Instagram - default)
 *
 * @param token - The plaintext token to encrypt
 * @returns Base64-encoded string containing IV + ciphertext + auth tag
 */
export function encryptToken(token: string): string {
  return encryptWithKey(token, 'instagram');
}

/**
 * Decrypt a token from storage (Instagram - default)
 *
 * @param encryptedToken - Base64-encoded encrypted token (IV + ciphertext + auth tag)
 * @returns The decrypted plaintext token
 * @throws Error if decryption fails (tampered data, wrong key, etc.)
 */
export function decryptToken(encryptedToken: string): string {
  return decryptWithKey(encryptedToken, 'instagram');
}

/**
 * Encrypt a WhatsApp token for secure storage
 *
 * @param token - The plaintext token to encrypt
 * @returns Base64-encoded string containing IV + ciphertext + auth tag
 */
export function encryptWhatsAppToken(token: string): string {
  return encryptWithKey(token, 'whatsapp');
}

/**
 * Decrypt a WhatsApp token from storage
 *
 * @param encryptedToken - Base64-encoded encrypted token (IV + ciphertext + auth tag)
 * @returns The decrypted plaintext token
 * @throws Error if decryption fails (tampered data, wrong key, etc.)
 */
export function decryptWhatsAppToken(encryptedToken: string): string {
  return decryptWithKey(encryptedToken, 'whatsapp');
}

/**
 * Generic encrypt function with configurable key type
 */
function encryptWithKey(token: string, keyType: EncryptionKeyType): string {
  const key = getEncryptionKey(keyType);
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(token, 'utf8'),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  // Combine: IV (16 bytes) + encrypted data + auth tag (16 bytes)
  const combined = Buffer.concat([iv, encrypted, authTag]);

  return combined.toString('base64');
}

/**
 * Generic decrypt function with configurable key type
 */
function decryptWithKey(encryptedToken: string, keyType: EncryptionKeyType): string {
  const key = getEncryptionKey(keyType);
  const combined = Buffer.from(encryptedToken, 'base64');

  // Extract components
  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(combined.length - AUTH_TAG_LENGTH);
  const encrypted = combined.subarray(IV_LENGTH, combined.length - AUTH_TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}

/**
 * Generate a new encryption key for setup
 * Run this once to generate a key for your .env file
 *
 * @returns A 32-byte hex string suitable for TOKEN_ENCRYPTION_KEY
 */
export function generateEncryptionKey(): string {
  return randomBytes(32).toString('hex');
}
