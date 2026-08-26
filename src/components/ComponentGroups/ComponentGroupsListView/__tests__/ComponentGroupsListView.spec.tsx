import * as React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { MOCK_COMPONENT_GROUPS } from '~/components/ComponentGroups/ComponentGroupsListView/__data__/mockComponentGroups';
import { ComponentGroupsListView } from '~/components/ComponentGroups/ComponentGroupsListView/ComponentGroupsListView';
import { useComponentGroups } from '~/hooks/useComponentGroups';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import { renderWithQueryClient } from '~/unit-test-utils/mock-react-query';
import { setupVirtualizerMock } from '~/unit-test-utils/mock-virtualizer';

jest.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Link: ({
    children,
    to,
    ...props
  }: {
    children: React.ReactNode;
    to: string;
    'data-test'?: string;
  }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

jest.mock('~/hooks/useComponentGroups', () => ({
  useComponentGroups: jest.fn(),
}));

jest.mock('~/feature-flags/FeatureFlagIndicator', () => ({
  FeatureFlagIndicator: () => null,
}));

const useComponentGroupsMock = useComponentGroups as jest.Mock;

mockUseNamespaceHook('test-ns');

const TestedComponent = ({ searchParams }: { searchParams?: string }) => (
  <NuqsTestingAdapter searchParams={searchParams}>
    <ComponentGroupsListView />
  </NuqsTestingAdapter>
);

describe('ComponentGroupsListView', () => {
  beforeEach(() => {
    setupVirtualizerMock();
    useComponentGroupsMock.mockReturnValue([MOCK_COMPONENT_GROUPS, true, undefined]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should show a loading skeleton while groups are loading', () => {
    useComponentGroupsMock.mockReturnValue([[], false, undefined]);

    renderWithQueryClient(<TestedComponent />);

    expect(screen.getByTestId('table-container')).toBeInTheDocument();
    expect(screen.getByTestId('table-skeleton')).toBeInTheDocument();
    expect(screen.queryByTestId('table-v2')).not.toBeInTheDocument();
  });

  it('should show an error state when loading groups fails', () => {
    useComponentGroupsMock.mockReturnValue([[], true, { code: 500, message: 'Server error' }]);

    renderWithQueryClient(<TestedComponent />);

    expect(screen.getByText('Unable to load component groups')).toBeInTheDocument();
  });

  it('should show the empty state when there are no groups', () => {
    useComponentGroupsMock.mockReturnValue([[], true, undefined]);

    renderWithQueryClient(<TestedComponent />);

    expect(screen.getByText('Organize components for testing')).toBeInTheDocument();
    expect(
      screen.getByText(/A component group bundles components and branches/),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('filter-toolbar')).not.toBeInTheDocument();
  });

  it('should render group rows with name, component count, and latest build', async () => {
    renderWithQueryClient(<TestedComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('table-v2')).toBeInTheDocument();
    });

    expect(screen.getByRole('heading', { level: 1, name: /Groups/i })).toBeInTheDocument();
    expect(screen.getByTestId('filter-toolbar')).toBeInTheDocument();

    const nameLinks = screen.getAllByTestId('component-group-name');
    expect(nameLinks).toHaveLength(4);
    expect(nameLinks[0]).toHaveTextContent('frontend-stack');
    expect(nameLinks[0]).toHaveAttribute('href', '/ns/test-ns/groups/frontend-stack');

    expect(screen.getAllByTestId('component-group-components')[0]).toHaveTextContent('3');

    const latestBuild = screen.getAllByTestId('component-group-latest-build')[0];
    expect(latestBuild).toHaveTextContent('konflux-ui');
    expect(latestBuild).toHaveTextContent('on v1.2.0');

    expect(screen.getByTestId('component-group-no-build')).toHaveTextContent('No Builds yet');
  });

  it('should call useComponentGroups with the current namespace', () => {
    renderWithQueryClient(<TestedComponent />);

    expect(useComponentGroupsMock).toHaveBeenCalledWith('test-ns', true);
  });

  it('should show the filtered empty state when the name filter matches nothing', () => {
    renderWithQueryClient(<TestedComponent searchParams="?name=does-not-exist" />);

    expect(screen.getByText('No results found')).toBeInTheDocument();
    expect(screen.queryByTestId('table-v2')).not.toBeInTheDocument();
  });

  it('should filter groups by name from the URL', async () => {
    renderWithQueryClient(<TestedComponent searchParams="?name=frontend" />);

    await waitFor(() => {
      expect(screen.getByTestId('component-group-name')).toHaveTextContent('frontend-stack');
    });

    expect(screen.getAllByTestId('component-group-name')).toHaveLength(1);
    expect(screen.queryByText('backend-services')).not.toBeInTheDocument();
    expect(screen.queryByText('platform-operators')).not.toBeInTheDocument();
  });
});
