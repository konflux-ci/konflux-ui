import { renderHook } from '@testing-library/react';
import type { K8sModelCommon } from '../../../types/k8s';
import { useK8sWatchResource } from '../useK8sWatchResource';

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn().mockReturnValue({
    data: undefined,
    isLoading: true,
    error: undefined,
  }),
  hashKey: jest.fn().mockReturnValue('test-key'),
}));

jest.mock('../useK8sQueryWatch', () => ({
  useK8sQueryWatch: jest.fn().mockReturnValue(undefined),
}));

jest.mock('../../k8s-utils', () => ({
  convertToK8sQueryParams: jest.fn().mockReturnValue({}),
}));

jest.mock('../../query/utils', () => ({
  createQueryKeys: jest.fn().mockReturnValue([]),
  createListqueryOptions: jest.fn().mockReturnValue({}),
  createGetQueryOptions: jest.fn().mockReturnValue({}),
}));

const mockModel: K8sModelCommon = {
  kind: 'Secret',
  apiGroup: '',
  apiVersion: 'v1',
  plural: 'secrets',
};

const mockResourceInit = {
  groupVersionKind: { group: '', version: 'v1', kind: 'Secret' },
  namespace: 'test-ns',
  isList: true,
};

describe('useK8sWatchResource', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    warnSpy = jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('should warn when 4th argument appears double-wrapped with requestInit', () => {
    const doubleWrapped = { requestInit: { headers: { Accept: 'application/json' } } };

    renderHook(() =>
      useK8sWatchResource(mockResourceInit, mockModel, undefined, doubleWrapped as never),
    );

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('double-wrapped'));
  });

  it('should not warn when 4th argument has flat options', () => {
    const flatOptions = { headers: { Accept: 'application/json' } };

    renderHook(() =>
      useK8sWatchResource(mockResourceInit, mockModel, undefined, flatOptions as never),
    );

    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('should not warn when 4th argument is empty', () => {
    renderHook(() => useK8sWatchResource(mockResourceInit, mockModel, undefined, {}));

    expect(warnSpy).not.toHaveBeenCalled();
  });
});
