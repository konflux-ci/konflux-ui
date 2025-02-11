import * as NamespaceHook from '../shared/providers/Namespace/useNamespaceInfo';
import { createJestMockFunction } from './common';
import type { JestMockedFunction, MockFunctionKeys } from './type';

type NamespaceHook = {
  [K in MockFunctionKeys<typeof NamespaceHook>]: (typeof NamespaceHook)[K];
};

export const mockNamespaceHooks = <T extends MockFunctionKeys<NamespaceHook>>(
  name: T,
  initialValue: ReturnType<NamespaceHook[T]>,
): JestMockedFunction<NamespaceHook[T]> => {
  const mockFn = createJestMockFunction<NamespaceHook[T]>().mockReturnValue(initialValue);

  jest.spyOn(NamespaceHook, name).mockImplementation(mockFn);

  return mockFn;
};

export const mockUseNamespaceHook = (initialValue: ReturnType<NamespaceHook['useNamespace']>) =>
  mockNamespaceHooks('useNamespace', initialValue);
