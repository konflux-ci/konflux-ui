import { screen } from '@testing-library/react';
import { useNamespaceInfo } from '~/shared/providers/Namespace';
import { renderWithQueryClientAndRouter } from '~/unit-test-utils/rendering-utils';
import ReleaseMonitor from '../ReleaseMonitor';

jest.mock('~/shared/providers/Namespace', () => ({
  useNamespaceInfo: jest.fn(),
}));

const useNamespaceInfoMock = useNamespaceInfo as jest.Mock;

describe('ReleaseMonitor', () => {
  it('should render the release monitor page', () => {
    useNamespaceInfoMock.mockReturnValue({
      namespaces: [],
      namespacesLoaded: true,
    });

    renderWithQueryClientAndRouter(<ReleaseMonitor />);

    expect(screen.getByText('Release Monitor')).toBeInTheDocument();
    expect(
      screen.getByText('The dashboard to monitor the releases you care about'),
    ).toBeInTheDocument();
  });
});
