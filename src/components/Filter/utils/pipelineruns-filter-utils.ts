import { PipelineRunLabel } from '../../../consts/pipelinerun';
import { PipelineRunKind } from '../../../types';
import { pipelineRunStatus } from '../../../utils/pipeline-utils';

export type PipelineRunsFilterState = {
  name: string;
  commit: string;
  status: string[];
  type: string[];
};

export type AttributeFilterType = 'name' | 'commit';

export interface AttributeOption {
  key: AttributeFilterType;
  label: string;
}

// Predefined attribute options for the filter
export const ATTRIBUTE_OPTIONS: AttributeOption[] = [
  { key: 'name', label: 'Name' },
  { key: 'commit', label: 'Commit' },
];

// Helper function to get current filter value based on active attribute
export const getCurrentFilterValue = (
  filters: PipelineRunsFilterState,
  activeAttribute: AttributeFilterType,
): string => {
  return filters[activeAttribute] || '';
};

// Helper function to update filter based on active attribute
export const updateFilterByAttribute = (
  filters: PipelineRunsFilterState,
  activeAttribute: AttributeFilterType,
  value: string,
): PipelineRunsFilterState => {
  return {
    ...filters,
    [activeAttribute]: value,
  };
};

// Helper function to clear specific filter
export const clearFilter = (
  filters: PipelineRunsFilterState,
  filterKey: keyof PipelineRunsFilterState,
): PipelineRunsFilterState => {
  const clearedValue = Array.isArray(filters[filterKey]) ? [] : '';
  return {
    ...filters,
    [filterKey]: clearedValue,
  };
};

// Helper function to get placeholder text
export const getPlaceholderText = (activeAttribute: AttributeFilterType): string => {
  const option = ATTRIBUTE_OPTIONS.find((opt) => opt.key === activeAttribute);
  return `Filter by ${option?.label.toLowerCase() || activeAttribute}...`;
};

export const filterPipelineRuns = (
  pipelineRuns: PipelineRunKind[],
  filters: PipelineRunsFilterState,
  customFilter?: (plr: PipelineRunKind) => boolean,
  componentName?: string,
): PipelineRunKind[] => {
  const { name, commit, status, type } = filters;

  return pipelineRuns
    .filter((plr) => {
      const runType = plr?.metadata.labels[PipelineRunLabel.PIPELINE_TYPE];
      const commitSha =
        plr?.metadata.labels?.[PipelineRunLabel.COMMIT_LABEL] ||
        plr?.metadata.labels?.[PipelineRunLabel.TEST_SERVICE_COMMIT] ||
        plr?.metadata.annotations?.[PipelineRunLabel.COMMIT_ANNOTATION];

      return (
        (!name ||
          plr.metadata.name.toLowerCase().startsWith(String(name).trim().toLowerCase()) ||
          plr.metadata.labels?.[PipelineRunLabel.COMPONENT]
            ?.toLowerCase()
            .startsWith(String(name).trim().toLowerCase())) &&
        (!commit ||
          !String(commit).trim() ||
          (commitSha && commitSha.toLowerCase().startsWith(String(commit).trim().toLowerCase()))) &&
        (!status.length || status.includes(pipelineRunStatus(plr))) &&
        (!type.length || type.includes(runType))
      );
    })
    .filter((plr) => !customFilter || customFilter(plr));
};
