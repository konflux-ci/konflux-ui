import * as React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CONFORMA_TASK, ENTERPRISE_CONTRACT_LABEL } from '~/consts/security';
import { usePipelineRunV2 } from '~/hooks/usePipelineRunsV2';
import { useTaskRunV2 } from '~/hooks/useTaskRunsV2';
import { TektonResourceLabel } from '~/types';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import { downloadYaml } from '~/utils/common-utils';
import { renderWithQueryClientAndRouter } from '~/utils/test-utils';
import { testTaskRuns } from '../../TaskRunListView/__data__/mock-TaskRun-data';
import { TaskRunDetailsView } from '../TaskRunDetailsView';

jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({ t: (x) => x })),
}));

const navigateMock = jest.fn();
const mockTaskRun = testTaskRuns[0];

const useParamsMock = jest.fn().mockReturnValue({ taskRunName: mockTaskRun.metadata.name });

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    Link: (props) => <a href={props.to}>{props.children}</a>,
    useNavigate: () => navigateMock,
    useParams: () => useParamsMock(),
    useSearchParams: () => React.useState(() => new URLSearchParams()),
  };
});

jest.mock('~/hooks/usePipelineRunsV2', () => ({
  usePipelineRunV2: jest.fn(),
}));

jest.mock('~/hooks/useTaskRunsV2', () => ({
  useTaskRunV2: jest.fn(),
}));

jest.mock('~/utils/common-utils', () => {
  const actual = jest.requireActual('~/utils/common-utils');
  const mockDownloadYaml = jest.fn();
  return {
    ...actual,
    downloadYaml: mockDownloadYaml,
    downloadYamlAction: (obj: { kind?: string }) => ({
      cta: () => mockDownloadYaml(obj),
      id: `download-${(obj.kind ?? 'resource').toLowerCase()}-yaml`,
      label: 'Download YAML',
    }),
  };
});

const useTaskRunMock = useTaskRunV2 as jest.Mock;
const usePipelineRunV2Mock = usePipelineRunV2 as jest.Mock;
const downloadYamlMock = downloadYaml as jest.Mock;

describe('TaskRunDetailsView', () => {
  mockUseNamespaceHook('test-ns');

  beforeEach(() => {
    usePipelineRunV2Mock.mockReturnValue([undefined, false]);
  });

  it('should render spinner if taskrun data is not loaded', () => {
    useTaskRunMock.mockReturnValue([null, false]);
    renderWithQueryClientAndRouter(<TaskRunDetailsView />);
    screen.getByRole('progressbar');
  });

  it('should render the error state if the taskrun is not found', () => {
    useTaskRunMock.mockReturnValue([null, true, { code: 404 }]);
    renderWithQueryClientAndRouter(<TaskRunDetailsView />);
    screen.getByText('404: Page not found');
    screen.getByText('Go to applications list');
  });

  it('should render the actions button and download YAML when clicked', async () => {
    const user = userEvent.setup();
    useTaskRunMock.mockReturnValue([mockTaskRun, true]);
    renderWithQueryClientAndRouter(<TaskRunDetailsView />);

    const actionsButton = screen.getByRole('button', { name: /Actions/i });
    await user.click(actionsButton);

    expect(screen.getByText('Download YAML')).toBeInTheDocument();

    // Test the download action
    const downloadMenuItem = screen.getByText('Download YAML');
    await user.click(downloadMenuItem);

    expect(downloadYamlMock).toHaveBeenCalledWith(mockTaskRun);
  });

  it('should render the security tab when it is a enterprise contract task run', () => {
    const mockECTaskRun = {
      ...mockTaskRun,
      metadata: {
        ...mockTaskRun.metadata,
        labels: {
          ...mockTaskRun.metadata.labels,
          [ENTERPRISE_CONTRACT_LABEL]: 'enterprise-contract',
        },
      },
    };

    useTaskRunMock.mockReturnValue([mockECTaskRun, true, undefined]);

    renderWithQueryClientAndRouter(<TaskRunDetailsView />);
    expect(screen.getByRole('tab', { name: /security/i })).toBeInTheDocument();
  });

  it('should render the security tab when it is a conforma task run', () => {
    const mockConformaTaskRun = {
      ...mockTaskRun,
      metadata: {
        ...mockTaskRun.metadata,
        labels: {
          ...mockTaskRun.metadata.labels,
          [TektonResourceLabel.pipelineTask]: CONFORMA_TASK,
        },
      },
    };

    useTaskRunMock.mockReturnValue([mockConformaTaskRun, true, undefined]);

    renderWithQueryClientAndRouter(<TaskRunDetailsView />);
    expect(screen.getByRole('tab', { name: /security/i })).toBeInTheDocument();
  });

  it('should show displayName from childReferences when available', () => {
    useTaskRunMock.mockReturnValue([mockTaskRun, true]);
    usePipelineRunV2Mock.mockReturnValue([
      {
        status: {
          childReferences: [
            {
              name: mockTaskRun.metadata.name,
              pipelineTaskName: 'example-task',
              displayName: 'Build for linux/amd64',
            },
          ],
        },
      },
      true,
    ]);

    renderWithQueryClientAndRouter(<TaskRunDetailsView />);
    const titleSpan = document.querySelector('.pf-v5-u-mr-sm');
    expect(titleSpan).not.toBeNull();
    expect(titleSpan.textContent).toContain('(Build for linux/amd64)');
  });

  it('should not show displayName parentheses when childReferences has no displayName', () => {
    useTaskRunMock.mockReturnValue([mockTaskRun, true]);
    usePipelineRunV2Mock.mockReturnValue([
      {
        status: {
          childReferences: [
            {
              name: mockTaskRun.metadata.name,
              pipelineTaskName: 'example-task',
            },
          ],
        },
      },
      true,
    ]);

    renderWithQueryClientAndRouter(<TaskRunDetailsView />);
    const titleSpan = document.querySelector('.pf-v5-u-mr-sm');
    expect(titleSpan).not.toBeNull();
    expect(titleSpan.textContent).not.toContain('(');
  });
});
