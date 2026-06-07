import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '~/shared/hooks/useLocalStorage';
import { SavedView, SavedViewsConfig } from '../types';
import { useSavedViews } from '../useSavedViews';
import { generateSlug } from '../utils';

jest.mock('~/shared/hooks/useLocalStorage');
jest.mock('../utils', () => ({
  ...jest.requireActual('../utils'),
  generateSlug: jest.fn(),
}));

const mockUseLocalStorage = jest.mocked(useLocalStorage);
const mockGenerateSlug = jest.mocked(generateSlug);

const config: SavedViewsConfig = {
  resourceKey: 'pipelineruns',
  columnKeyPrefix: 'col-state-pr',
  routePath: '/workspaces/:workspace/pipelineruns',
};

let mockViews: SavedView[];
let mockSetViews: jest.Mock;
const mockRemoveViews = jest.fn();

beforeEach(() => {
  mockViews = [];
  mockSetViews = jest.fn((updater: unknown) => {
    if (typeof updater === 'function') {
      mockViews = (updater as (prev: SavedView[]) => SavedView[])(mockViews);
    } else {
      mockViews = updater as SavedView[];
    }
  });
  mockUseLocalStorage.mockReturnValue([mockViews, mockSetViews, mockRemoveViews]);
  mockGenerateSlug.mockReturnValue('sv-abc12345');
  jest.clearAllMocks();
  localStorage.clear();
});

