import { render } from '@testing-library/react';
import { ApplicationKind, ComponentKind } from '../../../types';
import { createK8sWatchResourceMock } from '../../../utils/test-utils';
import ApplicationListRow from '../ApplicationListRow';

jest.mock('react-router-dom', () => ({
  Link: (props) => <a href={props.to}>{props.children}</a>,
}));

jest.mock('../../../utils/rbac', () => ({
  useAccessReviewForModel: jest.fn(() => [true, true]),
}));

const application: ApplicationKind = {
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
    displayName: 'mno app display name',
  },
};

const components: ComponentKind[] = [
  {
    kind: 'Component',
    apiVersion: 'appstudio.redhat.com/v1alpha1',
    metadata: {
      creationTimestamp: '2022-02-03T19:34:28Z',
      finalizers: Array['application.appstudio.redhat.com/finalizer'],
      name: 'component1',
      namespace: 'test',
      resourceVersion: '187593762',
      uid: '60725777-a545-4c54-bf25-19a3f231aed1',
    },
    spec: {
      application: 'mno-app',
      componentName: 'component1',
      source: null,
    },
  },
  {
    kind: 'Component',
    apiVersion: 'appstudio.redhat.com/v1alpha1',
    metadata: {
      creationTimestamp: '2022-02-03T19:34:28Z',
      finalizers: Array['application.appstudio.redhat.com/finalizer'],
      name: 'component2',
      namespace: 'test',
      resourceVersion: '187593762',
      uid: '60725777-a545-4c54-bf25-19a3f231aed1',
    },
    spec: {
      application: 'mno-app',
      componentName: 'component2',
      source: null,
    },
  },
];

const watchResourceMock = createK8sWatchResourceMock();

describe('Application List Row', () => {
  it('renders application list row', () => {
    watchResourceMock.mockReturnValue([components, true]);
    const { getByText } = render(<ApplicationListRow columns={null} obj={application} />);
    expect(getByText(application.spec.displayName)).toBeInTheDocument();
    expect(getByText('2 Components')).toBeInTheDocument();
  });

  it('renders 0 components in the component column if the application has none available', () => {
    watchResourceMock.mockReturnValue([[], true]);
    const { getByText } = render(<ApplicationListRow columns={null} obj={application} />);
    expect(getByText('0 Components')).toBeInTheDocument();
  });

  it('renders skeleton in the component column if the components are not loaded', () => {
    watchResourceMock.mockReturnValue([[], false]);
    const { getByText } = render(<ApplicationListRow columns={null} obj={application} />);
    expect(getByText('Loading component count')).toBeInTheDocument();
  });

  it('renders error message in the component column if the components are not loaded', () => {
    watchResourceMock.mockReturnValue([undefined, true, Error()]);
    const { getByText } = render(<ApplicationListRow columns={null} obj={application} />);
    expect(getByText('Failed to load components')).toBeInTheDocument();
  });

  it('should render metadata name if there is no display name', () => {
    watchResourceMock.mockReturnValue([[], false]);
    const { getByRole } = render(
      <ApplicationListRow
        columns={null}
        obj={{ ...application, spec: { ...application.spec, displayName: '' } }}
      />,
    );
    expect(getByRole('link', { name: application.metadata.name })).toBeInTheDocument();
  });
});
