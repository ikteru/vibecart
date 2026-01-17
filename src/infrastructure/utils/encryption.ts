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

/**
 * Get encryption key from environment
 * @throws Error if key is not set or invalid length
 */
function getEncryptionKey(): Buffer {
  const key = process.env.INSTAGRAM_TOKEN_ENCRYPTION_KEY;

  if (!key) {
    throw new Error('INSTAGRAM_TOKEN_ENCRYPTION_KEY is not set');
  }

  const keyBuffer = Buffer.from(key, 'hex');

  if (keyBuffer.length !== 32) {
    throw new Error(
      'INSTAGRAM_TOKEN_ENCRYPTION_KEY must be a 32-byte (64 character) hex string'
    );
  }

  return keyBuffer;
}

/**
 * Encrypt a token for secure storage
 *
 * @param token - The plaintext token to encrypt
 * @returns Base64-encoded string containing IV + ciphertext + auth tag
 */
export function encryptToken(token: string): string {
  const key = getEncryptionKey();
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
 * Decrypt a token from storage
 *
 * @param encryptedToken - Base64-encoded encrypted token (IV + ciphertext + auth tag)
 * @returns The decrypted plaintext token
 * @throws Error if decryption fails (tampered data, wrong key, etc.)
 */
export function decryptToken(encryptedToken: string): string {
  const key = getEncryptionKey();
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
 * @returns A 32-byte hex string suitable for INSTAGRAM_TOKEN_ENCRYPTION_KEY
 */
export function generateEncryptionKey(): string {
  return randomBytes(32).toString('hex');
}
