import { renderHook } from '@testing-library/react-hooks';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import { createK8sWatchResourceMock } from '../../utils/test-utils';
import { useApplicationReleases } from '../useApplicationReleases';

const watchResourceMock = createK8sWatchResourceMock();

describe('useApplicationReleases', () => {
  mockUseNamespaceHook('test-ns');
  it('should return empty array incase release are not loaded', () => {
    watchResourceMock.mockReturnValue([[], false]);

    const { result } = renderHook(() => useApplicationReleases('test-app'));
    const [results, loaded] = result.current;
    expect(loaded).toEqual(false);
    expect(results.length).toEqual(0);
  });

  it('should return empty array incase snapshots are not loaded', () => {
    watchResourceMock.mockReturnValue([[], true]);

    const { result } = renderHook(() => useApplicationReleases('test-app'));
    const [results, loaded] = result.current;
    expect(loaded).toEqual(true);
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

    const { result } = renderHook(() => useApplicationReleases('test-app'));
    const [results, loaded] = result.current;
    expect(loaded).toEqual(true);
    expect(results.length).toEqual(4);
    expect(results.map((r) => r.metadata.name)).toEqual(['r1', 'r2', 'r3', 'r4']);
  });
});
