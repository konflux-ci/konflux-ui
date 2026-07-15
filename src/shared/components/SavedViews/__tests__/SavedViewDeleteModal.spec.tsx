import { render, screen, fireEvent } from '@testing-library/react';
import { SavedViewDeleteModal } from '../SavedViewDeleteModal';

describe('SavedViewDeleteModal', () => {
  const mockOnClose = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders view label in confirmation text', () => {
    render(
      <SavedViewDeleteModal onClose={mockOnClose} onDelete={mockOnDelete} viewLabel="My View" />,
    );

    expect(screen.getByText('My View')).toBeInTheDocument();
    expect(screen.getByText(/are you sure you want to delete/i)).toBeInTheDocument();
    expect(screen.getByText(/this action cannot be undone/i)).toBeInTheDocument();
  });

  it('calls onDelete on Delete click', () => {
    render(
      <SavedViewDeleteModal onClose={mockOnClose} onDelete={mockOnDelete} viewLabel="My View" />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(mockOnDelete).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('closes without calling onDelete on Cancel', () => {
    render(
      <SavedViewDeleteModal onClose={mockOnClose} onDelete={mockOnDelete} viewLabel="My View" />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(mockOnClose).toHaveBeenCalled();
    expect(mockOnDelete).not.toHaveBeenCalled();
  });
});
