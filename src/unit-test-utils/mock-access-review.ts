import * as AccessReviewUtils from '../utils/rbac';
import { createJestMockFunction } from './common';
import type { JestMockedFunction, MockFunctionKeys } from './type';

type AccessReviewFunction = {
  [K in MockFunctionKeys<typeof AccessReviewUtils>]: (typeof AccessReviewUtils)[K];
};

export const mockAccessReviewUtil = <T extends MockFunctionKeys<AccessReviewFunction>>(
  name: T,
  resolution?: ReturnType<AccessReviewFunction[T]>,
): JestMockedFunction<AccessReviewFunction[T]> => {
  const mockFn = createJestMockFunction<AccessReviewFunction[T]>().mockReturnValue(resolution);
  jest.spyOn(AccessReviewUtils, name).mockImplementation(mockFn);
  return mockFn;
};

export const mockAccessReviewUtilImplementation = <
  T extends MockFunctionKeys<AccessReviewFunction>,
>(
  name: T,
  implementation?: (
    ...args: Parameters<AccessReviewFunction[T]>
  ) => ReturnType<AccessReviewFunction[T]>,
): JestMockedFunction<AccessReviewFunction[T]> => {
  const mockFn = createJestMockFunction<AccessReviewFunction[T]>(implementation);
  jest.spyOn(AccessReviewUtils, name).mockImplementation(mockFn);
  return mockFn;
};
