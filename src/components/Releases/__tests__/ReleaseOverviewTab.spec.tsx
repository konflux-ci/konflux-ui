import { render, screen } from '@testing-library/react';
import { mockUseNamespaceHook } from '../../../unit-test-utils/mock-namespace';
import { createK8sWatchResourceMock } from '../../../utils/test-utils';
import { mockReleases } from '../__data__/mock-release-data';
import ReleaseOverviewTab from '../ReleaseOverviewTab';

jest.mock('react-router-dom', () => ({
  Link: (props) => <a href={props.to}>{props.children}</a>,
  useParams: () => ({ releaseName: 'test-release' }),
}));

jest.mock('../../../hooks/useReleases', () => ({
  useRelease: jest.fn(() => [mockReleases[0], true]),
}));

const useNamespaceMock = mockUseNamespaceHook('my-ns');
const watchResourceMock = createK8sWatchResourceMock();

describe('ReleaseOverviewTab', () => {
  beforeEach(() => {
    useNamespaceMock.mockReturnValue('my-ns');
  });

  it('should render loading indicator', () => {
    watchResourceMock.mockReturnValue([{ spec: { application: 'test-app' } }, false]);
    render(<ReleaseOverviewTab />);
    expect(screen.getByRole('progressbar')).toBeVisible();
  });

  it('should render correct details', () => {
    watchResourceMock.mockReturnValue([{ spec: { application: 'test-app' } }, true]);
    render(<ReleaseOverviewTab />);
    expect(screen.getByText('Duration')).toBeVisible();
    expect(screen.getByText('10 seconds')).toBeVisible();

    expect(screen.getByText('Release Process')).toBeVisible();
    expect(screen.getByText('Manual')).toBeVisible();

    expect(screen.getByText('Status')).toBeVisible();
    expect(screen.getByText('Unknown')).toBeVisible();

    expect(screen.getByText('Release Plan')).toBeVisible();
    expect(screen.getByText('test-plan')).toBeVisible();

    expect(screen.getByText('Snapshot')).toBeVisible();
    expect(screen.getByText('test-snapshot')).toBeVisible();

    expect(screen.getByText('Release Target')).toBeVisible();
    expect(screen.getByText('test-target')).toBeVisible();

    expect(screen.getByText('Tenant Pipeline Run')).toBeVisible();

    expect(screen.getByText('Tenant Collector Pipeline Run')).toBeVisible();

    expect(screen.getByRole('link', { name: 'test-pipelinerun' }).getAttribute('href')).toBe(
      `/ns/my-ns/applications/test-app/pipelineruns/test-pipelinerun`,
    );
  });

  it('should render correct details if managedProcessing', () => {
    render(<ReleaseOverviewTab />);
    expect(screen.getByText('Managed Pipeline Run')).toBeVisible();
    expect(screen.getByRole('link', { name: 'test-pipelinerun' }).getAttribute('href')).toBe(
      `/ns/my-ns/applications/test-app/pipelineruns/test-pipelinerun`,
    );
  });
});
