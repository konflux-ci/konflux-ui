import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PipelineRunsFilterToolbar from '../PipelineRunsFilterToolbar';

const typeOptions = [
  { key: 'build', count: 2 },
  { key: 'test', count: 2 },
];
const statusOptions = [{ key: 'Succeeded', count: 4 }];
const versionOptions = [{ key: 'main' }, { key: 'release-1.0' }];
const versionOptionsWithLabels = [
  { key: 'main', label: 'Main Branch' },
  { key: 'release-1.0', label: 'Release 1.0' },
];

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
        typeOptions={typeOptions}
        statusOptions={statusOptions}
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
        typeOptions={typeOptions}
        statusOptions={statusOptions}
        versionOptions={versionOptions}
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
        typeOptions={typeOptions}
        statusOptions={statusOptions}
        versionOptions={versionOptions}
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

  it('should display labels instead of keys when version options include labels', async () => {
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
        typeOptions={typeOptions}
        statusOptions={statusOptions}
        versionOptions={versionOptionsWithLabels}
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
