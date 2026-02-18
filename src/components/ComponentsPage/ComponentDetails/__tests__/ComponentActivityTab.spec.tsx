import { useNavigate, useParams } from 'react-router-dom';
import { screen, fireEvent, act } from '@testing-library/react';
import { pipelineWithCommits } from '~/components/Commits/__data__/pipeline-with-commits';
import { MockComponents } from '~/components/Commits/CommitDetails/visualization/__data__/MockCommitWorkflowData';
import { useComponent, useComponents } from '~/hooks/useComponents';
import { usePipelineRunsV2 } from '~/hooks/usePipelineRunsV2';
import { renderWithQueryClientAndRouter } from '~/unit-test-utils';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import { createUseApplicationMock } from '~/utils/test-utils';
import { ComponentActivityTab } from '../tabs/ComponentActivityTab';

jest.mock('~/hooks/useTektonResults');

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
  useParams: jest.fn(),
}));

jest.mock('~/components/Commits/commit-status', () => ({
  ...jest.requireActual('~/components/Commits/commit-status'),
  useCommitStatus: () => ['-', true],
}));

jest.mock('~/hooks/useComponents', () => ({
  useComponents: jest.fn(),
  useComponent: jest.fn(),
}));

jest.mock('~/hooks/usePipelineRunsV2', () => ({
  usePipelineRunsV2: jest.fn(),
}));

jest.mock('~/feature-flags/hooks', () => ({
  ...jest.requireActual('~/feature-flags/hooks'),
  useIsOnFeatureFlag: jest.fn(() => true),
  IfFeature: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

createUseApplicationMock([{ metadata: { name: 'test' } }, true]);

const useComponentsMock = useComponents as jest.Mock;
const componentMock = useComponent as jest.Mock;
const useNavigateMock = useNavigate as jest.Mock;
const useParamsMock = useParams as jest.Mock;
const usePipelineRunsV2Mock = usePipelineRunsV2 as jest.Mock;

describe('ComponentActivityTab (V2)', () => {
  let navigateMock: jest.Mock;

  mockUseNamespaceHook('test-ns');

  beforeEach(() => {
    usePipelineRunsV2Mock.mockReturnValue([
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
    renderWithQueryClientAndRouter(<ComponentActivityTab />);
    screen.getByTestId('comp__activity__tabItem commits');
    screen.getByTestId('comp__activity__tabItem pipelineruns');
  });

  it('should render two tabs under component activity', async () => {
    componentMock.mockReturnValue([MockComponents[0], true]);
    renderWithQueryClientAndRouter(<ComponentActivityTab />);
    screen.getByTestId('comp__activity__tabItem commits');
    const plrTab = screen.getByTestId('comp__activity__tabItem pipelineruns');

    await act(() => fireEvent.click(plrTab));
    // V2 route uses /ns/:workspaceName/components/:componentName/activity/:activityTab
    expect(navigateMock).toHaveBeenCalledWith(
      '/ns/test-ns/components/test-component/activity/pipelineruns',
    );
  });

  it('should display Activity section with correct title and description', () => {
    componentMock.mockReturnValue([MockComponents[0], true]);
    renderWithQueryClientAndRouter(<ComponentActivityTab />);
    expect(screen.getByText('Activity')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Monitor your commits and their pipeline progression across all components.',
      ),
    ).toBeInTheDocument();
  });

  it('should show spinner when component is loading', () => {
    componentMock.mockReturnValue([null, false, undefined]);
    renderWithQueryClientAndRouter(<ComponentActivityTab />);
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });

  it('should show error state when component fails to load', () => {
    componentMock.mockReturnValue([null, true, new Error('Failed to load')]);
    renderWithQueryClientAndRouter(<ComponentActivityTab />);
    expect(screen.getByText('Unable to load component')).toBeInTheDocument();
  });

  it('should return null when componentName is missing', () => {
    useParamsMock.mockReturnValue({ activityTab: 'latest-commits' });
    const { container } = renderWithQueryClientAndRouter(<ComponentActivityTab />);
    expect(container.firstChild).toBeNull();
  });
});
