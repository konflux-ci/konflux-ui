import Prism from 'prismjs';

/**
 * Custom Prism.js language definition for application logs
 * Highlights: timestamps, log levels, key=value pairs, results, paths, URLs
 */
Prism.languages.applog = {
  // Timestamps (various formats: YYYY-MM-DD or YYYY/MM/DD with HH:MM:SS)
  timestamp: {
    pattern: /\b\d{4}[-/]\d{2}[-/]\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?\b/,
    alias: 'number',
  },

  // Log levels
  'log-level': {
    pattern: /\b(TRACE|DEBUG|INFO|INFORMATION|WARN|WARNING|ERROR|ERR|FATAL|PANIC|CRITICAL)\b/i,
    inside: {
      error: /\b(ERROR|ERR|FATAL|PANIC|CRITICAL)\b/i,
      warning: /\b(WARN|WARNING)\b/i,
      info: /\b(INFO|INFORMATION)\b/i,
      debug: /\b(DEBUG|TRACE)\b/i,
    },
  },

  // Test results
  result: {
    pattern: /\b(PASSED|FAILED|SUCCESS|SUCCESSFUL|FAILURE|FAIL|OK)\b/i,
    inside: {
      success: /\b(PASSED|SUCCESS|SUCCESSFUL|OK)\b/i,
      failure: /\b(FAILED|FAILURE|FAIL)\b/i,
    },
  },

  // Key=value pairs
  'key-value': {
    pattern: /\b([\w.-]+)=([\w.:/@-]+)/,
    inside: {
      key: /^[\w.-]+/,
      punctuation: /=/,
      value: /[\w.:/@-]+$/,
    },
  },

  // File paths
  path: {
    pattern: /(^|\s)(\/[\w\-./]+\.[\w]+)/,
    lookbehind: true,
  },

  // URLs
  url: {
    pattern: /https?:\/\/[^\s<]+/,
    greedy: true,
  },

  // Quoted strings
  string: {
    pattern: /"(?:\\.|[^\\"\r\n])*"/,
    greedy: true,
  },

  // Numbers (standalone)
  number: /\b\d+\.?\d*\b/,

  // Common separators
  punctuation: /[{}[\]();,.:]/,
};

export default Prism;
