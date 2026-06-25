import { useSearchParams } from 'react-router-dom';
import { renderHook } from '@testing-library/react';
import { useLocalStorage } from '~/shared/hooks/useLocalStorage';
import { SavedView } from '../types';
import { useActiveSavedView } from '../useActiveSavedView';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useSearchParams: jest.fn(),
}));
jest.mock('~/shared/hooks/useLocalStorage');

const mockUseSearchParams = jest.mocked(useSearchParams);
const mockUseLocalStorage = jest.mocked(useLocalStorage);

const mockViews: SavedView[] = [
  {
    slug: 'failed-builds',
    label: 'Failed Builds',
    searchParams: 'status=failed',
    columnStateKey: 'prns-columns:failed-builds',
  },
  {
    slug: 'recent-runs',
    label: 'Recent Runs',
    searchParams: 'sort=newest',
    columnStateKey: 'prns-columns:recent-runs',
  },
];

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useActiveSavedView', () => {
  it('returns undefined when no view param is in the URL', () => {
    mockUseSearchParams.mockReturnValue([new URLSearchParams(), jest.fn()]);
    mockUseLocalStorage.mockReturnValue([mockViews, jest.fn(), jest.fn()]);

    const { result } = renderHook(() => useActiveSavedView('pipeline-runs'));

    expect(result.current).toBeUndefined();
  });

  it('returns undefined when view slug is not found in saved views', () => {
    mockUseSearchParams.mockReturnValue([new URLSearchParams('view=nonexistent'), jest.fn()]);
    mockUseLocalStorage.mockReturnValue([mockViews, jest.fn(), jest.fn()]);

    const { result } = renderHook(() => useActiveSavedView('pipeline-runs'));

    expect(result.current).toBeUndefined();
  });

  it('returns the matching saved view when slug is found', () => {
    mockUseSearchParams.mockReturnValue([new URLSearchParams('view=failed-builds'), jest.fn()]);
    mockUseLocalStorage.mockReturnValue([mockViews, jest.fn(), jest.fn()]);

    const { result } = renderHook(() => useActiveSavedView('pipeline-runs'));

    expect(result.current).toEqual(mockViews[0]);
  });

  it('returns the correct view when multiple views exist', () => {
    mockUseSearchParams.mockReturnValue([new URLSearchParams('view=recent-runs'), jest.fn()]);
    mockUseLocalStorage.mockReturnValue([mockViews, jest.fn(), jest.fn()]);

    const { result } = renderHook(() => useActiveSavedView('pipeline-runs'));

    expect(result.current).toEqual(mockViews[1]);
  });

  it('uses the correct localStorage key based on resourceKey', () => {
    mockUseSearchParams.mockReturnValue([new URLSearchParams(), jest.fn()]);
    mockUseLocalStorage.mockReturnValue([[], jest.fn(), jest.fn()]);

    renderHook(() => useActiveSavedView('my-resource'));

    expect(mockUseLocalStorage).toHaveBeenCalledWith('saved-views:my-resource', []);
  });

  it('returns undefined when saved views list is empty', () => {
    mockUseSearchParams.mockReturnValue([new URLSearchParams('view=some-view'), jest.fn()]);
    mockUseLocalStorage.mockReturnValue([[], jest.fn(), jest.fn()]);

    const { result } = renderHook(() => useActiveSavedView('pipeline-runs'));

    expect(result.current).toBeUndefined();
  });
});
