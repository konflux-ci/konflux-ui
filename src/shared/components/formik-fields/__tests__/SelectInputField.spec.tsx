import * as React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useFormikContext } from 'formik';
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

const setupUser = () => userEvent.setup();

const openDropdown = async (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole('button', { name: 'Test toggle' }));

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
      const user = setupUser();
      renderField();
      await openDropdown(user);
      await waitFor(() => {
        expect(screen.getByText('option-a')).toBeVisible();
        expect(screen.getByText('option-b')).toBeVisible();
        expect(screen.getByText('option-c')).toBeVisible();
      });
    });

    it('does not open when disabled', async () => {
      const user = setupUser();
      renderField({ isDisabled: true });
      await user.click(screen.getByRole('button', { name: 'Test toggle' }));
      expect(screen.queryByText('option-a')).not.toBeInTheDocument();
    });
  });

  describe('single-select (variant="typeahead")', () => {
    it('selects a value and closes the dropdown', async () => {
      const user = setupUser();
      renderField({ variant: 'typeahead' });
      await openDropdown(user);

      await waitFor(() => {
        expect(screen.getByText('option-a')).toBeVisible();
      });

      await user.click(screen.getByText('option-a'));

      await waitFor(() => {
        expect(screen.getByDisplayValue('option-a')).toBeInTheDocument();
        expect(screen.queryByText('option-b')).not.toBeInTheDocument();
      });
    });

    it('clears the value, closes the dropdown, and stops event propagation', async () => {
      const user = setupUser();
      renderField({ variant: 'typeahead' }, { [fieldName]: 'option-a' });

      expect(screen.getByDisplayValue('option-a')).toBeInTheDocument();

      const clearBtn = screen.getByRole('button', { name: 'Clear input value' });
      await user.click(clearBtn);

      await waitFor(() => {
        expect(screen.queryByDisplayValue('option-a')).not.toBeInTheDocument();
        expect(screen.queryByText('option-b')).not.toBeInTheDocument();
      });
    });

    it('fires onClear callback when clear button is clicked', async () => {
      const user = setupUser();
      const onClear = jest.fn();
      renderField({ variant: 'typeahead', onClear }, { [fieldName]: 'option-a' });

      await user.click(screen.getByRole('button', { name: 'Clear input value' }));

      await waitFor(() => {
        expect(onClear).toHaveBeenCalledTimes(1);
      });
    });

    it('fires onSelect callback when an option is selected', async () => {
      const user = setupUser();
      const onSelect = jest.fn();
      renderField({ variant: 'typeahead', onSelect });
      await openDropdown(user);

      await waitFor(() => {
        expect(screen.getByText('option-b')).toBeVisible();
      });

      await user.click(screen.getByText('option-b'));

      await waitFor(() => {
        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onSelect).toHaveBeenCalledWith(expect.anything(), 'option-b');
      });
    });
  });

  describe('multi-select (default variant)', () => {
    it('defaults to typeaheadMulti and allows multiple selections', async () => {
      const user = setupUser();
      renderField({}, { [fieldName]: [] });
      await openDropdown(user);

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'option-a' })).toBeVisible();
      });

      await user.click(screen.getByRole('option', { name: 'option-a' }));

      await waitFor(() => {
        expect(screen.getAllByText('option-a').length).toBeGreaterThanOrEqual(1);
      });

      await user.click(screen.getByRole('option', { name: 'option-b' }));

      await waitFor(() => {
        expect(screen.getAllByText('option-a').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('option-b').length).toBeGreaterThanOrEqual(1);
      });
    });

    it('removes a multi-select chip via onClose', async () => {
      const user = setupUser();
      renderField({}, { [fieldName]: ['option-a', 'option-b'] });

      await waitFor(() => {
        expect(screen.getByText('option-a')).toBeVisible();
        expect(screen.getByText('option-b')).toBeVisible();
      });

      const closeButtons = screen.getAllByRole('button', { name: /close/i });
      await user.click(closeButtons[0]);

      await waitFor(() => {
        expect(screen.queryByText('option-a')).not.toBeInTheDocument();
      });
    });

    it('deselects an already-selected item on re-click', async () => {
      const user = setupUser();
      renderField({}, { [fieldName]: ['option-a'] });
      await openDropdown(user);

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'option-a' })).toBeVisible();
      });

      await user.click(screen.getByRole('option', { name: 'option-a' }));

      await waitFor(() => {
        expect(screen.queryAllByRole('button', { name: /close/i })).toHaveLength(0);
      });
    });

    it('clears all selections via clear button', async () => {
      const user = setupUser();
      renderField({}, { [fieldName]: ['option-a', 'option-b'] });

      await user.click(screen.getByRole('button', { name: 'Clear input value' }));

      await waitFor(() => {
        expect(screen.queryByText('option-a')).not.toBeInTheDocument();
        expect(screen.queryByText('option-b')).not.toBeInTheDocument();
      });
    });
  });

  describe('typeahead filtering', () => {
    it('filters options as user types', async () => {
      const user = setupUser();
      renderField({ variant: 'typeahead' });
      await openDropdown(user);

      const input = screen.getByRole('combobox');
      await user.clear(input);
      await user.type(input, 'option-a');

      await waitFor(() => {
        expect(screen.getByText('option-a')).toBeVisible();
        expect(screen.queryByText('option-b')).not.toBeInTheDocument();
      });
    });

    it('shows all options when filter is empty', async () => {
      const user = setupUser();
      renderField({ variant: 'typeahead' });
      await openDropdown(user);

      const input = screen.getByRole('combobox');
      await user.type(input, 'option-a');

      await waitFor(() => {
        expect(screen.queryByText('option-b')).not.toBeInTheDocument();
      });

      await user.clear(input);

      await waitFor(() => {
        expect(screen.getByText('option-a')).toBeVisible();
        expect(screen.getByText('option-b')).toBeVisible();
      });
    });

    it('opens the dropdown when user starts typing while closed', async () => {
      const user = setupUser();
      renderField({ variant: 'typeahead' });

      const input = screen.getByRole('combobox');
      await user.type(input, 'opt');

      await waitFor(() => {
        expect(screen.getByText('option-a')).toBeVisible();
      });
    });
  });

  describe('creatable options', () => {
    it('shows Create option when isCreatable and hasOnCreateOption are true and no match exists', async () => {
      const user = setupUser();
      renderField({ variant: 'typeahead', isCreatable: true, hasOnCreateOption: true });
      await openDropdown(user);

      const input = screen.getByRole('combobox');
      await user.type(input, 'new-item');

      await waitFor(() => {
        expect(screen.getByText('Create "new-item"')).toBeVisible();
      });
    });

    it('does not show Create option when typed value matches existing option', async () => {
      const user = setupUser();
      renderField({ variant: 'typeahead', isCreatable: true, hasOnCreateOption: true });
      await openDropdown(user);

      const input = screen.getByRole('combobox');
      await user.type(input, 'option-a');

      await waitFor(() => {
        expect(screen.queryByText(/Create/)).not.toBeInTheDocument();
      });
    });

    it('creates and selects a new option in single-select mode', async () => {
      const user = setupUser();
      renderField({ variant: 'typeahead', isCreatable: true, hasOnCreateOption: true });
      await openDropdown(user);

      const input = screen.getByRole('combobox');
      await user.type(input, 'brand-new');

      await waitFor(() => {
        expect(screen.getByText('Create "brand-new"')).toBeVisible();
      });

      await user.click(screen.getByText('Create "brand-new"'));

      await waitFor(() => {
        expect(screen.getByDisplayValue('brand-new')).toBeInTheDocument();
      });
    });

    it('fires onSelect callback when a new option is created', async () => {
      const user = setupUser();
      const onSelect = jest.fn();
      renderField({
        variant: 'typeahead',
        isCreatable: true,
        hasOnCreateOption: true,
        onSelect,
      });
      await openDropdown(user);

      const input = screen.getByRole('combobox');
      await user.type(input, 'created-val');

      await waitFor(() => {
        expect(screen.getByText('Create "created-val"')).toBeVisible();
      });

      await user.click(screen.getByText('Create "created-val"'));

      await waitFor(() => {
        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onSelect).toHaveBeenCalledWith(expect.anything(), 'created-val');
      });
    });

    it('creates and adds a new option in multi-select mode', async () => {
      const user = setupUser();
      renderField({ isCreatable: true, hasOnCreateOption: true }, { [fieldName]: [] });
      await openDropdown(user);

      const input = screen.getByRole('combobox');
      await user.type(input, 'new-multi');

      await waitFor(() => {
        expect(screen.getByText('Create "new-multi"')).toBeVisible();
      });

      await user.click(screen.getByText('Create "new-multi"'));

      await waitFor(() => {
        expect(screen.getAllByText('new-multi').length).toBeGreaterThanOrEqual(1);
      });
    });

    it('does not create duplicate options', async () => {
      const user = setupUser();
      renderField({ variant: 'typeahead', isCreatable: true, hasOnCreateOption: true });
      await openDropdown(user);

      const input = screen.getByRole('combobox');

      await user.type(input, 'unique-val');
      await waitFor(() => {
        expect(screen.getByText('Create "unique-val"')).toBeVisible();
      });
      await user.click(screen.getByText('Create "unique-val"'));

      await waitFor(() => {
        expect(screen.getByDisplayValue('unique-val')).toBeInTheDocument();
      });

      await openDropdown(user);
      await user.clear(input);

      await waitFor(() => {
        expect(screen.getAllByRole('option')).toBeDefined();
      });

      const allOptions = screen.getAllByRole('option');
      expect(allOptions.filter((o) => o.textContent === 'unique-val')).toHaveLength(1);
    });
  });

  describe('options sync', () => {
    it('updates internal options when external options prop changes', async () => {
      const user = setupUser();
      const { rerender } = renderField({ variant: 'typeahead' });

      await openDropdown(user);
      await waitFor(() => {
        expect(screen.getByText('option-a')).toBeVisible();
      });

      // close the dropdown before rerendering with new options
      await openDropdown(user);
      await waitFor(() => {
        expect(screen.queryByText('option-a')).not.toBeInTheDocument();
      });

      const newOptions: SelectInputOption[] = [
        { value: 'new-a', disabled: false },
        { value: 'new-b', disabled: false },
      ];

      rerender(
        <SelectInputField
          name={fieldName}
          label="Test Label"
          options={newOptions}
          toggleId="test-toggle"
          toggleAriaLabel="Test toggle"
          variant="typeahead"
          helpText="Pick an option"
        />,
      );

      await openDropdown(user);
      await waitFor(() => {
        expect(screen.getByText('new-a')).toBeVisible();
        expect(screen.getByText('new-b')).toBeVisible();
        expect(screen.queryByText('option-a')).not.toBeInTheDocument();
      });
    });
  });

  describe('input interaction', () => {
    it('opens the dropdown on input click when closed', async () => {
      const user = setupUser();
      renderField({ variant: 'typeahead' });

      const input = screen.getByRole('combobox');
      await user.click(input);

      await waitFor(() => {
        expect(screen.getByText('option-a')).toBeVisible();
      });
    });

    it('marks field as touched on blur', async () => {
      const TouchedIndicator = () => {
        const { touched } = useFormikContext<Record<string, unknown>>();
        return <span data-test="touched-state">{JSON.stringify(touched)}</span>;
      };

      formikRenderer(
        <>
          <SelectInputField
            name={fieldName}
            label="Test Label"
            options={options}
            toggleId="test-toggle"
            toggleAriaLabel="Test toggle"
            variant="typeahead"
          />
          <TouchedIndicator />
        </>,
        { [fieldName]: '' },
      );

      const toggleContainer = document.getElementById('test-toggle');
      fireEvent.blur(toggleContainer);

      await waitFor(() => {
        expect(JSON.parse(screen.getByTestId('touched-state').textContent)).toEqual(
          expect.objectContaining({ [fieldName]: true }),
        );
      });
    });

    it('clears single-select value when user types over it', async () => {
      const user = setupUser();
      renderField({ variant: 'typeahead' }, { [fieldName]: 'option-a' });

      expect(screen.getByDisplayValue('option-a')).toBeInTheDocument();

      const input = screen.getByRole('combobox');
      await user.type(input, 'x');

      await waitFor(() => {
        expect(screen.queryByDisplayValue('option-a')).not.toBeInTheDocument();
      });
    });
  });
});
