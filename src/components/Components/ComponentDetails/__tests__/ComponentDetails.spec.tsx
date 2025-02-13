import { useNavigate, useParams } from 'react-router-dom';
import { screen, fireEvent, act } from '@testing-library/react';
import { useComponent } from '../../../../hooks/useComponents';
import { PACState } from '../../../../hooks/usePACState';
import { mockUseNamespaceHook } from '../../../../unit-test-utils/mock-namespace';
import {
  createK8sWatchResourceMock,
  renderWithQueryClientAndRouter,
  WithTestWorkspaceContext,
} from '../../../../utils/test-utils';
import { useModalLauncher } from '../../../modal/ModalProvider';
import { mockApplication } from '../../__data__/mock-data';
import { mockComponent } from '../__data__/mockComponentDetails';
import ComponentDetailsView from '../ComponentDetailsView';

jest.mock('../../../modal/ModalProvider', () => ({
  ...jest.requireActual('../../../modal/ModalProvider'),
  useModalLauncher: jest.fn(() => () => {}),
}));

jest.mock('../../../../utils/rbac', () => ({
  useAccessReviewForModel: jest.fn(() => [true, true]),
}));

jest.mock('../../../../hooks/useComponents', () => ({
  useComponent: jest.fn(),
  useAllComponents: jest.fn(() => [[], true, undefined]),
}));

jest.mock('../../../../hooks/usePipelineRuns', () => ({
  ...jest.requireActual('../../../../hooks/usePipelineRuns'),
  useLatestSuccessfulBuildPipelineRunForComponent: jest.fn(),
  useLatestPushBuildPipelineRunForComponent: jest.fn(),
}));

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: jest.fn(),
    useParams: jest.fn(),
  };
});

jest.mock('../../../../hooks/usePACState', () => {
  const actual = jest.requireActual('../../../../hooks/usePACState');
  return {
    ...actual,
    __esModule: true,
    default: () => PACState.pending,
  };
});

const useNavigateMock = useNavigate as jest.Mock;
const useParamsMock = useParams as jest.Mock;
const useComponentMock = useComponent as jest.Mock;
const watchResourceMock = createK8sWatchResourceMock();
const useModalLauncherMock = useModalLauncher as jest.Mock;

const ComponentDetailsViewWrapper = WithTestWorkspaceContext(<ComponentDetailsView />);

describe('ComponentDetailsView', () => {
  let navigateMock: jest.Mock;
  const showModalMock = jest.fn();

  mockUseNamespaceHook('test-ns');

  beforeEach(() => {
    useComponentMock.mockReturnValue([mockComponent, true]);
    watchResourceMock.mockReturnValue([[mockApplication], true]);

    navigateMock = jest.fn();
    useNavigateMock.mockImplementation(() => navigateMock);
    useParamsMock.mockReturnValue({
      applicationName: 'test-application',
      componentName: 'human-resources',
    });
    useModalLauncherMock.mockImplementation(() => {
      return showModalMock;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render the component details', () => {
    renderWithQueryClientAndRouter(<ComponentDetailsViewWrapper />);
    screen.queryByLabelText('human-resources');
  });

  it('should show a spinner while loading', () => {
    useComponentMock.mockReturnValue([{}, false]);
    renderWithQueryClientAndRouter(<ComponentDetailsViewWrapper />);
    screen.getByTestId('spinner');
  });

  it('should show an error state when component cannot be loaded', () => {
    useComponentMock.mockReturnValue([{}, false, { code: 404, message: 'Not found' }]);
    renderWithQueryClientAndRouter(<ComponentDetailsViewWrapper />);
    screen.getByText('404: Page not found');
  });

  it('should render two tabs under component details', async () => {
    renderWithQueryClientAndRouter(<ComponentDetailsViewWrapper />);
    screen.getByTestId('app-details__tabItem componentdetails');
    const activityTab = screen.getByTestId('app-details__tabItem activity');

    await act(() => fireEvent.click(activityTab));
    expect(navigateMock).toHaveBeenCalledWith(
      '/workspaces/test-ns/applications/test-application/components/human-resources/activity',
    );
  });
});
