import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TEXT_SEARCH_TYPES } from '~/consts/constants';
import PipelineRunsFilterToolbar from '../PipelineRunsFilterToolbar';

const typeOptions = [
  { key: 'build', count: 2 },
  { key: 'test', count: 2 },
];
const statusOptions = [{ key: 'Succeeded', count: 4 }];
const searchOptions = Object.values(TEXT_SEARCH_TYPES);

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
        typeOptions={typeOptions}
        statusOptions={statusOptions}
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
          version: '',
        }}
        setFilters={setFilters}
        onClearFilters={jest.fn()}
        typeOptions={typeOptions}
        statusOptions={statusOptions}
      />,
    );

    const name = screen.getByPlaceholderText<HTMLInputElement>('Filter by name...');
    await user.type(name, 'test');
    expect(name.value).toBe('test');
    await waitFor(() => expect(setFilters).toHaveBeenCalledTimes(1));
    expect(setFilters).toHaveBeenCalledWith({ name: 'test', status: [], type: [], version: '' });
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
        typeOptions={typeOptions}
        statusOptions={statusOptions}
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
        typeOptions={typeOptions}
        statusOptions={statusOptions}
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

  it('should not render search type dropdown when searchOptions is not provided', () => {
    render(
      <PipelineRunsFilterToolbar
        filters={{
          name: '',
          status: [],
          type: [],
        }}
        setFilters={jest.fn()}
        onClearFilters={jest.fn()}
        typeOptions={typeOptions}
        statusOptions={statusOptions}
      />,
    );

    expect(screen.queryByRole('button', { name: TEXT_SEARCH_TYPES.NAME })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Version filter menu' })).not.toBeInTheDocument();
  });

  it('should render search type dropdown when searchOptions is provided', () => {
    render(
      <PipelineRunsFilterToolbar
        filters={{
          name: '',
          status: [],
          type: [],
          version: '',
        }}
        setFilters={jest.fn()}
        onClearFilters={jest.fn()}
        typeOptions={typeOptions}
        statusOptions={statusOptions}
        searchOptions={searchOptions}
      />,
    );

    expect(screen.getByRole('button', { name: TEXT_SEARCH_TYPES.NAME })).toBeVisible();
    expect(screen.getByPlaceholderText('Filter by name...')).toBeVisible();
  });

  it('should update version filter when Version search type is selected', async () => {
    jest.useFakeTimers();
    const setFilters = jest.fn();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    render(
      <PipelineRunsFilterToolbar
        filters={{
          name: '',
          status: [],
          type: [],
          version: '',
        }}
        setFilters={setFilters}
        onClearFilters={jest.fn()}
        typeOptions={typeOptions}
        statusOptions={statusOptions}
        searchOptions={searchOptions}
      />,
    );

    await user.click(screen.getByRole('button', { name: TEXT_SEARCH_TYPES.NAME }));
    await user.click(screen.getByRole('menuitem', { name: TEXT_SEARCH_TYPES.VERSION }));

    const versionInput = await waitFor(() =>
      screen.getByPlaceholderText<HTMLInputElement>('Filter by version...'),
    );
    setFilters.mockClear();
    await user.type(versionInput, 'main');

    jest.advanceTimersByTime(600);

    await waitFor(() =>
      expect(setFilters).toHaveBeenCalledWith(
        expect.objectContaining({
          name: '',
          status: [],
          type: [],
          version: 'main',
        }),
      ),
    );

    jest.useRealTimers();
  });

  it('should display version value in search input when version filter is set', () => {
    render(
      <PipelineRunsFilterToolbar
        filters={{
          name: '',
          status: [],
          type: [],
          version: 'release-1.0',
        }}
        setFilters={jest.fn()}
        onClearFilters={jest.fn()}
        typeOptions={typeOptions}
        statusOptions={statusOptions}
        searchOptions={searchOptions}
      />,
    );

    expect(screen.getByRole('textbox', { name: 'name filter' })).toHaveValue('release-1.0');
  });
});
