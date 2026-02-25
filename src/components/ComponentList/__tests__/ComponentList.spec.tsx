import { screen } from '@testing-library/react';
import { FilterContextProvider } from '~/components/Filter/generic/FilterContext';
import type { ComponentKind } from '~/types';
import { renderWithQueryClient } from '~/unit-test-utils/mock-react-query';
import { mockUseSearchParamBatch } from '~/unit-test-utils/mock-useSearchParam';
import ComponentList from '../ComponentList';

jest.mock('~/hooks/useComponents', () => ({
  useAllComponents: jest.fn(),
}));

jest.mock('~/hooks/useSearchParam', () => ({
  useSearchParamBatch: () => mockUseSearchParamBatch(),
}));

jest.mock('~/shared/providers/Namespace/useNamespaceInfo', () => ({
  useNamespace: jest.fn(),
}));

jest.mock('../ComponentListRow', () => ({
  __esModule: true,
  default: ({ obj }: { obj: ComponentKind }) => (
    <>
      <td data-test="component-list-item">{obj.metadata.name}</td>
    </>
  ),
}));

const useAllComponentsMock = jest.requireMock('~/hooks/useComponents')
  .useAllComponents as jest.Mock;
const useNamespaceMock = jest.requireMock('~/shared/providers/Namespace/useNamespaceInfo')
  .useNamespace as jest.Mock;

const createMockComponent = (name: string, namespace = 'test-ns'): ComponentKind =>
  ({
    apiVersion: 'appstudio.redhat.com/v1alpha1',
    kind: 'Component',
    metadata: { name, namespace, uid: `uid-${name}` },
    spec: {
      application: 'test-app',
      componentName: name,
      source: { git: { url: 'https://example.com/repo', revision: 'main' } },
    },
  }) as ComponentKind;

const renderComponentList = () =>
  renderWithQueryClient(
    <FilterContextProvider filterParams={['name', 'status']}>
      <ComponentList />
    </FilterContextProvider>,
  );

describe('ComponentList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useNamespaceMock.mockReturnValue('test-ns');
    useAllComponentsMock.mockReturnValue([[], true, undefined]);
  });

  it('renders title and description', () => {
    renderComponentList();
    expect(screen.getByRole('heading', { level: 3, name: /Components/i })).toBeInTheDocument();
    expect(
      screen.getAllByText(/A component is an image built from source code in a repository/).length,
    ).toBeGreaterThanOrEqual(1);
  });

  it('renders the component list container', () => {
    renderComponentList();
    expect(screen.getByTestId('component-list')).toBeInTheDocument();
  });

  it('renders the filter toolbar when components are present', () => {
    const components = [createMockComponent('single-comp')];
    useAllComponentsMock.mockReturnValue([components, true, undefined]);
    renderComponentList();
    expect(screen.getByTestId('component-list-toolbar')).toBeInTheDocument();
  });

  it('shows loading skeleton when components are not loaded', () => {
    useAllComponentsMock.mockReturnValue([[], false, undefined]);
    renderComponentList();
    expect(screen.getByTestId('data-table-skeleton')).toBeInTheDocument();
  });

  it('shows error state when useAllComponents returns an error', () => {
    useAllComponentsMock.mockReturnValue([[], true, { code: 403 }]);
    renderComponentList();
    expect(screen.getByText(/Unable to load components/i)).toBeInTheDocument();
  });

  it('shows empty state with Add component when no components exist', () => {
    renderComponentList();
    expect(screen.getByText(/To get started, add a component/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add component/i })).toBeInTheDocument();
  });

  it('renders component rows when data is loaded', () => {
    const components = [createMockComponent('comp-a'), createMockComponent('comp-b')];
    useAllComponentsMock.mockReturnValue([components, true, undefined]);

    renderComponentList();

    expect(screen.getByText('comp-a')).toBeInTheDocument();
    expect(screen.getByText('comp-b')).toBeInTheDocument();
    expect(screen.getAllByTestId('component-list-item')).toHaveLength(2);
  });

  it('calls useAllComponents with current namespace', () => {
    useNamespaceMock.mockReturnValue('my-namespace');
    renderComponentList();
    expect(useAllComponentsMock).toHaveBeenCalledWith('my-namespace');
  });

  it('filters components by name when name filter is applied via context', async () => {
    const components = [createMockComponent('nodejs-app'), createMockComponent('go-service')];
    useAllComponentsMock.mockReturnValue([components, true, undefined]);
    const setFiltersMock = jest.fn();
    const onClearFiltersMock = jest.fn();
    const { FilterContext: FilterContextObj } = await import(
      '~/components/Filter/generic/FilterContext'
    );
    renderWithQueryClient(
      <FilterContextObj.Provider
        value={{
          filters: { name: 'nodejs', status: [] },
          setFilters: setFiltersMock,
          onClearFilters: onClearFiltersMock,
        }}
      >
        <ComponentList />
      </FilterContextObj.Provider>,
    );
    expect(screen.getByText('nodejs-app')).toBeInTheDocument();
    expect(screen.queryByText('go-service')).not.toBeInTheDocument();
  });

  it('renders table when components are loaded', () => {
    const components = [createMockComponent('one')];
    useAllComponentsMock.mockReturnValue([components, true, undefined]);
    renderComponentList();
    expect(screen.getByText('one')).toBeInTheDocument();
  });
});
