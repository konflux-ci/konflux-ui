import { MemoryRouter } from 'react-router-dom';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { mockApplication } from '~/components/ApplicationDetails/__data__/mock-data';
import { FilterContextProvider } from '~/components/Filter/generic/FilterContext';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import { useApplications } from '../../../../hooks/useApplications';
import { useReleasePlanAdmissions } from '../../../../hooks/useReleasePlanAdmissions';
import { mockAccessReviewUtil } from '../../../../unit-test-utils/mock-access-review';
import { mockReleasePlanAdmissions } from '../__data__/release-plan-admission.mock';
import ReleasePlanAdmissionListView from '../ReleasePlanAdmissionListView';

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

jest.mock('../../../../hooks/useReleasePlanAdmissions', () => ({
  useReleasePlanAdmissions: jest.fn(),
}));

jest.mock('../../../../hooks/useApplications', () => ({
  useApplications: jest.fn(),
}));

const mockReleasePlanHook = useReleasePlanAdmissions as jest.Mock;
const useApplicationsMock = useApplications as jest.Mock;

const ReleasePlanAdmissionList = (
  <MemoryRouter>
    <FilterContextProvider filterParams={['name']}>
      <ReleasePlanAdmissionListView />
    </FilterContextProvider>
  </MemoryRouter>
);

describe('ReleasePlanAdmissionListView', () => {
  mockUseNamespaceHook('test-ns');
  mockAccessReviewUtil('useAccessReviewForModels', [true, true]);
  useApplicationsMock.mockReturnValue([[mockApplication], true]);

  it('should render progress bar while loading', async () => {
    mockReleasePlanHook.mockReturnValue([[], false]);
    const wrapper = render(ReleasePlanAdmissionList);
    expect(await wrapper.findByRole('progressbar')).toBeTruthy();
  });

  it('should render empty state when no release Plans present', () => {
    mockReleasePlanHook.mockReturnValue([[], true]);
    const wrapper = render(ReleasePlanAdmissionList);
    expect(wrapper.findByText('No Release Plan Admission found')).toBeTruthy();
  });

  it('should render table view for release plans', async () => {
    mockReleasePlanHook.mockReturnValue([mockReleasePlanAdmissions, true]);
    const wrapper = render(ReleasePlanAdmissionList);
    await waitFor(() => expect(wrapper.container.getElementsByTagName('table')).toHaveLength(1));
  });

  it('should render filter toolbar', async () => {
    mockReleasePlanHook.mockReturnValue([mockReleasePlanAdmissions, true]);
    const wrapper = render(ReleasePlanAdmissionList);
    await waitFor(() => wrapper.getByTestId('release-plan-admission-list-toolbar'));
    expect(wrapper.container.getElementsByTagName('table')).toHaveLength(1);
    expect(wrapper.container.getElementsByTagName('tr')).toHaveLength(3);
  });

  it('should filter release plan admissions based on name', async () => {
    mockReleasePlanHook.mockReturnValue([mockReleasePlanAdmissions, true]);
    render(ReleasePlanAdmissionList);

    act(() => {
      fireEvent.change(screen.getByPlaceholderText('Filter by name...'), {
        target: { value: 'test-rpa-2' },
      });

      jest.advanceTimersByTime(700);
    });

    await waitFor(() => {
      expect(screen.queryByText('test-rpa')).not.toBeInTheDocument();
      expect(screen.queryByText('test-rpa-2')).toBeInTheDocument();
    });

    act(() => {
      fireEvent.change(screen.getByPlaceholderText('Filter by name...'), {
        target: { value: '' },
      });
      jest.advanceTimersByTime(700);
    });
  });

  it('should handle no matched name', async () => {
    mockReleasePlanHook.mockReturnValue([mockReleasePlanAdmissions, true]);
    render(ReleasePlanAdmissionList);

    act(() => {
      fireEvent.change(screen.getByPlaceholderText('Filter by name...'), {
        target: { value: 'no-match' },
      });

      jest.advanceTimersByTime(700);
    });

    await waitFor(() => {
      expect(screen.queryByText('test-rpa')).not.toBeInTheDocument();
      expect(screen.queryByText('test-rpa-2')).not.toBeInTheDocument();
      expect(screen.queryByText('No results found')).toBeInTheDocument();
    });

    const clearFilterButton = screen.getAllByRole('button', { name: 'Clear all filters' })[0];
    act(() => {
      fireEvent.click(clearFilterButton);
    });
  });
});
