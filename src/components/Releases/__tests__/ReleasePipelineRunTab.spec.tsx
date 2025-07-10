import { render, screen } from '@testing-library/react';
import { mockUseNamespaceHook } from '../../../unit-test-utils/mock-namespace';
import { createK8sWatchResourceMock } from '../../../utils/test-utils';
import { mockReleases } from '../__data__/mock-release-data';
import ReleasePipelineRunTab from '../ReleasePipelineRunTab';

jest.mock('react-router-dom', () => ({
  Link: (props) => <a href={props.to}>{props.children}</a>,
  useParams: () => ({ releaseName: 'test-release' }),
}));

jest.mock('../../../hooks/useReleases', () => ({
  useRelease: jest.fn(() => [mockReleases[0], true]),
}));

const useNamespaceMock = mockUseNamespaceHook('my-ns');
const watchResourceMock = createK8sWatchResourceMock();

describe('ReleasePipelineRunTab', () => {
  beforeEach(() => {
    useNamespaceMock.mockReturnValue('my-ns');
  });

  it('should render loading indicator', () => {
    watchResourceMock.mockReturnValue([{ spec: { application: 'test-app' } }, false]);
    render(<ReleasePipelineRunTab />);
    expect(screen.getByRole('progressbar')).toBeVisible();
  });

  it('should render correct details', () => {
    watchResourceMock.mockReturnValue([{ spec: { application: 'test-app' } }, true]);
    render(<ReleasePipelineRunTab />);
    expect(screen.getByText('Name')).toBeVisible();
    expect(screen.getByText('test-pipelinerun')).toBeVisible();

    expect(screen.getByText('Start Time')).toBeVisible();
    expect(screen.getByText('-')).toBeVisible();

    expect(screen.getByText('Duration')).toBeVisible();
    expect(screen.getByText('less than a second')).toBeVisible();

    expect(screen.getByText('Type')).toBeVisible();
    expect(screen.getByText('Tenant')).toBeVisible();

    expect(screen.getByText('Status')).toBeVisible();
    expect(screen.getByText('Unknown')).toBeVisible();

    expect(screen.getByText('Snapshot')).toBeVisible();
    expect(screen.getByText('test-snapshot')).toBeVisible();

    expect(screen.getByText('Namespace')).toBeVisible();
    expect(screen.getByText('my-ns')).toBeVisible();
  });
});
