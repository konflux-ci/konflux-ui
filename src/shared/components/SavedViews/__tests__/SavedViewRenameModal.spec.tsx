import { render, screen, fireEvent } from '@testing-library/react';
import { SavedViewRenameModal } from '../SavedViewRenameModal';

// Access the component directly for testing (not exported by default)
// We import the file which exports the launcher, but we need to test the component
// The component is the default export of the module's internal, so we test via the launcher pattern

describe('SavedViewRenameModal', () => {
  const mockOnClose = jest.fn();
  const mockOnRename = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with current name pre-filled', () => {
    render(
      <SavedViewRenameModal onClose={mockOnClose} onRename={mockOnRename} currentLabel="My View" />,
    );

    const input = screen.getByRole('textbox', { name: /name/i });
    expect(input).toHaveValue('My View');
  });

  it('calls onRename with new name on Rename click', () => {
    render(
      <SavedViewRenameModal onClose={mockOnClose} onRename={mockOnRename} currentLabel="My View" />,
    );

    const input = screen.getByRole('textbox', { name: /name/i });
    fireEvent.change(input, { target: { value: 'Renamed View' } });

    fireEvent.click(screen.getByRole('button', { name: 'Rename' }));

    expect(mockOnRename).toHaveBeenCalledWith('Renamed View');
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('disables Rename button when input is empty', () => {
    render(
      <SavedViewRenameModal onClose={mockOnClose} onRename={mockOnRename} currentLabel="My View" />,
    );

    const input = screen.getByRole('textbox', { name: /name/i });
    fireEvent.change(input, { target: { value: '' } });

    expect(screen.getByRole('button', { name: 'Rename' })).toBeDisabled();
  });

  it('closes without calling onRename on Cancel', () => {
    render(
      <SavedViewRenameModal onClose={mockOnClose} onRename={mockOnRename} currentLabel="My View" />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(mockOnClose).toHaveBeenCalled();
    expect(mockOnRename).not.toHaveBeenCalled();
  });
});
