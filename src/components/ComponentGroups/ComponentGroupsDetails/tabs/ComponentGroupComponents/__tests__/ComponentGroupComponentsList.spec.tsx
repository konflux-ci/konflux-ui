import * as React from 'react';
import { useParams } from 'react-router-dom';
import { screen, waitFor } from '@testing-library/react';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import ComponentGroupComponentsList from '~/components/ComponentGroups/ComponentGroupsDetails/tabs/ComponentGroupComponents/ComponentGroupComponentsList';
import { useComponentGroup } from '~/hooks/useComponentGroups';
import { useComponentsByName } from '~/hooks/useComponents';
import { ComponentGroupKind } from '~/types';
import { ComponentKind } from '~/types/component';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import { renderWithQueryClient } from '~/unit-test-utils/mock-react-query';
import { setupVirtualizerMock } from '~/unit-test-utils/mock-virtualizer';

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
  useParams: jest.fn(),
}));

jest.mock('~/hooks/useComponentGroups', () => ({
  useComponentGroup: jest.fn(),
}));

jest.mock('~/hooks/useComponents', () => ({
  useComponentsByName: jest.fn(),
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
  default: ({ componentName, version }: { componentName: string; version?: string }) => (
    <span data-test="latest-push-build">
      {componentName}/{version ?? 'all versions'}
    </span>
  ),
}));

const useParamsMock = useParams as jest.Mock;
const useComponentGroupMock = useComponentGroup as jest.Mock;
const useComponentsByNameMock = useComponentsByName as jest.Mock;

const group = {
  apiVersion: 'appstudio.redhat.com/v1beta2',
  kind: 'ComponentGroup',
  metadata: { name: 'frontend-stack', namespace: 'test-ns' },
  spec: {
    components: [
      { name: 'frontend', componentVersion: { name: 'frontend', version: 'main' } },
      { name: 'backend', componentVersion: { name: 'backend', version: 'release' } },
      { name: 'docs' },
    ],
  },
  status: {
    globalCandidateList: [
      { name: 'frontend', version: 'main', lastPromotedBuildTime: '2026-08-20T00:00:00Z' },
      { name: 'backend', version: 'release', lastPromotedBuildTime: '2026-08-21T00:00:00Z' },
      { name: 'docs', version: 'v1', lastPromotedBuildTime: '2026-08-19T00:00:00Z' },
    ],
  },
} as ComponentGroupKind;

const createComponent = (name: string, url?: string): ComponentKind =>
  ({
    apiVersion: 'appstudio.redhat.com/v1alpha1',
    kind: 'Component',
    metadata: { name, namespace: 'test-ns' },
    spec: {
      application: 'test-application',
      componentName: name,
      source: url ? { url } : undefined,
    },
  }) as ComponentKind;

const mockComponents = [
  createComponent('frontend', 'https://github.com/example/frontend'),
  createComponent('backend'),
  createComponent('docs'),
];

const TestedComponent = ({ searchParams }: { searchParams?: string }) => (
  <NuqsTestingAdapter searchParams={searchParams}>
    <ComponentGroupComponentsList />
  </NuqsTestingAdapter>
);

describe('ComponentGroupComponentsList', () => {
  mockUseNamespaceHook('test-ns');

  beforeEach(() => {
    setupVirtualizerMock();
    useParamsMock.mockReturnValue({ groupName: 'frontend-stack' });
    useComponentGroupMock.mockReturnValue([group, true, undefined]);
    useComponentsByNameMock.mockReturnValue([mockComponents, true, undefined]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should show a loading skeleton while the group or components are loading', () => {
    useComponentGroupMock.mockReturnValue([null, false, undefined]);
    useComponentsByNameMock.mockReturnValue([[], false, undefined]);

    renderWithQueryClient(<TestedComponent />);

    expect(screen.getByTestId('table-container')).toBeInTheDocument();
    expect(screen.getByTestId('table-skeleton')).toBeInTheDocument();
    expect(screen.queryByTestId('table-v2')).not.toBeInTheDocument();
  });

  it('should show an error state when the group fails to load', () => {
    useComponentGroupMock.mockReturnValue([null, true, { code: 500, message: 'Server error' }]);

    renderWithQueryClient(<TestedComponent />);

    expect(screen.getByText('Unable to load group components')).toBeInTheDocument();
  });

  it('should show an error state when the component list fails to load', () => {
    useComponentsByNameMock.mockReturnValue([[], true, { code: 500, message: 'Server error' }]);

    renderWithQueryClient(<TestedComponent />);

    expect(screen.getByText('Unable to load group components')).toBeInTheDocument();
  });

  it('should show the empty state when the group has no components', () => {
    const emptyGroup = {
      ...group,
      spec: { components: [] },
    } as ComponentGroupKind;
    useComponentGroupMock.mockReturnValue([emptyGroup, true, undefined]);
    useComponentsByNameMock.mockReturnValue([[], true, undefined]);

    renderWithQueryClient(<TestedComponent />);

    expect(screen.getByText('Add components to this group')).toBeInTheDocument();
    expect(screen.getByText(/This group has no components/)).toBeInTheDocument();
    expect(screen.queryByTestId('filter-toolbar')).not.toBeInTheDocument();
  });

  it('should render component details and version-aware build sections', async () => {
    renderWithQueryClient(<TestedComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('table-v2')).toBeInTheDocument();
    });

    const componentLinks = screen.getAllByTestId('component-name');
    expect(componentLinks[0]).toHaveAttribute('href', '/ns/test-ns/components/frontend');
    expect(componentLinks[1]).toHaveAttribute('href', '/ns/test-ns/components/backend');

    expect(screen.getByRole('link', { name: 'main' })).toHaveAttribute(
      'href',
      '/ns/test-ns/components/frontend/versions/main',
    );
    expect(screen.getByRole('link', { name: 'release' })).toHaveAttribute(
      'href',
      '/ns/test-ns/components/backend/versions/release',
    );
    expect(screen.getByRole('link', { name: 'v1' })).toHaveAttribute(
      'href',
      '/ns/test-ns/components/docs/versions/v1',
    );

    expect(screen.getByTestId('git-repo-link')).toHaveTextContent(
      'https://github.com/example/frontend (main)',
    );
    expect(
      screen.getAllByTestId('latest-push-build').map((element) => element.textContent),
    ).toEqual(['frontend/main', 'backend/release', 'docs/v1']);
  });

  it('should request the components referenced by the group', () => {
    renderWithQueryClient(<TestedComponent />);

    expect(useComponentGroupMock).toHaveBeenCalledWith('test-ns', 'frontend-stack', true);
    expect(useComponentsByNameMock).toHaveBeenCalledWith(
      'test-ns',
      ['frontend', 'backend', 'docs'],
      true,
    );
  });

  it('should filter group components by name from the URL', async () => {
    renderWithQueryClient(<TestedComponent searchParams="?name=backend" />);

    await waitFor(() => {
      expect(screen.getByTestId('component-name')).toHaveTextContent('backend');
    });

    expect(screen.getAllByTestId('component-name')).toHaveLength(1);
    expect(screen.queryByText('frontend')).not.toBeInTheDocument();
  });
});
