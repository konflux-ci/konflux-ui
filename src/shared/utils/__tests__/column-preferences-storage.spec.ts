import { FeatureFlagsStore } from '~/feature-flags/store';
import {
  getColumnPreferencesStorage,
  migrateColumnPreferences,
  writeColumnPreference,
} from '../column-preferences-storage';

jest.mock('~/feature-flags/store', () => ({
  FeatureFlagsStore: { isOn: jest.fn() },
}));

const isFlagOn = FeatureFlagsStore.isOn as jest.MockedFunction<typeof FeatureFlagsStore.isOn>;

describe('column preference storage', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    isFlagOn.mockReset();
  });

  it.each([
    [true, 'localStorage'],
    [false, 'sessionStorage'],
  ])('selects %s when the feature flag is %s', (enabled, expected) => {
    isFlagOn.mockReturnValue(enabled);
    expect(getColumnPreferencesStorage()).toBe(expected);
  });

  it('copies a session preference to local storage when local storage is selected', () => {
    isFlagOn.mockReturnValue(true);
    sessionStorage.setItem('columns', '["name"]');

    migrateColumnPreferences('columns');

    expect(localStorage.getItem('columns')).toBe('["name"]');
    expect(sessionStorage.getItem('columns')).toBeNull();
  });

  it('copies a local preference to session storage when session storage is selected', () => {
    isFlagOn.mockReturnValue(false);
    localStorage.setItem('columns', '["status"]');

    migrateColumnPreferences('columns');

    expect(sessionStorage.getItem('columns')).toBe('["status"]');
  });

  it('removes stale storage when writing a new preference', () => {
    isFlagOn.mockReturnValue(true);
    sessionStorage.setItem('columns', '["stale"]');

    writeColumnPreference('columns', '["new"]');

    expect(localStorage.getItem('columns')).toBe('["new"]');
    expect(sessionStorage.getItem('columns')).toBeNull();
  });

  it('does not overwrite a preference already in the selected storage', () => {
    isFlagOn.mockReturnValue(true);
    sessionStorage.setItem('columns', '["session"]');
    localStorage.setItem('columns', '["local"]');

    migrateColumnPreferences('columns');

    expect(localStorage.getItem('columns')).toBe('["local"]');
  });
});
