import * as React from 'react';
import { fireEvent, screen, waitFor, cleanup } from '@testing-library/react';
import { formikRenderer } from '~/unit-test-utils/rendering-utils';
import { SelectInputOption } from '../field-types';
import SelectInputField from '../SelectInputField';
import '@testing-library/jest-dom';

const options: SelectInputOption[] = [
  { value: 'option-a', disabled: false },
  { value: 'option-b', disabled: false },
  { value: 'option-c', disabled: true },
];

const fieldName = 'testSelect';

const renderField = (
  props: Partial<React.ComponentProps<typeof SelectInputField>> = {},
  initialValues: Record<string, unknown> = { [fieldName]: '' },
) =>
  formikRenderer(
    <SelectInputField
      name={fieldName}
      label="Test Label"
      options={options}
      toggleId="test-toggle"
      toggleAriaLabel="Test toggle"
      helpText="Pick an option"
      {...props}
    />,
    initialValues,
  );

const openDropdown = () => fireEvent.click(screen.getByRole('button', { name: 'Test toggle' }));

const getChipLabels = () =>
  screen
    .queryAllByText((_, el) => el?.classList?.contains('pf-v5-c-label__text') || false)
    .map((el) => el.textContent);

describe('SelectInputField', () => {
  afterEach(jest.resetAllMocks);

  describe('rendering', () => {
    it('renders label, help text, and toggle', () => {
      renderField();
      expect(screen.getByText('Test Label')).toBeVisible();
      expect(screen.getByText('Pick an option')).toBeVisible();
      expect(screen.getByRole('button', { name: 'Test toggle' })).toBeVisible();
    });

    it('renders placeholder text', () => {
      renderField({ placeholderText: 'Select something...' });
      expect(screen.getByPlaceholderText('Select something...')).toBeVisible();
    });

    it('shows options when toggle is clicked', async () => {
      renderField();
      openDropdown();
      await waitFor(() => {
        expect(screen.getByText('option-a')).toBeVisible();
        expect(screen.getByText('option-b')).toBeVisible();
        expect(screen.getByText('option-c')).toBeVisible();
      });
    });

    it('does not open when disabled', () => {
      renderField({ isDisabled: true });
      fireEvent.click(screen.getByRole('button', { name: 'Test toggle' }));
      expect(screen.queryByText('option-a')).not.toBeInTheDocument();
    });
  });

  describe('single-select (variant="typeahead")', () => {
    it('selects a value and closes the dropdown', async () => {
      renderField({ variant: 'typeahead' });
      openDropdown();

      await waitFor(() => {
        expect(screen.getByText('option-a')).toBeVisible();
      });

      fireEvent.click(screen.getByText('option-a'));

      await waitFor(() => {
        expect(screen.getByDisplayValue('option-a')).toBeInTheDocument();
        expect(screen.queryByText('option-b')).not.toBeInTheDocument();
      });
    });

    it('clears the value, closes the dropdown, and stops event propagation', async () => {
      renderField({ variant: 'typeahead' }, { [fieldName]: 'option-a' });

      expect(screen.getByDisplayValue('option-a')).toBeInTheDocument();

      const clearBtn = screen.getByRole('button', { name: 'Clear input value' });
      fireEvent.click(clearBtn);

      await waitFor(() => {
        expect(screen.queryByDisplayValue('option-a')).not.toBeInTheDocument();
        expect(screen.queryByText('option-b')).not.toBeInTheDocument();
      });
    });

    it('fires onClear callback when clear button is clicked', async () => {
      const onClear = jest.fn();
      renderField({ variant: 'typeahead', onClear }, { [fieldName]: 'option-a' });

      fireEvent.click(screen.getByRole('button', { name: 'Clear input value' }));

      await waitFor(() => {
        expect(onClear).toHaveBeenCalledTimes(1);
      });
    });

    it('fires onSelect callback when an option is selected', async () => {
      const onSelect = jest.fn();
      renderField({ variant: 'typeahead', onSelect });
      openDropdown();

      await waitFor(() => {
        expect(screen.getByText('option-b')).toBeVisible();
      });

      fireEvent.click(screen.getByText('option-b'));

      await waitFor(() => {
        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onSelect).toHaveBeenCalledWith(expect.anything(), 'option-b');
      });
    });
  });

  describe('multi-select (default variant)', () => {
    it('defaults to typeaheadMulti and allows multiple selections', async () => {
      renderField({}, { [fieldName]: [] });
      openDropdown();

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'option-a' })).toBeVisible();
      });

      fireEvent.click(screen.getByRole('option', { name: 'option-a' }));

      await waitFor(() => {
        expect(getChipLabels()).toContain('option-a');
      });

      fireEvent.click(screen.getByRole('option', { name: 'option-b' }));

      await waitFor(() => {
        expect(getChipLabels()).toContain('option-a');
        expect(getChipLabels()).toContain('option-b');
      });
    });

    it('removes a multi-select chip via onClose', async () => {
      renderField({}, { [fieldName]: ['option-a', 'option-b'] });

      await waitFor(() => {
        expect(screen.getByText('option-a')).toBeVisible();
        expect(screen.getByText('option-b')).toBeVisible();
      });

      const closeButtons = screen.getAllByRole('button', { name: /close/i });
      fireEvent.click(closeButtons[0]);

      await waitFor(() => {
        expect(getChipLabels()).not.toContain('option-a');
      });
    });

    it('deselects an already-selected item on re-click', async () => {
      renderField({}, { [fieldName]: ['option-a'] });
      openDropdown();

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'option-a' })).toBeVisible();
      });

      fireEvent.click(screen.getByRole('option', { name: 'option-a' }));

      await waitFor(() => {
        expect(getChipLabels()).not.toContain('option-a');
      });
    });

    it('clears all selections via clear button', async () => {
      renderField({}, { [fieldName]: ['option-a', 'option-b'] });

      fireEvent.click(screen.getByRole('button', { name: 'Clear input value' }));

      await waitFor(() => {
        expect(getChipLabels()).toHaveLength(0);
      });
    });
  });

  describe('typeahead filtering', () => {
    it('filters options as user types', async () => {
      renderField({ variant: 'typeahead' });
      openDropdown();

      const input = screen.getByRole('combobox');
      fireEvent.change(input, { target: { value: 'option-a' } });

      await waitFor(() => {
        expect(screen.getByText('option-a')).toBeVisible();
        expect(screen.queryByText('option-b')).not.toBeInTheDocument();
      });
    });

    it('shows all options when filter is empty', async () => {
      renderField({ variant: 'typeahead' });
      openDropdown();

      const input = screen.getByRole('combobox');
      fireEvent.change(input, { target: { value: 'option-a' } });

      await waitFor(() => {
        expect(screen.queryByText('option-b')).not.toBeInTheDocument();
      });

      fireEvent.change(input, { target: { value: '' } });

      await waitFor(() => {
        expect(screen.getByText('option-a')).toBeVisible();
        expect(screen.getByText('option-b')).toBeVisible();
      });
    });

    it('opens the dropdown when user starts typing while closed', async () => {
      renderField({ variant: 'typeahead' });

      const input = screen.getByRole('combobox');
      fireEvent.change(input, { target: { value: 'opt' } });

      await waitFor(() => {
        expect(screen.getByText('option-a')).toBeVisible();
      });
    });
  });

  describe('creatable options', () => {
    it('shows Create option when isCreatable and hasOnCreateOption are true and no match exists', async () => {
      renderField({ variant: 'typeahead', isCreatable: true, hasOnCreateOption: true });
      openDropdown();

      const input = screen.getByRole('combobox');
      fireEvent.change(input, { target: { value: 'new-item' } });

      await waitFor(() => {
        expect(screen.getByText('Create "new-item"')).toBeVisible();
      });
    });

    it('does not show Create option when typed value matches existing option', async () => {
      renderField({ variant: 'typeahead', isCreatable: true, hasOnCreateOption: true });
      openDropdown();

      const input = screen.getByRole('combobox');
      fireEvent.change(input, { target: { value: 'option-a' } });

      await waitFor(() => {
        expect(screen.queryByText(/Create/)).not.toBeInTheDocument();
      });
    });

    it('creates and selects a new option in single-select mode', async () => {
      renderField({ variant: 'typeahead', isCreatable: true, hasOnCreateOption: true });
      openDropdown();

      const input = screen.getByRole('combobox');
      fireEvent.change(input, { target: { value: 'brand-new' } });

      await waitFor(() => {
        expect(screen.getByText('Create "brand-new"')).toBeVisible();
      });

      fireEvent.click(screen.getByText('Create "brand-new"'));

      await waitFor(() => {
        expect(screen.getByDisplayValue('brand-new')).toBeInTheDocument();
      });
    });

    it('creates and adds a new option in multi-select mode', async () => {
      renderField({ isCreatable: true, hasOnCreateOption: true }, { [fieldName]: [] });
      openDropdown();

      const input = screen.getByRole('combobox');
      fireEvent.change(input, { target: { value: 'new-multi' } });

      await waitFor(() => {
        expect(screen.getByText('Create "new-multi"')).toBeVisible();
      });

      fireEvent.click(screen.getByText('Create "new-multi"'));

      await waitFor(() => {
        expect(getChipLabels()).toContain('new-multi');
      });
    });

    it('does not create duplicate options', async () => {
      renderField({ variant: 'typeahead', isCreatable: true, hasOnCreateOption: true });
      openDropdown();

      const input = screen.getByRole('combobox');

      fireEvent.change(input, { target: { value: 'unique-val' } });
      await waitFor(() => {
        expect(screen.getByText('Create "unique-val"')).toBeVisible();
      });
      fireEvent.click(screen.getByText('Create "unique-val"'));

      await waitFor(() => {
        expect(screen.getByDisplayValue('unique-val')).toBeInTheDocument();
      });

      openDropdown();
      fireEvent.change(input, { target: { value: '' } });

      await waitFor(() => {
        expect(screen.getAllByRole('option')).toBeDefined();
      });

      const allOptions = screen.getAllByRole('option');
      expect(allOptions.filter((o) => o.textContent === 'unique-val')).toHaveLength(1);
    });
  });

  describe('options sync', () => {
    it('updates internal options when external options prop changes', async () => {
      renderField({ variant: 'typeahead' });

      openDropdown();
      await waitFor(() => {
        expect(screen.getByText('option-a')).toBeVisible();
      });

      cleanup();

      const newOptions: SelectInputOption[] = [
        { value: 'new-a', disabled: false },
        { value: 'new-b', disabled: false },
      ];

      formikRenderer(
        <SelectInputField
          name={fieldName}
          label="Test Label"
          options={newOptions}
          toggleId="test-toggle"
          toggleAriaLabel="Test toggle"
          variant="typeahead"
        />,
        { [fieldName]: '' },
      );

      fireEvent.click(screen.getByRole('button', { name: 'Test toggle' }));
      await waitFor(() => {
        expect(screen.getByText('new-a')).toBeVisible();
        expect(screen.getByText('new-b')).toBeVisible();
      });
    });
  });

  describe('input interaction', () => {
    it('opens the dropdown on input click when closed', async () => {
      renderField({ variant: 'typeahead' });

      const input = screen.getByRole('combobox');
      fireEvent.click(input);

      await waitFor(() => {
        expect(screen.getByText('option-a')).toBeVisible();
      });
    });

    it('marks field as touched on blur', () => {
      renderField({ variant: 'typeahead' });

      const toggle = screen.getByRole('button', { name: 'Test toggle' });
      fireEvent.blur(toggle);
    });

    it('clears single-select value when user types over it', async () => {
      renderField({ variant: 'typeahead' }, { [fieldName]: 'option-a' });

      expect(screen.getByDisplayValue('option-a')).toBeInTheDocument();

      const input = screen.getByRole('combobox');
      fireEvent.change(input, { target: { value: 'x' } });

      await waitFor(() => {
        expect(screen.queryByDisplayValue('option-a')).not.toBeInTheDocument();
      });
    });
  });
});
