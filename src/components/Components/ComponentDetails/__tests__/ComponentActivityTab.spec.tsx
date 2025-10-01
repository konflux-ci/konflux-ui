import { useNavigate, useParams } from 'react-router-dom';
import { screen, fireEvent, act } from '@testing-library/react';
import { useComponent, useComponents } from '../../../../hooks/useComponents';
import { usePipelineRuns } from '../../../../hooks/usePipelineRuns';
import { mockUseNamespaceHook } from '../../../../unit-test-utils/mock-namespace';
import { createUseApplicationMock, routerRenderer } from '../../../../utils/test-utils';
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

jest.mock('../../../../hooks/usePipelineRuns', () => ({
  usePipelineRuns: jest.fn(),
}));

createUseApplicationMock([{ metadata: { name: 'test' } }, true]);

const useComponentsMock = useComponents as jest.Mock;
const componentMock = useComponent as jest.Mock;
const useNavigateMock = useNavigate as jest.Mock;
const useParamsMock = useParams as jest.Mock;
const usePipelineRunsMock = usePipelineRuns as jest.Mock;

describe('ComponentActivityTab', () => {
  let navigateMock: jest.Mock;

  mockUseNamespaceHook('test-ns');

  beforeEach(() => {
    usePipelineRunsMock.mockReturnValue([
      pipelineWithCommits.slice(0, 4),
      true,
      undefined,
      undefined,
      { isFetchingNextPage: false, hasNextPage: false },
    ]);
    useComponentsMock.mockReturnValue([MockComponents, true]);

    navigateMock = jest.fn();
    useNavigateMock.mockImplementation(() => navigateMock);
    useParamsMock.mockReturnValue({
      activityTab: 'latest-commits',
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
      '/ns/test-ns/applications/my-test-output/components/test-component/activity/pipelineruns',
    );
  });
});
