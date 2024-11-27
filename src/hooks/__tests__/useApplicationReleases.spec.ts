import { renderHook } from '@testing-library/react-hooks';
import { createK8sWatchResourceMock } from '../../utils/test-utils';
import { useApplicationReleases } from '../useApplicationReleases';
import { useApplicationSnapshots } from '../useApplicationSnapshots';

jest.mock('../useApplicationSnapshots', () => ({
  useApplicationSnapshots: jest.fn(),
}));

jest.mock('../../components/Workspace/useWorkspaceInfo', () => ({
  useWorkspaceInfo: jest.fn(() => ({ namespace: 'test-ns', workspace: 'test-ws' })),
}));

const watchResourceMock = createK8sWatchResourceMock();
const useSnapshotsMock = useApplicationSnapshots as jest.Mock;

describe('useApplicationReleases', () => {
  it('should return empty array incase release are not loaded', () => {
    watchResourceMock.mockReturnValue([[], false]);
    useSnapshotsMock.mockReturnValue([
      [{ metadata: { name: 'my-snapshot' } }, { metadata: { name: 'my-snapshot-2' } }],
      true,
    ]);

    const { result } = renderHook(() => useApplicationReleases('test-app'));
    const [results, loaded] = result.current;
    expect(loaded).toEqual(false);
    expect(results.length).toEqual(0);
  });

  it('should return empty array incase snapshots are not loaded', () => {
    watchResourceMock.mockReturnValue([[], true]);
    useSnapshotsMock.mockReturnValue([
      [{ metadata: { name: 'my-snapshot' } }, { metadata: { name: 'my-snapshot-2' } }],
      false,
    ]);

    const { result } = renderHook(() => useApplicationReleases('test-app'));
    const [results, loaded] = result.current;
    expect(loaded).toEqual(false);
    expect(results.length).toEqual(0);
  });

  it('should only return releases that are in the application', () => {
    watchResourceMock.mockReturnValue([
      [
        { metadata: { name: 'r1' }, spec: { snapshot: 'my-snapshot' } },
        { metadata: { name: 'r2' }, spec: { snapshot: 'my-snapshot' } },
        { metadata: { name: 'r3' }, spec: { snapshot: 'test-snapshot' } },
        { metadata: { name: 'r4' }, spec: { snapshot: 'test-snapshot' } },
      ],
      true,
    ]);
    useSnapshotsMock.mockReturnValue([
      [{ metadata: { name: 'my-snapshot' } }, { metadata: { name: 'my-snapshot-2' } }],
      true,
    ]);

    const { result } = renderHook(() => useApplicationReleases('test-app'));
    const [results, loaded] = result.current;
    expect(useSnapshotsMock).toHaveBeenCalledWith('test-app');
    expect(loaded).toEqual(true);
    expect(results.length).toEqual(2);
    expect(results.map((r) => r.metadata.name)).toEqual(['r1', 'r2']);
  });
});
