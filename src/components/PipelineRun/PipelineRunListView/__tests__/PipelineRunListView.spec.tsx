import * as React from 'react';
import { Table, Thead, Tr, Th, Tbody } from '@patternfly/react-table';
import { screen, fireEvent, waitFor, act } from '@testing-library/react';
import { FilterContextProvider } from '~/components/Filter/generic/FilterContext';
import { useSearchParamBatch } from '~/hooks/useSearchParam';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import { renderWithQueryClient } from '~/unit-test-utils/mock-react-query';
import {
  mockUseSearchParamBatch,
  resetMockSearchParams,
} from '~/unit-test-utils/mock-useSearchParam';
import { PipelineRunLabel, PipelineRunType } from '../../../../consts/pipelinerun';
import { useApplication } from '../../../../hooks/useApplications';
import { useComponents } from '../../../../hooks/useComponents';
import { usePipelineRunsV2 } from '../../../../hooks/usePipelineRunsV2';
import { useLocalStorage } from '../../../../shared/hooks/useLocalStorage';
import { PipelineRunKind, PipelineRunStatus } from '../../../../types';
import { createUseApplicationMock } from '../../../../utils/test-utils';
import { mockComponentsData } from '../../../ApplicationDetails/__data__';
import PipelineRunsListView from '../PipelineRunsListView';

jest.useFakeTimers();
const useNamespaceMock = mockUseNamespaceHook('test-ns');

jest.mock('~/hooks/useSnapshots', () => ({
  useSnapshot: jest.fn(() => [{ metadata: { name: 'snap' } }, false, null]),
}));

jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({ t: (x) => x })),
}));

jest.mock('../../../../hooks/usePipelineRunsV2', () => ({
  usePipelineRunsV2: jest.fn(),
}));

createUseApplicationMock([
  { metadata: { name: 'test', creationTimestamp: '2022-01-01T00:00:00Z' } },
  true,
]);

jest.mock('../../../../hooks/useScanResults', () => ({
  useKarchScanResults: jest.fn(() => [
    [],
    true,
    undefined,
    () => {},
    { isFetchingNextPage: false, hasNextPage: false },
  ]),
  usePLRVulnerabilities: jest.fn(() => ({ vulnerabilities: {}, fetchedPipelineRuns: [] })),
}));

jest.mock('../../../../hooks/useComponents', () => ({
  useComponents: jest.fn().mockReturnValue([[], true]),
  useComponent: jest.fn().mockReturnValue([{ metadata: { name: { test } } }, true]),
}));

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    Link: (props) => <a href={props.to}>{props.children}</a>,
    useNavigate: jest.fn(),
    useLocation: jest.fn(() => ({ pathname: '/ns/test-ns' })),
  };
});

jest.mock('../../../../hooks/useSearchParam', () => ({
  useSearchParamBatch: jest.fn(),
}));

jest.mock('../../../../shared/hooks/useLocalStorage', () => ({
  useLocalStorage: jest.fn(() => [undefined, jest.fn(), jest.fn()]),
}));

jest.mock('../../../../shared/components/table/TableComponent', () => {
  return (props) => {
    const { data, filters, selected, match, kindObj } = props;
    const cProps = { data, filters, selected, match, kindObj };
    const columns = props.Header(cProps);
    const Row = props.Row;

    React.useEffect(() => {
      props?.onRowsRendered?.({ stopIndex: data.length - 1 });
      props?.infiniteLoaderProps?.loadMoreRows?.();
      props?.infiniteLoaderProps?.isRowLoaded?.({ index: 0 });
      props?.infiniteLoaderProps?.isRowLoaded?.({ index: data.length });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data]);

    return (
      <Table role="table" aria-label="table" variant="compact" borders={true}>
        <Thead>
          <Tr>
            {columns.map((col, idx) => (
              <Th key={idx} {...(col.props ?? {})}>
                {col.title}
              </Th>
            ))}
          </Tr>
        </Thead>
        <Tbody>
          {props.data.map((d, i) => (
            <Tr key={props.getRowProps?.(d)?.id ?? i}>
              <Row obj={d} index={i} columns={columns} />
            </Tr>
          ))}
        </Tbody>
      </Table>
    );
  };
});

jest.mock('../../../../utils/rbac', () => ({
  useAccessReviewForModel: jest.fn(() => [true, true]),
}));

