import { render, screen } from '@testing-library/react';
import { useRelease } from '~/hooks/useReleases';
import { mockUseNamespaceHook } from '../../../unit-test-utils/mock-namespace';
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
const useMockRelease = useRelease as jest.Mock;

describe('ReleaseOverviewTab', () => {
  beforeEach(() => {
    useNamespaceMock.mockReturnValue('my-ns');
  });

  it('should render loading indicator', () => {
    useMockRelease.mockImplementation(() => [mockReleases[1], false, undefined, undefined, false]);
    render(<ReleaseOverviewTab />);
    expect(screen.getByRole('progressbar')).toBeVisible();
  });

  it('should render correct details', () => {
    useMockRelease.mockImplementation(() => [mockReleases[0], true, undefined, undefined, false]);
    render(<ReleaseOverviewTab />);
    expect(screen.getByText('Duration')).toBeVisible();
    expect(screen.getByText('10 seconds')).toBeVisible();

    expect(screen.getByText('Status')).toBeVisible();
    expect(screen.getByText('Unknown')).toBeVisible();

    expect(screen.getByText('Release Plan')).toBeVisible();
    expect(screen.getByText('test-plan')).toBeVisible();

    expect(screen.getByText('Snapshot')).toBeVisible();
    expect(screen.getByText('test-snapshot')).toBeVisible();

    expect(screen.getByText('Release Target (Managed Namespace)')).toBeVisible();
    expect(screen.getByText('test-target')).toBeVisible();
  });
});
