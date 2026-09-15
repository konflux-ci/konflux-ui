import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useQueryState } from 'nuqs';
import { useModalLauncher } from '~/shared/components/modal/ModalProvider';
import { SavedViewActions } from '../SavedViewActions';
import { SavedView } from '../types';
import { useSavedViews } from '../useSavedViews';

jest.mock('../useSavedViews');
jest.mock('~/shared/components/modal/ModalProvider');
jest.mock('nuqs', () => ({
  useQueryState: jest.fn(),
  parseAsString: {},
}));

const mockSaveView = jest.fn().mockReturnValue('sv-test1234');
const mockUpdateView = jest.fn();
const mockDeleteView = jest.fn();
const mockRenameView = jest.fn();
const mockIsSlugAvailable = jest.fn().mockReturnValue(true);
const mockSetViewParam = jest.fn();
const mockShowModal = jest.fn();

const defaultProps = {
  resourceKey: 'pipelines',
  columnKeyPrefix: 'cols-pipelines',
  currentColumnStateKey: 'cols-pipelines:current',
  isFiltered: false,
  activeSavedView: undefined as SavedView | undefined,
};

const activeView: SavedView = {
  slug: 'my-view',
  label: 'My View',
  searchParams: 'status=running',
  columnStateKey: 'cols-pipelines:my-view',
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useSavedViews).mockReturnValue({
    views: [],
    saveView: mockSaveView,
    deleteView: mockDeleteView,
    renameView: mockRenameView,
    updateView: mockUpdateView,
    isSlugAvailable: mockIsSlugAvailable,
  });
  jest
    .mocked(useQueryState)
    .mockReturnValue([null, mockSetViewParam] as ReturnType<typeof useQueryState>);
  jest.mocked(useModalLauncher).mockReturnValue(mockShowModal);

  Object.defineProperty(window, 'location', {
    writable: true,
    value: { ...window.location, search: '?status=running&type=build' },
  });
});

const openDropdown = () => {
  fireEvent.click(screen.getByTestId('saved-view-actions-toggle'));
};

describe('SavedViewActions', () => {
  it('is disabled when no filters active and no saved view', () => {
    render(<SavedViewActions {...defaultProps} isFiltered={false} activeSavedView={undefined} />);
    expect(screen.getByTestId('saved-view-actions-toggle')).toBeDisabled();
  });

  it('is enabled when isFiltered is true', () => {
    render(<SavedViewActions {...defaultProps} isFiltered={true} />);
    expect(screen.getByTestId('saved-view-actions-toggle')).toBeEnabled();
  });

  it('is enabled when activeSavedView is set even if isFiltered is false', () => {
    render(<SavedViewActions {...defaultProps} isFiltered={false} activeSavedView={activeView} />);
    expect(screen.getByTestId('saved-view-actions-toggle')).toBeEnabled();
  });

  it('shows "Save view" when filtered and no active view', async () => {
    render(<SavedViewActions {...defaultProps} isFiltered={true} />);
    openDropdown();

    await waitFor(() => {
      expect(screen.getByRole('menuitem', { name: /Save view/i })).toBeInTheDocument();
    });
    expect(screen.queryByRole('menuitem', { name: /Edit view/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: /Delete/i })).not.toBeInTheDocument();
  });

  it('shows "Edit view" and "Delete" when active view exists', async () => {
    render(<SavedViewActions {...defaultProps} isFiltered={true} activeSavedView={activeView} />);
    openDropdown();

    await waitFor(() => {
      expect(screen.getByRole('menuitem', { name: /Edit view/i })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: /Delete/i })).toBeInTheDocument();
    });
    expect(screen.queryByRole('menuitem', { name: /Save view/i })).not.toBeInTheDocument();
  });

  it('shows "Update view with new filters" when active view exists and params changed', async () => {
    // Current URL has 'status=running&type=build', active view has 'status=running'
    render(<SavedViewActions {...defaultProps} isFiltered={true} activeSavedView={activeView} />);
    openDropdown();

    await waitFor(() => {
      expect(
        screen.getByRole('menuitem', { name: /Update view with new filters/i }),
      ).toBeInTheDocument();
    });
  });

  it('hides "Update view with new filters" when params match active view', async () => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...window.location, search: '?status=running' },
    });
    render(<SavedViewActions {...defaultProps} isFiltered={true} activeSavedView={activeView} />);
    openDropdown();

    await waitFor(() => {
      expect(screen.getByRole('menuitem', { name: /Edit view/i })).toBeInTheDocument();
    });
    expect(
      screen.queryByRole('menuitem', { name: /Update view with new filters/i }),
    ).not.toBeInTheDocument();
  });

  it('launches save modal when "Save view" is clicked', async () => {
    render(<SavedViewActions {...defaultProps} isFiltered={true} />);
    openDropdown();

    await waitFor(() => {
      expect(screen.getByRole('menuitem', { name: /Save view/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('menuitem', { name: /Save view/i }));

    expect(mockShowModal).toHaveBeenCalled();
  });

  it('launches rename modal when "Edit view" is clicked', async () => {
    render(<SavedViewActions {...defaultProps} isFiltered={true} activeSavedView={activeView} />);
    openDropdown();

    await waitFor(() => {
      expect(screen.getByRole('menuitem', { name: /Edit view/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('menuitem', { name: /Edit view/i }));

    expect(mockShowModal).toHaveBeenCalled();
  });

  it('calls updateView directly when "Update view with new filters" is clicked', async () => {
    render(<SavedViewActions {...defaultProps} isFiltered={true} activeSavedView={activeView} />);
    openDropdown();

    await waitFor(() => {
      expect(
        screen.getByRole('menuitem', { name: /Update view with new filters/i }),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('menuitem', { name: /Update view with new filters/i }));

    expect(mockUpdateView).toHaveBeenCalledWith('my-view', {
      searchParams: 'status=running&type=build',
      currentColumnStateKey: 'cols-pipelines:current',
    });
  });

  it('launches delete modal when "Delete" is clicked', async () => {
    render(<SavedViewActions {...defaultProps} isFiltered={true} activeSavedView={activeView} />);
    openDropdown();

    await waitFor(() => {
      expect(screen.getByRole('menuitem', { name: /Delete/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('menuitem', { name: /Delete/i }));

    expect(mockShowModal).toHaveBeenCalled();
  });
});
