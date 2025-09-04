/**
 * Tests for KUBEARCHIVE_PATH_PREFIX
 *
 * Testing library/framework: Jest-style (describe/it/expect). These tests are also compatible with Vitest
 * when using global APIs enabled (globals: true). No additional dependencies introduced.
 */
import { KUBEARCHIVE_PATH_PREFIX } from '../const';

describe('KUBEARCHIVE_PATH_PREFIX', () => {
  it('matches the expected canonical prefix', () => {
    expect(KUBEARCHIVE_PATH_PREFIX).toBe('plugins/kubearchive');
  });

  it('is a non-empty string', () => {
    expect(typeof KUBEARCHIVE_PATH_PREFIX).toBe('string');
    expect(KUBEARCHIVE_PATH_PREFIX.length).toBeGreaterThan(0);
  });

  it('does not start or end with a slash', () => {
    expect(KUBEARCHIVE_PATH_PREFIX.startsWith('/')).toBe(false);
    expect(KUBEARCHIVE_PATH_PREFIX.endsWith('/')).toBe(false);
  });

  it('uses forward slashes only (POSIX-style)', () => {
    expect(KUBEARCHIVE_PATH_PREFIX.includes('\\')).toBe(false);
  });

  it('contains exactly two segments: "plugins" and "kubearchive"', () => {
    const segments = KUBEARCHIVE_PATH_PREFIX.split('/');
    expect(segments).toHaveLength(2);
    expect(segments[0]).toBe('plugins');
    expect(segments[1]).toBe('kubearchive');
  });

  it('can be safely used to prefix file names without producing double slashes', () => {
    // Helper ensures suffix cannot create double slashes if it has leading slashes.
    const join = (suffix: string) => [KUBEARCHIVE_PATH_PREFIX, suffix.replace(/^\/+/, '')].join('/');
    expect(join('file.tar')).toBe('plugins/kubearchive/file.tar');
    expect(join('/file.tar')).toBe('plugins/kubearchive/file.tar');
    expect(join('nested/dir/file.tar')).toBe('plugins/kubearchive/nested/dir/file.tar');
  });

  it('rejects common incorrect variants', () => {
    expect(KUBEARCHIVE_PATH_PREFIX).not.toBe('/plugins/kubearchive');
    expect(KUBEARCHIVE_PATH_PREFIX).not.toBe('plugins/kubearchive/');
    expect(KUBEARCHIVE_PATH_PREFIX).not.toBe('plugins\\kubearchive');
    expect(KUBEARCHIVE_PATH_PREFIX).not.toBe('plugin/kubearchive'); // missing "s"
  });
});