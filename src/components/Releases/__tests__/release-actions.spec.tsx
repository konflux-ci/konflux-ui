import { renderHook } from '@testing-library/react';
import { PipelineRunLabel } from '~/consts/pipelinerun';
import { ReleaseKind } from '~/types';
import { downloadYaml } from '~/utils/common-utils';
import { releaseRerun } from '../../../utils/release-actions';
import { useReleaseActions } from '../release-actions';

jest.mock('~/utils/common-utils', () => ({
  ...jest.requireActual('~/utils/common-utils'),
  downloadYaml: jest.fn(),
}));

jest.mock('../../../utils/release-actions', () => ({
  releaseRerun: jest.fn(),
}));

jest.mock('../../../auth/useAuth', () => ({
  useAuth: () => ({ user: { email: 'user@example.com' } }),
}));

jest.mock('~/shared/providers/Namespace/useNamespaceInfo', () => ({
  useNamespace: jest.fn(() => 'test-ns'),
}));

const downloadYamlMock = downloadYaml as jest.Mock;
const releaseRerunMock = releaseRerun as jest.Mock;

describe('useReleaseActions', () => {
  const mockRelease: ReleaseKind = {
    apiVersion: 'appstudio.redhat.com/v1alpha1',
    kind: 'Release',
    metadata: {
      name: 'test-release',
      namespace: 'test-ns',
      labels: {
        [PipelineRunLabel.APPLICATION]: 'my-app',
      },
    },
    spec: {
      releasePlan: 'test-plan',
      snapshot: 'test-snapshot',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    downloadYamlMock.mockImplementation(() => {});
    releaseRerunMock.mockResolvedValue({});
  });

  it('should return Download YAML and Re-run release actions', () => {
    const { result } = renderHook(() => useReleaseActions(mockRelease));
    const actions = result.current;

    expect(actions).toHaveLength(2);
    expect(actions[0]).toEqual(
      expect.objectContaining({
        id: 'download-release-yaml',
        label: 'Download YAML',
      }),
    );
    expect(actions[1]).toEqual(
      expect.objectContaining({
        id: 're-run-release',
        label: 'Re-run release',
      }),
    );
  });

  it('should call downloadYaml with release when Download YAML cta is invoked', () => {
    const { result } = renderHook(() => useReleaseActions(mockRelease));
    const downloadAction = result.current[0];

    expect(typeof downloadAction.cta).toBe('function');
    (downloadAction.cta as () => void)();

    expect(downloadYamlMock).toHaveBeenCalledTimes(1);
    expect(downloadYamlMock).toHaveBeenCalledWith(mockRelease);
  });

  it('should call releaseRerun with release and user email when Re-run release cta is invoked', async () => {
    const { result } = renderHook(() => useReleaseActions(mockRelease));
    const rerunAction = result.current[1];

    expect(typeof rerunAction.cta).toBe('function');
    await (rerunAction.cta as () => Promise<unknown>)();

    expect(releaseRerunMock).toHaveBeenCalledTimes(1);
    expect(releaseRerunMock).toHaveBeenCalledWith(mockRelease, 'user@example.com');
  });

  it('should include analytics on Re-run release action', () => {
    const { result } = renderHook(() => useReleaseActions(mockRelease));
    const rerunAction = result.current[1];

    expect(rerunAction.analytics).toEqual({
      link_name: 're-run-release',
      link_location: 'release-actions',
      release_name: 'test-release',
      app_name: 'my-app',
      namespace: 'test-ns',
    });
  });

  it('should use empty application name when release has no application label', () => {
    const releaseWithoutApp = {
      ...mockRelease,
      metadata: { ...mockRelease.metadata, labels: {} },
    };
    const { result } = renderHook(() => useReleaseActions(releaseWithoutApp as ReleaseKind));
    const rerunAction = result.current[1];

    expect(rerunAction.analytics).toEqual(
      expect.objectContaining({
        app_name: '',
      }),
    );
  });
});
