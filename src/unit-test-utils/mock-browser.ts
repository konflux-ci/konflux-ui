/**
 * Mock window.location with custom properties
 */
export const mockLocation = (location?: {
  hash?: string;
  port?: number;
  pathname?: string;
  search?: string;
  origin?: string;
  hostname?: string;
}) => {
  const windowLocation = JSON.stringify(window.location);
  delete (window as Window & { location?: Location }).location;
  Object.defineProperty(window, 'location', {
    configurable: true,
    writable: true,
    value: JSON.parse(windowLocation),
  });
  if (location) {
    Object.assign(window.location, location);
  }
};

/**
 * Mock window.fetch for testing HTTP requests
 * Returns a cleanup function to restore original fetch
 */
export const mockWindowFetch = (): (() => void) => {
  const originalFetch = window.fetch;

  // Ensure window.fetch exists before mocking
  if (typeof window.fetch !== 'function') {
    (window as Window & { fetch?: typeof fetch }).fetch = jest.fn() as typeof fetch;
  }

  // Use jest.spyOn to mock fetch
  jest.spyOn(window, 'fetch').mockImplementation(() =>
    Promise.resolve({
      json: () => Promise.resolve({ data: 'mocked data' }),
      text: () => Promise.resolve('mocked text'),
      blob: () => Promise.resolve(new Blob(['mocked blob'])),
      ok: true,
      status: 200,
      statusText: 'OK',
    } as Response),
  );

  // Return a cleanup function
  return () => {
    (window as Window & { fetch?: typeof fetch }).fetch = originalFetch;
    jest.restoreAllMocks();
  };
};
