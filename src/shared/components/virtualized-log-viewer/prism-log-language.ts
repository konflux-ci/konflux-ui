import Prism from 'prismjs';

/**
 * Custom Prism language definition for log files
 * Highlights: timestamps, log levels, key=value pairs, and test results
 *
 * Order matters: Earlier patterns have higher priority
 */
Prism.languages.log = {
  // key=value pairs - must come FIRST to prevent inner values from being matched by other rules
  // Matches: key="value" or key=value (only when preceded by whitespace or line start)
  // This prevents matching URLs like "?searchType=containers" or JSON values
  'key-value': {
    pattern: /(^|[\s,])([a-zA-Z_][\w.-]*)(=)(?:"[^"]*"|'[^']*'|[^\s,})\]]+)/,
    greedy: true,
    lookbehind: true,
    inside: {
      key: {
        pattern: /^[a-zA-Z_][\w.-]*(?==)/,
        alias: 'attr-name',
      },
      operator: /=/,
    },
  },

  // Log levels - ERROR/FATAL/FAIL/FAILED (higher priority than PASSED to avoid conflicts)
  'log-level-error': {
    pattern: /\b(?:ERROR|FATAL|FAIL|FAILED)\b/i,
    alias: 'error',
  },

  // Test results - PASSED/SUCCESS
  result: {
    pattern: /\b(?:PASSED|SUCCESS(?:FUL)?)\b/i,
    alias: 'success',
  },

  // Log levels - WARN/WARNING
  'log-level-warn': {
    pattern: /\b(?:WARN(?:ING)?)\b/i,
    alias: 'warning',
  },

  // Log levels - INFO
  'log-level-info': {
    pattern: /\b(?:INFO)\b/i,
    alias: 'info',
  },

  // Log levels - DEBUG/TRACE
  'log-level-debug': {
    pattern: /\b(?:DEBUG|TRACE)\b/i,
    alias: 'comment',
  },

  // Timestamps - matches various formats (AFTER key=value to avoid matching timestamps in values)
  // Examples:
  //   2026-02-02T10:51:43+00:00 (ISO with timezone)
  //   2026-02-02T10:52:23Z (ISO with Z)
  //   2026/02/02 10:52:23 (slash-separated)
  //   2026-02-02 10:52:23 (dash-separated)
  //   [10:30:45] (bracketed time)
  timestamp: {
    pattern:
      /\b\d{4}[-/]\d{2}[-/]\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?\b|\[\d{2}:\d{2}:\d{2}\]|\b\d{2}:\d{2}:\d{2}\b/,
    alias: 'number',
  },
};

export default Prism;
