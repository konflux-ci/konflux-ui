import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TEXT_SEARCH_TYPES } from '~/consts/constants';
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

  it('should render search type dropdown when searchOptions are provided', () => {
    render(
      <BaseTextFilterToolbar
        text=""
        label="name"
        setText={mockSetText}
        onClearFilters={mockOnClearFilters}
        searchOptions={Object.values(TEXT_SEARCH_TYPES)}
      />,
    );

    expect(screen.getByRole('button', { name: TEXT_SEARCH_TYPES.NAME })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Filter by name...')).toBeInTheDocument();
  });

  it('should update placeholder when search type changes', async () => {
    const user = userEvent.setup();

    render(
      <BaseTextFilterToolbar
        text=""
        label="name"
        setText={mockSetText}
        onClearFilters={mockOnClearFilters}
        searchOptions={Object.values(TEXT_SEARCH_TYPES)}
      />,
    );

    await user.click(screen.getByRole('button', { name: TEXT_SEARCH_TYPES.NAME }));
    await user.click(screen.getByRole('menuitem', { name: TEXT_SEARCH_TYPES.VERSION }));

    expect(screen.getByPlaceholderText('Filter by version...')).toBeInTheDocument();
    expect(mockSetText).toHaveBeenCalledWith('', TEXT_SEARCH_TYPES.VERSION);
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
        searchOptions={Object.values(TEXT_SEARCH_TYPES)}
      />,
    );

    const searchInput = screen.getByRole('textbox');
    await user.type(searchInput, 'test search');

    jest.advanceTimersByTime(600);

    expect(mockSetText).toHaveBeenCalledWith('test search', TEXT_SEARCH_TYPES.NAME);

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
        <div data-test="custom-child">Custom child component</div>
      </BaseTextFilterToolbar>,
    );

    expect(screen.getByText('Custom child component')).toBeInTheDocument();
  });

  it('should hide search input when showSearchInput is false', () => {
    render(
      <BaseTextFilterToolbar
        text=""
        label="name"
        setText={mockSetText}
        onClearFilters={mockOnClearFilters}
        showSearchInput={false}
      />,
    );

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('should apply no left padding when noLeftPadding is true', () => {
    const { container } = render(
      <BaseTextFilterToolbar
        text=""
        label="name"
        setText={mockSetText}
        onClearFilters={mockOnClearFilters}
        noLeftPadding
        dataTest="toolbar-no-padding"
      />,
    );

    expect(container.querySelector('.pf-v5-c-toolbar__content')).toHaveStyle({
      paddingLeft: '0',
    });
  });
});
