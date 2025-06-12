import { act, fireEvent, render, screen } from '@testing-library/react';
import PipelineRunsFilterToolbar from '../PipelineRunsFilterToolbar';

jest.mock('lodash-es', () => ({ debounce: jest.fn((fn) => fn) }));

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
    await act(() =>
      fireEvent.change(name, {
        target: { value: 'test' },
      }),
    );
    expect(name.value).toBe('test');
    expect(setFilters.mock.calls).toHaveLength(1);
    expect(setFilters.mock.calls[0][0]).toStrictEqual({ name: 'test', status: [], type: [] });
  });

  it('it should update status filter', () => {
    const setFilters = jest.fn();

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
    fireEvent.click(statusFilter);
    expect(statusFilter).toHaveAttribute('aria-expanded', 'true');

    const succeededOption = screen.getByLabelText(/succeeded/i, {
      selector: 'input',
    });

    fireEvent.click(succeededOption);

    expect(setFilters.mock.calls).toHaveLength(1);
    expect(setFilters.mock.calls[0][0]).toStrictEqual({
      name: '',
      status: ['Succeeded'],
      type: [],
    });
  });

  it('it should update type filter', () => {
    const setFilters = jest.fn();

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
    fireEvent.click(typeFilter);
    expect(typeFilter).toHaveAttribute('aria-expanded', 'true');

    const buildOption = screen.getByLabelText(/build/i, {
      selector: 'input',
    });

    fireEvent.click(buildOption);

    expect(setFilters.mock.calls).toHaveLength(1);
    expect(setFilters.mock.calls[0][0]).toStrictEqual({
      name: '',
      status: [],
      type: ['build'],
    });
  });
});
