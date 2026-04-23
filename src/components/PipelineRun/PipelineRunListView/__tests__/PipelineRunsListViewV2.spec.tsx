import * as React from 'react';
import { Table as PfTable, TableHeader } from '@patternfly/react-table/deprecated';
import { screen, waitFor } from '@testing-library/react';
import { FilterContext, FilterContextProvider } from '~/components/Filter/generic/FilterContext';
import { PipelineRunLabel, PipelineRunType } from '~/consts/pipelinerun';
import { useComponent } from '~/hooks/useComponents';
import { usePipelineRunsV2 } from '~/hooks/usePipelineRunsV2';
import { PipelineRunKind, PipelineRunStatus } from '~/types';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import { renderWithQueryClient } from '~/unit-test-utils/mock-react-query';
import { mockUseSearchParamBatch } from '~/unit-test-utils/mock-useSearchParam';
import { PipelineRunListRow } from '../PipelineRunListRow';
import PipelineRunsListViewV2 from '../PipelineRunsListViewV2';

jest.useFakeTimers();
const useNamespaceMock = mockUseNamespaceHook('test-ns');

jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({ t: (x) => x })),
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

jest.mock('~/hooks/useSearchParam', () => ({
  useSearchParamBatch: () => mockUseSearchParamBatch(),
}));

jest.mock('~/shared/components/table/TableComponent', () => {
  return (props) => {
    const { data, filters, selected, match, kindObj } = props;
    const cProps = { data, filters, selected, match, kindObj };
    const columns = props.Header(cProps);

    React.useEffect(() => {
      props?.onRowsRendered?.({ stopIndex: data.length - 1 });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data]);
    return (
      <PfTable role="table" aria-label="table" cells={columns} variant="compact" borders={false}>
        <TableHeader role="rowgroup" />
        <tbody>
          {props.data.map((d, i) => (
            <tr key={i}>
              <PipelineRunListRow columns={null} obj={d} />
            </tr>
          ))}
        </tbody>
      </PfTable>
    );
  };
});

jest.mock('~/utils/rbac', () => ({
  useAccessReviewForModel: jest.fn(() => [true, true]),
}));

jest.mock('~/hooks/useComponents', () => ({
  useComponent: jest.fn(),
}));

jest.mock('~/hooks/usePipelineRunsV2', () => ({
  usePipelineRunsV2: jest.fn(),
}));

jest.mock('~/hooks/useSnapshots', () => ({
  useSnapshot: jest.fn(() => [{ metadata: { name: 'snap' } }, false, null]),
}));

jest.mock('~/hooks/useScanResults', () => ({
  useKarchScanResults: jest.fn(() => [
    [],
    true,
    undefined,
    () => {},
    { isFetchingNextPage: false, hasNextPage: false },
  ]),
  usePLRVulnerabilities: jest.fn(() => ({ vulnerabilities: {}, fetchedPipelineRuns: [] })),
}));

const useComponentMock = useComponent as jest.Mock;
const usePipelineRunsV2Mock = usePipelineRunsV2 as jest.Mock;

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
        'appstudio.openshift.io/component': 'sample-component',
        [PipelineRunLabel.PIPELINE_TYPE]: PipelineRunType.BUILD as string,
      },
      annotations: {
        [PipelineRunLabel.COMMIT_PROVIDER_LABEL]: 'github',
      },
    },
    spec: {
      key: 'key2',
    },
  },
];

const mockComponentData = {
  metadata: {
    name: 'sample-component',
    creationTimestamp: '2022-01-01T00:00:00Z',
  },
  spec: {
    source: {
      versions: [
        { name: 'v1.0', revision: 'main' },
        { name: 'v2.0', revision: 'release-2.0' },
      ],
    },
  },
};

const TestedComponentV2 = ({ versionName }: { versionName?: string }) => (
  <FilterContextProvider filterParams={['name', 'status', 'type', 'version']}>
    <PipelineRunsListViewV2 componentName="sample-component" versionName={versionName} />
  </FilterContextProvider>
);

