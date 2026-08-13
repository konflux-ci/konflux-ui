import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SelectDropdown } from '~/shared/components/Filter/controls/SelectDropdown';
import { FilterOption, GroupedOptions, OptionItem } from '~/shared/components/Filter/types';

const flatOptions: FilterOption[] = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Archived', value: 'archived' },
];

const flatOptionsWithDivider: OptionItem[] = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { type: 'divider' },
  { label: 'Archived', value: 'archived' },
];

const groupedOptions: GroupedOptions[] = [
  {
    group: 'Status',
    options: [
      { label: 'Active', value: 'active' },
      { label: 'Inactive', value: 'inactive' },
    ],
  },
  {
    group: 'Priority',
    options: [
      { label: 'High', value: 'high' },
      { label: 'Low', value: 'low' },
    ],
  },
];

const clickToggle = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: /filter/i }));
};

describe('SelectDropdown', () => {
  describe('flat options', () => {
    it('renders toggle with provided text', () => {
      render(
        <SelectDropdown
          toggleText="Filter"
          options={flatOptions}
          selected={[]}
          onSelect={jest.fn()}
        />,
      );
      expect(screen.getByRole('button', { name: /filter/i })).toBeInTheDocument();
    });

    it('shows options when opened', async () => {
      const user = userEvent.setup();
      render(
        <SelectDropdown
          toggleText="Filter"
          options={flatOptions}
          selected={[]}
          onSelect={jest.fn()}
        />,
      );

      await clickToggle(user);

      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Inactive')).toBeInTheDocument();
      expect(screen.getByText('Archived')).toBeInTheDocument();
    });

    it('fires onSelect when option is clicked', async () => {
      const onSelect = jest.fn();
      const user = userEvent.setup();
      render(
        <SelectDropdown
          toggleText="Filter"
          options={flatOptions}
          selected={[]}
          onSelect={onSelect}
        />,
      );

      await clickToggle(user);
      await user.click(screen.getByText('Active'));

      expect(onSelect).toHaveBeenCalledWith('active');
    });

    it('renders dividers for DividerOption items', async () => {
      const user = userEvent.setup();
      render(
        <SelectDropdown
          toggleText="Filter"
          options={flatOptionsWithDivider}
          selected={[]}
          onSelect={jest.fn()}
        />,
      );

      await clickToggle(user);

      expect(screen.getByRole('separator')).toBeInTheDocument();
    });

    it('closes dropdown after select when not multiple', async () => {
      const user = userEvent.setup();
      render(
        <SelectDropdown
          toggleText="Filter"
          options={flatOptions}
          selected={[]}
          onSelect={jest.fn()}
        />,
      );

      await clickToggle(user);
      await user.click(screen.getByText('Active'));

      // toggle should no longer be expanded
      expect(screen.getByRole('button', { name: /filter/i })).toHaveAttribute(
        'aria-expanded',
        'false',
      );
    });

    it('keeps dropdown open after select when multiple', async () => {
      const user = userEvent.setup();
      render(
        <SelectDropdown
          toggleText="Filter"
          options={flatOptions}
          selected={[]}
          onSelect={jest.fn()}
          multiple
        />,
      );

      await clickToggle(user);
      await user.click(screen.getByText('Active'));

      // dropdown should remain open
      expect(screen.getByText('Inactive')).toBeInTheDocument();
    });
  });

  describe('grouped options', () => {
    it('renders group labels', async () => {
      const user = userEvent.setup();
      render(
        <SelectDropdown
          toggleText="Filter"
          options={groupedOptions}
          selected={[]}
          onSelect={jest.fn()}
        />,
      );

      await clickToggle(user);

      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Priority')).toBeInTheDocument();
    });

    it('renders options within groups', async () => {
      const user = userEvent.setup();
      render(
        <SelectDropdown
          toggleText="Filter"
          options={groupedOptions}
          selected={[]}
          onSelect={jest.fn()}
        />,
      );

      await clickToggle(user);

      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('High')).toBeInTheDocument();
    });
  });

  describe('checkbox mode', () => {
    it('renders checkboxes when hasCheckbox is true', async () => {
      const user = userEvent.setup();
      render(
        <SelectDropdown
          toggleText="Filter"
          options={flatOptions}
          selected={['active']}
          onSelect={jest.fn()}
          hasCheckbox
          multiple
        />,
      );

      await clickToggle(user);

      // checkbox inputs should be present within the menu
      const menu = screen.getByRole('menu');
      const checkboxes = within(menu).getAllByRole('checkbox');
      expect(checkboxes.length).toBe(3);
    });
  });

  describe('badge', () => {
    it('shows badge with selected count when badge prop is true', () => {
      render(
        <SelectDropdown
          toggleText="Filter"
          options={flatOptions}
          selected={['active', 'inactive']}
          onSelect={jest.fn()}
          badge
        />,
      );

      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('does not show badge when no items are selected', () => {
      render(
        <SelectDropdown
          toggleText="Filter"
          options={flatOptions}
          selected={[]}
          onSelect={jest.fn()}
          badge
        />,
      );

      expect(screen.queryByText('0')).not.toBeInTheDocument();
    });
  });

  describe('description and icon', () => {
    it('renders description when provided on option', async () => {
      const user = userEvent.setup();
      const optionsWithDesc: FilterOption[] = [
        { label: 'Active', value: 'active', description: 'Currently running' },
      ];
      render(
        <SelectDropdown
          toggleText="Filter"
          options={optionsWithDesc}
          selected={[]}
          onSelect={jest.fn()}
        />,
      );

      await clickToggle(user);

      expect(screen.getByText('Currently running')).toBeInTheDocument();
    });

    it('renders icon when provided on option', async () => {
      const user = userEvent.setup();
      const TestIcon = () => <span data-test="test-icon">icon</span>;
      const optionsWithIcon: FilterOption[] = [
        { label: 'Active', value: 'active', icon: <TestIcon /> },
      ];
      render(
        <SelectDropdown
          toggleText="Filter"
          options={optionsWithIcon}
          selected={[]}
          onSelect={jest.fn()}
        />,
      );

      await clickToggle(user);

      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    });
  });

  describe('toggleIcon', () => {
    it('renders toggle icon when provided', () => {
      const ToggleIcon = () => <span data-test="toggle-icon">TI</span>;
      render(
        <SelectDropdown
          toggleText="Filter"
          toggleIcon={<ToggleIcon />}
          options={flatOptions}
          selected={[]}
          onSelect={jest.fn()}
        />,
      );

      expect(screen.getByTestId('toggle-icon')).toBeInTheDocument();
    });
  });

  describe('isDisabled', () => {
    it('disables the toggle when isDisabled is true', () => {
      render(
        <SelectDropdown
          toggleText="Filter"
          options={flatOptions}
          selected={[]}
          onSelect={jest.fn()}
          isDisabled
        />,
      );

      expect(screen.getByRole('button', { name: /filter/i })).toBeDisabled();
    });
  });
});
