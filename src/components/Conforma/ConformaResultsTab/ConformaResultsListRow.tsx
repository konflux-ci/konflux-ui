import * as React from 'react';
import { TableData } from '~/shared';
import type { GroupedConformaRow } from './conforma-grouping-utils';
import { ConformaCountBadge } from './ConformaCountBadge';
import { ConformaGroupedTableColumnClasses } from './ConformaResultsListHeader';

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
    <TableData className={ConformaGroupedTableColumnClasses.groupKey}>{obj.groupKey}</TableData>
    <TableData className={ConformaGroupedTableColumnClasses.violations}>
      <ConformaCountBadge count={obj.violations} type="violations" />
    </TableData>
    <TableData className={ConformaGroupedTableColumnClasses.warnings}>
      <ConformaCountBadge count={obj.warnings} type="warnings" />
    </TableData>
    <TableData className={ConformaGroupedTableColumnClasses.successes}>
      <ConformaCountBadge count={obj.successes} type="successes" />
    </TableData>
  </>
);

export default ConformaResultsListRow;
