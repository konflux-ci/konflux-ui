import Prism from '../prism-log-language';

describe('Prism Log Language', () => {
  describe('Timestamps', () => {
    it('should tokenize ISO 8601 timestamp with Z', () => {
      const tokens = Prism.tokenize('2026-02-02T10:52:23Z', Prism.languages.log);

      const timestamp = tokens.find((t) => typeof t !== 'string' && t.type === 'timestamp');
      expect(timestamp).toBeDefined();
      expect(timestamp).toHaveProperty('content', '2026-02-02T10:52:23Z');
    });

    it('should tokenize ISO 8601 timestamp with timezone offset', () => {
      const tokens = Prism.tokenize('2026-02-02T10:51:43+00:00', Prism.languages.log);

      const timestamp = tokens.find((t) => typeof t !== 'string' && t.type === 'timestamp');
      expect(timestamp).toBeDefined();
      expect(timestamp).toHaveProperty('content', '2026-02-02T10:51:43+00:00');
    });

    it('should tokenize slash-separated date with time', () => {
      const tokens = Prism.tokenize('2026/02/02 10:52:23', Prism.languages.log);

      const timestamp = tokens.find((t) => typeof t !== 'string' && t.type === 'timestamp');
      expect(timestamp).toBeDefined();
      expect(timestamp).toHaveProperty('content', '2026/02/02 10:52:23');
    });

    it('should tokenize bracketed time', () => {
      const tokens = Prism.tokenize('[10:30:45]', Prism.languages.log);

      const timestamp = tokens.find((t) => typeof t !== 'string' && t.type === 'timestamp');
      expect(timestamp).toBeDefined();
    });
  });

  describe('Log Levels', () => {
    it('should tokenize ERROR level', () => {
      const tokens = Prism.tokenize('ERROR: Something failed', Prism.languages.log);

      const errorToken = tokens.find((t) => typeof t !== 'string' && t.type === 'log-level-error');
      expect(errorToken).toBeDefined();
      expect(errorToken).toHaveProperty('content', 'ERROR');
    });

    it('should tokenize WARN level', () => {
      const tokens = Prism.tokenize('WARN: Low disk space', Prism.languages.log);

      const warnToken = tokens.find((t) => typeof t !== 'string' && t.type === 'log-level-warn');
      expect(warnToken).toBeDefined();
      expect(warnToken).toHaveProperty('content', 'WARN');
    });

    it('should tokenize INFO level', () => {
      const tokens = Prism.tokenize('INFO: Server started', Prism.languages.log);

      const infoToken = tokens.find((t) => typeof t !== 'string' && t.type === 'log-level-info');
      expect(infoToken).toBeDefined();
      expect(infoToken).toHaveProperty('content', 'INFO');
    });

    it('should tokenize DEBUG level', () => {
      const tokens = Prism.tokenize('DEBUG: Connection established', Prism.languages.log);

      const debugToken = tokens.find((t) => typeof t !== 'string' && t.type === 'log-level-debug');
      expect(debugToken).toBeDefined();
      expect(debugToken).toHaveProperty('content', 'DEBUG');
    });

    it('should tokenize FAILED', () => {
      const tokens = Prism.tokenize('Test FAILED', Prism.languages.log);

      const failedToken = tokens.find((t) => typeof t !== 'string' && t.type === 'log-level-error');
      expect(failedToken).toBeDefined();
      expect(failedToken).toHaveProperty('content', 'FAILED');
    });
  });

  describe('Test Results', () => {
    it('should tokenize PASSED', () => {
      const tokens = Prism.tokenize('Test PASSED', Prism.languages.log);

      const passedToken = tokens.find((t) => typeof t !== 'string' && t.type === 'result');
      expect(passedToken).toBeDefined();
      expect(passedToken).toHaveProperty('content', 'PASSED');
    });

    it('should tokenize SUCCESS', () => {
      const tokens = Prism.tokenize('Build SUCCESS', Prism.languages.log);

      const successToken = tokens.find((t) => typeof t !== 'string' && t.type === 'result');
      expect(successToken).toBeDefined();
      expect(successToken).toHaveProperty('content', 'SUCCESS');
    });
  });

  describe('Key-Value Pairs', () => {
    it('should tokenize simple key=value', () => {
      const tokens = Prism.tokenize('status=active', Prism.languages.log);

      const kvToken = tokens.find((t) => typeof t !== 'string' && t.type === 'key-value');
      expect(kvToken).toBeDefined();
    });

    it('should tokenize key=value with quoted string', () => {
      const tokens = Prism.tokenize('message="Hello World"', Prism.languages.log);

      const kvToken = tokens.find((t) => typeof t !== 'string' && t.type === 'key-value');
      expect(kvToken).toBeDefined();
    });

    it('should tokenize key=value with timestamp in value', () => {
      const tokens = Prism.tokenize('time="2026-02-02T10:52:23Z"', Prism.languages.log);

      const kvToken = tokens.find((t) => typeof t !== 'string' && t.type === 'key-value');
      expect(kvToken).toBeDefined();
    });

    it('should NOT tokenize key=value inside URLs', () => {
      const tokens = Prism.tokenize(
        '"https://example.com?searchType=containers"',
        Prism.languages.log,
      );

      // searchType should NOT be tokenized as a key-value pair
      const kvTokens = tokens.filter((t) => typeof t !== 'string' && t.type === 'key-value');
      expect(kvTokens.length).toBe(0);
    });

    it('should NOT tokenize content inside JSON strings', () => {
      const tokens = Prism.tokenize('"+XM+s3niWaEk1U5jnR5DpA=="', Prism.languages.log);

      // Content inside quotes should not be tokenized
      const kvTokens = tokens.filter((t) => typeof t !== 'string' && t.type === 'key-value');
      expect(kvTokens.length).toBe(0);
    });

    it('should tokenize multiple key=value pairs', () => {
      const tokens = Prism.tokenize('user=admin status=active role=moderator', Prism.languages.log);

      const kvTokens = tokens.filter((t) => typeof t !== 'string' && t.type === 'key-value');
      expect(kvTokens.length).toBe(3);
    });
  });

  describe('Complex Log Lines', () => {
    it('should tokenize complete log line with all elements', () => {
      const logLine =
        '2026-02-02T10:52:23Z INFO msg="check completed" status=FAILED check=HasLicense';
      const tokens = Prism.tokenize(logLine, Prism.languages.log);

      const timestamp = tokens.find((t) => typeof t !== 'string' && t.type === 'timestamp');
      const infoLevel = tokens.find((t) => typeof t !== 'string' && t.type === 'log-level-info');
      const kvTokens = tokens.filter((t) => typeof t !== 'string' && t.type === 'key-value');

      expect(timestamp).toBeDefined();
      expect(infoLevel).toBeDefined();
      expect(kvTokens.length).toBeGreaterThanOrEqual(2);
    });

    it('should prioritize log levels over other patterns', () => {
      const tokens = Prism.tokenize('ERROR in module', Prism.languages.log);

      const errorToken = tokens.find((t) => typeof t !== 'string' && t.type === 'log-level-error');
      expect(errorToken).toBeDefined();
    });

    it('should handle mixed case log levels', () => {
      const tokens = Prism.tokenize('Error: connection failed', Prism.languages.log);

      const errorToken = tokens.find((t) => typeof t !== 'string' && t.type === 'log-level-error');
      expect(errorToken).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string', () => {
      const tokens = Prism.tokenize('', Prism.languages.log);
      expect(tokens).toEqual(['']);
    });

    it('should handle plain text without special tokens', () => {
      const tokens = Prism.tokenize('This is plain text', Prism.languages.log);
      expect(tokens).toEqual(['This is plain text']);
    });

    it('should not tokenize partial timestamps', () => {
      const tokens = Prism.tokenize('2026-02-02', Prism.languages.log);

      const timestampToken = tokens.find((t) => typeof t !== 'string' && t.type === 'timestamp');
      expect(timestampToken).toBeUndefined();
    });
  });

  describe('Pattern Order Dependencies', () => {
    it('should tokenize key-value BEFORE timestamp to prevent inner values from being matched', () => {
      // If timestamp pattern comes first, it might match the timestamp inside the quoted value
      const tokens = Prism.tokenize('time="2026-02-02T10:52:23Z"', Prism.languages.log);

      // Should tokenize as key-value (not as standalone timestamp)
      const kvToken = tokens.find((t) => typeof t !== 'string' && t.type === 'key-value');
      expect(kvToken).toBeDefined();

      // The inner timestamp should be part of the key-value token, not a separate timestamp token
      const standaloneTimestamp = tokens.find(
        (t) => typeof t !== 'string' && t.type === 'timestamp',
      );
      expect(standaloneTimestamp).toBeUndefined();
    });

    it('should tokenize ERROR/FAILED before PASSED to avoid conflicts', () => {
      // FAILED should be tokenized as error, not as a partial match of PASSED
      const tokens = Prism.tokenize('Test FAILED', Prism.languages.log);

      const errorToken = tokens.find((t) => typeof t !== 'string' && t.type === 'log-level-error');
      expect(errorToken).toBeDefined();
      expect(errorToken).toHaveProperty('content', 'FAILED');

      // Should NOT be tokenized as result
      const resultToken = tokens.find((t) => typeof t !== 'string' && t.type === 'result');
      expect(resultToken).toBeUndefined();
    });

    it('should not match key-value inside URLs (greedy + lookbehind)', () => {
      // The key-value pattern uses lookbehind to ensure it's preceded by whitespace or line start
      // This prevents matching URL query parameters
      const tokens = Prism.tokenize(
        'url="https://example.com?searchType=containers"',
        Prism.languages.log,
      );

      const kvTokens = tokens.filter((t) => typeof t !== 'string' && t.type === 'key-value');

      // Should only match url=, NOT searchType=
      expect(kvTokens.length).toBe(1);

      // Verify it's the outer key-value pair
      const kvToken = kvTokens[0];
      expect(kvToken).toBeDefined();
      if (typeof kvToken !== 'string') {
        // Token content can be string or array - get full text representation
        const getTokenText = (content: string | Prism.Token | (string | Prism.Token)[]): string => {
          if (typeof content === 'string') return content;
          if (Array.isArray(content)) return content.map(getTokenText).join('');
          return getTokenText(content.content);
        };
        const fullText = getTokenText(kvToken.content);
        expect(fullText).toContain('url=');
        expect(fullText).toContain('searchType'); // Inside the quoted value
      }
    });

    it('should handle log level priorities correctly', () => {
      // Multiple log levels in one line - should tokenize each correctly
      const tokens = Prism.tokenize('ERROR WARN INFO DEBUG', Prism.languages.log);

      const errorToken = tokens.find((t) => typeof t !== 'string' && t.type === 'log-level-error');
      const warnToken = tokens.find((t) => typeof t !== 'string' && t.type === 'log-level-warn');
      const infoToken = tokens.find((t) => typeof t !== 'string' && t.type === 'log-level-info');
      const debugToken = tokens.find((t) => typeof t !== 'string' && t.type === 'log-level-debug');

      expect(errorToken).toBeDefined();
      expect(warnToken).toBeDefined();
      expect(infoToken).toBeDefined();
      expect(debugToken).toBeDefined();
    });
  });
});
