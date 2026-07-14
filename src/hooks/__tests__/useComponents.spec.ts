import { renderHook } from '@testing-library/react-hooks';
import { mockComponentsData } from '../../components/ApplicationDetails/__data__/WorkflowComponentsData';
import { createK8sWatchResourceMock } from '../../utils/test-utils';
import { useAllComponents, useComponents } from '../useComponents';

const useK8sWatchResourceMock = createK8sWatchResourceMock();

describe('useComponents', () => {
  it('should return empty array when call is inflight', () => {
    useK8sWatchResourceMock.mockReturnValue([[], false, undefined]);
    const { result } = renderHook(() => useComponents('test-ns', 'test-dev-samples'));
    expect(result.current).toEqual([[], false, undefined]);
  });

  it('should return components when namespace is passed', () => {
    useK8sWatchResourceMock.mockReturnValue([mockComponentsData, true, undefined]);

    const { result } = renderHook(() => useComponents('test-ns', 'test-dev-samples'));
    const [components] = result.current;
    expect(components).toHaveLength(3);
  });
});

describe('useAllComponents', () => {
  it('should return empty array when call is inflight', () => {
    useK8sWatchResourceMock.mockReturnValue([[], false, undefined]);
    const { result } = renderHook(() => useAllComponents('test-ns'));
    expect(result.current).toEqual([[], false, undefined]);
  });

  it('should return all components in a namespace', () => {
    useK8sWatchResourceMock.mockReturnValue([mockComponentsData, true, undefined]);
    const { result } = renderHook(() => useAllComponents('test-ns'));
    const [components] = result.current;
    expect(components).toHaveLength(3);
  });

  it('should filter out deleted componets', () => {
    useK8sWatchResourceMock.mockReturnValue([
      [...mockComponentsData, { metadata: { name: 'sdfs', deletionTimestamp: 'sad-wqe' } }],
      true,
      undefined,
    ]);
    const { result } = renderHook(() => useAllComponents('test-ns'));
    const [components] = result.current;
    expect(components).toHaveLength(3);
  });
});
