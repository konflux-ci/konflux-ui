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

export const countResultsByStatus = (results: ConformaResultRow[]) =>
  results.reduce(
    (acc, r) => {
      if (r.status === CONFORMA_RESULT_STATUS.violations) acc.totalViolations++;
      else if (r.status === CONFORMA_RESULT_STATUS.warnings) acc.totalWarnings++;
      else if (r.status === CONFORMA_RESULT_STATUS.successes) acc.totalSuccesses++;
      return acc;
    },
    { totalViolations: 0, totalWarnings: 0, totalSuccesses: 0 },
  );

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

/**
 * Extracts the shared image name (everything before `@`) from an array of
 * image references.  Returns `undefined` when the images do not share a
 * common repository prefix or the array is empty.
 */
export const getCommonImageName = (images: string[]): string | undefined => {
  if (images.length === 0) return undefined;
  const names = images.map((img) => {
    const atIdx = img.lastIndexOf('@');
    return atIdx > 0 ? img.substring(0, atIdx) : img;
  });
  const first = names[0];
  return names.every((n) => n === first) ? first : undefined;
};

/** Merges arch-variant titles by trimming divergent suffixes to a shared prefix. */
const mergeTitles = (a: string, b: string): string => {
  if (a === b) return a;

  let i = 0;
  const max = Math.min(a.length, b.length);
  while (i < max && a[i] === b[i]) i++;

  let prefix = a.substring(0, i);
  const lastOpenParen = prefix.lastIndexOf('(');
  const lastSpace = prefix.lastIndexOf(' ');

  if (lastOpenParen !== -1 && i > lastOpenParen) {
    prefix = prefix.substring(0, lastOpenParen);
  } else if (lastSpace !== -1 && prefix.indexOf('(', lastSpace + 1) !== -1) {
    prefix = prefix.substring(0, prefix.indexOf('(', lastSpace + 1));
  } else if (lastSpace !== -1) {
    prefix = prefix.substring(0, lastSpace);
  }

  prefix = prefix.trimEnd();
  return prefix || a;
};

/**
 * Merges rows that share the same title, msg, component, and status (i.e. the
 * same policy violation but across different architecture images) into a single
 * row.  The merged row carries an `images` array with every unique image digest
 * from the group.  Rows without an image are handled gracefully — they collapse
 * with other rows whose only difference is the image field.
 */
export const collapseArchDuplicates = (rows: ConformaResultRow[]): ConformaResultRow[] => {
  const map = new Map<string, ConformaResultRow>();
  for (const row of rows) {
    const key = `${row.code ?? row.title}\0${row.msg ?? ''}\0${row.component}\0${row.status}`;
    const existing = map.get(key);
    if (existing) {
      if (row.title !== existing.title) {
        existing.title = mergeTitles(existing.title, row.title);
      }
      if (row.description && row.description !== existing.description) {
        existing.description = existing.description
          ? `${existing.description}\n${row.description}`
          : row.description;
      }
      if (row.solution && row.solution !== existing.solution) {
        existing.solution = existing.solution
          ? `${existing.solution}\n${row.solution}`
          : row.solution;
      }
      for (const image of row.images) {
        if (!existing.images.includes(image)) {
          existing.images = [...existing.images, image];
        }
      }
    } else {
      map.set(key, { ...row, images: [...row.images] });
    }
  }
  return Array.from(map.values());
};
