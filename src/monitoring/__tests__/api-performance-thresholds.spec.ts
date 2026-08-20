import {
  getSlowApiThreshold,
  API_SLOW_THRESHOLDS,
  PLUGIN_SLOW_THRESHOLDS,
} from '~/monitoring/api-performance-thresholds';

describe('getSlowApiThreshold', () => {
  it('returns null for non-same-origin URLs', () => {
    expect(getSlowApiThreshold('https://example.com/api/data', 10_000)).toBeNull();
  });

  it('returns null for URLs below warn threshold', () => {
    expect(getSlowApiThreshold('/api/data', 1_000)).toBeNull();
  });

  it('returns warning for regular API calls above warn threshold', () => {
    expect(getSlowApiThreshold('/api/data', 4_000)).toEqual({
      level: 'warning',
      thresholdMs: API_SLOW_THRESHOLDS.WARN_MS,
    });
  });

  it('returns error for regular API calls above critical threshold', () => {
    expect(getSlowApiThreshold('/api/data', 9_000)).toEqual({
      level: 'error',
      thresholdMs: API_SLOW_THRESHOLDS.CRITICAL_MS,
    });
  });

  it('uses plugin thresholds for plugin paths', () => {
    // 4000ms is above regular WARN (3000) but below plugin WARN (5000)
    // Since the URL contains /plugins/, plugin thresholds apply → null
    expect(getSlowApiThreshold('/api/plugins/my-plugin', 4_000)).toBeNull();
  });

  it('returns warning for plugin paths above plugin warn threshold', () => {
    expect(getSlowApiThreshold('/api/plugins/my-plugin', 6_000)).toEqual({
      level: 'warning',
      thresholdMs: PLUGIN_SLOW_THRESHOLDS.WARN_MS,
    });
  });

  it('returns error for plugin paths above plugin critical threshold', () => {
    expect(getSlowApiThreshold('/api/plugins/my-plugin', 11_000)).toEqual({
      level: 'error',
      thresholdMs: PLUGIN_SLOW_THRESHOLDS.CRITICAL_MS,
    });
  });

  it('returns null for exactly the warn threshold (not exceeded)', () => {
    expect(getSlowApiThreshold('/api/data', API_SLOW_THRESHOLDS.WARN_MS)).toBeNull();
  });
});
