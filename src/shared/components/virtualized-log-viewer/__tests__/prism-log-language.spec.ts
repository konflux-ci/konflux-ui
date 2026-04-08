import Prism from 'prismjs';
import registerLogSyntax from '../refractor-log';

// Register the log language
registerLogSyntax(Prism);

describe('Prism Log Language', () => {
  describe('Date and Time', () => {
    it('should tokenize ISO 8601 date', () => {
      const tokens = Prism.tokenize('2026-02-02T10:52:23Z', Prism.languages.log);

      const dateToken = tokens.find((t) => typeof t !== 'string' && t.type === 'date');
      expect(dateToken).toBeDefined();
      expect(dateToken).toHaveProperty('content', '2026-02-02T');
    });

    it('should tokenize time with Z timezone', () => {
      const tokens = Prism.tokenize('10:52:23Z', Prism.languages.log);

      const timeToken = tokens.find((t) => typeof t !== 'string' && t.type === 'time');
      expect(timeToken).toBeDefined();
      expect(timeToken).toHaveProperty('content', '10:52:23Z');
    });

    it('should tokenize time with timezone offset', () => {
      const tokens = Prism.tokenize('10:51:43+00:00', Prism.languages.log);

      const timeToken = tokens.find((t) => typeof t !== 'string' && t.type === 'time');
      expect(timeToken).toBeDefined();
      expect(timeToken).toHaveProperty('content', '10:51:43+00:00');
    });

    it('should tokenize slash-separated date', () => {
      const tokens = Prism.tokenize('2026/02/02', Prism.languages.log);

      const dateToken = tokens.find((t) => typeof t !== 'string' && t.type === 'date');
      expect(dateToken).toBeDefined();
      expect(dateToken).toHaveProperty('content', '2026/02/02');
    });

    it('should tokenize bracketed time', () => {
      const tokens = Prism.tokenize('[10:30:45]', Prism.languages.log);

      const timeToken = tokens.find((t) => typeof t !== 'string' && t.type === 'time');
      expect(timeToken).toBeDefined();
      expect(timeToken).toHaveProperty('content', '10:30:45');
    });

    it('should tokenize relative time units', () => {
      const tokens = Prism.tokenize('took 100ms', Prism.languages.log);

      const timeToken = tokens.find((t) => typeof t !== 'string' && t.type === 'time');
      expect(timeToken).toBeDefined();
      expect(timeToken).toHaveProperty('content', '100ms');
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

    it('should tokenize "key"="value" with double-quoted key', () => {
      const tokens = Prism.tokenize('"architecture"="x86_64"', Prism.languages.log);

      const kvToken = tokens.find((t) => typeof t !== 'string' && t.type === 'key-value');
      expect(kvToken).toBeDefined();
    });

    it('should tokenize multiple quoted key-value pairs', () => {
      const tokens = Prism.tokenize(
        '"architecture"="x86_64" "vcs-type"="git" "build-date"="2026-03-05T06:00:17Z"',
        Prism.languages.log,
      );

      const kvTokens = tokens.filter((t) => typeof t !== 'string' && t.type === 'key-value');
      expect(kvTokens.length).toBe(3);
    });

    it("should tokenize 'key'='value' with single-quoted key", () => {
      const tokens = Prism.tokenize("'status'='active'", Prism.languages.log);

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
        '2026-02-02T10:52:23Z INFO msg="check completed" ERROR occurred check=HasLicense';
      const tokens = Prism.tokenize(logLine, Prism.languages.log);

      const dateToken = tokens.find((t) => typeof t !== 'string' && t.type === 'date');
      const timeToken = tokens.find((t) => typeof t !== 'string' && t.type === 'time');
      const infoLevel = tokens.find((t) => typeof t !== 'string' && t.type === 'log-level-info');
      const errorLevel = tokens.find((t) => typeof t !== 'string' && t.type === 'log-level-error');
      const kvTokens = tokens.filter((t) => typeof t !== 'string' && t.type === 'key-value');

      expect(dateToken).toBeDefined();
      expect(timeToken).toBeDefined();
      expect(infoLevel).toBeDefined();
      expect(errorLevel).toBeDefined();
      expect(kvTokens.length).toBeGreaterThanOrEqual(1);
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

  describe('URLs and Email', () => {
    it('should tokenize HTTP URLs', () => {
      const tokens = Prism.tokenize('Visit https://example.com', Prism.languages.log);

      const urlToken = tokens.find((t) => typeof t !== 'string' && t.type === 'url');
      expect(urlToken).toBeDefined();
      expect(urlToken).toHaveProperty('content', 'https://example.com');
    });

    it('should tokenize FTP URLs', () => {
      const tokens = Prism.tokenize('Download ftp://files.example.com/data', Prism.languages.log);

      const urlToken = tokens.find((t) => typeof t !== 'string' && t.type === 'url');
      expect(urlToken).toBeDefined();
    });

    it('should tokenize email addresses', () => {
      const tokens = Prism.tokenize('Contact user@example.com for help', Prism.languages.log);

      const emailToken = tokens.find((t) => typeof t !== 'string' && t.type === 'email');
      expect(emailToken).toBeDefined();
      expect(emailToken).toHaveProperty('content', 'user@example.com');
    });
  });

  describe('Container Images', () => {
    it('should tokenize Docker image with tag', () => {
      const tokens = Prism.tokenize('quay.io/konflux-ci/test:latest', Prism.languages.log);

      const imageToken = tokens.find((t) => typeof t !== 'string' && t.type === 'container-image');
      expect(imageToken).toBeDefined();
    });

    it('should tokenize Docker image with SHA256 digest', () => {
      const tokens = Prism.tokenize(
        'quay.io/repo/image@sha256:1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        Prism.languages.log,
      );

      const imageToken = tokens.find((t) => typeof t !== 'string' && t.type === 'container-image');
      expect(imageToken).toBeDefined();
    });

    it('should tokenize docker:// protocol images', () => {
      const tokens = Prism.tokenize('docker://localhost:5000/myapp:v1.0', Prism.languages.log);

      const imageToken = tokens.find((t) => typeof t !== 'string' && t.type === 'container-image');
      expect(imageToken).toBeDefined();
    });
  });

  describe('Files', () => {
    it('should tokenize filename with extension', () => {
      const tokens = Prism.tokenize('Reading config.yaml file', Prism.languages.log);

      const filenameToken = tokens.find((t) => typeof t !== 'string' && t.type === 'filename');
      expect(filenameToken).toBeDefined();
      expect(filenameToken).toHaveProperty('content', 'config.yaml');
    });

    it('should tokenize various file extensions', () => {
      const tokens = Prism.tokenize('main.py script.sh app.ts Dockerfile', Prism.languages.log);

      const filenameTokens = tokens.filter((t) => typeof t !== 'string' && t.type === 'filename');
      expect(filenameTokens.length).toBeGreaterThanOrEqual(3);
    });

    it('should tokenize file paths', () => {
      const tokens = Prism.tokenize('File at /var/log/app.log', Prism.languages.log);

      const pathToken = tokens.find((t) => typeof t !== 'string' && t.type === 'file-path');
      expect(pathToken).toBeDefined();
    });

    it('should tokenize relative file paths', () => {
      const tokens = Prism.tokenize('./src/main.ts', Prism.languages.log);

      const pathToken = tokens.find((t) => typeof t !== 'string' && t.type === 'file-path');
      expect(pathToken).toBeDefined();
    });
  });

  describe('Identifiers', () => {
    it('should tokenize IPv4 addresses', () => {
      const tokens = Prism.tokenize('Connected from 192.168.1.100', Prism.languages.log);

      const ipToken = tokens.find((t) => typeof t !== 'string' && t.type === 'ip-address');
      expect(ipToken).toBeDefined();
      expect(ipToken).toHaveProperty('content', '192.168.1.100');
    });

    it('should tokenize MAC addresses', () => {
      const tokens = Prism.tokenize('Device MAC: a1:b2:c3:d4:e5:f6', Prism.languages.log);

      const macToken = tokens.find((t) => typeof t !== 'string' && t.type === 'mac-address');
      expect(macToken).toBeDefined();
      expect(macToken).toHaveProperty('content', 'a1:b2:c3:d4:e5:f6');
    });

    it('should tokenize domain names', () => {
      const tokens = Prism.tokenize('Connecting to api.example.com server', Prism.languages.log);

      const domainToken = tokens.find((t) => typeof t !== 'string' && t.type === 'domain');
      expect(domainToken).toBeDefined();
      expect(domainToken).toHaveProperty('content', 'api.example.com');
    });

    it('should tokenize UUIDs', () => {
      const tokens = Prism.tokenize(
        'Request ID: 550e8400-e29b-41d4-a716-446655440000',
        Prism.languages.log,
      );

      const uuidToken = tokens.find((t) => typeof t !== 'string' && t.type === 'uuid');
      expect(uuidToken).toBeDefined();
      expect(uuidToken).toHaveProperty('content', '550e8400-e29b-41d4-a716-446655440000');
    });

    it('should tokenize Git SHA hashes', () => {
      const tokens = Prism.tokenize('Commit abc1234def', Prism.languages.log);

      const hashToken = tokens.find((t) => typeof t !== 'string' && t.type === 'hash');
      expect(hashToken).toBeDefined();
      expect(hashToken).toHaveProperty('content', 'abc1234def');
    });

    it('should tokenize SHA-256 hashes', () => {
      const tokens = Prism.tokenize(
        'Hash: 1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        Prism.languages.log,
      );

      const hashToken = tokens.find((t) => typeof t !== 'string' && t.type === 'hash');
      expect(hashToken).toBeDefined();
    });

    it('should tokenize process IDs', () => {
      const tokens = Prism.tokenize('Process [12345] started', Prism.languages.log);

      const pidToken = tokens.find((t) => typeof t !== 'string' && t.type === 'pid');
      expect(pidToken).toBeDefined();
      expect(pidToken).toHaveProperty('content', '[12345]');
    });
  });

  describe('Booleans', () => {
    it('should tokenize boolean true', () => {
      const tokens = Prism.tokenize('Result: true', Prism.languages.log);

      const boolToken = tokens.find((t) => typeof t !== 'string' && t.type === 'boolean');
      expect(boolToken).toBeDefined();
      expect(boolToken).toHaveProperty('content', 'true');
    });

    it('should tokenize boolean false and null', () => {
      const tokens = Prism.tokenize('Values: false, null, true', Prism.languages.log);

      const boolTokens = tokens.filter((t) => typeof t !== 'string' && t.type === 'boolean');
      expect(boolTokens.length).toBe(3);
    });
  });

  describe('Strings', () => {
    it('should tokenize double-quoted strings', () => {
      const tokens = Prism.tokenize('"Hello World"', Prism.languages.log);

      const stringToken = tokens.find((t) => typeof t !== 'string' && t.type === 'string');
      expect(stringToken).toBeDefined();
      expect(stringToken).toHaveProperty('content', '"Hello World"');
    });

    it('should tokenize single-quoted strings', () => {
      const tokens = Prism.tokenize("'test message'", Prism.languages.log);

      const stringToken = tokens.find((t) => typeof t !== 'string' && t.type === 'string');
      expect(stringToken).toBeDefined();
    });
  });

  describe('Exceptions', () => {
    it('should tokenize Java stack traces', () => {
      const stackTrace = `java.lang.NullPointerException: Cannot invoke method
    at com.example.MyClass.myMethod(MyClass.java:42)
    at com.example.Main.main(Main.java:10)`;

      const tokens = Prism.tokenize(stackTrace, Prism.languages.log);

      const exceptionToken = tokens.find((t) => typeof t !== 'string' && t.type === 'exception');
      expect(exceptionToken).toBeDefined();
    });
  });

  describe('Separators', () => {
    it('should tokenize separator lines', () => {
      const tokens = Prism.tokenize('---', Prism.languages.log);

      const separatorToken = tokens.find((t) => typeof t !== 'string' && t.type === 'separator');
      expect(separatorToken).toBeDefined();
      expect(separatorToken).toHaveProperty('content', '---');
    });

    it('should tokenize equals separator', () => {
      const tokens = Prism.tokenize('====', Prism.languages.log);

      const separatorToken = tokens.find((t) => typeof t !== 'string' && t.type === 'separator');
      expect(separatorToken).toBeDefined();
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

    it('should tokenize date-only values', () => {
      const tokens = Prism.tokenize('2026-02-02', Prism.languages.log);

      const dateToken = tokens.find((t) => typeof t !== 'string' && t.type === 'date');
      expect(dateToken).toBeDefined();
      expect(dateToken).toHaveProperty('content', '2026-02-02');
    });
  });

  describe('Pattern Order Dependencies', () => {
    it('should tokenize key-value BEFORE string to prevent quoted keys from being matched as strings', () => {
      // Key-value must come before string pattern to properly match "key"="value"
      const tokens = Prism.tokenize('"architecture"="x86_64"', Prism.languages.log);

      // Should tokenize as key-value, not as separate strings
      const kvToken = tokens.find((t) => typeof t !== 'string' && t.type === 'key-value');
      expect(kvToken).toBeDefined();

      // Should not have standalone string tokens (the quotes are part of key-value)
      const stringTokens = tokens.filter((t) => typeof t !== 'string' && t.type === 'string');
      expect(stringTokens.length).toBe(0);
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
