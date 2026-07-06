import * as React from 'react';
import { TableData } from '~/shared';
import { CONFORMA_RESULT_STATUS } from '~/types/conforma';
import type { GroupedConformaRow } from './conforma-grouping-utils';
import { ConformaCountBadge } from './ConformaCountBadge';
import { conformaGroupedTableColumnClasses } from './ConformaResultsListHeader';

type ConformaResultsListRowProps = {
  obj: GroupedConformaRow;
};

/**
 * Row fragment for the Conforma grouped results table.
 * Renders main summary cells (groupKey, violations, warnings, successes)
 * using the shared TableData component, following the project's row fragment pattern.
 */
const ConformaResultsListRow: React.FC<ConformaResultsListRowProps> = ({ obj }) => (
  <>
    <TableData className={conformaGroupedTableColumnClasses.groupKey}>{obj.groupKey}</TableData>
    <TableData className={conformaGroupedTableColumnClasses.violations}>
      <ConformaCountBadge count={obj.violations} type={CONFORMA_RESULT_STATUS.violations} />
    </TableData>
    <TableData className={conformaGroupedTableColumnClasses.warnings}>
      <ConformaCountBadge count={obj.warnings} type={CONFORMA_RESULT_STATUS.warnings} />
    </TableData>
    <TableData className={conformaGroupedTableColumnClasses.successes}>
      <ConformaCountBadge count={obj.successes} type={CONFORMA_RESULT_STATUS.successes} />
    </TableData>
  </>
);

export default ConformaResultsListRow;
