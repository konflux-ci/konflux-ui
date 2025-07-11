import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';
import { FilterContextProvider } from '~/components/Filter/generic/FilterContext';
import { useK8sAndKarchResources } from '~/hooks/useK8sAndKarchResources';
import { mockUseNamespaceHook } from '../../../../unit-test-utils/mock-namespace';
import { createUseParamsMock, renderWithQueryClientAndRouter } from '../../../../utils/test-utils';
import SnapshotsListView from '../SnapshotsListView';

jest.useFakeTimers();

jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({ t: (x) => x })),
}));

jest.mock('../../../../hooks/useK8sAndKarchResources', () => ({
  useK8sAndKarchResources: jest.fn(),
}));

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    Link: (props) => <a href={props.to}>{props.children}</a>,
  };
});

const useMockSnapshots = useK8sAndKarchResources as jest.Mock;

// Helper function to create wrapped component
const createWrappedComponent = () => (
  <FilterContextProvider filterParams={[]}>
    <SnapshotsListView applicationName="test-app" />
  </FilterContextProvider>
);

const checkEmptyState = () => {
  expect(
    screen.queryByText(
      /A snapshot is a point-in-time, immutable record of an application's container images/,
    ),
  ).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Learn more' })).toBeInTheDocument();

  // Check for the empty state title
  expect(screen.getByText('No snapshots found')).toBeInTheDocument();

  // Check for the empty state description text
  expect(
    screen.getByText(/Snapshots are created automatically by push events or pull request events/),
  ).toBeInTheDocument();
  expect(
    screen.queryByText('Snapshots can also created by created by manually if needed'),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByText('Once created, Snapshots will be displayed on this page'),
  ).not.toBeInTheDocument();
};

describe('SnapshotsListView - Empty State', () => {
  createUseParamsMock({ applicationName: 'test-app' });

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNamespaceHook('test-namespace');
  });

  it('should display empty state when no snapshots are found', () => {
    // Mock empty snapshots data
    useMockSnapshots.mockReturnValue({
      data: [],
      isLoading: false,
      hasError: false,
    });

    renderWithQueryClientAndRouter(createWrappedComponent());

    checkEmptyState();
  });

  it('should display empty state when snapshots data is undefined', () => {
    // Mock undefined snapshots data
    useMockSnapshots.mockReturnValue({
      data: undefined,
      isLoading: false,
      hasError: false,
    });

    renderWithQueryClientAndRouter(createWrappedComponent());

    checkEmptyState();
  });

  it('should display empty state when snapshots data is null', () => {
    // Mock null snapshots data
    useMockSnapshots.mockReturnValue({
      data: null,
      isLoading: false,
      hasError: false,
    });

    renderWithQueryClientAndRouter(createWrappedComponent());

    checkEmptyState();
  });

  it('should not display empty state when snapshots are loading', () => {
    // Mock loading state
    useMockSnapshots.mockReturnValue({
      data: [],
      isLoading: true,
      hasError: false,
    });

    renderWithQueryClientAndRouter(createWrappedComponent());

    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });

  it('should not display empty state when there is an error', () => {
    // Mock error state
    useMockSnapshots.mockReturnValue({
      data: [],
      isLoading: false,
      hasError: true,
    });

    renderWithQueryClientAndRouter(createWrappedComponent());

    expect(screen.getByText('Unable to load snapshots')).toBeInTheDocument();
  });
});
