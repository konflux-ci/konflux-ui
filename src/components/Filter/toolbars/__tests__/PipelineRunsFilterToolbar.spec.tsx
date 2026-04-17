import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PipelineRunsFilterToolbar from '../PipelineRunsFilterToolbar';

const defaultFilters = {
  name: '',
  status: [] as string[],
  type: [] as string[],
  version: '',
};

describe('PipelineRunsFilterToolbar', () => {
  it('it should render filter toolbar accurately', () => {
    render(
      <PipelineRunsFilterToolbar
        filters={defaultFilters}
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

  it('it should update name filter when search type is Name', async () => {
    const setFilters = jest.fn();
    const user = userEvent.setup();

    render(
      <PipelineRunsFilterToolbar
        filters={defaultFilters}
        setFilters={setFilters}
        onClearFilters={jest.fn()}
        typeOptions={{ build: 2, test: 2 }}
        statusOptions={{ Succeeded: 4 }}
        filterOptions={['Name', 'Version']}
      />,
    );

    const nameInput = screen.getByPlaceholderText<HTMLInputElement>('Filter by name...');
    await user.type(nameInput, 'test');
    expect(nameInput.value).toBe('test');
    await waitFor(() => expect(setFilters).toHaveBeenCalledTimes(1));
    expect(setFilters).toHaveBeenCalledWith({
      name: 'test',
      version: '',
      status: [],
      type: [],
    });
  });

  it('it should update status filter', async () => {
    const setFilters = jest.fn();
    const user = userEvent.setup();

    render(
      <PipelineRunsFilterToolbar
        filters={defaultFilters}
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
      version: '',
    });
  });

  it('it should update type filter', async () => {
    const setFilters = jest.fn();
    const user = userEvent.setup();

    render(
      <PipelineRunsFilterToolbar
        filters={defaultFilters}
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
      version: '',
    });
  });

  it('should not render Name/Version dropdown when filterOptions is not provided', () => {
    render(
      <PipelineRunsFilterToolbar
        filters={defaultFilters}
        setFilters={jest.fn()}
        onClearFilters={jest.fn()}
        typeOptions={{ build: 2, test: 2 }}
        statusOptions={{ Succeeded: 4 }}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Name' })).not.toBeInTheDocument();
  });

  it('should not render Name/Version dropdown when filterOptions is an empty array', () => {
    render(
      <PipelineRunsFilterToolbar
        filters={defaultFilters}
        setFilters={jest.fn()}
        onClearFilters={jest.fn()}
        typeOptions={{ build: 2, test: 2 }}
        statusOptions={{ Succeeded: 4 }}
        filterOptions={[]}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Name' })).not.toBeInTheDocument();
  });

  it('should render Name/Version dropdown when filterOptions is provided', () => {
    render(
      <PipelineRunsFilterToolbar
        filters={defaultFilters}
        setFilters={jest.fn()}
        onClearFilters={jest.fn()}
        typeOptions={{ build: 2, test: 2 }}
        statusOptions={{ Succeeded: 4 }}
        filterOptions={['Name', 'Version']}
      />,
    );

    expect(screen.getByRole('button', { name: 'Name' })).toBeVisible();
  });

  it('should update version search when search type is Version', async () => {
    jest.useFakeTimers();
    const setFilters = jest.fn();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    render(
      <PipelineRunsFilterToolbar
        filters={defaultFilters}
        setFilters={setFilters}
        onClearFilters={jest.fn()}
        typeOptions={{ build: 2, test: 2 }}
        statusOptions={{ Succeeded: 4 }}
        filterOptions={['Name', 'Version']}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Name' }));
    await user.click(screen.getByRole('menuitem', { name: 'Version' }));

    const searchInput = screen.getByRole('textbox', { name: 'name filter' });
    await user.type(searchInput, 'main');
    jest.advanceTimersByTime(600);

    await waitFor(() => expect(setFilters).toHaveBeenCalled());
    expect(setFilters).toHaveBeenCalledWith({
      name: '',
      version: 'main',
      status: [],
      type: [],
    });

    jest.useRealTimers();
  });
});