const useApplicationMock = useApplication as jest.Mock;
const useComponentsMock = useComponents as jest.Mock;
const useSearchParamBatchMock = useSearchParamBatch as jest.Mock;
const useLocalStorageMock = useLocalStorage as jest.Mock;
const usePipelineRunsMock = usePipelineRunsV2 as jest.Mock;

const appName = 'my-test-app';

const pipelineRuns: PipelineRunKind[] = [
  {
    kind: 'PipelineRun',
    apiVersion: 'tekton.dev/v1beta1',
    metadata: {
      creationTimestamp: '2022-08-04T16:23:43Z',
      finalizers: Array['chains.tekton.dev/pipelinerun'],
      name: 'basic-node-js-first',
      namespace: 'test',
      ownerReferences: [
        {
          apiVersion: 'appstudio.redhat.com/v1alpha1',
          kind: 'Component',
          name: 'basic-node-js',
          uid: '6b79df0c-1bee-40c0-81ee-7c4d1c9a422f',
        },
      ],
      resourceVersion: '497868251',
      uid: '9c1f121c-1eb6-490f-b2d9-befbfc658df1',
      labels: {
        'appstudio.openshift.io/component': 'sample-component',
        'pipelinesascode.tekton.dev/event-type': 'pull_request',
        [PipelineRunLabel.PIPELINE_TYPE]: PipelineRunType.TEST as string,
      },
      annotations: {
        [PipelineRunLabel.COMMIT_PROVIDER_LABEL]: 'github',
      },
    },
    spec: {
      key: 'key1',
    },
    status: {
      startTime: '2022-08-05T16:23:43Z',
      conditions: [
        {
          status: 'True',
          type: 'Succeeded',
        },
      ],
    } as PipelineRunStatus,
  },
  {
    kind: 'PipelineRun',
    apiVersion: 'tekton.dev/v1beta1',
    metadata: {
      creationTimestamp: '2022-08-04T16:23:43Z',
      finalizers: Array['chains.tekton.dev/pipelinerun'],
      name: 'basic-node-js-second',
      namespace: 'test',
      ownerReferences: [
        {
          apiVersion: 'appstudio.redhat.com/v1alpha1',
          kind: 'Component',
          name: 'basic-node-js',
          uid: '6b79df0c-1bee-40c0-81ee-7c4d1c9a422f',
        },
      ],
      resourceVersion: '497868252',
      uid: '9c1f121c-1eb6-490f-b2d9-befbfc658dfb',
      labels: {
        'appstudio.openshift.io/component': 'test-component',
        'pipelinesascode.tekton.dev/event-type': 'pull_request',
        [PipelineRunLabel.PIPELINE_TYPE]: PipelineRunType.BUILD as string,
      },
      annotations: {
        [PipelineRunLabel.COMMIT_PROVIDER_LABEL]: 'github',
      },
    },
    spec: {
      key: 'key2',
    },
    status: {
      startTime: '2022-08-04T16:23:43Z',
    } as PipelineRunStatus,
  },
  {
    kind: 'PipelineRun',
    apiVersion: 'tekton.dev/v1beta1',
    metadata: {
      creationTimestamp: '2022-08-04T16:23:43Z',
      finalizers: Array['chains.tekton.dev/pipelinerun'],
      name: 'basic-node-js-third',
      namespace: 'test',
      ownerReferences: [
        {
          apiVersion: 'appstudio.redhat.com/v1alpha1',
          kind: 'Component',
          name: 'basic-node-js',
          uid: '6b79df0c-1bee-40c0-81ee-7c4d1c9a422f',
        },
      ],
      resourceVersion: '497868253',
      uid: '9c1f121c-1eb6-490f-b2d9-befbfc658dfc',
      labels: {
        'appstudio.openshift.io/component': 'sample-component',
        'pipelinesascode.tekton.dev/event-type': 'push',
        [PipelineRunLabel.PIPELINE_TYPE]: PipelineRunType.BUILD as string,
      },
      annotations: {
        [PipelineRunLabel.COMMIT_PROVIDER_LABEL]: 'github',
      },
    },
    spec: {
      key: 'key3',
    },
  },
];

const pipelineRunsWithoutToSorted = (): PipelineRunKind[] => {
  const runs = [...pipelineRuns];
  Object.defineProperty(runs, 'toSorted', { value: undefined });
  return runs;
};

