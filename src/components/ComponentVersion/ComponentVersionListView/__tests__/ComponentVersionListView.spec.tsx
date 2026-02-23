import { Table as PfTable, Tbody, Tr } from '@patternfly/react-table';
import { act, fireEvent, screen } from '@testing-library/react';
import { FilterContextProvider } from '~/components/Filter/generic/FilterContext';
import { useComponent } from '~/hooks/useComponents';
import { ComponentKind, ComponentSpecs } from '~/types/component';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import { mockUseSearchParamBatch } from '~/unit-test-utils/mock-useSearchParam';
import { renderWithQueryClientAndRouter } from '~/unit-test-utils/rendering-utils';
import { ComponentVersionListRow } from '../ComponentVersionListRow';
import ComponentVersionListView from '../ComponentVersionListView';

jest.useFakeTimers();

jest.mock('~/hooks/useSearchParam', () => ({
  useSearchParamBatch: () => mockUseSearchParamBatch(),
}));

jest.mock('~/hooks/useComponents', () => ({
  useComponent: jest.fn(),
}));

jest.mock('~/shared/components/table/TableComponent', () => {
  return (props) => {
    return (
      <PfTable role="table" aria-label="table" variant="compact" borders={false}>
        <Tbody>
          {props.data.map((d, i) => (
            <Tr key={i}>
              <ComponentVersionListRow
                obj={d}
                customData={{
                  repoUrl: 'https://github.com/org/repo',
                  componentName: 'my-component',
                }}
              />
            </Tr>
          ))}
        </Tbody>
      </PfTable>
    );
  };
});

jest.mock('~/utils/rbac', () => ({
  createLoaderWithAccessCheck: jest.fn(),
}));

const useComponentMock = useComponent as jest.Mock;

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
  metadata: {
    name: 'my-component',
    namespace: 'test-ns',
    uid: 'test-uid',
    creationTimestamp: '2024-01-01T00:00:00Z',
  },
  spec: {
    source: {
      url: 'https://github.com/org/repo',
      versions: [],
    },
    containerImage: 'quay.io/org/repo',
  } as ComponentSpecs,
};

const VersionListView = () => (
  <FilterContextProvider filterParams={['name']}>
    <ComponentVersionListView componentName="my-component" />
  </FilterContextProvider>
);

describe('ComponentVersionListView', () => {
  mockUseNamespaceHook('test-ns');

  beforeEach(() => {
    useComponentMock.mockReturnValue([mockComponent, true, undefined]);
  });

  it('should render error state when component fails to load', () => {
    useComponentMock.mockReturnValue([undefined, true, new Error('500: Internal server error')]);
    renderWithQueryClientAndRouter(<VersionListView />);
    expect(screen.getByText('Unable to load Component versions')).toBeInTheDocument();
  });

  it('should render all versions', () => {
    renderWithQueryClientAndRouter(<VersionListView />);
    expect(screen.getByText('Version 1.0')).toBeInTheDocument();
    expect(screen.getByText('Test')).toBeInTheDocument();
    expect(screen.getByText('Different pipeline')).toBeInTheDocument();
  });

  it('should render filter toolbar when versions exist', () => {
    renderWithQueryClientAndRouter(<VersionListView />);
    expect(screen.getByPlaceholderText('Filter by name...')).toBeInTheDocument();
  });

  it('should not render filter toolbar when no versions and not filtered', () => {
    useComponentMock.mockReturnValue([mockComponentNoVersions, true, undefined]);
    renderWithQueryClientAndRouter(<VersionListView />);
    expect(screen.queryByPlaceholderText('Filter by name...')).not.toBeInTheDocument();
  });

  it('should filter versions by name', () => {
    const view = renderWithQueryClientAndRouter(<VersionListView />);

    const filter = screen.getByPlaceholderText<HTMLInputElement>('Filter by name...');
    act(() => {
      fireEvent.change(filter, { target: { value: 'Version' } });
    });
    act(() => {
      jest.advanceTimersByTime(700);
    });
    view.rerender(<VersionListView />);

    expect(screen.getByText('Version 1.0')).toBeInTheDocument();
    expect(screen.queryByText('Test')).not.toBeInTheDocument();
    expect(screen.queryByText('Different pipeline')).not.toBeInTheDocument();
  });

  it('should perform case-insensitive filtering', () => {
    const view = renderWithQueryClientAndRouter(<VersionListView />);

    const filter = screen.getByPlaceholderText<HTMLInputElement>('Filter by name...');
    act(() => {
      fireEvent.change(filter, { target: { value: 'version' } });
    });
    act(() => {
      jest.advanceTimersByTime(700);
    });
    view.rerender(<VersionListView />);

    expect(screen.getByText('Version 1.0')).toBeInTheDocument();
  });

  it('should show empty filtered state when filter matches nothing', () => {
    const view = renderWithQueryClientAndRouter(<VersionListView />);

    const filter = screen.getByPlaceholderText<HTMLInputElement>('Filter by name...');
    act(() => {
      fireEvent.change(filter, { target: { value: 'nonexistent' } });
    });
    act(() => {
      jest.advanceTimersByTime(700);
    });
    view.rerender(<VersionListView />);

    expect(screen.queryByText('Version 1.0')).not.toBeInTheDocument();
    expect(screen.getByText('No results found')).toBeInTheDocument();
  });
});
