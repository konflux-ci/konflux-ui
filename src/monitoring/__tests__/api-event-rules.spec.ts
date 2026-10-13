import {
  evaluateApiEventRules,
  DEFAULT_API_EVENT_RULES,
  ApiEventRule,
} from '~/monitoring/api-event-rules';

describe('evaluateApiEventRules', () => {
  describe('default rules', () => {
    it('returns 0 for chrome extension URLs', () => {
      expect(evaluateApiEventRules('chrome-extension://abc/script.js', 500)).toBe(0);
    });

    it('returns 0 for absolute external URLs', () => {
      expect(evaluateApiEventRules('https://cdn.example.com/script.js', 500)).toBe(0);
    });

    it('returns 1 for plugin paths even for 404', () => {
      expect(evaluateApiEventRules('/api/k8s/plugins/kubearchive/apis/batch/v1/jobs', 404)).toBe(1);
    });

    it('returns 1 for plugin paths for non-404', () => {
      expect(evaluateApiEventRules('/api/k8s/plugins/kite/api/v1/test', 500)).toBe(1);
    });

    it('returns 0 for 404 from regular API paths', () => {
      expect(
        evaluateApiEventRules('/api/k8s/apis/tekton.dev/v1/namespaces/test/pipelines', 404),
      ).toBe(0);
    });

    it('returns undefined (no override) for non-404 errors from regular API paths', () => {
      expect(
        evaluateApiEventRules('/api/k8s/apis/tekton.dev/v1/namespaces/test/pipelines', 500),
      ).toBeUndefined();
    });

    it('returns undefined (no override) for errors from oauth2 paths', () => {
      expect(evaluateApiEventRules('/oauth2/userinfo', 500)).toBeUndefined();
    });

    it('returns 0 for 404 from oauth2 paths', () => {
      expect(evaluateApiEventRules('/oauth2/callback', 404)).toBe(0);
    });

    it('does not match non-API paths containing plugins', () => {
      expect(evaluateApiEventRules('/applications/plugins/example', 404)).toBe(0);
      expect(evaluateApiEventRules('/applications/plugins/example', 500)).toBeUndefined();
    });
  });

  describe('extensibility', () => {
    it('custom rules prepended to default rules are evaluated first', () => {
      const customRule: ApiEventRule = {
        name: 'block-oauth2',
        matches: (url) => url.startsWith('/oauth2/'),
        sampleRate: 0,
      };

      const rules = [customRule, ...DEFAULT_API_EVENT_RULES];

      // Without custom rule, /oauth2/userinfo with 500 would be undefined (no override)
      expect(evaluateApiEventRules('/oauth2/userinfo', 500)).toBeUndefined();

      // With custom rule prepended, it should be 0 (first match wins)
      expect(evaluateApiEventRules('/oauth2/userinfo', 500, rules)).toBe(0);
    });
  });
});
