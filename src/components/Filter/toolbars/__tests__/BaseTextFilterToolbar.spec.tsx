import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
      />,
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
      />,
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
      />,
    );

    const manageColumnsButton = screen.queryByRole('button', { name: /manage columns/i });
    expect(manageColumnsButton).not.toBeInTheDocument();
  });

  it('should call openColumnManagement when manage columns button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <BaseTextFilterToolbar
        text=""
        label="name"
        setText={mockSetText}
        onClearFilters={mockOnClearFilters}
        openColumnManagement={mockOpenColumnManagement}
        totalColumns={8}
      />,
    );

    const manageColumnsButton = screen.getByRole('button', { name: /manage columns/i });
    await user.click(manageColumnsButton);

    expect(mockOpenColumnManagement).toHaveBeenCalledTimes(1);
  });

  it('should call setText with debounced value and search type when search input changes', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    render(
      <BaseTextFilterToolbar
        text=""
        label="name"
        setText={mockSetText}
        onClearFilters={mockOnClearFilters}
      />,
    );

    const searchInput = screen.getByRole('textbox');
    await user.type(searchInput, 'test search');

    // Fast-forward time to trigger debounced function
    jest.advanceTimersByTime(600);

    expect(mockSetText).toHaveBeenCalledWith('test search', '');

    jest.useRealTimers();
  });

  it('should render Name/Version dropdown when filterOptions is non-empty', async () => {
    const user = userEvent.setup();
    render(
      <BaseTextFilterToolbar
        text=""
        label="name"
        setText={mockSetText}
        onClearFilters={mockOnClearFilters}
        filterOptions={['Name', 'Version']}
      />,
    );

    expect(screen.getByRole('button', { name: 'Name' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Name' }));
    expect(await screen.findByRole('menuitem', { name: 'Version' })).toBeInTheDocument();
  });

  it('should call setText with search option Name when filterOptions includes Name', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    render(
      <BaseTextFilterToolbar
        text=""
        label="name"
        setText={mockSetText}
        onClearFilters={mockOnClearFilters}
        filterOptions={['Name', 'Version']}
      />,
    );

    const searchInput = screen.getByRole('textbox', { name: 'name filter' });
    await user.type(searchInput, 'abc');
    jest.advanceTimersByTime(600);

    expect(mockSetText).toHaveBeenCalledWith('abc', 'Name');

    jest.useRealTimers();
  });

  it('should call setText with search option Version after selecting Version', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    render(
      <BaseTextFilterToolbar
        text=""
        label="name"
        setText={mockSetText}
        onClearFilters={mockOnClearFilters}
        filterOptions={['Name', 'Version']}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Name' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Version' }));

    const searchInput = screen.getByRole('textbox', { name: 'name filter' });
    await user.type(searchInput, 'v23');
    jest.advanceTimersByTime(600);

    expect(mockSetText).toHaveBeenCalledWith('v23', 'Version');
    jest.useRealTimers();
  });

  it('should not render search input when showSearchInput is false', () => {
    render(
      <BaseTextFilterToolbar
        text=""
        label="name"
        setText={mockSetText}
        onClearFilters={mockOnClearFilters}
        showSearchInput={false}
      >
        <div>child</div>
      </BaseTextFilterToolbar>,
    );

    expect(screen.queryByRole('textbox', { name: 'name filter' })).not.toBeInTheDocument();
    expect(screen.getByText('child')).toBeInTheDocument();
  });

  it('should set data-test on toolbar when dataTest is provided', () => {
    const { container } = render(
      <BaseTextFilterToolbar
        text=""
        label="name"
        setText={mockSetText}
        onClearFilters={mockOnClearFilters}
        dataTest="my-toolbar"
      />,
    );

    expect(container.querySelector('[data-test="my-toolbar"]')).toBeInTheDocument();
  });

  it('should not render search-type dropdown when filterOptions is empty', () => {
    render(
      <BaseTextFilterToolbar
        text=""
        label="name"
        setText={mockSetText}
        onClearFilters={mockOnClearFilters}
        filterOptions={[]}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Name' })).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'name filter' })).toBeVisible();
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
      </BaseTextFilterToolbar>,
    );

    expect(screen.getByText('Custom child component')).toBeInTheDocument();
  });
});
