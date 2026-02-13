import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

// Get encryption key from environment variable
// Generate with: openssl rand -base64 32
function getEncryptionKey(): Buffer {
  const key = process.env.GITHUB_TOKEN_ENCRYPTION_KEY;

  if (!key) {
    throw new Error(
      'GITHUB_TOKEN_ENCRYPTION_KEY environment variable is not set. ' +
      'Generate one with: openssl rand -base64 32'
    );
  }

  try {
    return Buffer.from(key, 'base64');
  } catch (error) {
    throw new Error('Invalid GITHUB_TOKEN_ENCRYPTION_KEY format. Must be base64 encoded.');
  }
}

/**
 * Encrypts a string using AES-256-GCM encryption
 * Returns format: iv:authTag:encryptedData (all hex encoded)
 */
export function encrypt(text: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Return as iv:authTag:encrypted (colon-separated hex strings)
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts a string encrypted with the encrypt() function
 * Expects format: iv:authTag:encryptedData (all hex encoded)
 */
export function decrypt(encryptedText: string): string {
  const key = getEncryptionKey();
  const [ivHex, authTagHex, encrypted] = encryptedText.split(':');

  if (!ivHex || !authTagHex || !encrypted) {
    throw new Error('Invalid encrypted text format');
  }

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
