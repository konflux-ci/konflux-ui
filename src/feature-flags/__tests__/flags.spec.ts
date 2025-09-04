// Detected testing framework: jest
// Tests use global describe/it/expect APIs (Jest/Vitest compatible).

import { FLAGS, FLAGS_STATUS } from '../flags';

describe('Feature flags definitions', () => {
  describe('FLAGS_STATUS', () => {
    it('maps statuses to human-readable labels', () => {
      expect(FLAGS_STATUS.wip).toBe('Unstable');
      expect(FLAGS_STATUS.ready).toBe('Stable');
    });

    it('exposes exactly the expected status keys', () => {
      const keys = Object.keys(FLAGS_STATUS).sort();
      expect(keys).toEqual(['ready', 'wip']);
      for (const val of Object.values(FLAGS_STATUS)) {
        expect(typeof val).toBe('string');
        expect(val.length).toBeGreaterThan(0);
      }
    });
  });

  describe('FLAGS object', () => {
    it('exposes only the expected feature keys', () => {
      const keys = Object.keys(FLAGS).sort();
      expect(keys).toEqual(['dark-theme', 'release-monitor', 'system-notifications'].sort());
      expect('kubearchive-integration' in FLAGS).toBe(false);
    });

    it('every feature meta.key matches its dictionary key and has required fields', () => {
      for (const k of Object.keys(FLAGS)) {
        const f = FLAGS[k];
        expect(f).toBeDefined();
        expect(f.key).toBe(k);
        expect(typeof f.description).toBe('string');
        expect(f.description.trim().length).toBeGreaterThan(0);
        expect(typeof f.defaultEnabled).toBe('boolean');
        expect(typeof f.status).toBe('string');
      }
    });

    it('defaultEnabled is false for all current flags (per spec)', () => {
      for (const f of Object.values(FLAGS)) {
        expect(f.defaultEnabled).toBe(false);
      }
    });

    it('status is valid and currently "wip" for all flags; resolves to correct label', () => {
      for (const f of Object.values(FLAGS)) {
        expect(['wip', 'ready']).toContain(f.status);
      }
      for (const f of Object.values(FLAGS)) {
        expect(f.status).toBe('wip');
        expect(FLAGS_STATUS[f.status]).toBe('Unstable');
      }
    });

    it('guards are undefined for current flags', () => {
      for (const f of Object.values(FLAGS)) {
        expect(f.guard).toBeUndefined();
      }
    });

    it('has expected descriptive copy for all current flags', () => {
      expect(FLAGS['dark-theme'].description).toBe(
        'Enable the theme switcher in the header to toggle between light and dark modes.'
      );
      expect(FLAGS['release-monitor'].description).toBe(
        'New release monitor page that make user see all the related releases of viable namespaces'
      );
      expect(FLAGS['system-notifications'].description).toBe(
        'Enable system notifications badge and notification center'
      );
    });

    it('Object.values(FLAGS) returns a non-empty array with one entry per key', () => {
      const vals = Object.values(FLAGS);
      expect(Array.isArray(vals)).toBe(true);
      expect(vals.length).toBe(Object.keys(FLAGS).length);
      expect(vals.length).toBeGreaterThan(0);
    });

    it('unknown flag keys are not present', () => {
      const unknown = 'does-not-exist';
      expect(FLAGS[unknown]).toBeUndefined();
    });
  });
});