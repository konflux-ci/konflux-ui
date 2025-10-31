import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PipelineRunsFilterToolbar from '../PipelineRunsFilterToolbar';

describe('PipelineRunsFilterToolbar', () => {
  it('it should render filter tooblar accurately', () => {
    render(
      <PipelineRunsFilterToolbar
        filters={{
          name: '',
          commit: '',
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
          commit: '',
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
          commit: '',
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
          commit: '',
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
});
