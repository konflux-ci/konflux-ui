import { act, fireEvent, render, screen } from '@testing-library/react';
import PipelineRunsFilterToolbar from '../PipelineRunsFilterToolbar';

jest.mock('lodash-es', () => ({ debounce: jest.fn((fn) => fn) }));

describe('PipelineRunsFilterToolbar', () => {
  it('it should render filter tooblar accurately', () => {
    render(
      <PipelineRunsFilterToolbar
        filters={{
          nameFilter: '',
          statusFilter: [],
          typeFilter: [],
        }}
        dispatchFilters={jest.fn()}
        typeOptions={{ build: 2, test: 2 }}
        statusOptions={{ Succeeded: 4 }}
      />,
    );

    expect(screen.getByTestId('pipelinerun-list-toolbar')).toBeVisible();
    expect(screen.getByRole('textbox', { name: 'name filter' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Status filter menu' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Type filter menu' })).toBeVisible();
  });

  it('it should update name filter', async () => {
    const dispatchFilters = jest.fn();

    render(
      <PipelineRunsFilterToolbar
        filters={{
          nameFilter: '',
          statusFilter: [],
          typeFilter: [],
        }}
        dispatchFilters={dispatchFilters}
        typeOptions={{ build: 2, test: 2 }}
        statusOptions={{ Succeeded: 4 }}
      />,
    );

    const nameFilter = screen.getByPlaceholderText<HTMLInputElement>('Filter by name...');
    await act(() =>
      fireEvent.change(nameFilter, {
        target: { value: 'test' },
      }),
    );
    expect(nameFilter.value).toBe('test');
    expect(dispatchFilters.mock.calls).toHaveLength(1);
    expect(dispatchFilters.mock.calls[0][0]).toStrictEqual({ type: 'SET_NAME', payload: 'test' });
  });

  it('it should update status filter', () => {
    const dispatchFilters = jest.fn();

    render(
      <PipelineRunsFilterToolbar
        filters={{
          nameFilter: '',
          statusFilter: [],
          typeFilter: [],
        }}
        dispatchFilters={dispatchFilters}
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

    expect(dispatchFilters.mock.calls).toHaveLength(1);
    expect(dispatchFilters.mock.calls[0][0]).toStrictEqual({
      type: 'SET_STATUS',
      payload: ['Succeeded'],
    });
  });

  it('it should update type filter', () => {
    const dispatchFilters = jest.fn();

    render(
      <PipelineRunsFilterToolbar
        filters={{
          nameFilter: '',
          statusFilter: [],
          typeFilter: [],
        }}
        dispatchFilters={dispatchFilters}
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

    expect(dispatchFilters.mock.calls).toHaveLength(1);
    expect(dispatchFilters.mock.calls[0][0]).toStrictEqual({
      type: 'SET_TYPE',
      payload: ['build'],
    });
  });
});
