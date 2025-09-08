import { useParams } from 'react-router-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FilterContext } from '~/components/Filter/generic/FilterContext';
import { mockReleasePlans } from '~/components/ReleaseService/ReleasePlan/__data__/release-plan.mock';
import { SESSION_STORAGE_KEYS } from '~/consts/constants';
import { useReleasePlan } from '~/hooks/useReleasePlans';
import { useRelease } from '~/hooks/useReleases';
import { useNamespace } from '~/shared/providers/Namespace';
import { mockReleaseWithAllProcessing } from '../__data__/mock-release-data';
import ReleasePipelineRunTab from '../ReleasePipelineRunTab';

// Mock dependencies
jest.mock('react-router-dom', () => ({
  useParams: jest.fn(),
}));

jest.mock('~/hooks/useReleases');
jest.mock('~/hooks/useReleasePlans');
jest.mock('~/shared/providers/Namespace');

const mockUseParams = useParams as jest.MockedFunction<typeof useParams>;
const mockUseRelease = useRelease as jest.MockedFunction<typeof useRelease>;
const mockUseReleasePlan = useReleasePlan as jest.MockedFunction<typeof useReleasePlan>;
const mockUseNamespace = useNamespace as jest.MockedFunction<typeof useNamespace>;

const mockReleasePlan = mockReleasePlans[0];

const mockFilterContextValue = {
  filters: { name: '' },
  setFilters: jest.fn(),
  onClearFilters: jest.fn(),
};

const TestWrapper = ({ children }) => (
  <FilterContext.Provider value={mockFilterContextValue}>{children}</FilterContext.Provider>
);

describe('ReleasePipelineRunTab', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseParams.mockReturnValue({ releaseName: 'test-release' });
    mockUseNamespace.mockReturnValue('test-namespace');
    mockUseRelease.mockReturnValue([
      mockReleaseWithAllProcessing,
      true,
      undefined,
      undefined,
      false,
    ]);
    mockUseReleasePlan.mockReturnValue([mockReleasePlan, true, undefined]);

    // Mock sessionStorage
    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
      },
      writable: true,
    });
  });

  it('should render pipeline runs table with manage columns button (8+ columns)', async () => {
    render(
      <TestWrapper>
        <ReleasePipelineRunTab />
      </TestWrapper>,
    );

    await waitFor(() => {
      expect(screen.getByText('Pipeline runs')).toBeInTheDocument();
    });

    // Since we have 8 columns (> 6), the manage columns button should be visible
    const manageColumnsButton = screen.getByRole('button', { name: /manage columns/i });
    expect(manageColumnsButton).toBeInTheDocument();
  });

  it('should open column management modal when button is clicked', async () => {
    render(
      <TestWrapper>
        <ReleasePipelineRunTab />
      </TestWrapper>,
    );

    await waitFor(() => {
      expect(screen.getByText('Pipeline runs')).toBeInTheDocument();
    });

    const manageColumnsButton = screen.getByRole('button', { name: /manage columns/i });
    fireEvent.click(manageColumnsButton);

    await waitFor(() => {
      expect(screen.getByText('Manage pipeline run columns')).toBeInTheDocument();
      expect(
        screen.getByText('Selected columns will be displayed in the pipeline runs table.'),
      ).toBeInTheDocument();
    });
  });

  it('should show checkboxes for all columns in modal', async () => {
    render(
      <TestWrapper>
        <ReleasePipelineRunTab />
      </TestWrapper>,
    );

    await waitFor(() => {
      expect(screen.getByText('Pipeline runs')).toBeInTheDocument();
    });

    const manageColumnsButton = screen.getByRole('button', { name: /manage columns/i });
    fireEvent.click(manageColumnsButton);

    await waitFor(() => {
      // Check for column checkboxes (excluding Name which is non-hidable)
      expect(screen.getByRole('checkbox', { name: 'Started' })).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: 'Duration' })).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: 'Type' })).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: 'Snapshot' })).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: 'Namespace' })).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: 'Status' })).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: 'Completed' })).toBeInTheDocument();
    });
  });

  it('should save column preferences to session storage when changed', async () => {
    const mockSetItem = jest.fn();
    window.sessionStorage.setItem = mockSetItem;

    render(
      <TestWrapper>
        <ReleasePipelineRunTab />
      </TestWrapper>,
    );

    await waitFor(() => {
      expect(screen.getByText('Pipeline runs')).toBeInTheDocument();
    });

    // Should save default columns to session storage
    await waitFor(() => {
      expect(mockSetItem).toHaveBeenCalledWith(
        SESSION_STORAGE_KEYS.RELEASE_PIPELINE_VISIBLE_COLUMNS,
        expect.stringContaining('name'),
      );
    });
  });

  it('should load saved column preferences from session storage', () => {
    const mockGetItem = jest.fn().mockReturnValue(JSON.stringify(['name', 'startTime', 'type']));
    window.sessionStorage.getItem = mockGetItem;

    render(
      <TestWrapper>
        <ReleasePipelineRunTab />
      </TestWrapper>,
    );

    expect(mockGetItem).toHaveBeenCalledWith(SESSION_STORAGE_KEYS.RELEASE_PIPELINE_VISIBLE_COLUMNS);
  });

  it('should handle session storage errors gracefully', () => {
    const mockGetItem = jest.fn().mockImplementation(() => {
      throw new Error('Storage error');
    });
    window.sessionStorage.getItem = mockGetItem;

    // Should not throw error
    expect(() => {
      render(
        <TestWrapper>
          <ReleasePipelineRunTab />
        </TestWrapper>,
      );
    }).not.toThrow();
  });

  it('should close modal when cancel button is clicked', async () => {
    render(
      <TestWrapper>
        <ReleasePipelineRunTab />
      </TestWrapper>,
    );

    await waitFor(() => {
      expect(screen.getByText('Pipeline runs')).toBeInTheDocument();
    });

    // Open modal
    const manageColumnsButton = screen.getByRole('button', { name: /manage columns/i });
    fireEvent.click(manageColumnsButton);

    await waitFor(() => {
      expect(screen.getByText('Manage pipeline run columns')).toBeInTheDocument();
    });

    // Close modal
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText('Manage pipeline run columns')).not.toBeInTheDocument();
    });
  });

  it('should show loading spinner when data is not loaded', () => {
    mockUseRelease.mockReturnValue([null, false, undefined, undefined, false]);
    mockUseReleasePlan.mockReturnValue([null, false, undefined]);

    render(
      <TestWrapper>
        <ReleasePipelineRunTab />
      </TestWrapper>,
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should filter pipeline runs based on name filter', async () => {
    const filterContextWithName = {
      ...mockFilterContextValue,
      filters: { name: 'test-filter' },
    };

    const TestWrapperWithFilter = ({ children }) => (
      <FilterContext.Provider value={filterContextWithName}>{children}</FilterContext.Provider>
    );

    render(
      <TestWrapperWithFilter>
        <ReleasePipelineRunTab />
      </TestWrapperWithFilter>,
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('test-filter')).toBeInTheDocument();
    });
  });
});
