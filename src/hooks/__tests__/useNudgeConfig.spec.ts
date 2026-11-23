import { renderHook } from '@testing-library/react';
import { NudgeConfigModel } from '~/models';
import { NudgeConfigKind } from '~/types';
import { createK8sWatchResourceMock } from '~/unit-test-utils';
import { useNudgeConfig } from '../useNudgeConfig';

const watchMock = createK8sWatchResourceMock();

const nudgeConfig: NudgeConfigKind = {
  apiVersion: 'appstudio.redhat.com/v1beta2',
  kind: 'NudgeConfig',
  metadata: { name: 'nudge-config', namespace: 'test-ns' },
  spec: { nudges: [{ from: 'a', to: 'b', mode: 'immediate' }] },
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useNudgeConfig', () => {
  it('fetches the singleton nudge-config resource by fixed name', () => {
    watchMock.mockReturnValue([nudgeConfig, true, undefined]);
    renderHook(() => useNudgeConfig('test-ns', true));
    expect(watchMock).toHaveBeenCalledWith(
      {
        groupVersionKind: {
          group: 'appstudio.redhat.com',
          version: 'v1beta2',
          kind: 'NudgeConfig',
        },
        namespace: 'test-ns',
        name: 'nudge-config',
        watch: true,
      },
      NudgeConfigModel,
    );
  });

  it('returns the resource when found', () => {
    watchMock.mockReturnValue([nudgeConfig, true, undefined]);
    const { result } = renderHook(() => useNudgeConfig('test-ns'));
    expect(result.current).toEqual([nudgeConfig, true, undefined]);
  });

  it('treats a 404 as "no NudgeConfig" rather than an error', () => {
    watchMock.mockReturnValue([undefined, true, { code: 404 }]);
    const { result } = renderHook(() => useNudgeConfig('test-ns'));
    expect(result.current).toEqual([null, true, undefined]);
  });

  it('surfaces non-404 errors', () => {
    const error = { code: 403 };
    watchMock.mockReturnValue([undefined, true, error]);
    const { result } = renderHook(() => useNudgeConfig('test-ns'));
    expect(result.current).toEqual([null, true, error]);
  });

  it('reports the loading state', () => {
    watchMock.mockReturnValue([undefined, false, undefined]);
    const { result } = renderHook(() => useNudgeConfig('test-ns'));
    expect(result.current).toEqual([null, false, undefined]);
  });

  it('does not fetch without a namespace', () => {
    watchMock.mockReturnValue({ data: undefined, isLoading: false, error: undefined });
    renderHook(() => useNudgeConfig(''));
    expect(watchMock).toHaveBeenCalledWith(undefined, NudgeConfigModel);
  });
});
