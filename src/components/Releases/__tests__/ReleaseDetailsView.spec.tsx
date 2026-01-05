import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useK8sAndKarchResource } from '~/hooks/useK8sAndKarchResources';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import { TrackEvents } from '~/utils/analytics';
import { useAccessReviewForModel } from '~/utils/rbac';
import { releaseRerun } from '../../../utils/release-actions';
import { renderWithQueryClientAndRouter } from '../../../utils/test-utils';
import ReleaseDetailsView from '../ReleaseDetailsView';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ applicationName: 'my-app', releaseName: 'test-release' }),
  };
});

jest.mock('../../../hooks/useK8sAndKarchResources', () => ({
  useK8sAndKarchResource: jest.fn(),
}));

jest.mock('~/utils/rbac', () => ({
  useAccessReviewForModel: jest.fn(() => [true, true]),
}));

const mockTrack = jest.fn();
jest.mock('~/utils/analytics', () => ({
  ...jest.requireActual('~/utils/analytics'),
  useTrackEvent: () => mockTrack,
}));

jest.mock('../../../auth/useAuth', () => ({
  useAuth: () => ({ user: { email: 'test@example.com' } }),
}));

jest.mock('../../../utils/release-actions', () => ({
  releaseRerun: jest.fn(),
}));

const useMockRelease = useK8sAndKarchResource as jest.Mock;
const useAccessReviewForModelMock = useAccessReviewForModel as jest.Mock;
const releaseRerunMock = releaseRerun as jest.Mock;

