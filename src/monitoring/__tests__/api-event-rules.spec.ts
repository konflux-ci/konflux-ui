import {
  evaluateApiEventRules,
  DEFAULT_API_EVENT_RULES,
  ApiEventRule,
} from '~/monitoring/api-event-rules';

describe('evaluateApiEventRules', () => {
  describe('default rules', () => {
    it('ignores chrome extension URLs', () => {
      expect(evaluateApiEventRules('chrome-extension://abc/script.js', 500)).toBe('ignore');
    });

    it('ignores absolute external URLs', () => {
      expect(evaluateApiEventRules('https://cdn.example.com/script.js', 500)).toBe('ignore');
    });

    it('sends errors from plugin paths even for 404', () => {
      expect(evaluateApiEventRules('/api/k8s/plugins/kubearchive/apis/batch/v1/jobs', 404)).toBe(
        'send',
      );
    });

    it('sends errors from plugin paths for non-404', () => {
      expect(evaluateApiEventRules('/api/k8s/plugins/kite/api/v1/test', 500)).toBe('send');
    });

    it('ignores 404 from regular API paths', () => {
      expect(
        evaluateApiEventRules('/api/k8s/apis/tekton.dev/v1/namespaces/test/pipelines', 404),
      ).toBe('ignore');
    });

    it('sends non-404 errors from regular API paths', () => {
      expect(
        evaluateApiEventRules('/api/k8s/apis/tekton.dev/v1/namespaces/test/pipelines', 500),
      ).toBe('send');
    });

    it('sends errors from oauth2 paths', () => {
      expect(evaluateApiEventRules('/oauth2/userinfo', 500)).toBe('send');
    });

    it('ignores 404 from oauth2 paths', () => {
      expect(evaluateApiEventRules('/oauth2/callback', 404)).toBe('ignore');
    });
  });

  describe('extensibility', () => {
    it('custom rules prepended to default rules are evaluated first', () => {
      const customRule: ApiEventRule = {
        name: 'block-oauth2',
        matches: (url) => url.startsWith('/oauth2/'),
        action: 'ignore',
      };

      const rules = [customRule, ...DEFAULT_API_EVENT_RULES];

      // Without custom rule, /oauth2/userinfo with 500 would be 'send'
      expect(evaluateApiEventRules('/oauth2/userinfo', 500)).toBe('send');

      // With custom rule prepended, it should be 'ignore' (first match wins)
      expect(evaluateApiEventRules('/oauth2/userinfo', 500, rules)).toBe('ignore');
    });
  });
});
