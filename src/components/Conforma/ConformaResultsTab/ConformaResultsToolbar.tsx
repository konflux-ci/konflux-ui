import * as React from 'react';
import {
  Button,
  ButtonVariant,
  MenuToggle,
  Select,
  SelectList,
  SelectOption,
} from '@patternfly/react-core';
import { FilterContext } from '~/components/Filter/generic/FilterContext';
import { MultiSelect } from '~/components/Filter/generic/MultiSelect';
import { BaseTextFilterToolbar } from '~/components/Filter/toolbars/BaseTextFIlterToolbar';
import { createFilterObj } from '~/components/Filter/utils/filter-utils';
import { useDeepCompareMemoize } from '~/shared';
import { CONFORMA_RESULT_STATUS } from '~/types/conforma';
import type { GroupByMode } from './conforma-grouping-utils';
import type { ConformaResultRow } from './useApplicationConformaResults';

type ConformaResultsToolbarProps = {
  allResults: ConformaResultRow[];
  groupBy: GroupByMode;
  onGroupByChange: (value: GroupByMode) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
};

const statuses = [
  CONFORMA_RESULT_STATUS.violations,
  CONFORMA_RESULT_STATUS.warnings,
  CONFORMA_RESULT_STATUS.successes,
];

const groupByLabels: Record<GroupByMode, string> = {
  rule: 'Rule',
  component: 'Component',
};

export const ConformaResultsToolbar: React.FC<ConformaResultsToolbarProps> = ({
  allResults,
  groupBy,
  onGroupByChange,
  onExpandAll,
  onCollapseAll,
}) => {
  const { filters: unparsedFilters, setFilters, onClearFilters } = React.useContext(FilterContext);
  const filters = useDeepCompareMemoize({
    name: unparsedFilters.name ? (unparsedFilters.name as string) : '',
    status: unparsedFilters.status ? (unparsedFilters.status as string[]) : [],
  });
  const { name: nameFilter, status: statusFilter } = filters;

  const [isGroupByOpen, setIsGroupByOpen] = React.useState(false);

  const statusFilterObj = React.useMemo(
    () => createFilterObj(allResults, (r) => r.status, statuses),
    [allResults],
  );

  return (
    <BaseTextFilterToolbar
      text={nameFilter}
      label="rule"
      setText={(name) => setFilters({ ...filters, name })}
      onClearFilters={onClearFilters}
      dataTest="conforma-results-toolbar"
    >
      <MultiSelect
        label="Status"
        filterKey="status"
        values={statusFilter}
        setValues={(status) => setFilters({ ...filters, status })}
        options={statusFilterObj}
      />
      <Select
        toggle={(toggleRef) => (
          <MenuToggle
            ref={toggleRef}
            isExpanded={isGroupByOpen}
            onClick={() => setIsGroupByOpen(!isGroupByOpen)}
            data-test="conforma-group-by-select"
          >
            {`Group by: ${groupByLabels[groupBy]}`}
          </MenuToggle>
        )}
        onSelect={(_, value) => {
          onGroupByChange(value as GroupByMode);
          setIsGroupByOpen(false);
        }}
        selected={groupBy}
        isOpen={isGroupByOpen}
        onOpenChange={setIsGroupByOpen}
      >
        <SelectList>
          <SelectOption value="rule">Group by: Rule</SelectOption>
          <SelectOption value="component">Group by: Component</SelectOption>
        </SelectList>
      </Select>
      <Button
        variant={ButtonVariant.link}
        onClick={onExpandAll}
        data-test="conforma-expand-all"
      >
        Expand all
      </Button>
      <Button
        variant={ButtonVariant.link}
        onClick={onCollapseAll}
        data-test="conforma-collapse-all"
      >
        Collapse all
      </Button>
    </BaseTextFilterToolbar>
  );
};
