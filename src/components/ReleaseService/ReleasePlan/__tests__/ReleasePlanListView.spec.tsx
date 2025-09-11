import { MemoryRouter } from 'react-router-dom';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { mockApplication } from '~/components/ApplicationDetails/__data__/mock-data';
import { FilterContextProvider } from '~/components/Filter/generic/FilterContext';
import { useApplications } from '../../../../hooks/useApplications';
import { useReleasePlans } from '../../../../hooks/useReleasePlans';
import { mockAccessReviewUtil } from '../../../../unit-test-utils/mock-access-review';
import { mockReleasePlan, mockReleasePlans } from '../__data__/release-plan.mock';
import ReleasePlanListView from '../ReleasePlanListView';

jest.useFakeTimers();

jest.mock('~/shared/components/table/Table', () => {
  const TableComponent = jest.requireActual('~/shared/components/table/Table').default;

  const MockTable = (props) => {
    return <TableComponent {...props} virtualize={false} />;
  };

  return MockTable;
});

jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({ t: (x) => x })),
}));

jest.mock('../../../../hooks/useReleasePlans', () => ({
  useReleasePlans: jest.fn(),
}));

jest.mock('../../../../hooks/useApplications', () => ({
  useApplications: jest.fn(),
}));

const mockReleasePlanHook = useReleasePlans as jest.Mock;

const ReleasePlanList = (
  <MemoryRouter>
    <FilterContextProvider filterParams={['name']}>
      <ReleasePlanListView />
    </FilterContextProvider>
  </MemoryRouter>
);

const useApplicationsMock = useApplications as jest.Mock;

describe('ReleasePlanListView', () => {
  mockAccessReviewUtil('useAccessReviewForModels', [true, true]);

  beforeEach(() => {
    useApplicationsMock.mockReturnValue([[mockApplication], true]);
  });

  it('should render progress bar while loading', async () => {
    mockReleasePlanHook.mockReturnValue([[], false]);
    const wrapper = render(ReleasePlanList);
    expect(await wrapper.findByRole('progressbar')).toBeTruthy();
  });

  it('should render the error state if there is an error loading the applications', () => {
    mockReleasePlanHook.mockReturnValue([[mockReleasePlan], true]);
    useApplicationsMock.mockReturnValue([undefined, true, { code: 403 }]);
    render(ReleasePlanList);
    expect(screen.getByText('Unable to load release plans')).toBeInTheDocument();
    expect(screen.getByText('Forbidden')).toBeInTheDocument();
  });

  it('should render the error state if there is an error loading the release plans', () => {
    mockReleasePlanHook.mockReturnValue([undefined, true, { code: 403 }]);
    render(ReleasePlanList);
    expect(screen.getByText('Unable to load release plans')).toBeInTheDocument();
    expect(screen.getByText('Forbidden')).toBeInTheDocument();
  });

  it('should render empty state when no release Plans present', () => {
    mockReleasePlanHook.mockReturnValue([[], true]);
    const wrapper = render(ReleasePlanList);
    expect(wrapper.findByText('No Release Plan found')).toBeTruthy();
  });

  it('should render table view for release plans', async () => {
    mockReleasePlanHook.mockReturnValue([[mockReleasePlan], true]);
    const wrapper = render(ReleasePlanList);
    await waitFor(() => expect(wrapper.container.getElementsByTagName('table')).toHaveLength(1));
  });

  it('should render filter toolbar', async () => {
    mockReleasePlanHook.mockReturnValue([[mockReleasePlan], true]);
    const wrapper = render(ReleasePlanList);
    await waitFor(() => wrapper.getByTestId('release-plan-list-toolbar'));
    expect(wrapper.container.getElementsByTagName('table')).toHaveLength(1);
    expect(wrapper.container.getElementsByTagName('tr')).toHaveLength(2);
  });

  it('should filter release plans based on name', async () => {
    mockReleasePlanHook.mockReturnValue([mockReleasePlans, true]);
    render(ReleasePlanList);

    fireEvent.change(screen.getByPlaceholderText('Filter by name...'), {
      target: { value: 'test-plan-2' },
    });
    act(() => {
      jest.advanceTimersByTime(700);
    });

    await waitFor(() => {
      expect(screen.queryByText('test-plan')).not.toBeInTheDocument();
      expect(screen.queryByText('test-plan-2')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('Filter by name...'), {
      target: { value: '' },
    });
    act(() => {
      jest.advanceTimersByTime(700);
    });
  });

  it('should handle no matched name', async () => {
    mockReleasePlanHook.mockReturnValue([mockReleasePlans, true]);
    render(ReleasePlanList);

    fireEvent.change(screen.getByPlaceholderText('Filter by name...'), {
      target: { value: 'no-match' },
    });
    act(() => {
      jest.advanceTimersByTime(700);
    });

    await waitFor(() => {
      expect(screen.queryByText('test-plan')).not.toBeInTheDocument();
      expect(screen.queryByText('test-plan-2')).not.toBeInTheDocument();
      expect(screen.queryByText('No results found')).toBeInTheDocument();
    });

    const clearFilterButton = screen.getAllByRole('button', { name: 'Clear all filters' })[0];
    fireEvent.click(clearFilterButton);
  });

  describe('Access Control Scenarios', () => {
    it('should show access denied state when user lacks list permissions', () => {
      mockAccessReviewUtil('useAccessReviewForModels', [false, true]);
      mockReleasePlanHook.mockReturnValue([[mockReleasePlan], true]);

      render(ReleasePlanList);

      expect(screen.getByTestId('no-access-state')).toBeInTheDocument();
      expect(screen.queryByTestId('release-plan-list-toolbar')).not.toBeInTheDocument();
    });

    it('should show loading spinner while access review is being checked', () => {
      mockAccessReviewUtil('useAccessReviewForModels', [true, false]);
      mockReleasePlanHook.mockReturnValue([[mockReleasePlan], true]);

      render(ReleasePlanList);

      expect(screen.getByTestId('spinner')).toBeInTheDocument();
    });

    it('should render list view when user has proper list access', async () => {
      mockAccessReviewUtil('useAccessReviewForModels', [true, true]);
      mockReleasePlanHook.mockReturnValue([[mockReleasePlan], true]);

      render(ReleasePlanList);

      expect(screen.queryByTestId('no-access-state')).not.toBeInTheDocument();
      expect(screen.getByTestId('release-plan-list-toolbar')).toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByRole('grid')).toBeInTheDocument();
      });
    });
  });
});
