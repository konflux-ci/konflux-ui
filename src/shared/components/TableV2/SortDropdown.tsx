import * as React from 'react';
import { SelectDropdown } from '~/shared/components/Filter/controls/SelectDropdown';
import type { GroupedOptions } from '~/shared/components/Filter/types';
import { useColumnState } from './hooks/useColumnState';
import type { ColumnDefinition } from './types';

/** Props for {@link SortDropdown}. */
export interface SortDropdownProps<TData> {
  /** Column definitions — only columns with `sortable: true` appear in the dropdown. */
  columns: ColumnDefinition<TData>[];
  /** LocalStorage key for persisting column/sort state. */
  columnStateKey: string;
}

/**
 * Dropdown for selecting sort column and direction.
 *
 * Renders two option groups: "Sort by" (one option per sortable column) and
 * "Direction" (Ascending / Descending). Uses `useColumnState` to read and
 * write sort state, sharing persistence with the Table component.
 *
 * @typeParam TData - The row data type
 */
export const SortDropdown = <TData,>({ columns, columnStateKey }: SortDropdownProps<TData>) => {
  const { columnState, setColumnState } = useColumnState(columnStateKey, columns);

  const sortableColumns = React.useMemo(() => columns.filter((col) => col.sortable), [columns]);

  const groups: GroupedOptions[] = React.useMemo(
    () => [
      {
        group: 'Sort by',
        options: sortableColumns.map((col) => ({
          label: typeof col.header === 'string' ? col.header : col.id,
          value: col.id,
        })),
      },
      {
        group: 'Direction',
        options: [
          { label: 'Ascending', value: 'asc' },
          { label: 'Descending', value: 'desc' },
        ],
      },
    ],
    [sortableColumns],
  );

  const selected = React.useMemo(
    () => [columnState.sortColumn, columnState.sortDirection].filter((v): v is string => !!v),
    [columnState.sortColumn, columnState.sortDirection],
  );

  const handleSelect = (value: string) => {
    if (value === 'asc' || value === 'desc') {
      setColumnState({ ...columnState, sortDirection: value });
    } else {
      setColumnState({
        ...columnState,
        sortColumn: value,
        sortDirection: columnState.sortDirection ?? 'asc',
      });
    }
  };

  const columnLabel = sortableColumns.find((col) => col.id === columnState.sortColumn);
  const toggleText =
    columnState.sortColumn && columnLabel
      ? `Sort by: ${typeof columnLabel.header === 'string' ? columnLabel.header : columnLabel.id} (${columnState.sortDirection ?? 'asc'})`
      : 'Sort';

  return (
    <SelectDropdown
      toggleText={toggleText}
      options={groups}
      selected={selected}
      onSelect={handleSelect}
      multiple
    />
  );
};
