import { createTableHeaders } from '~/shared/components/table/utils';

export const ConformaGroupedTableColumnClasses = {
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
    { title: groupLabel, className: ConformaGroupedTableColumnClasses.groupKey },
    { title: 'Violations', className: ConformaGroupedTableColumnClasses.violations },
    { title: 'Warnings', className: ConformaGroupedTableColumnClasses.warnings },
    { title: 'Successes', className: ConformaGroupedTableColumnClasses.successes },
  ])(null, null, null);
