import { MemoryRouter } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { FilterContextProvider } from '../../Filter/generic/FilterContext';
import ReleaseMonitor from '../ReleaseMonitor';

// Mock child components
jest.mock('../ReleaseMonitorListView', () => {
  return jest.fn(() => <div data-test="release-monitor-list-view">Release Monitor List View</div>);
});

jest.mock('../../Filter/generic/FilterContext', () => {
  return {
    FilterContextProvider: jest.fn(({ children, filterParams }) => (
      <div data-test="filter-context-provider" data-filter-params={filterParams.join(',')}>
        {children}
      </div>
    )),
  };
});

// Type casts for mocked functions
const mockFilterContextProvider = FilterContextProvider as jest.Mock;

describe('ReleaseMonitor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render without crashing', async () => {
    render(
      <MemoryRouter>
        <ReleaseMonitor />
      </MemoryRouter>,
    );

    expect(await screen.findByTestId('filter-context-provider')).toBeInTheDocument();
    expect(await screen.findByTestId('release-monitor-list-view')).toBeInTheDocument();
  });

  it('should provide correct filter parameters to FilterContextProvider', async () => {
    render(
      <MemoryRouter>
        <ReleaseMonitor />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(mockFilterContextProvider).toHaveBeenCalledWith(
        expect.objectContaining({
          filterParams: ['name', 'status', 'application', 'releasePlan', 'namespace', 'component'],
        }),
        expect.anything(),
      );
    });

    const filterProvider = await screen.findByTestId('filter-context-provider');
    expect(filterProvider).toHaveAttribute(
      'data-filter-params',
      'name,status,application,releasePlan,namespace,component',
    );
  });

  it('should render ReleaseMonitorListView inside FilterContextProvider', async () => {
    render(
      <MemoryRouter>
        <ReleaseMonitor />
      </MemoryRouter>,
    );

    const filterProvider = await screen.findByTestId('filter-context-provider');
    const listView = await screen.findByTestId('release-monitor-list-view');

    expect(filterProvider).toContainElement(listView);
  });
});
