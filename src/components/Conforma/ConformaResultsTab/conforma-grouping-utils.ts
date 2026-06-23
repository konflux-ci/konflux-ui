import { CONFORMA_RESULT_STATUS } from '~/types/conforma';
import type { ConformaResultRow } from './useApplicationConformaResults';

export type GroupByMode = 'rule' | 'component';

export type GroupedConformaRow = {
  groupKey: string;
  violations: number;
  warnings: number;
  successes: number;
  rows: ConformaResultRow[];
};

export const groupByRule = (results: ConformaResultRow[]): GroupedConformaRow[] => {
  const map = new Map<string, ConformaResultRow[]>();

  for (const row of results) {
    const key = row.title || 'Unknown rule';
    const existing = map.get(key);
    if (existing) {
      existing.push(row);
    } else {
      map.set(key, [row]);
    }
  }

  return Array.from(map.entries()).map(([groupKey, rows]) => ({
    groupKey,
    violations: rows.filter((r) => r.status === CONFORMA_RESULT_STATUS.violations).length,
    warnings: rows.filter((r) => r.status === CONFORMA_RESULT_STATUS.warnings).length,
    successes: rows.filter((r) => r.status === CONFORMA_RESULT_STATUS.successes).length,
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
    violations: rows.filter((r) => r.status === CONFORMA_RESULT_STATUS.violations).length,
    warnings: rows.filter((r) => r.status === CONFORMA_RESULT_STATUS.warnings).length,
    successes: rows.filter((r) => r.status === CONFORMA_RESULT_STATUS.successes).length,
    rows,
  }));
};

export const filterResults = (
  results: ConformaResultRow[],
  searchText: string,
  statusFilters: ConformaResultRow['status'][],
): ConformaResultRow[] => {
  const lowerSearch = searchText.toLowerCase();

  return results.filter((row) => {
    if (
      lowerSearch &&
      !row.title?.toLowerCase().includes(lowerSearch) &&
      !row.component?.toLowerCase().includes(lowerSearch)
    ) {
      return false;
    }

    if (statusFilters.length > 0 && !statusFilters.includes(row.status)) {
      return false;
    }

    return true;
  });
};
