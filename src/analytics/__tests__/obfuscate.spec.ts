/**
 * @jest-environment node
 */
import { obfuscate, SHA256Hash } from '../obfuscate';

describe('obfuscate', () => {
  it('returns a branded 64-character hex string', async () => {
    const result: SHA256Hash = await obfuscate('testuser');
    expect(result).toMatch(/^[0-9a-f]{64}$/);
  });

  it('is deterministic and input-sensitive', async () => {
    await expect(obfuscate('hello')).resolves.toBe(await obfuscate('hello'));
    await expect(obfuscate('alice')).resolves.not.toBe(await obfuscate('bob'));
  });

  it('should match a known SHA-256 hash', async () => {
    const result = await obfuscate('');
    expect(result).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });

  it('should hash value:salt when salt is provided', async () => {
    const result = await obfuscate('testuser', 'cluster1');
    const expected = await obfuscate('testuser:cluster1');
    expect(result).toBe(expected);
  });
});
