import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import * as k8s from '../../../k8s';
import { mockNamespaceHooks } from '../../../unit-test-utils/mock-namespace';
import { mockReleases, mockNamespaceData, mockNamespaces } from '../__data__/mock-release-data';
import ReleaseMonitor from '../ReleaseMonitor';

const mockUseNamespaceInfo = mockNamespaceHooks('useNamespaceInfo', mockNamespaceData);

jest.mock('react-router-dom', () => ({
  Link: (props) => <a href={props.to}>{props.children}</a>,
}));

describe('ReleaseMonitor', () => {
  it('should render all columns', async () => {
    mockUseNamespaceInfo.mockReturnValue({
      ...mockNamespaceData,
      namespaces: mockNamespaces,
      namespacesLoaded: true,
    });
    jest.spyOn(k8s, 'K8sQueryReleaseListItems').mockResolvedValue(mockReleases);
    render(<ReleaseMonitor />);
    expect(screen.getByRole('columnheader', { name: 'Application' })).toBeVisible();
    expect(screen.getByRole('columnheader', { name: 'Component' })).toBeVisible();
    expect(screen.getByRole('columnheader', { name: 'Status' })).toBeVisible();
    expect(screen.getByRole('columnheader', { name: 'Release Name' })).toBeVisible();
    expect(screen.getByRole('columnheader', { name: 'Release Plan' })).toBeVisible();
    expect(screen.getByRole('columnheader', { name: 'Completion Time' })).toBeVisible();
    expect(screen.getByRole('columnheader', { name: 'Namespace' })).toBeVisible();
    await waitFor(() => {
      expect(screen.queryByText('foo')).toBeInTheDocument();
      expect(screen.queryByText('In Progress')).toBeInTheDocument();
      expect(screen.queryByText('foo-01')).toBeInTheDocument();
      expect(screen.queryByText('Succeeded')).toBeInTheDocument();
      expect(screen.queryByText('bar-01')).toBeInTheDocument();
      expect(screen.queryByText('Failed')).toBeInTheDocument();
    });
  });
});
