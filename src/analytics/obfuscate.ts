import { SHA256Hash } from './gen/analytics-types';

/**
 * Obfuscates a string using SHA-256 via the Web Crypto API.
 * Returns a hex-encoded hash branded as SHA256Hash.
 */
export const obfuscate = async (value: string): Promise<SHA256Hash> => {
  const encoded = new TextEncoder().encode(value);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex as SHA256Hash;
};
