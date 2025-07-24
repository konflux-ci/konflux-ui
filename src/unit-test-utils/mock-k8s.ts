import * as k8s from '../k8s';
import * as kubearchiveFetchUtil from '../kubearchive/fetch-utils';
// Mock utilities for k8s and kubearchive functions

/**
 * Transforms return data for useK8sWatchResource hook to new format
 */
export const transformReturnDataForUseK8sWatchResource = (args: unknown[]) => {
  const [data, loaded, error] = args;
  return {
    data,
    isLoading: typeof loaded === 'boolean' ? !loaded : undefined,
    error,
  };
};

/**
 * Creates a mock for useK8sWatchResource hook
 */
export const createK8sWatchResourceMock = () => {
  const mockFn = jest.fn();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockImplementation = (returnValue: any) => {
    if (Array.isArray(returnValue)) {
      const [data, loaded, error] = returnValue;
      return {
        data: data ?? [],
        isLoading: typeof loaded === 'boolean' ? !loaded : undefined,
        error,
      };
    }
    return returnValue;
  };

  jest
    .spyOn(k8s, 'useK8sWatchResource')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unnecessary-type-assertion
    .mockImplementation((...args) => mockImplementation(mockFn(...args)) as any);

  return mockFn;
};

export const createK8sUtilMock = (name: string) => {
  const mockFn = jest.fn();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  jest.spyOn(k8s as any, name).mockImplementation(mockFn);

  return mockFn;
};

export const createKubearchiveUtilMock = (name: string) => {
  const mockFn = jest.fn();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  jest.spyOn(kubearchiveFetchUtil as any, name).mockImplementation(mockFn);

  return mockFn;
};
