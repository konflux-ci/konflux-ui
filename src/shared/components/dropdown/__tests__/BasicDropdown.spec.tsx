import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import BasicDropdown, { DropdownItemObject } from '../BasicDropdown';
import '@testing-library/jest-dom';

const items: DropdownItemObject[] = [
  { key: 'key1', value: 'value1' },
  { key: 'key2', value: 'value2' },
  { key: 'key3', value: 'value3' },
];

const itemsWithLabels: DropdownItemObject[] = [
  { key: 'key1', value: 'val1', label: 'Label One' },
  { key: 'key2', value: 'val2', label: 'Label Two' },
];

const itemsWithDescriptions: DropdownItemObject[] = [
  { key: 'key1', value: 'val1', label: 'Label One', description: 'Description for one' },
  { key: 'key2', value: 'val2', label: 'Label Two', description: 'Description for two' },
];

afterEach(jest.resetAllMocks);

describe('BasicDropdown', () => {
  it('renders with placeholder when nothing is selected', () => {
    render(<BasicDropdown items={items} variant="default" placeholder="Select an option" />);
    expect(screen.getByText('Select an option')).toBeInTheDocument();
  });

  it('renders selected value in the toggle', () => {
    render(<BasicDropdown items={items} variant="default" selected="value1" />);
    expect(screen.getByTestId('dropdown-toggle')).toHaveTextContent('value1');
  });

  it('renders all menu items when opened', async () => {
    render(<BasicDropdown items={items} variant="default" selected="value1" />);
    fireEvent.click(screen.getByTestId('dropdown-toggle'));
    await waitFor(() => {
      const menuItems = screen.getAllByRole('menuitem');
      expect(menuItems).toHaveLength(3);
      expect(menuItems[0]).toHaveTextContent('value1');
      expect(menuItems[1]).toHaveTextContent('value2');
      expect(menuItems[2]).toHaveTextContent('value3');
    });
  });

  it('displays label text instead of value when label is provided', async () => {
    render(<BasicDropdown items={itemsWithLabels} variant="default" selected="val1" />);
    fireEvent.click(screen.getByTestId('dropdown-toggle'));
    await waitFor(() => {
      const menuItems = screen.getAllByRole('menuitem');
      expect(menuItems[0]).toHaveTextContent('Label One');
      expect(menuItems[1]).toHaveTextContent('Label Two');
    });
  });

  it('falls back to value when label is undefined', async () => {
    render(<BasicDropdown items={items} variant="default" selected="value1" />);
    fireEvent.click(screen.getByTestId('dropdown-toggle'));
    await waitFor(() => {
      const menuItems = screen.getAllByRole('menuitem');
      expect(menuItems[0]).toHaveTextContent('value1');
    });
  });

  it('renders description via PatternFly description prop', async () => {
    render(<BasicDropdown items={itemsWithDescriptions} variant="default" selected="val1" />);
    fireEvent.click(screen.getByTestId('dropdown-toggle'));
    await waitFor(() => {
      expect(screen.getByText('Description for one')).toBeInTheDocument();
      expect(screen.getByText('Description for two')).toBeInTheDocument();
    });
  });

  it('does not render value as description when no description is provided', async () => {
    render(<BasicDropdown items={items} variant="default" selected="value1" />);
    fireEvent.click(screen.getByTestId('dropdown-toggle'));
    await waitFor(() => {
      const menuItems = screen.getAllByRole('menuitem');
      // Items without a description field should not have PF's description element
      menuItems.forEach((item) => {
        const descriptionEl = item.querySelector('.pf-v5-c-menu__item-description');
        expect(descriptionEl).toBeNull();
      });
    });
  });

  it('calls onChange when an item is selected', async () => {
    const onChange = jest.fn();
    render(
      <BasicDropdown items={items} variant="default" selected="value1" onChange={onChange} />,
    );
    fireEvent.click(screen.getByTestId('dropdown-toggle'));
    await waitFor(() => {
      fireEvent.click(screen.getByText('value2'));
    });
    expect(onChange).toHaveBeenCalledWith('value2');
  });

  it('renders Recommended badge for recommended item', async () => {
    render(<BasicDropdown items={items} variant="default" selected="value1" recommended="value2" />);
    fireEvent.click(screen.getByTestId('dropdown-toggle'));
    await waitFor(() => {
      expect(screen.getByText('Recommended')).toBeInTheDocument();
    });
  });
});
