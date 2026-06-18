import * as React from 'react';
import {
  Button,
  ButtonVariant,
  Flex,
  FlexItem,
  Label,
  MenuToggle,
  Select,
  SelectList,
  SelectOption,
  Spinner,
  Text,
} from '@patternfly/react-core';
import { SyncIcon } from '@patternfly/react-icons/dist/esm/icons/sync-icon';
import { FilterContext } from '~/components/Filter/generic/FilterContext';
import { MultiSelect } from '~/components/Filter/generic/MultiSelect';
import { BaseTextFilterToolbar } from '~/components/Filter/toolbars/BaseTextFIlterToolbar';
import { createFilterObj } from '~/components/Filter/utils/filter-utils';
import { useDeepCompareMemoize } from '~/shared';
import { fromNow } from '~/shared/components/timestamp/datetime';
import {
  CONFORMA_RESULT_STATUS,
  type ConformaRefreshState,
  type ConformaResultRow,
} from '~/types/conforma';
import type { GroupByMode } from './conforma-grouping-utils';

type ConformaResultsToolbarProps = {
  allResults: ConformaResultRow[];
  groupBy: GroupByMode;
  onGroupByChange: (value: GroupByMode) => void;
  allExpanded: boolean;
  onToggleExpandAll: () => void;
  refresh: ConformaRefreshState;
};

const RELATIVE_TIME_INTERVAL_MS = 30_000;

const useRelativeTime = (epochMs: number): string => {
  const [, setTick] = React.useState(0);

  React.useEffect(() => {
    if (!epochMs) return;
    const id = setInterval(() => setTick((n) => n + 1), RELATIVE_TIME_INTERVAL_MS);
    return () => clearInterval(id);
  }, [epochMs]);

  if (!epochMs) return '';
  return fromNow(new Date(epochMs));
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
  allExpanded,
  onToggleExpandAll,
  refresh,
}) => {
  const { filters: unparsedFilters, setFilters, onClearFilters } = React.useContext(FilterContext);
  const filters = useDeepCompareMemoize({
    name: unparsedFilters.name ? (unparsedFilters.name as string) : '',
    status: unparsedFilters.status ? (unparsedFilters.status as string[]) : [],
  });
  const { name: nameFilter, status: statusFilter } = filters;

  const [isGroupByOpen, setIsGroupByOpen] = React.useState(false);

  const relativeTime = useRelativeTime(refresh.lastFetchedAt);

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
          <SelectOption value="rule">Rule</SelectOption>
          <SelectOption value="component">Component</SelectOption>
        </SelectList>
      </Select>
      <Button
        variant={ButtonVariant.primary}
        onClick={onToggleExpandAll}
        data-test={allExpanded ? 'conforma-collapse-all' : 'conforma-expand-all'}
      >
        {allExpanded ? 'Collapse all' : 'Expand all'}
      </Button>
      <Flex
        alignItems={{ default: 'alignItemsCenter' }}
        spaceItems={{ default: 'spaceItemsSm' }}
        className="conforma-results-toolbar__refresh"
      >
        {refresh.hasLiveUpdatesPaused && (
          <FlexItem>
            <Label color="orange" data-test="conforma-live-updates-paused">
              Live updates paused
            </Label>
          </FlexItem>
        )}
        {relativeTime && (
          <FlexItem>
            <Text
              component="small"
              className="conforma-results-toolbar__last-checked"
              data-test="conforma-last-checked"
            >
              Last checked: {relativeTime}
            </Text>
          </FlexItem>
        )}
        {refresh.isRefreshing && (
          <FlexItem>
            <Spinner size="sm" aria-label="Refreshing Conforma results" />
          </FlexItem>
        )}
        <FlexItem>
          <Button
            variant={ButtonVariant.link}
            onClick={refresh.onRefresh}
            isDisabled={refresh.isRefreshing}
            aria-label="Refresh Conforma results"
            data-test="conforma-refresh-button"
            className={
              refresh.hasLiveUpdatesPaused
                ? 'conforma-results-toolbar__refresh-button--highlighted'
                : undefined
            }
            icon={<SyncIcon />}
          >
            Refresh
          </Button>
        </FlexItem>
      </Flex>
    </BaseTextFilterToolbar>
  );
};
