import * as React from 'react';
import type { ConformaResultRow } from '~/types/conforma';
import { filterUpcomingPolicyChanges } from './conforma-grouping-utils';

/**
 * Returns the subset of rows that represent policy exceptions — warnings whose
 * policy code marks an upcoming/volatile policy change. Memoized so callers can
 * feed it into derived state without re-filtering on every render.
 */
export const usePolicyException = (results: ConformaResultRow[]): ConformaResultRow[] =>
  React.useMemo(() => filterUpcomingPolicyChanges(results), [results]);