describe('useSavedViews', () => {
  it('should initialize with empty views', () => {
    const { result } = renderHook(() => useSavedViews(config));
    expect(result.current.views).toEqual([]);
  });

  it('should use the correct storage key', () => {
    renderHook(() => useSavedViews(config));
    expect(mockUseLocalStorage).toHaveBeenCalledWith('saved-views:pipelineruns', []);
  });

  describe('saveView', () => {
    it('should save a view with auto-generated slug', () => {
      mockGenerateSlug.mockReturnValue('sv-auto1234');
      const { result } = renderHook(() => useSavedViews(config));

      let slug = '';
      act(() => {
        slug = result.current.saveView({
          label: 'My View',
          searchParams: '?status=failed',
          currentColumnStateKey: 'col-state-pr:default',
        });
      });

      expect(slug).toBe('sv-auto1234');
      expect(mockSetViews).toHaveBeenCalledWith(expect.any(Function));

      // Verify the updater produces the correct view
      const updater = mockSetViews.mock.calls[0][0] as (prev: SavedView[]) => SavedView[];
      const result2 = updater([]);
      expect(result2).toEqual([
        {
          slug: 'sv-auto1234',
          label: 'My View',
          searchParams: '?status=failed',
          columnStateKey: 'col-state-pr:sv-auto1234',
        },
      ]);
    });

    it('should save a view with a custom slug', () => {
      const { result } = renderHook(() => useSavedViews(config));

      let slug = '';
      act(() => {
        slug = result.current.saveView({
          slug: 'my-custom-slug',
          label: 'Custom View',
          searchParams: '?status=success',
          currentColumnStateKey: 'col-state-pr:default',
        });
      });

      expect(slug).toBe('my-custom-slug');
      expect(mockGenerateSlug).not.toHaveBeenCalled();
    });

    it('should copy column state from current key to new view key', () => {
      localStorage.setItem('col-state-pr:default', JSON.stringify({ order: ['a', 'b'] }));
      const { result } = renderHook(() => useSavedViews(config));

      act(() => {
        result.current.saveView({
          slug: 'test-view',
          label: 'Test',
          searchParams: '',
          currentColumnStateKey: 'col-state-pr:default',
        });
      });

      expect(localStorage.getItem('col-state-pr:test-view')).toBe(
        JSON.stringify({ order: ['a', 'b'] }),
      );
    });

    it('should not copy column state if source key does not exist', () => {
      const { result } = renderHook(() => useSavedViews(config));

      act(() => {
        result.current.saveView({
          slug: 'test-view',
          label: 'Test',
          searchParams: '',
          currentColumnStateKey: 'col-state-pr:nonexistent',
        });
      });

      expect(localStorage.getItem('col-state-pr:test-view')).toBeNull();
    });

    it('should append to existing views', () => {
      const existingView: SavedView = {
        slug: 'existing',
        label: 'Existing',
        searchParams: '?a=1',
        columnStateKey: 'col-state-pr:existing',
      };

      const { result } = renderHook(() => useSavedViews(config));

      act(() => {
        result.current.saveView({
          slug: 'new-view',
          label: 'New View',
          searchParams: '?b=2',
          currentColumnStateKey: 'col-state-pr:default',
        });
      });

      const updater = mockSetViews.mock.calls[0][0] as (prev: SavedView[]) => SavedView[];
      const updated = updater([existingView]);
      expect(updated).toHaveLength(2);
      expect(updated[0]).toEqual(existingView);
      expect(updated[1].slug).toBe('new-view');
    });
  });

  describe('deleteView', () => {
    it('should remove the view and clean up column state', () => {
      const viewToDelete: SavedView = {
        slug: 'delete-me',
        label: 'Delete Me',
        searchParams: '?x=1',
        columnStateKey: 'col-state-pr:delete-me',
      };
      mockViews = [viewToDelete];
      localStorage.setItem('col-state-pr:delete-me', '{"cols":["a"]}');

      mockUseLocalStorage.mockReturnValue([mockViews, mockSetViews, mockRemoveViews]);
      const { result } = renderHook(() => useSavedViews(config));

      act(() => {
        result.current.deleteView('delete-me');
      });

      // Column state should be removed
      expect(localStorage.getItem('col-state-pr:delete-me')).toBeNull();

      // Views should be filtered
      const updater = mockSetViews.mock.calls[0][0] as (prev: SavedView[]) => SavedView[];
      expect(updater([viewToDelete])).toEqual([]);
    });

    it('should handle deleting a non-existent slug gracefully', () => {
      mockViews = [];
      mockUseLocalStorage.mockReturnValue([mockViews, mockSetViews, mockRemoveViews]);
      const { result } = renderHook(() => useSavedViews(config));

      act(() => {
        result.current.deleteView('nonexistent');
      });

      // Should still call setViews to filter (no-op)
      expect(mockSetViews).toHaveBeenCalled();
    });
  });

  describe('renameView', () => {
    it('should update the label without changing the slug', () => {
      const { result } = renderHook(() => useSavedViews(config));

      act(() => {
        result.current.renameView('my-view', 'Updated Label');
      });

      const updater = mockSetViews.mock.calls[0][0] as (prev: SavedView[]) => SavedView[];
      const original: SavedView = {
        slug: 'my-view',
        label: 'Old Label',
        searchParams: '?a=1',
        columnStateKey: 'col-state-pr:my-view',
      };
      const updated = updater([original]);

      expect(updated).toEqual([
        {
          slug: 'my-view',
          label: 'Updated Label',
          searchParams: '?a=1',
          columnStateKey: 'col-state-pr:my-view',
        },
      ]);
    });

    it('should not affect other views', () => {
      const { result } = renderHook(() => useSavedViews(config));

      act(() => {
        result.current.renameView('view-a', 'New Name');
      });

      const updater = mockSetViews.mock.calls[0][0] as (prev: SavedView[]) => SavedView[];
      const views: SavedView[] = [
        { slug: 'view-a', label: 'Old', searchParams: '', columnStateKey: 'col-state-pr:view-a' },
        {
          slug: 'view-b',
          label: 'Keep This',
          searchParams: '',
          columnStateKey: 'col-state-pr:view-b',
        },
      ];
      const updated = updater(views);

      expect(updated[0].label).toBe('New Name');
      expect(updated[1].label).toBe('Keep This');
    });
  });

  describe('updateView', () => {
    it('should update searchParams and copy column state', () => {
      localStorage.setItem('col-state-pr:current', '{"visibility":{"name":true}}');
      const { result } = renderHook(() => useSavedViews(config));

      act(() => {
        result.current.updateView('my-view', {
          searchParams: '?status=updated',
          currentColumnStateKey: 'col-state-pr:current',
        });
      });

      const updater = mockSetViews.mock.calls[0][0] as (prev: SavedView[]) => SavedView[];
      const original: SavedView = {
        slug: 'my-view',
        label: 'My View',
        searchParams: '?status=old',
        columnStateKey: 'col-state-pr:my-view',
      };
      const updated = updater([original]);

      expect(updated[0].searchParams).toBe('?status=updated');
      expect(updated[0].label).toBe('My View');
      expect(localStorage.getItem('col-state-pr:my-view')).toBe('{"visibility":{"name":true}}');
    });

    it('should not copy column state if source key does not exist', () => {
      localStorage.setItem('col-state-pr:my-view', '{"old":"state"}');
      const { result } = renderHook(() => useSavedViews(config));

      act(() => {
        result.current.updateView('my-view', {
          searchParams: '?new=params',
          currentColumnStateKey: 'col-state-pr:nonexistent',
        });
      });

      const updater = mockSetViews.mock.calls[0][0] as (prev: SavedView[]) => SavedView[];
      const original: SavedView = {
        slug: 'my-view',
        label: 'My View',
        searchParams: '?old=params',
        columnStateKey: 'col-state-pr:my-view',
      };
      updater([original]);

      // Should keep old column state since source doesn't exist
      expect(localStorage.getItem('col-state-pr:my-view')).toBe('{"old":"state"}');
    });
  });

  describe('isSlugAvailable', () => {
    it('should return true for a unique slug', () => {
      mockViews = [];
      mockUseLocalStorage.mockReturnValue([mockViews, mockSetViews, mockRemoveViews]);
      const { result } = renderHook(() => useSavedViews(config));

      expect(result.current.isSlugAvailable('new-slug')).toBe(true);
    });

    it('should return false for an existing slug', () => {
      mockViews = [
        {
          slug: 'taken',
          label: 'Taken',
          searchParams: '',
          columnStateKey: 'col-state-pr:taken',
        },
      ];
      mockUseLocalStorage.mockReturnValue([mockViews, mockSetViews, mockRemoveViews]);
      const { result } = renderHook(() => useSavedViews(config));

      expect(result.current.isSlugAvailable('taken')).toBe(false);
    });
  });
});
