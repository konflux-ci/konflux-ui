type ConsoleMethods = 'log' | 'info' | 'warn' | 'error' | 'debug';

export interface MockConsole {
  log: jest.SpyInstance;
  info: jest.SpyInstance;
  warn: jest.SpyInstance;
  error: jest.SpyInstance;
  debug: jest.SpyInstance;
  /** Restore all console methods to original */
  restore: () => void;
  /** Clear all mock call history */
  clear: () => void;
}

/**
 * Mock all console methods and return spy instances.
 * Call restore() in afterEach to clean up.
 *
 * @example
 * const consoleMock = mockConsole();
 * myFunction(); // calls console.error internally
 * expect(consoleMock.error).toHaveBeenCalledWith('Error message');
 * consoleMock.restore();
 */
export const mockConsole = (): MockConsole => {
  const spies: Record<ConsoleMethods, jest.SpyInstance> = {
    log: jest.spyOn(console, 'log').mockImplementation(),
    info: jest.spyOn(console, 'info').mockImplementation(),
    warn: jest.spyOn(console, 'warn').mockImplementation(),
    error: jest.spyOn(console, 'error').mockImplementation(),
    debug: jest.spyOn(console, 'debug').mockImplementation(),
  };

  return {
    ...spies,
    restore: () => Object.values(spies).forEach((spy) => spy.mockRestore()),
    clear: () => Object.values(spies).forEach((spy) => spy.mockClear()),
  };
};