describe('ReleaseDetailsView', () => {
  const useNamespaceMock = mockUseNamespaceHook('test-ws');

  const mockRelease = {
    metadata: {
      name: 'test-release',
      namespace: 'test-ws',
    },
    spec: {
      releasePlan: 'test-releaseplan',
      snapshot: 'test-snapshot',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useAccessReviewForModelMock.mockReturnValue([true, true]);
    releaseRerunMock.mockResolvedValue({});
    useNamespaceMock.mockReturnValue('test-ws');
  });

  it('should render spinner if release data is not loaded', () => {
    useMockRelease.mockReturnValue({
      data: mockRelease,
      isLoading: true,
      fetchError: undefined,
      wsError: undefined,
      isError: false,
    });
    renderWithQueryClientAndRouter(<ReleaseDetailsView />);
    expect(screen.getByRole('progressbar')).toBeVisible();
  });

  it('should render the error state if the release is not found', () => {
    useMockRelease.mockReturnValue({
      data: {},
      isLoading: false,
      fetchError: { code: 404 },
      wsError: undefined,
      isError: true,
    });
    renderWithQueryClientAndRouter(<ReleaseDetailsView />);
    expect(screen.getByText('404: Page not found')).toBeVisible();
    expect(screen.getByText('Go to applications list')).toBeVisible();
  });

  it('should render release name if release data is loaded', () => {
    useMockRelease.mockReturnValue({ data: mockRelease, isLoading: false, fetchError: undefined });
    renderWithQueryClientAndRouter(<ReleaseDetailsView />);
    expect(screen.getAllByRole('heading')[0]).toHaveTextContent('test-release');
  });

  describe('Re-run release action', () => {
    it('should render re-run release action in actions dropdown', async () => {
      const user = userEvent.setup();
      useMockRelease.mockReturnValue({
        data: mockRelease,
        isLoading: false,
        fetchError: undefined,
      });
      renderWithQueryClientAndRouter(<ReleaseDetailsView />);

      const actionsButton = screen.getByRole('button', { name: /Actions/i });
      await user.click(actionsButton);

      expect(screen.getByRole('menuitem', { name: /Re-run release/i })).toBeInTheDocument();
    });

    it('should enable re-run release action when user has create permission', async () => {
      const user = userEvent.setup();
      useMockRelease.mockReturnValue({
        data: mockRelease,
        isLoading: false,
        fetchError: undefined,
      });
      renderWithQueryClientAndRouter(<ReleaseDetailsView />);

      const actionsButton = screen.getByRole('button', { name: /Actions/i });
      await user.click(actionsButton);

      const rerunAction = screen.getByRole('menuitem', { name: /Re-run release/i });
      expect(rerunAction).not.toHaveAttribute('aria-disabled', 'true');
    });

    it('should disable re-run release action when user lacks create permission', async () => {
      const user = userEvent.setup();
      useAccessReviewForModelMock.mockReturnValue([false, true]);
      useMockRelease.mockReturnValue({
        data: mockRelease,
        isLoading: false,
        fetchError: undefined,
      });
      renderWithQueryClientAndRouter(<ReleaseDetailsView />);

      const actionsButton = screen.getByRole('button', { name: /Actions/i });
      await user.click(actionsButton);

      const rerunAction = screen.getByRole('menuitem', { name: /Re-run release/i });
      expect(rerunAction).toHaveAttribute('aria-disabled', 'true');
    });

    it('should track event and call releaseRerun when re-run action is clicked', async () => {
      const user = userEvent.setup();
      useMockRelease.mockReturnValue({
        data: mockRelease,
        isLoading: false,
        fetchError: undefined,
      });
      renderWithQueryClientAndRouter(<ReleaseDetailsView />);

      const actionsButton = screen.getByRole('button', { name: /Actions/i });
      await user.click(actionsButton);

      const rerunAction = screen.getByRole('menuitem', { name: /Re-run release/i });
      await user.click(rerunAction);

      expect(mockTrack).toHaveBeenCalledWith(TrackEvents.ButtonClicked, {
        link_name: 're-run-release',
        link_location: 'release-actions',
        release_name: 'test-release',
        app_name: 'my-app',
        namespace: 'test-ws',
      });
      expect(releaseRerunMock).toHaveBeenCalledWith(mockRelease, 'test@example.com');
    });

    it('should navigate to releases list after successful re-run', async () => {
      const user = userEvent.setup();
      useMockRelease.mockReturnValue({
        data: mockRelease,
        isLoading: false,
        fetchError: undefined,
      });
      renderWithQueryClientAndRouter(<ReleaseDetailsView />);

      const actionsButton = screen.getByRole('button', { name: /Actions/i });
      await user.click(actionsButton);

      const rerunAction = screen.getByRole('menuitem', { name: /Re-run release/i });
      await user.click(rerunAction);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/ns/test-ws/applications/my-app/releases');
      });
    });

    it('should not navigate when releaseRerun does not resolve', async () => {
      const user = userEvent.setup();
      // Use a promise that never resolves to simulate pending/failed state
      releaseRerunMock.mockReturnValue(new Promise(() => {}));

      useMockRelease.mockReturnValue({
        data: mockRelease,
        isLoading: false,
        fetchError: undefined,
      });
      renderWithQueryClientAndRouter(<ReleaseDetailsView />);

      const actionsButton = screen.getByRole('button', { name: /Actions/i });
      await user.click(actionsButton);

      const rerunAction = screen.getByRole('menuitem', { name: /Re-run release/i });
      await user.click(rerunAction);

      // Wait for async operations
      await waitFor(() => {
        expect(releaseRerunMock).toHaveBeenCalled();
      });

      // Navigation should not have been called since promise never resolved
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should still track analytics event regardless of releaseRerun result', async () => {
      const user = userEvent.setup();
      // Use a promise that never resolves
      releaseRerunMock.mockReturnValue(new Promise(() => {}));

      useMockRelease.mockReturnValue({
        data: mockRelease,
        isLoading: false,
        fetchError: undefined,
      });
      renderWithQueryClientAndRouter(<ReleaseDetailsView />);

      const actionsButton = screen.getByRole('button', { name: /Actions/i });
      await user.click(actionsButton);

      const rerunAction = screen.getByRole('menuitem', { name: /Re-run release/i });
      await user.click(rerunAction);

      // Analytics should be tracked before the API call resolves
      expect(mockTrack).toHaveBeenCalledWith(TrackEvents.ButtonClicked, {
        link_name: 're-run-release',
        link_location: 'release-actions',
        release_name: 'test-release',
        app_name: 'my-app',
        namespace: 'test-ws',
      });

      // releaseRerun should still be called
      expect(releaseRerunMock).toHaveBeenCalledWith(mockRelease, 'test@example.com');
    });
  });
});
