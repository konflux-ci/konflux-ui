import { useContext } from 'react';
import { createSearchParams, useSearchParams } from 'react-router-dom';
import { renderHook, act } from '@testing-library/react';
import { FilterContext, FilterContextProvider } from '../FilterContext';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useSearchParams: jest.fn(),
}));

describe('FilterContext', () => {
  it('should create a context with default values', () => {
    const { result } = renderHook(() => useContext(FilterContext));
    expect(result.current.filters).toEqual({});
    expect(result.current.setFilters).toBeInstanceOf(Function);
    expect(result.current.onClearFilters).toBeInstanceOf(Function);
  });

  it('should provide the correct values to the context', () => {
    const mockSetFilters = jest.fn();
    const mockOnClearFilters = jest.fn();

    const { result } = renderHook(() => useContext(FilterContext), {
      wrapper: ({ children }) => (
        <FilterContext.Provider
          value={{
            filters: { name: 'test' },
            setFilters: mockSetFilters,
            onClearFilters: mockOnClearFilters,
          }}
        >
          {children}
        </FilterContext.Provider>
      ),
    });

    expect(result.current.filters).toEqual({ name: 'test' });
    expect(result.current.setFilters).toBe(mockSetFilters);
    expect(result.current.onClearFilters).toBe(mockOnClearFilters);
  });
});

describe('FilterContextProvider parsing behavior', () => {
  const mockSetSearchParams = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useSearchParams as jest.Mock).mockImplementation(() => [
      createSearchParams({}),
      mockSetSearchParams,
    ]);
  });

  it('should preserve plain string values when getting and setting filters', () => {
    // setup initial URL param
    (useSearchParams as jest.Mock).mockImplementation(() => [
      createSearchParams({ name: 'testrepo-b5746' }),
      mockSetSearchParams,
    ]);

    const { result } = renderHook(() => useContext(FilterContext), {
      wrapper: ({ children }) => (
        <FilterContextProvider filterParams={['name']}>{children}</FilterContextProvider>
      ),
    });

    // check that we get the plain string value correctly
    expect(result.current.filters).toEqual({ name: 'testrepo-b5746' });

    // set a new plain string value
    act(() => {
      result.current.setFilters({ name: 'new-repo-name' });
    });

    // verify the string was set without modification
    expect(mockSetSearchParams).toHaveBeenCalled();
    const params = mockSetSearchParams.mock.calls[0][0];
    expect(params.get('name')).toBe('new-repo-name');
  });

  it('should handle JSON values correctly', () => {
    // setup initial URL param with a JSON string
    (useSearchParams as jest.Mock).mockImplementation(() => [
      createSearchParams({ data: '{"key":"value"}' }),
      mockSetSearchParams,
    ]);

    const { result } = renderHook(() => useContext(FilterContext), {
      wrapper: ({ children }) => (
        <FilterContextProvider filterParams={['data']}>{children}</FilterContextProvider>
      ),
    });

    // check that JSON is parsed correctly
    expect(result.current.filters).toEqual({ data: { key: 'value' } });
  });

  it('should handle null values correctly', () => {
    // setup initial URL param with empty and null values
    (useSearchParams as jest.Mock).mockImplementation(() => [
      createSearchParams({
        empty: '',
        nullValue: null as unknown as string,
      }),
      mockSetSearchParams,
    ]);

    const { result } = renderHook(() => useContext(FilterContext), {
      wrapper: ({ children }) => (
        <FilterContextProvider filterParams={['empty', 'nullValue']}>
          {children}
        </FilterContextProvider>
      ),
    });

    // check that empty and null values are handled correctly
    expect(result.current.filters).toEqual({
      empty: null,
      nullValue: null,
    });
  });
});
