import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PipelineRunsFilterToolbar from '../PipelineRunsFilterToolbar';

describe('PipelineRunsFilterToolbar', () => {
  it('it should render filter tooblar accurately', () => {
    render(
      <PipelineRunsFilterToolbar
        filters={{
          name: '',
          status: [],
          type: [],
        }}
        setFilters={jest.fn()}
        onClearFilters={jest.fn()}
        typeOptions={{ build: 2, test: 2 }}
        statusOptions={{ Succeeded: 4 }}
      />,
    );

    expect(screen.getByRole('textbox', { name: 'name filter' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Status filter menu' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Type filter menu' })).toBeVisible();
  });

  it('it should update name filter', async () => {
    const setFilters = jest.fn();
    const user = userEvent.setup();

    render(
      <PipelineRunsFilterToolbar
        filters={{
          name: '',
          status: [],
          type: [],
        }}
        setFilters={setFilters}
        onClearFilters={jest.fn()}
        typeOptions={{ build: 2, test: 2 }}
        statusOptions={{ Succeeded: 4 }}
      />,
    );

    const name = screen.getByPlaceholderText<HTMLInputElement>('Filter by name...');
    await user.type(name, 'test');
    expect(name.value).toBe('test');
    await waitFor(() => expect(setFilters).toHaveBeenCalledTimes(1));
    expect(setFilters).toHaveBeenCalledWith({ name: 'test', status: [], type: [] });
  });

  it('it should update status filter', async () => {
    const setFilters = jest.fn();
    const user = userEvent.setup();

    render(
      <PipelineRunsFilterToolbar
        filters={{
          name: '',
          status: [],
          type: [],
        }}
        setFilters={setFilters}
        onClearFilters={jest.fn()}
        typeOptions={{ build: 2, test: 2 }}
        statusOptions={{ Succeeded: 4 }}
      />,
    );

    const statusFilter = screen.getByRole('button', {
      name: /status filter menu/i,
    });
    await user.click(statusFilter);
    expect(statusFilter).toHaveAttribute('aria-expanded', 'true');

    const succeededOption = screen.getByLabelText(/succeeded/i, {
      selector: 'input',
    });

    await user.click(succeededOption);

    expect(setFilters).toHaveBeenCalledTimes(1);
    expect(setFilters).toHaveBeenCalledWith({
      name: '',
      status: ['Succeeded'],
      type: [],
    });
  });

  it('it should update type filter', async () => {
    const setFilters = jest.fn();
    const user = userEvent.setup();

    render(
      <PipelineRunsFilterToolbar
        filters={{
          name: '',
          status: [],
          type: [],
        }}
        setFilters={setFilters}
        onClearFilters={jest.fn()}
        typeOptions={{ build: 2, test: 2 }}
        statusOptions={{ Succeeded: 4 }}
      />,
    );

    const typeFilter = screen.getByRole('button', {
      name: /type filter menu/i,
    });
    await user.click(typeFilter);
    expect(typeFilter).toHaveAttribute('aria-expanded', 'true');

    const buildOption = screen.getByLabelText(/build/i, {
      selector: 'input',
    });

    await user.click(buildOption);

    expect(setFilters).toHaveBeenCalledTimes(1);
    expect(setFilters).toHaveBeenCalledWith({
      name: '',
      status: [],
      type: ['build'],
    });
  });

  it('should not render version filter when versionOptions is not provided', () => {
    render(
      <PipelineRunsFilterToolbar
        filters={{
          name: '',
          status: [],
          type: [],
        }}
        setFilters={jest.fn()}
        onClearFilters={jest.fn()}
        typeOptions={{ build: 2, test: 2 }}
        statusOptions={{ Succeeded: 4 }}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Version filter menu' })).not.toBeInTheDocument();
  });

  it('should render version filter when versionOptions is provided', () => {
    render(
      <PipelineRunsFilterToolbar
        filters={{
          name: '',
          status: [],
          type: [],
          version: [],
        }}
        setFilters={jest.fn()}
        onClearFilters={jest.fn()}
        typeOptions={{ build: 2, test: 2 }}
        statusOptions={{ Succeeded: 4 }}
        versionOptions={{ main: 0, 'release-1.0': 0 }}
      />,
    );

    expect(screen.getByRole('button', { name: 'Version filter menu' })).toBeVisible();
  });

  it('should update version filter when a version option is selected', async () => {
    const setFilters = jest.fn();
    const user = userEvent.setup();

    render(
      <PipelineRunsFilterToolbar
        filters={{
          name: '',
          status: [],
          type: [],
          version: [],
        }}
        setFilters={setFilters}
        onClearFilters={jest.fn()}
        typeOptions={{ build: 2, test: 2 }}
        statusOptions={{ Succeeded: 4 }}
        // Counts must be > 0 for an option to be enabled (MultiSelect uses isDisabled={count === 0}).
        versionOptions={{ main: 1, 'release-1.0': 0 }}
      />,
    );

    const versionFilter = screen.getByRole('button', {
      name: /version filter menu/i,
    });
    await user.click(versionFilter);
    expect(versionFilter).toHaveAttribute('aria-expanded', 'true');

    const mainOption = screen.getByLabelText(/main/i, {
      selector: 'input',
    });
    await user.click(mainOption);

    expect(setFilters).toHaveBeenCalledTimes(1);
    expect(setFilters).toHaveBeenCalledWith({
      name: '',
      status: [],
      type: [],
      version: ['main'],
    });
  });

  it('should display optionLabels instead of keys when versionLabels is provided', async () => {
    const user = userEvent.setup();

    render(
      <PipelineRunsFilterToolbar
        filters={{
          name: '',
          status: [],
          type: [],
          version: [],
        }}
        setFilters={jest.fn()}
        onClearFilters={jest.fn()}
        typeOptions={{ build: 2, test: 2 }}
        statusOptions={{ Succeeded: 4 }}
        versionOptions={{ main: 0, 'release-1.0': 0 }}
        versionLabels={{ main: 'Main Branch', 'release-1.0': 'Release 1.0' }}
      />,
    );

    const versionFilter = screen.getByRole('button', {
      name: /version filter menu/i,
    });
    await user.click(versionFilter);

    expect(screen.getByText('Main Branch')).toBeInTheDocument();
    expect(screen.getByText('Release 1.0')).toBeInTheDocument();
  });
});
