import { screen } from '@testing-library/react';
import { ApplicationKind } from '../../../types';
import {
  createK8sWatchResourceMock,
  createUseWorkspaceInfoMock,
  renderWithQueryClient,
} from '../../../utils/test-utils';
import ApplicationListView from '../ApplicationListView';

jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({ t: (x) => x })),
}));

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useLocation: jest.fn(() => ({})),
    Link: (props) => <a href={props.to}>{props.children}</a>,
    useNavigate: jest.fn(),
  };
});

jest.mock('../../../utils/rbac', () => ({
  useAccessReviewForModel: jest.fn(() => [true, true]),
}));

const applications: ApplicationKind[] = [
  {
    kind: 'Application',
    apiVersion: 'appstudio.redhat.com/v1alpha1',
    metadata: {
      creationTimestamp: '2022-02-03T19:34:28Z',
      finalizers: Array['application.appstudio.redhat.com/finalizer'],
      name: 'mno-app',
      namespace: 'test',
      resourceVersion: '187593762',
      uid: '60725777-a545-4c54-bf25-19a3f231aed1',
    },
    spec: {
      displayName: 'mno-app',
    },
  },
  {
    kind: 'Application',
    apiVersion: 'appstudio.redhat.com/v1alpha1',
    metadata: {
      creationTimestamp: '2022-02-03T14:34:28Z',
      finalizers: Array['application.appstudio.redhat.com/finalizer'],
      name: 'mno-app1',
      namespace: 'test',
      resourceVersion: '187593762',
      uid: '60725777-a545-4c54-bf25-19a3f231aed1',
    },
    spec: {
      displayName: 'mno-app1',
    },
  },
  {
    kind: 'Application',
    apiVersion: 'appstudio.redhat.com/v1alpha1',
    metadata: {
      creationTimestamp: '2022-01-03T14:34:28Z',
      finalizers: Array['application.appstudio.redhat.com/finalizer'],
      name: 'mno-app2',
      namespace: 'test',
      resourceVersion: '187593762',
      uid: '60725777-a545-4c54-bf25-19a3f231aed1',
    },
    spec: {
      displayName: 'mno-app2',
    },
  },
  {
    kind: 'Application',
    apiVersion: 'appstudio.redhat.com/v1alpha1',
    metadata: {
      creationTimestamp: '2022-01-03T14:34:28Z',
      finalizers: Array['application.appstudio.redhat.com/finalizer'],
      name: 'xyz-app',
      namespace: 'test2',
      resourceVersion: '187593762',
      uid: '60725777-a545-4c54-bf25-19a3f231aed1',
    },
    spec: {
      displayName: 'xyz-app',
    },
  },
];

const watchResourceMock = createK8sWatchResourceMock();
createUseWorkspaceInfoMock({ namespace: 'test-ns', workspace: 'test-ws' });

const ApplicationList = ApplicationListView;

describe('Application List', () => {
  it('should render spinner if application data is not loaded', () => {
    watchResourceMock.mockReturnValue([[], false]);
    renderWithQueryClient(<ApplicationList />);
    screen.getByRole('progressbar');
  });

  it('should render empty state if no application is present', () => {
    watchResourceMock.mockReturnValue([[], true]);
    renderWithQueryClient(<ApplicationList />);
    screen.getByText('Easily onboard your applications');
    const button = screen.getByText('Create application');
    expect(button).toBeInTheDocument();
    expect(button.closest('a').href).toBe('http://localhost/workspaces/test-ws/import');
  });

  it('should render empty state with no card', () => {
    watchResourceMock.mockReturnValue([[], true]);
    renderWithQueryClient(<ApplicationList />);
    screen.getByText('Easily onboard your applications');
    expect(screen.queryByText('Create and manage your applications.')).toBeNull();
  });

  it('should render application list when application(s) is(are) present', () => {
    watchResourceMock.mockReturnValue([applications, true]);
    renderWithQueryClient(<ApplicationList />);
    screen.getByText('Create application');
    screen.getByText('Name');
    screen.getByText('Components');
    screen.getByText('Last deploy');
  });

  it('should not contain applications breadcrumb link in the list view', () => {
    watchResourceMock.mockReturnValue([applications, true]);
    renderWithQueryClient(<ApplicationList />);
    expect(screen.queryByTestId('applications-breadcrumb-link')).not.toBeInTheDocument();
  });
});
