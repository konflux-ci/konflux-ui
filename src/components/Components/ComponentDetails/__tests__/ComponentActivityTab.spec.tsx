import { useNavigate, useParams } from 'react-router-dom';
import { screen, fireEvent, act, configure } from '@testing-library/react';
import { useComponent, useComponents } from '../../../../hooks/useComponents';
import {
  createK8sWatchResourceMock,
  createUseWorkspaceInfoMock,
  routerRenderer,
} from '../../../../utils/test-utils';
import { pipelineWithCommits } from '../../../Commits/__data__/pipeline-with-commits';
import { MockComponents } from '../../../Commits/CommitDetails/visualization/__data__/MockCommitWorkflowData';
import { ComponentActivityTab } from '../tabs/ComponentActivityTab';

jest.mock('../../../../hooks/useTektonResults');

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
  useParams: jest.fn(),
}));

jest.mock('../../../Commits/commit-status', () => ({
  useCommitStatus: () => ['-', true],
}));

jest.mock('../../../../hooks/useComponents', () => ({
  useComponents: jest.fn(),
  useComponent: jest.fn(),
}));

const watchResourceMock = createK8sWatchResourceMock();
const useComponentsMock = useComponents as jest.Mock;
const componentMock = useComponent as jest.Mock;
const useNavigateMock = useNavigate as jest.Mock;
const useParamsMock = useParams as jest.Mock;

configure({ testIdAttribute: 'data-testid' });

describe('ComponentActivityTab', () => {
  let navigateMock: jest.Mock;

  createUseWorkspaceInfoMock({ namespace: 'test-ns', workspace: 'test-ws' });

  beforeEach(() => {
    watchResourceMock.mockReturnValue([pipelineWithCommits.slice(0, 4), true]);
    useComponentsMock.mockReturnValue([MockComponents, true]);

    navigateMock = jest.fn();
    useNavigateMock.mockImplementation(() => navigateMock);
    useParamsMock.mockReturnValue({
      activityTab: 'latest-commits',
      workspaceName: 'test-ws',
      componentName: 'test-component',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render the component activity', () => {
    componentMock.mockReturnValue([MockComponents[0], true]);
    routerRenderer(<ComponentActivityTab />);
    screen.getByTestId('comp__activity__tabItem commits');
    screen.getByTestId('comp__activity__tabItem pipelineruns');
  });

  it('should render two tabs under component activity', async () => {
    componentMock.mockReturnValue([MockComponents[0], true]);
    routerRenderer(<ComponentActivityTab />);
    screen.getByTestId('comp__activity__tabItem commits');
    const plrTab = screen.getByTestId('comp__activity__tabItem pipelineruns');

    await act(() => fireEvent.click(plrTab));
    expect(navigateMock).toHaveBeenCalledWith(
      '/workspaces/test-ws/applications/my-test-output/components/test-component/activity/pipelineruns',
    );
  });
});
