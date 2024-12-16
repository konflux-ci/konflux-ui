import { render, screen } from '@testing-library/react';
import { createK8sWatchResourceMock, createUseWorkspaceInfoMock } from '../../../utils/test-utils';
import { mockReleases } from '../__data__/mock-release-data';
import ReleaseOverviewTab from '../ReleaseOverviewTab';

jest.mock('react-router-dom', () => ({
  Link: (props) => <a href={props.to}>{props.children}</a>,
  useParams: () => ({ releaseName: 'test-release' }),
}));

jest.mock('../../../hooks/useWorkspaceResource', () => ({
  useWorkspaceResource: jest.fn(() => ['test-pipelinerun', 'target-ws']),
}));

jest.mock('../../../hooks/useReleases', () => ({
  useRelease: jest.fn(() => [mockReleases[0], true]),
}));

const watchResourceMock = createK8sWatchResourceMock();

describe('ReleaseOverviewTab', () => {
  beforeEach(() => {});

  createUseWorkspaceInfoMock({ namespace: 'test-ns', workspace: 'test-ws' });

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

    expect(screen.getByText('Pipeline Run')).toBeVisible();
    expect(screen.getByRole('link', { name: 'test-pipelinerun' }).getAttribute('href')).toBe(
      '/workspaces/target-ws/applications/test-app/pipelineruns/test-pipelinerun',
    );
  });

  it('should render correct details if managedProcessing', () => {
    render(<ReleaseOverviewTab />);
    expect(screen.getByText('Pipeline Run')).toBeVisible();
    expect(screen.getByRole('link', { name: 'test-pipelinerun' }).getAttribute('href')).toBe(
      '/workspaces/target-ws/applications/test-app/pipelineruns/test-pipelinerun',
    );
  });
});
