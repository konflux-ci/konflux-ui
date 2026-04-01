/**
 * @jest-environment node
 */
import { SHA256Hash } from '../gen/analytics-types';
import { obfuscate } from '../obfuscate';

describe('obfuscate', () => {
  it('should return a 64-character hex string', async () => {
    const result = await obfuscate('testuser');
    expect(result).toMatch(/^[0-9a-f]{64}$/);
  });

  it('should return a branded SHA256Hash type', async () => {
    const result: SHA256Hash = await obfuscate('testuser');
    expect(typeof result).toBe('string');
  });

  it('should produce consistent output for the same input', async () => {
    const first = await obfuscate('hello');
    const second = await obfuscate('hello');
    expect(first).toBe(second);
  });

  it('should produce different output for different inputs', async () => {
    const a = await obfuscate('alice');
    const b = await obfuscate('bob');
    expect(a).not.toBe(b);
  });

  it('should match a known SHA-256 hash', async () => {
    // SHA-256 of empty string is well-known
    const result = await obfuscate('');
    expect(result).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });

  it('should handle unicode input', async () => {
    const result = await obfuscate('日本語テスト');
    expect(result).toMatch(/^[0-9a-f]{64}$/);
  });

  it('should produce a different hash when salt is provided', async () => {
    const withoutSalt = await obfuscate('testuser');
    const withSalt = await obfuscate('testuser', 'cluster1');
    expect(withoutSalt).not.toBe(withSalt);
  });

  it('should produce different hashes for different salts', async () => {
    const salt1 = await obfuscate('testuser', 'cluster1');
    const salt2 = await obfuscate('testuser', 'cluster2');
    expect(salt1).not.toBe(salt2);
  });

  it('should produce consistent output for the same value and salt', async () => {
    const first = await obfuscate('testuser', 'cluster1');
    const second = await obfuscate('testuser', 'cluster1');
    expect(first).toBe(second);
  });

  it('should hash value:salt when salt is provided', async () => {
    const result = await obfuscate('testuser', 'cluster1');
    // Should match SHA-256 of "testuser:cluster1"
    const expected = await obfuscate('testuser:cluster1');
    expect(result).toBe(expected);
  });
});
