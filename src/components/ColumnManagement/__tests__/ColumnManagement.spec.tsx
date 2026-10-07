import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ColumnManagement from '~/components/ColumnManagement/ColumnManagement';
import { ModalProvider } from '~/components/modal/ModalProvider';
import { renderWithQueryClientAndRouter } from '~/unit-test-utils';

const columns = [
  { id: 'name', header: 'Name', nonHidable: true },
  { id: 'created', header: 'Created' },
];

it.each(['name', 'missing'])(
  'validates Restore defaults consistently for sort column %s',
  async (sortColumn) => {
    localStorage.clear();
    const user = userEvent.setup();
    localStorage.setItem(
      'column-management-defaults',
      JSON.stringify({
        visibleColumns: ['name'],
        columnOrder: ['created', 'name'],
        sortColumn: 'created',
        sortDirection: 'asc',
      }),
    );
    renderWithQueryClientAndRouter(
      <ModalProvider>
        <ColumnManagement
          columns={columns}
          columnStateKey="column-management-defaults"
          defaultVisibleColumns={['name', 'missing']}
          defaultSort={{ column: sortColumn, direction: 'desc' }}
          showColumnManagement
        />
      </ModalProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'Manage columns' }));
    expect(screen.getByRole('checkbox', { name: 'Created' })).not.toBeChecked();
    await user.click(screen.getByRole('checkbox', { name: 'Created' }));
    await user.click(screen.getByRole('button', { name: 'Restore defaults' }));
    expect(screen.getByRole('checkbox', { name: 'Created' })).not.toBeChecked();
    await user.click(screen.getByRole('button', { name: 'Save' }));
    const saved = JSON.parse(localStorage.getItem('column-management-defaults'));
    expect(saved.visibleColumns).toEqual(['name']);
    expect(saved.columnOrder).toEqual(['name', 'created']);
    expect(saved.sortColumn).toBe(sortColumn === 'name' ? 'name' : undefined);
    expect(saved.sortDirection).toBe(sortColumn === 'name' ? 'desc' : undefined);
  },
);
