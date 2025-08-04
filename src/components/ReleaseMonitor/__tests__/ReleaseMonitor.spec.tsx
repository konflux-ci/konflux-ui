import '@testing-library/jest-dom';
import { Table as PfTable, TableHeader } from '@patternfly/react-table/deprecated';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { mockNamespaceHooks } from '../../../unit-test-utils/mock-namespace';
import { createK8sUtilMock } from '../../../utils/test-utils';
import { mockReleases, mockNamespaceData, mockNamespaces } from '../__data__/mock-release-data';
import ReleaseListRow from '../ReleaseListRow';
import ReleaseMonitor from '../ReleaseMonitor';

const mockUseNamespaceInfo = mockNamespaceHooks('useNamespaceInfo', mockNamespaceData);

jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({ t: (x) => x })),
}));

jest.mock('react-router-dom', () => ({
  Link: (props) => <a href={props.to}>{props.children}</a>,
}));

const k8sUtilMock = createK8sUtilMock('K8sQueryListResourceItems');
k8sUtilMock.mockResolvedValue(mockReleases);

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
            {props.data.map((obj, i) => (
              <tr key={i}>
                <ReleaseListRow
                  obj={obj}
                  columns={null}
                  customData={{ applicationName: 'test-app' }}
                />
              </tr>
            ))}
          </tbody>
        </PfTable>
      );
    },
  };
});

