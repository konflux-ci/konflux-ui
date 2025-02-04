import type { JestMockedFunction, MockFunction } from './type';

/**
 * Type safe util for jest.fn()
 */
export const createJestMockFunction = <T extends MockFunction>(
  implementation?: (...args: Parameters<T>) => ReturnType<T>,
): JestMockedFunction<T> => jest.fn<ReturnType<T>, Parameters<T>>(implementation);
