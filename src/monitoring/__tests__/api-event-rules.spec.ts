import {
  evaluateApiEventRules,
  createDefaultApiEventRules,
  ApiEventRule,
} from '~/monitoring/api-event-rules';

describe('evaluateApiEventRules', () => {
  const defaultRules = createDefaultApiEventRules(1);

  describe('default rules', () => {
    it('returns 0 for chrome extension URLs', () => {
      expect(evaluateApiEventRules('chrome-extension://abc/script.js', 500, defaultRules)).toBe(0);
    });

    it('returns 0 for absolute external URLs', () => {
      expect(evaluateApiEventRules('https://cdn.example.com/script.js', 500, defaultRules)).toBe(0);
    });

    it('returns 1 for plugin paths even for 404', () => {
      expect(
        evaluateApiEventRules('/api/k8s/plugins/kubearchive/apis/batch/v1/jobs', 404, defaultRules),
      ).toBe(1);
    });

    it('returns 1 for plugin paths for non-404', () => {
      expect(evaluateApiEventRules('/api/k8s/plugins/kite/api/v1/test', 500, defaultRules)).toBe(1);
    });

    it('returns 0 for 404 from regular API paths', () => {
      expect(
        evaluateApiEventRules(
          '/api/k8s/apis/tekton.dev/v1/namespaces/test/pipelines',
          404,
          defaultRules,
        ),
      ).toBe(0);
    });

    it('returns default sample rate for non-404 errors from regular API paths', () => {
      expect(
        evaluateApiEventRules(
          '/api/k8s/apis/tekton.dev/v1/namespaces/test/pipelines',
          500,
          defaultRules,
        ),
      ).toBe(1);
    });

    it('returns default sample rate for errors from oauth2 paths', () => {
      expect(evaluateApiEventRules('/oauth2/userinfo', 500, defaultRules)).toBe(1);
    });

    it('returns 0 for 404 from oauth2 paths', () => {
      expect(evaluateApiEventRules('/oauth2/callback', 404, defaultRules)).toBe(0);
    });
  });

  describe('with custom default sample rate', () => {
    it('uses the configured sample rate for the default rule', () => {
      const rules = createDefaultApiEventRules(0.5);
      expect(evaluateApiEventRules('/api/k8s/apis/v1/pods', 500, rules)).toBe(0.5);
    });

    it('still returns 1 for plugin paths regardless of default rate', () => {
      const rules = createDefaultApiEventRules(0.5);
      expect(evaluateApiEventRules('/api/k8s/plugins/kubearchive/test', 500, rules)).toBe(1);
    });

    it('still returns 0 for 404 regardless of default rate', () => {
      const rules = createDefaultApiEventRules(0.5);
      expect(evaluateApiEventRules('/api/k8s/apis/v1/pods', 404, rules)).toBe(0);
    });
  });

  describe('extensibility', () => {
    it('custom rules prepended to default rules are evaluated first', () => {
      const customRule: ApiEventRule = {
        name: 'block-oauth2',
        matches: (url) => url.startsWith('/oauth2/'),
        sampleRate: 0,
      };

      const rules = [customRule, ...defaultRules];

      // Without custom rule, /oauth2/userinfo with 500 would use default rate (1)
      expect(evaluateApiEventRules('/oauth2/userinfo', 500, defaultRules)).toBe(1);

      // With custom rule prepended, it should be 0 (first match wins)
      expect(evaluateApiEventRules('/oauth2/userinfo', 500, rules)).toBe(0);
    });
  });
});
