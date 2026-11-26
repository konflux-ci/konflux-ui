import * as React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { useComponentV2 } from '~/hooks/useComponentsV2';
import { ComponentKind, ComponentSpecs } from '~/types/component';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import { renderWithQueryClient } from '~/unit-test-utils/mock-react-query';
import { setupVirtualizerMock } from '~/unit-test-utils/mock-virtualizer';
import ComponentVersionListView from '../ComponentVersionListView';

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

jest.mock('~/hooks/useComponentsV2', () => ({
  useComponentV2: jest.fn(),
}));

const useComponentMock = useComponentV2 as jest.Mock;

const mockComponent: Partial<ComponentKind> = {
  metadata: {
    name: 'my-component',
    namespace: 'test-ns',
    uid: 'test-uid',
    creationTimestamp: '2024-01-01T00:00:00Z',
  },
  spec: {
    source: {
      url: 'https://github.com/org/repo',
      versions: [
        { name: 'Version 1.0', revision: 'ver-1.0', context: './frontend' },
        { name: 'Test', revision: 'test' },
        { name: 'Different pipeline', revision: 'different_branch', context: './backend' },
      ],
    },
    containerImage: 'quay.io/org/repo',
  } as ComponentSpecs,
};

const mockComponentNoVersions: Partial<ComponentKind> = {
  ...mockComponent,
  spec: {
    ...mockComponent.spec,
    source: { url: 'https://github.com/org/repo', versions: [] },
  } as ComponentSpecs,
};

const TestedComponent = ({ searchParams }: { searchParams?: string }) => (
  <NuqsTestingAdapter searchParams={searchParams}>
    <ComponentVersionListView componentName="my-component" />
  </NuqsTestingAdapter>
);

describe('ComponentVersionListView', () => {
  mockUseNamespaceHook('test-ns');

  beforeEach(() => {
    setupVirtualizerMock();
    useComponentMock.mockReturnValue([mockComponent, true, undefined]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render error state when component fails to load', () => {
    useComponentMock.mockReturnValue([undefined, true, new Error('500: Internal server error')]);
    renderWithQueryClient(<TestedComponent />);
    expect(screen.getByText('Unable to load Component versions')).toBeInTheDocument();
  });

  it('should show a loading skeleton while the component is loading', () => {
    useComponentMock.mockReturnValue([undefined, false, undefined]);
    renderWithQueryClient(<TestedComponent />);
    expect(screen.getByTestId('table-skeleton')).toBeInTheDocument();
    expect(screen.queryByTestId('table-v2')).not.toBeInTheDocument();
  });

  it('should render all versions', async () => {
    renderWithQueryClient(<TestedComponent />);
    await waitFor(() => expect(screen.getByTestId('table-v2')).toBeInTheDocument());
    expect(screen.getByText('Version 1.0')).toBeInTheDocument();
    expect(screen.getByText('Test')).toBeInTheDocument();
    expect(screen.getByText('Different pipeline')).toBeInTheDocument();
  });

  it('should render filter toolbar when versions exist', () => {
    renderWithQueryClient(<TestedComponent />);
    expect(screen.getByPlaceholderText('Filter by Name...')).toBeInTheDocument();
  });

  it('should not render filter toolbar when no versions and not filtered', () => {
    useComponentMock.mockReturnValue([mockComponentNoVersions, true, undefined]);
    renderWithQueryClient(<TestedComponent />);
    expect(screen.queryByPlaceholderText('Filter by Name...')).not.toBeInTheDocument();
  });

  it('should filter versions by name from the URL', async () => {
    renderWithQueryClient(<TestedComponent searchParams="?name=Version" />);
    await waitFor(() => expect(screen.getByText('Version 1.0')).toBeInTheDocument());
    expect(screen.queryByText('Test')).not.toBeInTheDocument();
    expect(screen.queryByText('Different pipeline')).not.toBeInTheDocument();
  });

  it('should perform case-insensitive filtering', async () => {
    renderWithQueryClient(<TestedComponent searchParams="?name=version" />);
    await waitFor(() => expect(screen.getByText('Version 1.0')).toBeInTheDocument());
  });

  it('should show empty filtered state when filter matches nothing', () => {
    renderWithQueryClient(<TestedComponent searchParams="?name=nonexistent" />);
    expect(screen.queryByText('Version 1.0')).not.toBeInTheDocument();
    expect(screen.getByText('No results found')).toBeInTheDocument();
  });
});
