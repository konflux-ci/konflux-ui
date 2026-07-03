import { createTableHeaders } from '~/shared/components/table/utils';

export const conformaGroupedTableColumnClasses = {
  groupKey: 'pf-m-width-40',
  violations: 'pf-m-width-20',
  warnings: 'pf-m-width-20',
  successes: 'pf-m-width-20',
};

/**
 * Returns a HeaderFunc for the Conforma grouped results table.
 * The first column label is dynamic ("Rule" or "Component") based on groupBy mode.
 */
export const getConformaGroupedHeader = (groupLabel: string) =>
  createTableHeaders([
    { title: groupLabel, className: conformaGroupedTableColumnClasses.groupKey },
    { title: 'Violations', className: conformaGroupedTableColumnClasses.violations },
    { title: 'Warnings', className: conformaGroupedTableColumnClasses.warnings },
    { title: 'Successes', className: conformaGroupedTableColumnClasses.successes },
  ])(null, null, null);
