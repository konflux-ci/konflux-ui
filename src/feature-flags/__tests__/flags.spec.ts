/* 
  Test framework: This spec is written to work with Vitest or Jest.
  - If using Vitest, keep the import from 'vitest'.
  - If using Jest with globals, you can remove the import line or change it to: 
      import { describe, it, expect } from '@jest/globals';
*/
import { describe, it, expect } from 'vitest'; // Change to '@jest/globals' if project uses Jest
// Import the module under test (flags.ts is expected to be adjacent to __tests__)
import { FLAGS, FLAGS_STATUS } from '../flags';

describe('feature-flags: FLAGS_STATUS', () => {
  it('should expose exactly the expected status keys', () => {
    const keys = Object.keys(FLAGS_STATUS).sort();
    expect(keys).toEqual(['ready', 'wip']);
  });

  it('should map statuses to correct human-readable labels', () => {
    expect(FLAGS_STATUS.wip).toBe('Unstable');
    expect(FLAGS_STATUS.ready).toBe('Stable');
  });
});

describe('feature-flags: FLAGS', () => {
  it('should expose exactly the expected flag keys', () => {
    const keys = Object.keys(FLAGS).sort();
    expect(keys).toEqual(['dark-theme', 'release-monitor', 'system-notifications'].sort());
  });

  it('should not include commented-out or experimental keys', () => {
    // 'kubearchive-integration' exists only in commented code; ensure it is not exported.
    expect(Object.prototype.hasOwnProperty.call(FLAGS, 'kubearchive-integration')).toBe(false);
    // Accessing an unknown flag should yield undefined
    expect((FLAGS as Record<string, unknown>)['unknown-flag-key']).toBeUndefined();
  });

  it('dark-theme: has correct metadata', () => {
    const meta = FLAGS['dark-theme'];
    expect(meta).toBeDefined();
    expect(meta.key).toBe('dark-theme');
    expect(meta.description).toBe(
      'Enable the theme switcher in the header to toggle between light and dark modes.'
    );
    expect(meta.defaultEnabled).toBe(false);
    expect(meta.status).toBe('wip');
    expect((meta as Record<string, unknown>).guard).toBeUndefined();
  });

  it('release-monitor: has correct metadata', () => {
    const meta = FLAGS['release-monitor'];
    expect(meta).toBeDefined();
    expect(meta.key).toBe('release-monitor');
    expect(meta.description).toBe(
      'New release monitor page that make user see all the related releases of viable namespaces'
    );
    expect(meta.defaultEnabled).toBe(false);
    expect(meta.status).toBe('wip');
    expect((meta as Record<string, unknown>).guard).toBeUndefined();
  });

  it('system-notifications: has correct metadata', () => {
    const meta = FLAGS['system-notifications'];
    expect(meta).toBeDefined();
    expect(meta.key).toBe('system-notifications');
    expect(meta.description).toBe('Enable system notifications badge and notification center');
    expect(meta.defaultEnabled).toBe(false);
    expect(meta.status).toBe('wip');
    expect((meta as Record<string, unknown>).guard).toBeUndefined();
  });

  it('every flag uses a valid status that maps through FLAGS_STATUS', () => {
    for (const meta of Object.values(FLAGS)) {
      // runtime validation that status is a key of FLAGS_STATUS
      expect(Object.prototype.hasOwnProperty.call(FLAGS_STATUS, meta.status)).toBe(true);
      // and that it maps to a non-empty string label
      const label = (FLAGS_STATUS as Record<string, string>)[meta.status as unknown as string];
      expect(typeof label).toBe('string');
      expect(label.length).toBeGreaterThan(0);
    }
  });
});