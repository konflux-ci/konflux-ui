export const conformaGroupedTableColumnClasses = {
  groupKey: 'pf-m-width-40',
  violations: 'pf-m-width-20',
  warnings: 'pf-m-width-20',
  successes: 'pf-m-width-20',
};

// ponytail: plain array — createTableHeaders adds nothing without sorting
export const getConformaGroupedColumns = (groupLabel: string) => [
  { title: groupLabel, props: { className: conformaGroupedTableColumnClasses.groupKey } },
  { title: 'Violations', props: { className: conformaGroupedTableColumnClasses.violations } },
  { title: 'Warnings', props: { className: conformaGroupedTableColumnClasses.warnings } },
  { title: 'Successes', props: { className: conformaGroupedTableColumnClasses.successes } },
];
