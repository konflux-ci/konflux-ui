import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';
import { createUseParamsMock, renderWithQueryClientAndRouter } from '~/utils/test-utils';
import { SnapshotsListViewTab } from '../SnapshotsTab';

// Mock the FilterContextProvider to observe the provided filterParams
jest.mock('~/components/Filter/generic/FilterContext', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  FilterContextProvider: ({ children, filterParams }: any) => (
    <div data-test="filter-provider" data-filter-params={JSON.stringify(filterParams)}>
      {children}
    </div>
  ),
}));

// Mock the child list view component to assert prop passthrough
jest.mock('../SnapshotsListView', () => ({
  __esModule: true,
  // eslint-disable-next-line react/display-name, @typescript-eslint/no-explicit-any
  default: ({ applicationName }: any) => (
    <div data-test="snapshots-list-view">App: {applicationName}</div>
  ),
}));

describe('SnapshotsListViewTab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders SnapshotsListView with applicationName from route and sets filter params', () => {
    createUseParamsMock({ applicationName: 'my-app' });

    renderWithQueryClientAndRouter(<SnapshotsListViewTab />);

    // Assert FilterContextProvider received expected filter params
    const provider = screen.getByTestId('filter-provider');
    expect(provider).toBeInTheDocument();
    expect(provider).toHaveAttribute('data-filter-params', JSON.stringify(['name']));

    // Assert child received applicationName from useParams
    expect(screen.getByTestId('snapshots-list-view')).toHaveTextContent('App: my-app');
  });
});