describe('PipelineRunsListViewV2', () => {
  mockUseNamespaceHook('test-ns');

  beforeEach(() => {
    useNamespaceMock.mockReturnValue('test-ns');
    useComponentMock.mockReturnValue([mockComponentData, true, undefined]);
    usePipelineRunsV2Mock.mockReturnValue([
      pipelineRuns,
      true,
      null,
      () => {},
      { isFetchingNextPage: false, hasNextPage: false },
    ]);
  });

  it('should render error state when there is an API error', () => {
    usePipelineRunsV2Mock.mockReturnValue([
      [],
      true,
      new Error('500: Internal server error'),
      () => {},
      { isFetchingNextPage: false, hasNextPage: false },
    ]);
    renderWithQueryClient(<TestedComponentV2 />);
    screen.getByText('Unable to load pipeline runs');
  });

  it('should render empty state if no pipeline runs are present', () => {
    usePipelineRunsV2Mock.mockReturnValue([
      [],
      true,
      null,
      () => {},
      { isFetchingNextPage: false, hasNextPage: false },
    ]);
    renderWithQueryClient(<TestedComponentV2 />);
    expect(screen.getByText('Keep tabs on components and activity')).toBeVisible();
  });

  it('should render pipeline run rows when data is available', async () => {
    renderWithQueryClient(<TestedComponentV2 />);
    await waitFor(() => {
      expect(screen.queryByText('basic-node-js-first')).toBeInTheDocument();
      expect(screen.queryByText('basic-node-js-second')).toBeInTheDocument();
    });
  });

  it('should not render Name/Version search type dropdown when not scoped to a version', () => {
    renderWithQueryClient(<TestedComponentV2 />);
    expect(screen.queryByRole('button', { name: 'Name' })).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'name filter' })).toBeVisible();
  });

  it('should render Name/Version search type dropdown when scoped to a component version', () => {
    renderWithQueryClient(<TestedComponentV2 versionName="main" />);
    expect(screen.getByRole('button', { name: 'Name' })).toBeVisible();
    expect(screen.getByPlaceholderText('Filter by name...')).toBeVisible();
  });

  it('should show loading spinner when fetching next page', () => {
    usePipelineRunsV2Mock.mockReturnValue([
      pipelineRuns,
      true,
      null,
      () => {},
      { isFetchingNextPage: true, hasNextPage: true },
    ]);
    renderWithQueryClient(<TestedComponentV2 />);
    expect(screen.getByLabelText('Loading more pipeline runs')).toBeInTheDocument();
  });

  it('should call usePipelineRunsV2 with correct selector including component label', () => {
    renderWithQueryClient(<TestedComponentV2 />);
    expect(usePipelineRunsV2Mock).toHaveBeenCalledWith(
      'test-ns',
      expect.objectContaining({
        selector: expect.objectContaining({
          matchLabels: expect.objectContaining({
            'appstudio.openshift.io/component': 'sample-component',
          }),
        }),
      }),
    );
  });

  it('should query pipeline runs by component label only when versionName is provided', () => {
    renderWithQueryClient(<TestedComponentV2 versionName="main" />);
    expect(usePipelineRunsV2Mock).toHaveBeenCalledWith(
      'test-ns',
      expect.objectContaining({
        selector: expect.objectContaining({
          matchLabels: {
            'appstudio.openshift.io/component': 'sample-component',
          },
        }),
      }),
    );
  });

  it('should render skeleton while data is not loaded', () => {
    usePipelineRunsV2Mock.mockReturnValue([
      [],
      false,
      null,
      () => {},
      { isFetchingNextPage: false, hasNextPage: false },
    ]);
    renderWithQueryClient(<TestedComponentV2 />);
    screen.getByTestId('data-table-skeleton');
  });

  it('should ignore stale version filter on fixed-version pages', async () => {
    renderWithQueryClient(
      <FilterContext.Provider
        value={{
          filters: { name: '', status: [], type: [], version: 'stale-branch' },
          setFilters: jest.fn(),
          onClearFilters: jest.fn(),
        }}
      >
        <PipelineRunsListViewV2 componentName="sample-component" versionName="main" />
      </FilterContext.Provider>,
    );
    await waitFor(() => {
      expect(screen.queryByText('basic-node-js-first')).toBeInTheDocument();
      expect(screen.queryByText('basic-node-js-second')).toBeInTheDocument();
    });
  });
});
