import { TEXT_SEARCH_TYPES } from '~/consts/constants';
import { textMatch } from '~/utils/text-filter-utils';
import { PipelineRunLabel } from '../../../consts/pipelinerun';
import { PipelineRunKind } from '../../../types';
import { pipelineRunStatus } from '../../../utils/pipeline-utils';

export type FilterType = Record<string, string | string[] | boolean>;

export const filterPipelineRuns = (
  pipelineRuns: PipelineRunKind[],
  filters: FilterType,
  customFilter?: (plr: PipelineRunKind) => boolean,
): PipelineRunKind[] => {
  const { name, status, type } = filters;

  // It is not possible for `name` to not be a string, or `status` and `type` to not be arrays
  if (typeof name !== 'string' || !Array.isArray(status) || !Array.isArray(type)) {
    throw new Error('Invalid filter');
  }

  return pipelineRuns
    .filter((plr) => {
      const runType = plr?.metadata.labels[PipelineRunLabel.PIPELINE_TYPE];
      return (
        (!name ||
          textMatch(plr.metadata.name, name) ||
          textMatch(plr.metadata.labels?.[PipelineRunLabel.COMPONENT], name)) &&
        (!status.length || status.includes(pipelineRunStatus(plr))) &&
        (!type.length || type.includes(runType))
      );
    })
    .filter((plr) => !customFilter || customFilter(plr));
};

export const createFilterObj = <T>(
  items: T[],
  keyExtractor: (item: T) => string | undefined,
  validKeys?: string[],
  labels?: Record<string, string>,
  count?: boolean,
  filterFn?: (item: T) => boolean,
): { key: string; count?: number; label?: string }[] => {
  const counts = count
    ? items.reduce((acc, item) => {
        if (filterFn && !filterFn(item)) {
          return acc;
        }

        const key = keyExtractor(item);

        if (!validKeys || validKeys.includes(key)) {
          if (acc[key] !== undefined) {
            acc[key] = acc[key] + 1;
          } else {
            acc[key] = 1;
          }
        }

        return acc;
      }, {})
    : undefined;

  if (validKeys) {
    return validKeys.map((key) => ({
      key,
      count: count ? counts[key] ?? 0 : undefined,
      label: labels?.[key] ?? undefined,
    }));
  }

  if (count) {
    return Object.entries(counts).map(([key, countValue]: [string, number]) => ({
      key,
      count: count ? countValue : undefined,
      label: labels?.[key] ?? undefined,
    }));
  }

  const uniqueKeys = new Set();
  items
    .filter((item) => (filterFn ? filterFn(item) : true))
    .forEach((item) => {
      const key = keyExtractor(item);
      if (!key) return;
      uniqueKeys.add(key);
    });
  return Array.from(uniqueKeys).map((key: string) => ({ key, label: labels?.[key] ?? undefined }));
};

export const createTextSearchFilterObj = (
  newSearchValue: string,
  searchTypes: string,
  filters: FilterType,
  setFilters: (filters: FilterType) => void,
) => {
  switch (searchTypes) {
    case TEXT_SEARCH_TYPES.NAME:
      setFilters({ ...filters, name: newSearchValue, version: '' });
      break;
    case TEXT_SEARCH_TYPES.VERSION:
      setFilters({ ...filters, name: '', version: newSearchValue });
      break;
    default:
      setFilters({ ...filters, name: newSearchValue, version: '' });
  }
};