const TestedComponent = ({
  name,
  componentName,
  customFilter,
}: {
  name: string;
  componentName?: string;
  customFilter?: (plr: PipelineRunKind) => boolean;
}) => (
  <FilterContextProvider filterParams={['name', 'status', 'type']}>
    <PipelineRunsListView
      applicationName={name}
      componentName={componentName}
      customFilter={customFilter}
    />
  </FilterContextProvider>
);

describe('Pipeline run List', () => {
  mockUseNamespaceHook('test-ns');

  beforeEach(() => {
    resetMockSearchParams();
    jest.clearAllMocks();
    useApplicationMock.mockReturnValue([
      { metadata: { name: 'test', creationTimestamp: '2022-01-01T00:00:00Z' } },
      true,
    ]);
    useSearchParamBatchMock.mockImplementation(() => mockUseSearchParamBatch());
    useLocalStorageMock.mockReturnValue([undefined, jest.fn(), jest.fn()]);
    useComponentsMock.mockReturnValue([mockComponentsData, true]);
    useNamespaceMock.mockReturnValue('test-ns');
    usePipelineRunsMock.mockReturnValue([
      pipelineRuns,
      true,
      null,
      jest.fn(),
      { isFetchingNextPage: false, hasNextPage: false },
    ]);
  });

  it('should render spinner if application data is not loaded', () => {
    usePipelineRunsMock.mockReturnValue([
      [],
      false,
      null,
      jest.fn(),
      { isFetchingNextPage: false, hasNextPage: false },
    ]);
    renderWithQueryClient(<TestedComponent name={appName} />);
    screen.getByTestId('data-table-skeleton');
  });

  it('should render empty state if no application is present', () => {
    usePipelineRunsMock.mockReturnValue([
      [],
      true,
      null,
      jest.fn(),
      { isFetchingNextPage: false, hasNextPage: false },
    ]);
    renderWithQueryClient(<TestedComponent name={appName} />);
    screen.queryByText(/Keep tabs on components and activity/);
    screen.queryByText(/Monitor your components with pipelines and oversee CI\/CD activity./);
    const button = screen.queryByText('Add component');
    expect(button).toBeInTheDocument();
    expect(button.closest('a').href).toContain(
      `http://localhost/ns/test-ns/import?application=my-test-app`,
    );
  });

  it('should render error state when there is an API error', () => {
    usePipelineRunsMock.mockReturnValue([
      [],
      true,
      new Error('500: Internal server error'),
      jest.fn(),
      { isFetchingNextPage: false, hasNextPage: false },
    ]);
    renderWithQueryClient(<TestedComponent name="purple-mermaid-app" />);
    screen.getByText('Unable to load pipeline runs');
  });

  it('should render correct columns when pipelineRuns are present', () => {
    renderWithQueryClient(<TestedComponent name={appName} />);
    screen.queryByText('Name');
    screen.queryByText('Started');
    screen.queryByText('Duration');
    screen.queryAllByText('Status');
    screen.queryAllByText('Type');
    screen.queryByText('Component');
    screen.queryByText('Triggered By');
  });

  it('should render entire pipelineRuns list when no filter value', () => {
    renderWithQueryClient(<TestedComponent name={appName} />);
    expect(screen.queryByText('basic-node-js-first')).toBeInTheDocument();
    expect(screen.queryByText('basic-node-js-second')).toBeInTheDocument();
    expect(screen.queryByText('basic-node-js-third')).toBeInTheDocument();
    const filter = screen.getByPlaceholderText<HTMLInputElement>('Filter by name...');
    expect(filter.value).toBe('');
  });

  it('should render filtered pipelinerun list by name', async () => {
    const r = renderWithQueryClient(<TestedComponent name={appName} />);

    const filter = screen.getByPlaceholderText<HTMLInputElement>('Filter by name...');

    fireEvent.change(filter, {
      target: { value: 'second' },
    });
    expect(filter.value).toBe('second');

    act(() => {
      jest.advanceTimersByTime(700);
    });

    r.rerender(<TestedComponent name={appName} />);
    await waitFor(() => {
      expect(screen.queryByText('basic-node-js-first')).not.toBeInTheDocument();
      expect(screen.queryByText('basic-node-js-second')).toBeInTheDocument();
      expect(screen.queryByText('basic-node-js-third')).not.toBeInTheDocument();
    });

    fireEvent.change(filter, {
      target: { value: '' },
    });
    expect(filter.value).toBe('');

    act(() => {
      jest.advanceTimersByTime(700);
    });
  });

  it('should render filtered pipelinerun list by status', async () => {
    const r = renderWithQueryClient(<TestedComponent name={appName} />);

    const statusFilter = screen.getByRole('button', {
      name: /status filter menu/i,
    });

    fireEvent.click(statusFilter);
    expect(statusFilter).toHaveAttribute('aria-expanded', 'true');

    const succeededOption = r.getByLabelText(/succeeded/i, {
      selector: 'input',
    });

    await act(() => fireEvent.click(succeededOption));

    r.rerender(<TestedComponent name={appName} />);

    await waitFor(() => {
      expect(succeededOption).toBeChecked();
    });

    await waitFor(() => {
      expect(screen.queryByText('basic-node-js-first')).toBeInTheDocument();
      expect(screen.queryByText('basic-node-js-second')).not.toBeInTheDocument();
      expect(screen.queryByText('basic-node-js-third')).not.toBeInTheDocument();
    });

    expect(statusFilter).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(succeededOption);
    r.rerender(<TestedComponent name={appName} />);
    expect(succeededOption).not.toBeChecked();
  });

  it('should render filtered pipelinerun list by type', async () => {
    const r = renderWithQueryClient(<TestedComponent name={appName} />);

    const typeFilter = screen.getByRole('button', {
      name: /type filter menu/i,
    });

    fireEvent.click(typeFilter);
    expect(typeFilter).toHaveAttribute('aria-expanded', 'true');

    const testOption = r.getByLabelText(/test/i, {
      selector: 'input',
    });

    await act(() => fireEvent.click(testOption));

    r.rerender(<TestedComponent name={appName} />);

    await waitFor(() => {
      expect(testOption).toBeChecked();
    });

    await waitFor(() => {
      expect(screen.queryByText('basic-node-js-first')).toBeInTheDocument();
      expect(screen.queryByText('basic-node-js-second')).not.toBeInTheDocument();
      expect(screen.queryByText('basic-node-js-third')).not.toBeInTheDocument();
    });

    expect(typeFilter).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(testOption);
    r.rerender(<TestedComponent name={appName} />);
    expect(testOption).not.toBeChecked();
  });

  it('should clear the filters and render the list again in the table', async () => {
    const r = renderWithQueryClient(<TestedComponent name={appName} />);

    const filter = screen.getByPlaceholderText<HTMLInputElement>('Filter by name...');

    await act(() =>
      fireEvent.change(filter, {
        target: { value: 'no-match' },
      }),
    );

    expect(filter.value).toBe('no-match');

    act(() => {
      jest.advanceTimersByTime(700);
    });

    r.rerender(<TestedComponent name={appName} />);
    await waitFor(() => {
      expect(screen.queryByText('basic-node-js-first')).not.toBeInTheDocument();
      expect(screen.queryByText('basic-node-js-second')).not.toBeInTheDocument();
      expect(screen.queryByText('basic-node-js-third')).not.toBeInTheDocument();
      expect(screen.queryByText('No results found')).toBeInTheDocument();
      expect(
        screen.queryByText(
          'No results match this filter criteria. Clear all filters and try again.',
        ),
      ).toBeInTheDocument();
    });

    await act(() => fireEvent.click(screen.queryByRole('button', { name: 'Clear all filters' })));
    r.rerender(<TestedComponent name={appName} />);
    expect(filter.value).toBe('');

    await waitFor(() => {
      expect(screen.queryByText('basic-node-js-first')).toBeInTheDocument();
      expect(screen.queryByText('basic-node-js-second')).toBeInTheDocument();
      expect(screen.queryByText('basic-node-js-third')).toBeInTheDocument();
    });
  });

  it('should wait for application to load before fetching pipeline runs', () => {
    useApplicationMock.mockReturnValue([undefined, false]);

    renderWithQueryClient(<TestedComponent name={appName} />);

    expect(usePipelineRunsMock).toHaveBeenCalledWith(null, expect.any(Object));
  });

  it('should use persisted column preferences from localStorage', () => {
    const persistedColumns = ['name', 'started', 'status'];
    useLocalStorageMock.mockReturnValue([persistedColumns, jest.fn(), jest.fn()]);

    renderWithQueryClient(<TestedComponent name={appName} />);

    expect(useLocalStorageMock).toHaveBeenCalledWith(`pipeline-runs-columns-${appName}`);
    expect(screen.getByText('basic-node-js-first')).toBeInTheDocument();
  });

  it('should use component-specific localStorage key when componentName is provided', () => {
    renderWithQueryClient(<TestedComponent name={appName} componentName="sample-component" />);

    expect(useLocalStorageMock).toHaveBeenCalledWith(
      `pipeline-runs-columns-${appName}-sample-component`,
    );
  });

  it('should include component label in selector when componentName is provided', () => {
    renderWithQueryClient(<TestedComponent name={appName} componentName="sample-component" />);

    expect(usePipelineRunsMock).toHaveBeenCalledWith(
      'test-ns',
      expect.objectContaining({
        selector: expect.objectContaining({
          matchLabels: expect.objectContaining({
            [PipelineRunLabel.COMPONENT]: 'sample-component',
          }),
        }),
      }),
    );
  });

  it('should handle undefined pipeline runs from the hook', () => {
    usePipelineRunsMock.mockReturnValue([
      undefined,
      true,
      null,
      jest.fn(),
      { isFetchingNextPage: false, hasNextPage: false },
    ]);

    renderWithQueryClient(<TestedComponent name={appName} />);

    expect(screen.getByText(/Keep tabs on components and activity/)).toBeVisible();
  });

  it('should sort pipeline runs when toSorted is unavailable', () => {
    usePipelineRunsMock.mockReturnValue([
      pipelineRunsWithoutToSorted(),
      true,
      null,
      jest.fn(),
      { isFetchingNextPage: false, hasNextPage: false },
    ]);

    renderWithQueryClient(<TestedComponent name={appName} />);

    expect(screen.getByText('basic-node-js-first')).toBeInTheDocument();
    expect(screen.getByText('basic-node-js-second')).toBeInTheDocument();
    expect(screen.getByText('basic-node-js-third')).toBeInTheDocument();
  });

  it('should load next page when infinite loader requests more rows', () => {
    const getNextPage = jest.fn();
    usePipelineRunsMock.mockReturnValue([
      pipelineRuns,
      true,
      null,
      getNextPage,
      { isFetchingNextPage: false, hasNextPage: true },
    ]);

    renderWithQueryClient(<TestedComponent name={appName} />);

    expect(getNextPage).toHaveBeenCalled();
  });

  it('should not load next page when hasNextPage is false', () => {
    const getNextPage = jest.fn();
    usePipelineRunsMock.mockReturnValue([
      pipelineRuns,
      true,
      null,
      getNextPage,
      { isFetchingNextPage: false, hasNextPage: false },
    ]);

    renderWithQueryClient(<TestedComponent name={appName} />);

    expect(getNextPage).not.toHaveBeenCalled();
  });

  it('should show loading spinner when fetching next page', () => {
    usePipelineRunsMock.mockReturnValue([
      pipelineRuns,
      true,
      null,
      jest.fn(),
      { isFetchingNextPage: true, hasNextPage: true },
    ]);

    renderWithQueryClient(<TestedComponent name={appName} />);

    expect(screen.getByLabelText('Loading more pipeline runs')).toBeInTheDocument();
  });

  it('should open and close column management modal', () => {
    renderWithQueryClient(<TestedComponent name={appName} />);

    fireEvent.click(screen.getByRole('button', { name: 'Manage columns' }));
    expect(screen.getByRole('dialog', { name: 'Manage pipeline run columns' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(
      screen.queryByRole('dialog', { name: 'Manage pipeline run columns' }),
    ).not.toBeInTheDocument();
  });

  it('should apply customFilter when provided', () => {
    const customFilter = jest.fn(
      (plr: PipelineRunKind) => plr.metadata.name !== 'basic-node-js-third',
    );

    renderWithQueryClient(<TestedComponent name={appName} customFilter={customFilter} />);

    expect(screen.getByText('basic-node-js-first')).toBeInTheDocument();
    expect(screen.getByText('basic-node-js-second')).toBeInTheDocument();
    expect(screen.queryByText('basic-node-js-third')).not.toBeInTheDocument();
    expect(customFilter).toHaveBeenCalled();
  });
});
