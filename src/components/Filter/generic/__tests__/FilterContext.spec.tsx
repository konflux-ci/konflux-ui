import { useContext } from 'react';
import { renderHook } from '@testing-library/react';
import { FilterContext } from '../FilterContext';

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
