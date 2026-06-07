import { render, screen, fireEvent } from '@testing-library/react';
import { useQueryState } from 'nuqs';
import { SavedViewStar } from '../SavedViewStar';
import { SavedView } from '../types';
import { useSavedViews } from '../useSavedViews';

jest.mock('../useSavedViews');
jest.mock('nuqs', () => ({
  useQueryState: jest.fn(),
  parseAsString: {},
}));

const mockSaveView = jest.fn().mockReturnValue('sv-test1234');
const mockUpdateView = jest.fn();
const mockIsSlugAvailable = jest.fn().mockReturnValue(true);
const mockSetViewParam = jest.fn();

const defaultProps = {
  resourceKey: 'pipelines',
  columnKeyPrefix: 'cols-pipelines',
  currentColumnStateKey: 'cols-pipelines:current',
  isFiltered: false,
  activeSavedView: undefined as SavedView | undefined,
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useSavedViews).mockReturnValue({
    views: [],
    saveView: mockSaveView,
    deleteView: jest.fn(),
    renameView: jest.fn(),
    updateView: mockUpdateView,
    isSlugAvailable: mockIsSlugAvailable,
  });
  jest
    .mocked(useQueryState)
    .mockReturnValue([null, mockSetViewParam] as ReturnType<typeof useQueryState>);

  // Mock window.location.search
  Object.defineProperty(window, 'location', {
    writable: true,
    value: { ...window.location, search: '?status=running&type=build' },
  });
});

describe('SavedViewStar', () => {
  it('is hidden when no filters active and no saved view', () => {
    const { container } = render(
      <SavedViewStar {...defaultProps} isFiltered={false} activeSavedView={undefined} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('is visible when isFiltered is true', () => {
    render(<SavedViewStar {...defaultProps} isFiltered={true} />);
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
  });

  it('shows OutlinedStarIcon when no active view', () => {
    render(<SavedViewStar {...defaultProps} isFiltered={true} />);
    const button = screen.getByRole('button', { name: /save/i });
    // The outlined star icon should have class pf-v5-svg or similar, check via data-test
    expect(button.querySelector('[data-test="saved-view-star-outline"]')).toBeInTheDocument();
  });

  it('shows StarIcon when active view exists', () => {
    const activeView: SavedView = {
      slug: 'my-view',
      label: 'My View',
      searchParams: 'status=running',
      columnStateKey: 'cols-pipelines:my-view',
    };
    render(<SavedViewStar {...defaultProps} isFiltered={true} activeSavedView={activeView} />);
    const button = screen.getByRole('button', { name: /save/i });
    expect(button.querySelector('[data-test="saved-view-star-filled"]')).toBeInTheDocument();
  });

  it('is visible when activeSavedView is set even if isFiltered is false', () => {
    const activeView: SavedView = {
      slug: 'my-view',
      label: 'My View',
      searchParams: 'status=running',
      columnStateKey: 'cols-pipelines:my-view',
    };
    render(<SavedViewStar {...defaultProps} isFiltered={false} activeSavedView={activeView} />);
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
  });

  it('opens popover on click with name field when no active view', () => {
    render(<SavedViewStar {...defaultProps} isFiltered={true} />);
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('calls saveView with label and params on save', () => {
    render(<SavedViewStar {...defaultProps} isFiltered={true} />);
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    const input = screen.getByLabelText(/name/i);
    fireEvent.change(input, { target: { value: 'My Filter' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(mockSaveView).toHaveBeenCalledWith({
      label: 'My Filter',
      searchParams: 'status=running&type=build',
      currentColumnStateKey: 'cols-pipelines:current',
    });
  });

  it('updates URL with view param after save', () => {
    render(<SavedViewStar {...defaultProps} isFiltered={true} />);
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    const input = screen.getByLabelText(/name/i);
    fireEvent.change(input, { target: { value: 'My Filter' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(mockSetViewParam).toHaveBeenCalledWith('sv-test1234');
  });

  it('disables Save button when name is empty', () => {
    render(<SavedViewStar {...defaultProps} isFiltered={true} />);
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  describe('when active view exists', () => {
    const activeView: SavedView = {
      slug: 'my-view',
      label: 'My View',
      searchParams: 'status=running',
      columnStateKey: 'cols-pipelines:my-view',
    };

    it('shows Save and Save As buttons in popover', () => {
      render(<SavedViewStar {...defaultProps} isFiltered={true} activeSavedView={activeView} />);
      fireEvent.click(screen.getByRole('button', { name: /save/i }));

      expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /save as/i })).toBeInTheDocument();
    });

    it('Save button calls updateView with current params', () => {
      render(<SavedViewStar {...defaultProps} isFiltered={true} activeSavedView={activeView} />);
      fireEvent.click(screen.getByRole('button', { name: /save/i }));
      fireEvent.click(screen.getByRole('button', { name: 'Save' }));

      expect(mockUpdateView).toHaveBeenCalledWith('my-view', {
        searchParams: 'status=running&type=build',
        currentColumnStateKey: 'cols-pipelines:current',
      });
    });

    it('Save As shows name field for new entry', () => {
      render(<SavedViewStar {...defaultProps} isFiltered={true} activeSavedView={activeView} />);
      fireEvent.click(screen.getByRole('button', { name: /save/i }));
      fireEvent.click(screen.getByRole('button', { name: /save as/i }));

      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    });

    it('Save As calls saveView with new label', () => {
      render(<SavedViewStar {...defaultProps} isFiltered={true} activeSavedView={activeView} />);
      fireEvent.click(screen.getByRole('button', { name: /save/i }));
      fireEvent.click(screen.getByRole('button', { name: /save as/i }));

      const input = screen.getByLabelText(/name/i);
      fireEvent.change(input, { target: { value: 'New View' } });
      fireEvent.click(screen.getByRole('button', { name: 'Save' }));

      expect(mockSaveView).toHaveBeenCalledWith({
        label: 'New View',
        searchParams: 'status=running&type=build',
        currentColumnStateKey: 'cols-pipelines:current',
      });
      expect(mockSetViewParam).toHaveBeenCalledWith('sv-test1234');
    });
  });
});
