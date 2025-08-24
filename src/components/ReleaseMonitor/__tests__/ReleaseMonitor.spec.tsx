import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import * as FilterContext from '~/components/Filter/generic/FilterContext';
import ReleaseMonitor from '~/components/ReleaseMonitor/ReleaseMonitor';

// Mock child components
jest.mock('../ReleaseMonitorListView', () => {
  return jest.fn(() => (
    <section role="region" aria-label="Release Monitor List View">
      Release Monitor List View
    </section>
  ));
});

jest.mock('~/components/Filter/generic/FilterContext', () => {
  const actual = jest.requireActual('~/components/Filter/generic/FilterContext');
  return {
    ...actual,
    FilterContextProvider: jest.fn(({ children, filterParams }) => (
      <section
        role="region"
        aria-label="filter-context-provider"
        data-filter-params={filterParams.join(',')}
      >
        {children}
      </section>
    )),
  };
});

// Type casts for mocked functions
const mockFilterContextProvider = jest.mocked(FilterContext.FilterContextProvider);

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

    expect(screen.getByRole('region', { name: 'filter-context-provider' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Release Monitor List View' })).toBeInTheDocument();
  });

  it('should provide correct filter parameters to FilterContextProvider', async () => {
    render(
      <MemoryRouter>
        <ReleaseMonitor />
      </MemoryRouter>,
    );

    expect(mockFilterContextProvider).toHaveBeenLastCalledWith(
      expect.objectContaining({
        filterParams: ['name', 'status', 'application', 'releasePlan', 'namespace', 'component'],
      }),
      expect.anything(),
    );

    const filterProvider = screen.getByRole('region', { name: 'filter-context-provider' });
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

    const filterProvider = await screen.findByRole('region', { name: 'filter-context-provider' });
    const listView = screen.getByRole('region', { name: 'Release Monitor List View' });

    expect(filterProvider).toContainElement(listView);
  });
});
