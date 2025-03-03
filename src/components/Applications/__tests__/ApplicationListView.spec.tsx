import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Table as PfTable, TableHeader } from '@patternfly/react-table/deprecated';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { ApplicationKind } from '../../../types';
import { mockUseNamespaceHook } from '../../../unit-test-utils/mock-namespace';
import { createK8sWatchResourceMock, renderWithQueryClient } from '../../../utils/test-utils';
import ApplicationListRow from '../ApplicationListRow';
import ApplicationListView from '../ApplicationListView';

jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({ t: (x) => x })),
}));

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useLocation: jest.fn(() => ({})),
    useSearchParams: jest.fn(),
    Link: (props) => <a href={props.to}>{props.children}</a>,
    useNavigate: jest.fn(),
  };
});

jest.mock('../../../utils/rbac', () => ({
  useAccessReviewForModel: jest.fn(() => [true, true]),
}));

jest.mock('../../../shared/components/table', () => {
  const actual = jest.requireActual('../../../shared/components/table');
  return {
    ...actual,
    Table: (props) => {
      const { data, filters, selected, match, kindObj } = props;
      const cProps = { data, filters, selected, match, kindObj };
      const columns = props.Header(cProps);
      return (
        <PfTable role="table" aria-label="table" cells={columns} variant="compact" borders={false}>
          <TableHeader role="rowgroup" />
          <tbody>
            {props.data.map((d, i) => (
              <tr key={i}>
                <ApplicationListRow columns={null} obj={d} />
              </tr>
            ))}
          </tbody>
        </PfTable>
      );
    },
  };
});

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

const useSearchParamsMock = useSearchParams as jest.Mock;
const watchResourceMock = createK8sWatchResourceMock();

const ApplicationList = ApplicationListView;

describe('Application List', () => {
  mockUseNamespaceHook('test-ns');

  beforeEach(() => {
    useSearchParamsMock.mockImplementation(() => React.useState(new URLSearchParams()));
  });

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
    expect(button.closest('a').href).toBe('http://localhost/workspaces/test-ns/import');
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

  it('should apply query params to the filter', async () => {
    watchResourceMock.mockReturnValue([applications, true]);
    useSearchParamsMock.mockImplementation(() =>
      React.useState(new URLSearchParams('name=xyz-app')),
    );
    renderWithQueryClient(<ApplicationList />);
    await waitFor(() => {
      expect(screen.queryByText('mno-app')).not.toBeInTheDocument();
      expect(screen.queryByText('mno-app1')).not.toBeInTheDocument();
      expect(screen.queryByText('mno-app2')).not.toBeInTheDocument();
      expect(screen.queryByText('xyz-app')).toBeInTheDocument();
    });
  });

  it('should filter applications by name', async () => {
    watchResourceMock.mockReturnValue([applications, true]);
    const { rerender } = renderWithQueryClient(<ApplicationList />);
    await waitFor(() => {
      expect(screen.queryByText('mno-app')).toBeInTheDocument();
      expect(screen.queryByText('mno-app1')).toBeInTheDocument();
      expect(screen.queryByText('mno-app2')).toBeInTheDocument();
      expect(screen.queryByText('xyz-app')).toBeInTheDocument();
    });

    const filter = screen.getByPlaceholderText('Filter by name...');
    fireEvent.change(filter, { target: { value: 'xyz-app' } });
    rerender(<ApplicationList />);
    await waitFor(() => {
      expect(screen.queryByText('mno-app')).not.toBeInTheDocument();
      expect(screen.queryByText('mno-app1')).not.toBeInTheDocument();
      expect(screen.queryByText('mno-app2')).not.toBeInTheDocument();
      expect(screen.queryByText('xyz-app')).toBeInTheDocument();
    });
  });

  it('should use fallback filter value of metadata.name', async () => {
    const alteredApplications = applications.map((app) => ({
      ...app,
      spec: { displayName: undefined },
    }));
    watchResourceMock.mockReturnValue([alteredApplications, true]);
    const { rerender } = renderWithQueryClient(<ApplicationList />);
    await waitFor(() => {
      expect(screen.queryByText('mno-app')).toBeInTheDocument();
      expect(screen.queryByText('mno-app1')).toBeInTheDocument();
      expect(screen.queryByText('mno-app2')).toBeInTheDocument();
      expect(screen.queryByText('xyz-app')).toBeInTheDocument();
    });

    const filter = screen.getByPlaceholderText('Filter by name...');
    fireEvent.change(filter, { target: { value: 'xyz-app' } });
    rerender(<ApplicationList />);
    await waitFor(() => {
      expect(screen.queryByText('mno-app')).not.toBeInTheDocument();
      expect(screen.queryByText('mno-app1')).not.toBeInTheDocument();
      expect(screen.queryByText('mno-app2')).not.toBeInTheDocument();
      expect(screen.queryByText('xyz-app')).toBeInTheDocument();
    });
  });

  it('should filter case insensitive', async () => {
    watchResourceMock.mockReturnValue([applications, true]);
    const { rerender } = renderWithQueryClient(<ApplicationList />);
    await waitFor(() => {
      expect(screen.queryByText('mno-app')).toBeInTheDocument();
      expect(screen.queryByText('mno-app1')).toBeInTheDocument();
      expect(screen.queryByText('mno-app2')).toBeInTheDocument();
      expect(screen.queryByText('xyz-app')).toBeInTheDocument();
    });

    const filter = screen.getByPlaceholderText('Filter by name...');
    fireEvent.change(filter, { target: { value: 'XYZ' } });
    rerender(<ApplicationList />);
    await waitFor(() => {
      expect(screen.queryByText('mno-app')).not.toBeInTheDocument();
      expect(screen.queryByText('mno-app1')).not.toBeInTheDocument();
      expect(screen.queryByText('mno-app2')).not.toBeInTheDocument();
      expect(screen.queryByText('xyz-app')).toBeInTheDocument();
    });
  });

  it('should clear the filter when clear button is clicked', async () => {
    watchResourceMock.mockReturnValue([applications, true]);
    const { rerender } = renderWithQueryClient(<ApplicationList />);
    await waitFor(() => {
      expect(screen.queryByText('mno-app')).toBeInTheDocument();
      expect(screen.queryByText('mno-app1')).toBeInTheDocument();
      expect(screen.queryByText('mno-app2')).toBeInTheDocument();
      expect(screen.queryByText('xyz-app')).toBeInTheDocument();
    });

    const filter = screen.getByPlaceholderText('Filter by name...');
    fireEvent.change(filter, { target: { value: 'invalid-app' } });
    rerender(<ApplicationList />);
    await waitFor(() => {
      expect(screen.queryByText('mno-app')).not.toBeInTheDocument();
      expect(screen.queryByText('mno-app2')).not.toBeInTheDocument();
      expect(screen.queryByText('mno-app2')).not.toBeInTheDocument();
      expect(screen.queryByText('xyz-app')).not.toBeInTheDocument();
      expect(screen.queryByText('No results found')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Clear all filters' }));
    rerender(<ApplicationList />);
    await waitFor(() => {
      expect(screen.queryByText('mno-app')).toBeInTheDocument();
      expect(screen.queryByText('mno-app1')).toBeInTheDocument();
      expect(screen.queryByText('mno-app2')).toBeInTheDocument();
      expect(screen.queryByText('xyz-app')).toBeInTheDocument();
    });
  });
});
