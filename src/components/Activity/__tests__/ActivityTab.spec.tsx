import { useNavigate, useParams } from 'react-router-dom';
import { act, fireEvent, screen } from '@testing-library/react';
import { createK8sWatchResourceMock, routerRenderer } from '../../../utils/test-utils';
import { ACTIVITY_SECONDARY_TAB_KEY, ActivityTab } from '../ActivityTab';

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: jest.fn(),
    useParams: jest.fn(),
  };
});

jest.mock('../../../hooks/useTektonResults');
jest.mock('../../../hooks/usePipelineRuns', () => ({
  usePipelineRuns: jest.fn(() => [
    [],
    true,
    undefined,
    () => {},
    { isFetchingNextPage: false, hasNextPage: false },
  ]),
}));

const resourceMock = createK8sWatchResourceMock();

const useNavigateMock = useNavigate as jest.Mock;
const useParamsMock = useParams as jest.Mock;

describe('Activity Tab', () => {
  let navigateMock: jest.Mock;

  beforeEach(() => {
    navigateMock = jest.fn();
    useNavigateMock.mockImplementation(() => navigateMock);
    useParamsMock.mockReturnValue({ applicationName: 'test-app', workspaceName: 'test-ws' });
    resourceMock.mockReturnValue({ data: [], isLoading: false });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render Activity Tab', () => {
    routerRenderer(<ActivityTab />);
    screen.getByText('Activity by');
  });

  it('should render two tabs under activity', () => {
    routerRenderer(<ActivityTab />);
    screen.getByText('Latest commits');
    screen.getByText('Pipeline runs');

    const plrTab = screen.getByTestId('activity__tabItem pipelineruns');

    act(() => {
      fireEvent.click(plrTab);
    });
    expect(navigateMock).toHaveBeenCalledWith(
      '/ns/test-ws/applications/test-app/activity/pipelineruns',
    );
  });
  it('should display the correct tab', () => {
    useParamsMock.mockReturnValue({
      applicationName: 'test-app',
      workspaceName: 'test-ws',
      activityTab: 'pipelineruns',
    });
    let activitiesPage = routerRenderer(<ActivityTab />);
    let tabs = activitiesPage.getByTestId('activities-tabs-id');
    let activeTab = tabs.querySelector('.pf-v5-c-tabs__item.pf-m-current .pf-v5-c-tabs__item-text');
    expect(activeTab).toHaveTextContent('Pipeline runs');
    activitiesPage.unmount();

    useParamsMock.mockReturnValue({
      applicationName: 'test-app',
      workspaceName: 'test-ws',
      activityTab: 'latest-commits',
    });
    activitiesPage = routerRenderer(<ActivityTab />);
    tabs = activitiesPage.getByTestId('activities-tabs-id');
    activeTab = tabs.querySelector('.pf-v5-c-tabs__item.pf-m-current .pf-v5-c-tabs__item-text');
    expect(activeTab).toHaveTextContent('Latest commits');
    activitiesPage.unmount();
  });

  it('should read from localstorage and display the last used tab', () => {
    localStorage.setItem(ACTIVITY_SECONDARY_TAB_KEY, 'pipelineruns');

    useParamsMock.mockReturnValue({
      applicationName: 'test-app',
      workspaceName: 'test-ws',
      activityTab: null,
    });
    const activitiesPage = routerRenderer(<ActivityTab />);
    const tabs = activitiesPage.getByTestId('activities-tabs-id');
    const activeTab = tabs.querySelector(
      '.pf-v5-c-tabs__item.pf-m-current .pf-v5-c-tabs__item-text',
    );
    expect(activeTab).toHaveTextContent('Pipeline runs');
    activitiesPage.unmount();
  });

  it('should replace url if full path was not used', () => {
    localStorage.setItem(ACTIVITY_SECONDARY_TAB_KEY, 'pipelineruns');
    routerRenderer(<ActivityTab />);
    expect(navigateMock).toHaveBeenCalledWith(
      '/ns/test-ws/applications/test-app/activity/pipelineruns',
      { replace: true },
    );
  });
});
