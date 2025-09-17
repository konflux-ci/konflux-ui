import * as React from 'react';
import { Table as PfTable, TableHeader } from '@patternfly/react-table/deprecated';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { FilterContextProvider } from '~/components/Filter/generic/FilterContext';
import { useSearchParamBatch } from '~/hooks/useSearchParam';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import { mockUseSearchParamBatch } from '~/unit-test-utils/mock-useSearchParam';
import { PipelineRunLabel, PipelineRunType } from '../../../../consts/pipelinerun';
import { useComponents } from '../../../../hooks/useComponents';
import { usePipelineRuns } from '../../../../hooks/usePipelineRuns';
import { PipelineRunKind, PipelineRunStatus } from '../../../../types';
import { createUseApplicationMock } from '../../../../utils/test-utils';
import { mockComponentsData } from '../../../ApplicationDetails/__data__';
import { PipelineRunListRow } from '../PipelineRunListRow';
import PipelineRunsListView from '../PipelineRunsListView';

jest.useFakeTimers();
const useNamespaceMock = mockUseNamespaceHook('test-ns');

jest.mock('~/hooks/useSnapshots', () => ({
  useSnapshot: jest.fn(() => [{ metadata: { name: 'snap' } }, false, null]),
}));

jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({ t: (x) => x })),
}));

jest.mock('../../../../hooks/usePipelineRuns', () => ({
  usePipelineRuns: jest.fn(),
}));

createUseApplicationMock([{ metadata: { name: 'test' } }, true]);

jest.mock('../../../../hooks/useScanResults', () => ({
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

jest.mock('../../../../shared/components/table/TableComponent', () => {
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

jest.mock('../../../../utils/rbac', () => ({
  useAccessReviewForModel: jest.fn(() => [true, true]),
}));

const useComponentsMock = useComponents as jest.Mock;
const useSearchParamBatchMock = useSearchParamBatch as jest.Mock;

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

const usePipelineRunsMock = usePipelineRuns as jest.Mock;

const TestedComponent = ({ name }) => (
  <FilterContextProvider filterParams={['name', 'status', 'type']}>
    <PipelineRunsListView applicationName={name} />
  </FilterContextProvider>
);

describe('Pipeline run List', () => {
  mockUseNamespaceHook('test-ns');

  beforeEach(() => {
    useSearchParamBatchMock.mockImplementation(() => mockUseSearchParamBatch());
    useComponentsMock.mockReturnValue([mockComponentsData, true]);
    useNamespaceMock.mockReturnValue('test-ns');
  });

  it('should render spinner if application data is not loaded', () => {
    usePipelineRunsMock.mockReturnValue([
      [],
      false,
      null,
      () => {},
      { isFetchingNextPage: false, hasNextPage: false },
    ]);
    render(<TestedComponent name={appName} />);
    screen.getByTestId('data-table-skeleton');
  });

  it('should render empty state if no application is present', () => {
    usePipelineRunsMock.mockReturnValue([
      [],
      true,
      null,
      () => {},
      { isFetchingNextPage: false, hasNextPage: false },
    ]);
    render(<TestedComponent name={appName} />);
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
      () => {},
      { isFetchingNextPage: false, hasNextPage: false },
    ]);
    render(<TestedComponent name="purple-mermaid-app" />);
    screen.getByText('Unable to load pipeline runs');
  });

  it('should render correct columns when pipelineRuns are present', () => {
    usePipelineRunsMock.mockReturnValue([
      pipelineRuns,
      true,
      null,
      () => {},
      { isFetchingNextPage: false, hasNextPage: false },
    ]);
    render(<TestedComponent name={appName} />);
    screen.queryByText('Name');
    screen.queryByText('Started');
    screen.queryByText('Duration');
    screen.queryAllByText('Status');
    screen.queryAllByText('Type');
    screen.queryByText('Component');
    screen.queryByText('Triggered By');
  });

  it('should render entire pipelineRuns list when no filter value', () => {
    render(<TestedComponent name={appName} />);
    expect(screen.queryByText('basic-node-js-first')).toBeInTheDocument();
    expect(screen.queryByText('basic-node-js-second')).toBeInTheDocument();
    expect(screen.queryByText('basic-node-js-third')).toBeInTheDocument();
    const filter = screen.getByPlaceholderText<HTMLInputElement>('Filter by name...');
    expect(filter.value).toBe('');
  });

  it('should render filtered pipelinerun list by name', async () => {
    const r = render(<TestedComponent name={appName} />);

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

    // clean up for other tests
    fireEvent.change(filter, {
      target: { value: '' },
    });
    expect(filter.value).toBe('');

    act(() => {
      jest.advanceTimersByTime(700);
    });
  });

  it('should render filtered pipelinerun list by status', async () => {
    const r = render(<TestedComponent name={appName} />);

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

    // clean up for other tests
    expect(statusFilter).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(succeededOption);
    r.rerender(<TestedComponent name={appName} />);
    expect(succeededOption).not.toBeChecked();
  });

  it('should render filtered pipelinerun list by type', async () => {
    const r = render(<TestedComponent name={appName} />);

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

    // clean up for other tests
    expect(typeFilter).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(testOption);
    r.rerender(<TestedComponent name={appName} />);
    expect(testOption).not.toBeChecked();
  });

  it('should clear the filters and render the list again in the table', async () => {
    const r = render(<TestedComponent name={appName} />);

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
});
