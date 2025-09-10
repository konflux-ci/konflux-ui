import { MemoryRouter } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import * as FilterContext from '~/components/Filter/generic/FilterContext';
import ReleaseMonitor from '../ReleaseMonitor';

// Mock child components
jest.mock('../ReleaseMonitorListView', () => {
  return jest.fn(() => (
    <section role="region" aria-label="Release Monitor List View">
      Release Monitor List View
    </section>
  ));
});

jest.mock('~/components/Filter/generic/FilterContext', () => {
  return {
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

    expect(
      await screen.findByRole('region', { name: 'filter-context-provider' }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('region', { name: 'Release Monitor List View' }),
    ).toBeInTheDocument();
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

    const filterProvider = await screen.findByRole('region', { name: 'filter-context-provider' });
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
    const listView = await screen.findByRole('region', { name: 'Release Monitor List View' });

    expect(filterProvider).toContainElement(listView);
  });
});
