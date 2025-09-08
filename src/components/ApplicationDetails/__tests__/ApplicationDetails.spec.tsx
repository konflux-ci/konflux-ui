import * as React from 'react';
import { useParams } from 'react-router-dom';
import { screen } from '@testing-library/react';
import { useApplication, useApplications } from '../../../hooks/useApplications';
import { ComponentGroupVersionKind, PipelineRunGroupVersionKind } from '../../../models';
import { WatchK8sResource } from '../../../types/k8s';
import {
  createK8sWatchResourceMock,
  renderWithQueryClientAndRouter,
} from '../../../utils/test-utils';
import { componentCRMocks } from '../../Components/__data__/mock-data';
import { mockPipelineRuns } from '../../Components/__data__/mock-pipeline-run';
import { mockApplication } from '../__data__/mock-data';
import { getMockWorkflows } from '../__data__/WorkflowTestUtils';
import { ApplicationDetails } from '../ApplicationDetails';

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    Link: (props) => (
      <a href={props.to} data-test={props['data-test']}>
        {props.children}
      </a>
    ),
    useNavigate: () => jest.fn(),
    useSearchParams: () => React.useState(() => new URLSearchParams()),
    useParams: jest.fn(),
  };
});
jest.mock('../../../hooks/useApplications', () => ({
  useApplication: jest.fn(),
  useApplications: jest.fn(),
}));

jest.mock('../../../utils/rbac', () => ({
  useAccessReviewForModel: jest.fn(() => [true, true]),
}));

const useParamsMock = useParams as jest.Mock;
const useApplicationMock = useApplication as jest.Mock;
const useApplicationsMock = useApplications as jest.Mock;

const watchResourceMock = createK8sWatchResourceMock();

const { workflowMocks, applyWorkflowMocks } = getMockWorkflows();

const getMockedResources = (kind: WatchK8sResource) => {
  if (kind?.groupVersionKind === ComponentGroupVersionKind) {
    return [componentCRMocks, true];
  }
  if (kind?.groupVersionKind === PipelineRunGroupVersionKind) {
    return [mockPipelineRuns, true];
  }
  return [[], true];
};

describe('ApplicationDetails', () => {
  beforeEach(() => {
    useParamsMock.mockReturnValue({ applicationName: 'test' });
    useApplicationsMock.mockReturnValue([[mockApplication], true]);
    useApplicationMock.mockReturnValue([mockApplication, true]);

    applyWorkflowMocks(workflowMocks);

    watchResourceMock.mockImplementation(getMockedResources);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window.SVGElement as any).prototype.getBBox = () => ({
      x: 100,
      y: 100,
    });
  });
  afterEach(() => {
    jest.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window.SVGElement as any).prototype.getBBox = undefined;
  });
  it('should render spinner if application data is not loaded', () => {
    useApplicationMock.mockReturnValue([[], false]);
    renderWithQueryClientAndRouter(<ApplicationDetails />);
    expect(screen.queryByTestId('spinner')).toBeInTheDocument();
  });

  it('should render the error state if the application is not found', () => {
    useApplicationMock.mockReturnValue([[], true, { code: 404 }]);
    renderWithQueryClientAndRouter(<ApplicationDetails />);
    screen.getByText('404: Page not found');
    screen.getByText('Go to applications list');
  });

  it('should render application display name if application data is loaded', () => {
    watchResourceMock.mockReturnValueOnce([mockApplication, true]);
    renderWithQueryClientAndRouter(<ApplicationDetails />);
    expect(screen.queryByTestId('details__title')).toBeInTheDocument();
    expect(screen.queryByTestId('details__title').innerHTML).toBe('Test Application');
  });

  it('should display the overview tab by default', () => {
    renderWithQueryClientAndRouter(<ApplicationDetails />);
    const appDetails = screen.getByTestId('details');
    const activeTab = appDetails.querySelector(
      '.pf-v5-c-tabs__item.pf-m-current .pf-v5-c-tabs__item-text',
    );
    expect(activeTab).toHaveTextContent('Overview');
  });

  it('should contain applications breadcrumb link in the list view', () => {
    watchResourceMock.mockReturnValueOnce([mockApplication, true]);
    renderWithQueryClientAndRouter(<ApplicationDetails />);
    expect(screen.queryByTestId('applications-breadcrumb-link')).toBeInTheDocument();
  });
});
