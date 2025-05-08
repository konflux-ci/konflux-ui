import { FlagKey } from '../flags';
import { parseUrlForFeatureFlags, FeatureFlagsStore } from '../store';

describe('parseUrl()', () => {
  it('returns an empty object when no feature-flag params are present', () => {
    expect(parseUrlForFeatureFlags('')).toEqual({});
    expect(parseUrlForFeatureFlags('?q=search')).toEqual({});
  });

  it('parses the bulk "ff" param as “true” for every flag listed', () => {
    const result = parseUrlForFeatureFlags('?ff=alpha,beta,gamma');
    expect(result).toEqual({ alpha: true, beta: true, gamma: true });
  });

  it('parses individual "ff_<flag>" params and respects explicit true/false', () => {
    const result = parseUrlForFeatureFlags('?ff_foo=true&ff_bar=false&ff_baz=0');
    expect(result).toEqual({ foo: true, bar: false, baz: true });
  });

  it('merges bulk and keyed flags; keyed flags override duplicates set by bulk', () => {
    const result = parseUrlForFeatureFlags('?ff=alpha,beta&ff_beta=false&ff_gamma=true');
    expect(result).toEqual({ alpha: true, beta: false, gamma: true });
  });

  it('accepts a leading "?" or not', () => {
    const a = parseUrlForFeatureFlags('?ff=one');
    const b = parseUrlForFeatureFlags('ff=one');
    expect(a).toEqual(b);
  });

  it('treats a valueless keyed flag as true', () => {
    const result = parseUrlForFeatureFlags('?ff_newflag');
    expect(result).toEqual({ newflag: true });
  });
});

jest.mock('../flags', () => ({
  FLAGS: {
    featureA: { defaultEnabled: false },
    featureB: { defaultEnabled: true },
  },
}));

describe('FeatureFlagsStore', () => {
  beforeEach(() => {
    localStorage.clear();
    history.replaceState(null, '', '/');
    FeatureFlagsStore.refresh();
  });

  it('should initialize state with default values from FLAGS', () => {
    expect(FeatureFlagsStore.state).toEqual({
      featureA: false,
      featureB: true,
    });
  });

  it('should override state with URL search params', () => {
    history.replaceState(null, '', '/?ff=featureA&ff_featureB=false');
    FeatureFlagsStore.refresh();

    expect(FeatureFlagsStore.state).toEqual({
      featureA: true,
      featureB: false,
    });
  });

  it('should override state with localStorage values', () => {
    localStorage.setItem('__ff_overrides__', JSON.stringify({ featureA: true }));
    FeatureFlagsStore.refresh();

    expect(FeatureFlagsStore.state).toEqual({
      featureA: true,
      featureB: true,
    });
  });

  it('should update state and persist changes to localStorage and URL', () => {
    FeatureFlagsStore.set('featureA' as FlagKey, true);

    expect(FeatureFlagsStore.state['featureA' as FlagKey]).toBe(true);
    expect(localStorage.getItem('__ff_overrides__')).toContain('"featureA":true');
    expect(location.search).toContain('ff_featureA=true');
  });

  it('should reset all feature flags', () => {
    FeatureFlagsStore.set('featureA' as FlagKey, true);
    FeatureFlagsStore.resetAll();

    expect(FeatureFlagsStore.state).toEqual({
      featureA: false,
      featureB: true,
    });
    expect(localStorage.getItem('__ff_overrides__')).toBeNull();
    expect(location.search).toBe('');
  });

  it('should notify subscribers on state change', () => {
    const callback = jest.fn();
    const unsubscribe = FeatureFlagsStore.subscribe(callback);

    FeatureFlagsStore.set('featureA' as FlagKey, true);
    expect(callback).toHaveBeenCalledTimes(1);

    FeatureFlagsStore.set('featureA' as FlagKey, false);
    expect(callback).toHaveBeenCalledTimes(2);

    unsubscribe();
    FeatureFlagsStore.set('featureA' as FlagKey, true);
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('should not update state if the value is unchanged', () => {
    const callback = jest.fn();
    FeatureFlagsStore.subscribe(callback);

    FeatureFlagsStore.set('featureA' as FlagKey, false);
    expect(callback).not.toHaveBeenCalled();
  });

  it('should handle invalid localStorage data gracefully', () => {
    localStorage.setItem('__ff_overrides__', 'invalid-json');
    expect(() => FeatureFlagsStore.refresh()).not.toThrow();
    expect(FeatureFlagsStore.state).toEqual({
      featureA: false,
      featureB: true,
    });
  });

  it('should update URL search params correctly when toggling flags', () => {
    FeatureFlagsStore.set('featureA' as FlagKey, true);
    expect(location.search).toContain('ff_featureA=true');

    FeatureFlagsStore.set('featureA' as FlagKey, false);
    expect(location.search).toContain('ff_featureA=false');
  });

  it('should remove URL search params when resetting all flags', () => {
    FeatureFlagsStore.set('featureA' as FlagKey, true);
    expect(location.search).toContain('ff_featureA=true');

    FeatureFlagsStore.resetAll();

    expect(location.search).toBe('');
  });
});