describe('ReleaseMonitor', () => {
  it('should render all columns and releases', async () => {
    mockUseNamespaceInfo.mockReturnValue({
      ...mockNamespaceData,
      namespaces: mockNamespaces,
      namespacesLoaded: true,
    });

    const expectedHeaders = [
      'Application',
      'Component',
      'Status',
      'Release Name',
      'Release Plan',
      'Completion Time',
      'Namespace',
    ];

    render(<ReleaseMonitor />);

    // Wait for data to load and releases to appear
    await waitFor(() => {
      expect(screen.getByText('foo-component')).toBeInTheDocument();
      ['foo-component', 'test-01-component', 'bar-01-component'].forEach((component) => {
        expect(screen.getByText(component)).toBeInTheDocument();
      });
      expectedHeaders.forEach((header) => {
        expect(screen.getAllByText(header).length).toBeGreaterThan(0);
      });
    });
  });

  it('should filter releases by application', async () => {
    mockUseNamespaceInfo.mockReturnValue({
      ...mockNamespaceData,
      namespaces: mockNamespaces,
      namespacesLoaded: true,
    });

    render(<ReleaseMonitor />);

    await waitFor(() => {
      expect(screen.queryByText('foo-component')).toBeInTheDocument();
    });
    const applicationToggle = screen.getByRole('button', { name: 'Filter by application' });
    fireEvent.click(applicationToggle);
    const applicationMenuItems = screen.getAllByText('foo');
    fireEvent.click(applicationMenuItems[0]);
    await waitFor(() => {
      expect(screen.queryByText('test-01-component')).not.toBeInTheDocument();
      ['foo-component', 'bar-01-component'].map((component) => {
        expect(screen.queryByText(component)).toBeInTheDocument();
      });
    });
  });

  it('should filter releases by namespace', async () => {
    mockUseNamespaceInfo.mockReturnValue({
      ...mockNamespaceData,
      namespaces: mockNamespaces,
      namespacesLoaded: true,
    });

    render(<ReleaseMonitor />);

    await waitFor(() => {
      expect(screen.queryByText('foo-component')).toBeInTheDocument();
    });
    const attributeToggle = screen.getByRole('button', { name: 'Application' });
    fireEvent.click(attributeToggle);
    const namespaceMenuItem = screen.getByRole('menuitem', { name: 'Namespace' });
    fireEvent.click(namespaceMenuItem);
    const tenantToggle = screen.getByRole('button', { name: 'Filter by namespace' });
    fireEvent.click(tenantToggle);
    const tenantMenuItem = screen.getByRole('menuitem', { name: 'namespace-1' });
    fireEvent.click(tenantMenuItem);
    await waitFor(() => {
      ['foo-component', 'test-01-component'].map((component) => {
        expect(screen.queryByText(component)).toBeInTheDocument();
      });
    });
  });

  it('should filter releases by status', async () => {
    mockUseNamespaceInfo.mockReturnValue({
      ...mockNamespaceData,
      namespaces: mockNamespaces,
      namespacesLoaded: true,
    });
    render(<ReleaseMonitor />);
    await waitFor(() => {
      expect(screen.queryByText('foo-component')).toBeInTheDocument();
    });
    const attributeToggle = screen.getByRole('button', { name: 'Application' });
    fireEvent.click(attributeToggle);
    const statusMenuItem = screen.getByRole('menuitem', { name: 'Status' });
    fireEvent.click(statusMenuItem);
    const statusToggle = screen.getByRole('button', { name: 'Filter by status' });
    fireEvent.click(statusToggle);
    const succeededMenuItem = screen.getByRole('menuitem', { name: 'Succeeded' });
    fireEvent.click(succeededMenuItem);
    await waitFor(() => {
      expect(screen.queryByText('test-01-component')).toBeInTheDocument();
      ['foo-component', 'bar-01-component'].map((component) => {
        expect(screen.queryByText(component)).not.toBeInTheDocument();
      });
    });
  });

  it('should show empty state when no releases match filters', async () => {
    mockUseNamespaceInfo.mockReturnValue({
      ...mockNamespaceData,
      namespaces: mockNamespaces,
      namespacesLoaded: true,
    });
    render(<ReleaseMonitor />);
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
    const attributeToggle = screen.getByRole('button', { name: 'Application' });
    fireEvent.click(attributeToggle);
    const rpMenuItem = screen.getByRole('menuitem', { name: 'Release Plan' });
    fireEvent.click(rpMenuItem);
    const rpText = screen.getByPlaceholderText('Search by release plan');
    fireEvent.change(rpText, { target: { value: 'test-no-exit' } });
    await waitFor(() => {
      expect(screen.queryByText('No releases found')).toBeInTheDocument();
    });
  });

  it('should change visible filter input when attribute dropdown is clicked', async () => {
    mockUseNamespaceInfo.mockReturnValue({
      ...mockNamespaceData,
      namespaces: mockNamespaces,
      namespacesLoaded: true,
    });
    render(<ReleaseMonitor />);
    await waitFor(() => {
      expect(screen.queryByText('foo-component')).toBeInTheDocument();
    });
    const attributeToggle = screen.getByRole('button', { name: 'Application' });
    fireEvent.click(attributeToggle);
    const statusMenuItem = screen.getByRole('menuitem', { name: 'Status' });
    fireEvent.click(statusMenuItem);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Filter by status' })).toBeVisible();
    });
  });

  it('should filter releases by release plan', async () => {
    mockUseNamespaceInfo.mockReturnValue({
      ...mockNamespaceData,
      namespaces: mockNamespaces,
      namespacesLoaded: true,
    });
    render(<ReleaseMonitor />);
    await waitFor(() => {
      expect(screen.queryByText('foo-component')).toBeInTheDocument();
    });
    const attributeToggle = screen.getByRole('button', { name: 'Application' });
    fireEvent.click(attributeToggle);
    const rpMenuItem = screen.getByRole('menuitem', { name: 'Release Plan' });
    fireEvent.click(rpMenuItem);
    const rpText = screen.getByPlaceholderText('Search by release plan');
    fireEvent.change(rpText, { target: { value: 'test-plan-3' } });
    await waitFor(() => {
      expect(screen.queryByText('bar-01-component')).toBeInTheDocument();
      ['foo-component', 'test-01-component'].map((component) => {
        expect(screen.queryByText(component)).not.toBeInTheDocument();
      });
    });
  });
});
