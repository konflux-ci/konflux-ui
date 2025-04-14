import { render, screen, fireEvent } from '@testing-library/react';
import SelectComponentsDropdown from '../SelectComponnetsDropdown';

describe('SelectComponentsDropdown', () => {
  const mockOnSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with default props', () => {
    render(
      <SelectComponentsDropdown toggleText="Select" onSelect={mockOnSelect}>
        <div>Child Component</div>
      </SelectComponentsDropdown>,
    );

    expect(screen.getByText('Select')).toBeInTheDocument();
    expect(screen.queryByText('Child Component')).not.toBeInTheDocument();
  });

  it('toggles the dropdown menu when the toggle is clicked', () => {
    render(
      <SelectComponentsDropdown toggleText="Select" onSelect={mockOnSelect}>
        <div>Child Component</div>
      </SelectComponentsDropdown>,
    );

    fireEvent.click(screen.getByText('Select'));
    expect(screen.getByText('Child Component')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Select'));
    expect(screen.queryByText('Child Component')).not.toBeInTheDocument();
  });

  it('calls onSelect when a menu item is selected', () => {
    render(
      <SelectComponentsDropdown toggleText="Select" onSelect={mockOnSelect} closeOnSelect>
        <button data-test="menu-item" onClick={() => mockOnSelect('item1')}>
          Item 1
        </button>
      </SelectComponentsDropdown>,
    );

    fireEvent.click(screen.getByText('Select'));
    fireEvent.click(screen.getByTestId('menu-item'));
    expect(mockOnSelect).toHaveBeenCalledWith('item1');
  });

  it('does not close the menu when closeOnSelect is false', () => {
    render(
      <SelectComponentsDropdown toggleText="Select" onSelect={mockOnSelect} closeOnSelect={false}>
        <button data-test="menu-item" onClick={() => mockOnSelect('item1')}>
          Item 1
        </button>
      </SelectComponentsDropdown>,
    );

    fireEvent.click(screen.getByText('Select'));
    fireEvent.click(screen.getByTestId('menu-item'));

    expect(mockOnSelect).toHaveBeenCalledWith('item1');
    expect(screen.getByText('Item 1')).toBeInTheDocument();
  });

  it('displays a badge when badgeValue is provided', () => {
    render(
      <SelectComponentsDropdown toggleText="Select" onSelect={mockOnSelect} badgeValue={5}>
        <div>Child Component</div>
      </SelectComponentsDropdown>,
    );

    expect(screen.getByText('5')).toBeInTheDocument();
  });
});
