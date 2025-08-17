import { render, screen, fireEvent } from '@testing-library/react';
import { BaseTextFilterToolbar } from '../BaseTextFIlterToolbar';

describe('BaseTextFilterToolbar', () => {
  const mockSetText = jest.fn();
  const mockOnClearFilters = jest.fn();
  const mockOpenColumnManagement = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render search input with correct attributes', () => {
    render(
      <BaseTextFilterToolbar
        text=""
        label="name"
        setText={mockSetText}
        onClearFilters={mockOnClearFilters}
      />
    );

    const searchInput = screen.getByRole('textbox');
    expect(searchInput).toHaveAttribute('placeholder', 'Filter by name...');
    expect(searchInput).toHaveAttribute('aria-label', 'name filter');
  });

  it('should show column management button when openColumnManagement is provided and totalColumns > 6', () => {
    render(
      <BaseTextFilterToolbar
        text=""
        label="name"
        setText={mockSetText}
        onClearFilters={mockOnClearFilters}
        openColumnManagement={mockOpenColumnManagement}
        totalColumns={8}
      />
    );

    const manageColumnsButton = screen.getByRole('button', { name: /manage columns/i });
    expect(manageColumnsButton).toBeInTheDocument();
  });

  it('should NOT show column management button when totalColumns <= 6', () => {
    render(
      <BaseTextFilterToolbar
        text=""
        label="name"
        setText={mockSetText}
        onClearFilters={mockOnClearFilters}
        openColumnManagement={mockOpenColumnManagement}
        totalColumns={5}
      />
    );

    const manageColumnsButton = screen.queryByRole('button', { name: /manage columns/i });
    expect(manageColumnsButton).not.toBeInTheDocument();
  });

  it('should NOT show column management button when openColumnManagement is not provided', () => {
    render(
      <BaseTextFilterToolbar
        text=""
        label="name"
        setText={mockSetText}
        onClearFilters={mockOnClearFilters}
        totalColumns={8}
      />
    );

    const manageColumnsButton = screen.queryByRole('button', { name: /manage columns/i });
    expect(manageColumnsButton).not.toBeInTheDocument();
  });

  it('should call openColumnManagement when manage columns button is clicked', () => {
    render(
      <BaseTextFilterToolbar
        text=""
        label="name"
        setText={mockSetText}
        onClearFilters={mockOnClearFilters}
        openColumnManagement={mockOpenColumnManagement}
        totalColumns={8}
      />
    );

    const manageColumnsButton = screen.getByRole('button', { name: /manage columns/i });
    fireEvent.click(manageColumnsButton);

    expect(mockOpenColumnManagement).toHaveBeenCalledTimes(1);
  });

  it('should call setText with debounced value when search input changes', () => {
    jest.useFakeTimers();
    
    render(
      <BaseTextFilterToolbar
        text=""
        label="name"
        setText={mockSetText}
        onClearFilters={mockOnClearFilters}
      />
    );

    const searchInput = screen.getByRole('textbox');
    fireEvent.change(searchInput, { target: { value: 'test search' } });

    // Fast-forward time to trigger debounced function
    jest.advanceTimersByTime(600);

    expect(mockSetText).toHaveBeenCalledWith('test search');
    
    jest.useRealTimers();
  });

  it('should render children when provided', () => {
    render(
      <BaseTextFilterToolbar
        text=""
        label="name"
        setText={mockSetText}
        onClearFilters={mockOnClearFilters}
      >
        <div data-testid="custom-child">Custom child component</div>
      </BaseTextFilterToolbar>
    );

    expect(screen.getByText('Custom child component')).toBeInTheDocument();
  });
});
