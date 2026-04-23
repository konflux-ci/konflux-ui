import { Toolbar, ToolbarContent, ToolbarItem } from '@patternfly/react-core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MultiSelect } from '../MultiSelect';

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

describe('MultiSelect', () => {
  const defaultProps = {
    label: 'Version',
    filterKey: 'version',
    values: [] as string[],
    setValues: jest.fn(),
    options: ['main', 'release-1.0'],
  };

  it('should render options with raw keys when optionLabels is not provided', async () => {
    const user = userEvent.setup();

    renderMultiSelect(defaultProps);

    await user.click(screen.getByRole('button', { name: 'Version filter menu' }));

    expect(screen.getByText('main')).toBeInTheDocument();
    expect(screen.getByText('release-1.0')).toBeInTheDocument();
  });

  it('should render display labels from optionLabels instead of raw keys', async () => {
    const user = userEvent.setup();
    const optionLabels = { main: 'Main Branch', 'release-1.0': 'Release 1.0' };

    renderMultiSelect({ ...defaultProps, optionLabels });

    await user.click(screen.getByRole('button', { name: 'Version filter menu' }));

    expect(screen.getByText('Main Branch')).toBeInTheDocument();
    expect(screen.getByText('Release 1.0')).toBeInTheDocument();
  });

  it('should show chip labels using optionLabels mapping', () => {
    const optionLabels = { main: 'Main Branch', 'release-1.0': 'Release 1.0' };

    renderMultiSelect({ ...defaultProps, values: ['main'], optionLabels });

    expect(screen.getByText('Main Branch')).toBeInTheDocument();
  });

  it('should remove the correct key when a chip with a mapped label is deleted', async () => {
    const setValues = jest.fn();
    const user = userEvent.setup();
    const optionLabels = { main: 'Main Branch', 'release-1.0': 'Release 1.0' };

    renderMultiSelect({
      ...defaultProps,
      values: ['main', 'release-1.0'],
      setValues,
      optionLabels,
    });

    const mainChip = screen.getByText('Main Branch');
    // close button of the `Main Branch` chip
    const closeButton = mainChip.closest('li')?.querySelector('button');
    expect(closeButton).toBeTruthy();
    await user.click(closeButton);

    expect(setValues).toHaveBeenCalledWith(['release-1.0']);
  });

  it('should show raw key in chips when optionLabels is not provided', () => {
    renderMultiSelect({ ...defaultProps, values: ['main'] });

    expect(screen.getByText('main')).toBeInTheDocument();
  });
});
