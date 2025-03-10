import { useParams } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { PipelineRunLabel } from '../../../../../consts/pipelinerun';
import { usePipelineRunsForCommit } from '../../../../../hooks/usePipelineRuns';
import { mockUseNamespaceHook } from '../../../../../unit-test-utils/mock-namespace';
import { createK8sWatchResourceMock } from '../../../../../utils/test-utils';
import { PipelineRunListRow } from '../../../../PipelineRun/PipelineRunListView/PipelineRunListRow';
import { pipelineWithCommits } from '../../../__data__/pipeline-with-commits';
import CommitsPipelineRunTab from '../CommitsPipelineRunTab';

const useNamespaceMock = mockUseNamespaceHook('test-ns');

jest.mock('../../../../../shared/components/table/VirtualBody', () => {
  return {
    VirtualBody: (props) => {
      return props.data.map((plr, i) => (
        <PipelineRunListRow key={i} columns={props.columns} obj={plr} />
      ));
    },
  };
});

jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({ t: (x) => x })),
}));

jest.mock('react-router-dom', () => ({
  Link: (props) => <a href={props.to}>{props.children}</a>,
  useNavigate: jest.fn(),
  useParams: jest.fn(),
}));
jest.mock('../../../../../hooks/useTektonResults');
jest.mock('../../../../../hooks/usePipelineRuns', () => ({
  usePipelineRunsForCommit: jest.fn(),
}));

jest.mock('../../../../../utils/rbac', () => ({
  useAccessReviewForModel: jest.fn(() => [true, true]),
}));

jest.mock('../../../../../hooks/useComponents', () => ({
  useComponents: jest.fn(),
  useComponent: jest.fn().mockReturnValue([{ metadata: { name: { test } } }, true]),
}));

const appName = 'my-test-app';

const watchResourceMock = createK8sWatchResourceMock();
const usePipelineRunsForCommitMock = usePipelineRunsForCommit as jest.Mock;
const useParamsMock = useParams as jest.Mock;

const commitPlrs = [
  pipelineWithCommits[0],
  {
    ...pipelineWithCommits[1],
    metadata: {
      ...pipelineWithCommits[1].metadata,
      labels: {
        ...pipelineWithCommits[1].metadata.labels,
        [PipelineRunLabel.PIPELINE_TYPE]: 'test',
      },
    },
  },
];

describe('Commit Pipelinerun List', () => {
  mockUseNamespaceHook('test-ns');
  beforeEach(() => {
    useParamsMock.mockReturnValue({ applicationName: appName, commitName: 'test-sha-1' });
    jest.clearAllMocks();
    useNamespaceMock.mockReturnValue('test-ns');
  });
  it('should render error state if the API errors out', () => {
    usePipelineRunsForCommitMock.mockReturnValue([
      [],
      true,
      new Error('500: Internal server error'),
      () => {},
      { isFetchingNextPage: false, hasNextPage: false },
    ]);

    render(<CommitsPipelineRunTab />);

    screen.getByText('Unable to load pipeline runs');
  });

  it('should render empty state if no pipelinerun is present', () => {
    usePipelineRunsForCommitMock.mockReturnValue([
      [],
      true,
      undefined,
      () => {},
      { isFetchingNextPage: false, hasNextPage: false },
    ]);
    watchResourceMock.mockReturnValue([[], true]);
    render(<CommitsPipelineRunTab />);
    screen.getByText(/Keep tabs on components and activity/);
    screen.getByText(/Monitor your components with pipelines and oversee CI\/CD activity./);
    const button = screen.getByText('Add component');
    expect(button).toBeInTheDocument();
    expect(button.closest('a').href).toContain(
      `http://localhost/workspaces/test-ns/import?application=my-test-app`,
    );
  });

  it('should render pipelineRuns list when pipelineRuns are present', () => {
    usePipelineRunsForCommitMock.mockReturnValue([
      commitPlrs,
      true,
      undefined,
      () => {},
      { isFetchingNextPage: false, hasNextPage: false },
    ]);
    render(<CommitsPipelineRunTab />);
    screen.getByText(/Pipeline runs/);
    screen.getByText('Name');
    screen.getByText('Started');
    screen.getByText('Duration');
    screen.getByText('Status');
    screen.getByText('Type');
  });

  it('should render both Build and Test pipelineruns in the pipelinerun list', () => {
    render(
      <div style={{ overflow: 'auto' }}>
        <CommitsPipelineRunTab />
      </div>,
    );

    screen.getByText('Build');
    screen.getByText('Test');
  });
});
