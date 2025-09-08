import * as ApplicationHook from '../hooks/useApplications';
import { createJestMockFunction } from './common';
import type { JestMockedFunction, MockFunctionKeys } from './type';

type ApplicationHookModule = {
  [K in MockFunctionKeys<typeof ApplicationHook>]: (typeof ApplicationHook)[K];
};

export const createUseApplicationMock = (
  initialValue: unknown = [{ metadata: { name: '' } }, false, null],
): jest.Mock => {
  const mockFn = jest.fn().mockReturnValue(initialValue);

  jest.spyOn(ApplicationHook, 'useApplication').mockImplementation(mockFn);

  beforeEach(() => {
    mockFn.mockReturnValue(initialValue);
  });

  return mockFn;
};

export const mockApplicationHooks = <T extends MockFunctionKeys<ApplicationHookModule>>(
  name: T,
  initialValue: ReturnType<ApplicationHookModule[T]>,
): JestMockedFunction<ApplicationHookModule[T]> => {
  const mockFn = createJestMockFunction<ApplicationHookModule[T]>().mockReturnValue(initialValue);

  jest.spyOn(ApplicationHook, name).mockImplementation(mockFn);

  return mockFn;
};
