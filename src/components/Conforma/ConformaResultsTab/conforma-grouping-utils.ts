import { CONFORMA_RESULT_STATUS } from '~/types/conforma';
import type { ConformaResultRow } from '~/types/conforma';
import { textMatch } from '~/utils/text-filter-utils';

export type GroupByMode = 'rule' | 'component';

export type GroupedConformaRow = {
  groupKey: string;
  violations: number;
  warnings: number;
  successes: number;
  rows: ConformaResultRow[];
};

const countByStatus = (rows: ConformaResultRow[]) =>
  rows.reduce(
    (acc, r) => {
      if (r.status === CONFORMA_RESULT_STATUS.violations) acc.violations++;
      else if (r.status === CONFORMA_RESULT_STATUS.warnings) acc.warnings++;
      else if (r.status === CONFORMA_RESULT_STATUS.successes) acc.successes++;
      return acc;
    },
    { violations: 0, warnings: 0, successes: 0 },
  );

export const groupByRule = (results: ConformaResultRow[]): GroupedConformaRow[] => {
  const map = new Map<string, ConformaResultRow[]>();

  for (const row of results) {
    const key = row.code || row.title || 'Unknown rule';
    const existing = map.get(key);
    if (existing) {
      existing.push(row);
    } else {
      map.set(key, [row]);
    }
  }

  return Array.from(map.entries()).map(([groupKey, rows]) => ({
    groupKey,
    ...countByStatus(rows),
    rows,
  }));
};

export const groupByComponent = (
  results: ConformaResultRow[],
  allComponentNames?: string[],
): GroupedConformaRow[] => {
  const map = new Map<string, ConformaResultRow[]>();

  // Pre-populate groups for all known components so components without
  // any Conforma results still appear in the "group by component" view.
  if (allComponentNames) {
    for (const name of allComponentNames) {
      if (name) map.set(name, []);
    }
  }

  for (const row of results) {
    const key = row.component || 'Unknown component';
    const existing = map.get(key);
    if (existing) {
      existing.push(row);
    } else {
      map.set(key, [row]);
    }
  }

  return Array.from(map.entries()).map(([groupKey, rows]) => ({
    groupKey,
    ...countByStatus(rows),
    rows,
  }));
};

export const filterResults = (
  results: ConformaResultRow[],
  searchText: string,
  statusFilters: string[],
): ConformaResultRow[] =>
  results.filter((row) => {
    if (
      searchText &&
      !textMatch(row.title, searchText) &&
      !textMatch(row.component, searchText) &&
      !textMatch(row.code, searchText)
    ) {
      return false;
    }

    if (statusFilters.length > 0 && !statusFilters.includes(row.status)) {
      return false;
    }

    return true;
  });
