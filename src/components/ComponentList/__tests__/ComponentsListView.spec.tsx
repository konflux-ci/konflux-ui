import * as React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { useAllComponents } from '~/hooks/useComponents';
import { ComponentKind } from '~/types';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import { renderWithQueryClient } from '~/unit-test-utils/mock-react-query';
import { setupVirtualizerMock } from '~/unit-test-utils/mock-virtualizer';
import ComponentsListView from '../ComponentsListView';

jest.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Link: ({ children, to, ...props }: { children: React.ReactNode; to: string }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

jest.mock('~/hooks/useComponents', () => ({
  useAllComponents: jest.fn(),
}));

jest.mock('~/components/GitLink/GitRepoLink', () => ({
  __esModule: true,
  default: ({ url, revision }: { url: string; revision?: string }) => (
    <span data-test="git-repo-link">
      {url} ({revision ?? 'no revision'})
    </span>
  ),
}));

jest.mock('~/components/LatestBuild/LatestPushBuildSection', () => ({
  __esModule: true,
  default: ({ componentName }: { componentName: string }) => (
    <span data-test="latest-push-build">{componentName}</span>
  ),
}));

const useAllComponentsMock = useAllComponents as jest.Mock;

const createComponent = (name: string, source: ComponentKind['spec']['source']): ComponentKind =>
  ({
    apiVersion: 'appstudio.redhat.com/v1alpha1',
    kind: 'Component',
    metadata: { name, namespace: 'test-ns' },
    spec: {
      application: 'test-application',
      componentName: name,
      source,
    },
  }) as ComponentKind;

const mockComponents = [
  createComponent('frontend', {
    url: 'https://github.com/example/frontend',
    versions: [{ name: 'Main', revision: 'main' }],
  }),
  createComponent('backend', {
    url: 'https://github.com/example/backend',
    versions: [
      { name: 'Main', revision: 'main' },
      { name: 'Release', revision: 'release' },
    ],
  }),
];

const TestedComponent = ({ searchParams }: { searchParams?: string }) => (
  <NuqsTestingAdapter searchParams={searchParams}>
    <ComponentsListView />
  </NuqsTestingAdapter>
);

describe('ComponentsListView', () => {
  mockUseNamespaceHook('test-ns');

  beforeEach(() => {
    setupVirtualizerMock();
    useAllComponentsMock.mockReturnValue([mockComponents, true, undefined]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should show a loading skeleton while components are loading', () => {
    useAllComponentsMock.mockReturnValue([[], false, undefined]);

    renderWithQueryClient(<TestedComponent />);

    expect(screen.getByTestId('table-container')).toBeInTheDocument();
    expect(screen.getByTestId('table-skeleton')).toBeInTheDocument();
    expect(screen.queryByTestId('table-v2')).not.toBeInTheDocument();
  });

  it('should show an error state when loading components fails', () => {
    useAllComponentsMock.mockReturnValue([[], true, { code: 500, message: 'Server error' }]);

    renderWithQueryClient(<TestedComponent />);

    expect(screen.getByText('Unable to load components')).toBeInTheDocument();
  });

  it('should show the empty state when there are no components', () => {
    useAllComponentsMock.mockReturnValue([[], true, undefined]);

    renderWithQueryClient(<TestedComponent />);

    expect(screen.getByText('Create components in this namespace')).toBeInTheDocument();
    expect(screen.getByText(/This namespace has no components/)).toBeInTheDocument();
    expect(screen.queryByTestId('filter-toolbar')).not.toBeInTheDocument();
  });

  it('should render component links, version counts, repositories, and latest builds', async () => {
    renderWithQueryClient(<TestedComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('table-v2')).toBeInTheDocument();
    });

    expect(screen.getByRole('heading', { level: 1, name: 'Components' })).toBeInTheDocument();
    expect(screen.getByTestId('filter-toolbar')).toBeInTheDocument();

    const componentLinks = screen.getAllByTestId('component-name');
    expect(componentLinks[0]).toHaveTextContent('frontend');
    expect(componentLinks[0]).toHaveAttribute('href', '/ns/test-ns/components/frontend');

    const versionLinks = screen.getAllByTestId('component-versions');
    expect(versionLinks[0]).toHaveTextContent('1');
    expect(versionLinks[0]).toHaveAttribute('href', '/ns/test-ns/components/frontend/versions');
    expect(versionLinks[1]).toHaveTextContent('2');

    const repositoryLinks = screen.getAllByTestId('git-repo-link');
    expect(repositoryLinks[0]).toHaveTextContent('https://github.com/example/frontend (main)');
    expect(repositoryLinks[1]).toHaveTextContent(
      'https://github.com/example/backend (no revision)',
    );

    expect(
      screen.getAllByTestId('latest-push-build').map((element) => element.textContent),
    ).toEqual(['frontend', 'backend']);
  });

  it('should call useAllComponents with the current namespace', () => {
    renderWithQueryClient(<TestedComponent />);

    expect(useAllComponentsMock).toHaveBeenCalledWith('test-ns');
  });

  it('should filter components by name from the URL', async () => {
    renderWithQueryClient(<TestedComponent searchParams="?name=frontend" />);

    await waitFor(() => {
      expect(screen.getByTestId('component-name')).toHaveTextContent('frontend');
    });

    expect(screen.getAllByTestId('component-name')).toHaveLength(1);
    expect(screen.queryByText('backend')).not.toBeInTheDocument();
  });
});
