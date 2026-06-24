import { Toolbar, ToolbarContent, ToolbarItem } from '@patternfly/react-core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MENU_DIVIDER, MultiSelect } from '../MultiSelect';

const renderMultiSelect = (props: React.ComponentProps<typeof MultiSelect>) =>
  render(
    <Toolbar>
      <ToolbarContent>
        <ToolbarItem>
          <MultiSelect {...props} />
        </ToolbarItem>
      </ToolbarContent>
    </Toolbar>,
  );

const defaultOptions = [{ key: 'main' }, { key: 'release-1.0' }];

describe('MultiSelect', () => {
  const defaultProps = {
    label: 'Version',
    filterKey: 'version',
    values: [] as string[],
    setValues: jest.fn(),
    options: defaultOptions,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render options with raw keys when labels are not provided', async () => {
    const user = userEvent.setup();

    renderMultiSelect(defaultProps);

    await user.click(screen.getByRole('button', { name: 'Version filter menu' }));

    expect(screen.getByText('main')).toBeInTheDocument();
    expect(screen.getByText('release-1.0')).toBeInTheDocument();
  });

  it('should render display labels from options instead of raw keys', async () => {
    const user = userEvent.setup();
    const options = [
      { key: 'main', label: 'Main Branch' },
      { key: 'release-1.0', label: 'Release 1.0' },
    ];

    renderMultiSelect({ ...defaultProps, options });

    await user.click(screen.getByRole('button', { name: 'Version filter menu' }));

    expect(screen.getByText('Main Branch')).toBeInTheDocument();
    expect(screen.getByText('Release 1.0')).toBeInTheDocument();
  });

  it('should use custom placeholder, toggle aria label, and start expanded when configured', async () => {
    const user = userEvent.setup();

    renderMultiSelect({
      ...defaultProps,
      placeholderText: 'Pick a version',
      toggleAriaLabel: 'Custom version filter',
      defaultExpanded: true,
    });

    const toggle = screen.getByRole('button', { name: 'Custom version filter' });
    expect(toggle).toHaveTextContent('Pick a version');
    expect(toggle).toHaveAttribute('aria-expanded', 'true');

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('should show chip labels using option label mapping', () => {
    const options = [
      { key: 'main', label: 'Main Branch' },
      { key: 'release-1.0', label: 'Release 1.0' },
    ];

    renderMultiSelect({ ...defaultProps, values: ['main'], options });

    expect(screen.getByText('Main Branch')).toBeInTheDocument();
  });

  it('should show badge with selected count when values are selected', () => {
    renderMultiSelect({ ...defaultProps, values: ['main', 'release-1.0'] });

    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('should remove the correct key when a chip with a mapped label is deleted', async () => {
    const setValues = jest.fn();
    const user = userEvent.setup();
    const options = [
      { key: 'main', label: 'Main Branch' },
      { key: 'release-1.0', label: 'Release 1.0' },
    ];

    renderMultiSelect({
      ...defaultProps,
      values: ['main', 'release-1.0'],
      setValues,
      options,
    });

    const mainChip = screen.getByText('Main Branch');
    const closeButton = mainChip.closest('li')?.querySelector('button');
    expect(closeButton).toBeTruthy();
    await user.click(closeButton);

    expect(setValues).toHaveBeenCalledWith(['release-1.0']);
  });

  it('should remove chip using raw key when label is not in the mapping', async () => {
    const setValues = jest.fn();
    const user = userEvent.setup();

    renderMultiSelect({
      ...defaultProps,
      values: ['unknown-key'],
      setValues,
      options: [{ key: 'main', label: 'Main Branch' }],
    });

    const chip = screen.getByText('unknown-key');
    const closeButton = chip.closest('li')?.querySelector('button');
    expect(closeButton).toBeTruthy();
    await user.click(closeButton);

    expect(setValues).toHaveBeenCalledWith([]);
  });

  it('should clear all values when chip group is deleted', async () => {
    const setValues = jest.fn();
    const user = userEvent.setup();

    renderMultiSelect({
      ...defaultProps,
      values: ['main', 'release-1.0'],
      setValues,
    });

    await user.click(screen.getByRole('button', { name: 'Close label group Version' }));

    expect(setValues).toHaveBeenCalledWith([]);
  });

  it('should add a value when an unselected option is chosen', async () => {
    const setValues = jest.fn();
    const user = userEvent.setup();

    renderMultiSelect({ ...defaultProps, setValues });

    await user.click(screen.getByRole('button', { name: 'Version filter menu' }));
    await user.click(
      screen.getByLabelText(/main/i, {
        selector: 'input',
      }),
    );

    expect(setValues).toHaveBeenCalledWith(['main']);
  });

  it('should remove a value when a selected option is chosen again', async () => {
    const setValues = jest.fn();
    const user = userEvent.setup();

    renderMultiSelect({ ...defaultProps, values: ['main'], setValues });

    await user.click(screen.getByRole('button', { name: 'Version filter menu' }));
    await user.click(
      screen.getByLabelText(/main/i, {
        selector: 'input',
      }),
    );

    expect(setValues).toHaveBeenCalledWith([]);
  });

  it('should render a divider for menu divider options', async () => {
    const user = userEvent.setup();
    const options = [{ key: `${MENU_DIVIDER}1` }, { key: 'main' }];

    renderMultiSelect({ ...defaultProps, options });

    await user.click(screen.getByRole('button', { name: 'Version filter menu' }));

    expect(screen.getByRole('separator')).toBeInTheDocument();
    expect(screen.getByText('main')).toBeInTheDocument();
  });

  it('should show raw key in chips when labels are not provided', () => {
    renderMultiSelect({ ...defaultProps, values: ['main'] });

    expect(screen.getByText('main')).toBeInTheDocument();
  });
});
