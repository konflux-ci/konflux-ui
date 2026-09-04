import * as React from 'react';
import {
  Button,
  ButtonVariant,
  Flex,
  FlexItem,
  MenuToggle,
  Select,
  SelectList,
  SelectOption,
  Switch,
  ToolbarFilter,
} from '@patternfly/react-core';
import { FilterContext } from '~/components/Filter/generic/FilterContext';
import { MultiSelect } from '~/components/Filter/generic/MultiSelect';
import { BaseTextFilterToolbar } from '~/components/Filter/toolbars/BaseTextFIlterToolbar';
import { createFilterObj } from '~/components/Filter/utils/filter-utils';
import { HelpTooltipIcon } from '~/shared';
import {
  CONFORMA_RESULT_STATUS,
  type ConformaRefreshState,
  type ConformaResultRow,
} from '~/types/conforma';
import type { GroupByMode } from './conforma-grouping-utils';
import { ConformaRefreshIndicator } from './ConformaRefreshIndicator';
import { useConformaFilters } from './useConformaFilters';
import './ConformaResultsToolbar.scss';

type ConformaResultsToolbarProps = {
  allResults: ConformaResultRow[];
  groupBy: GroupByMode;
  onGroupByChange: (value: GroupByMode) => void;
  allExpanded: boolean;
  onToggleExpandAll: () => void;
  showDuplicates: boolean;
  onShowDuplicatesChange: (checked: boolean) => void;
  showPolicyExceptionsOnly: boolean;
  onShowPolicyExceptionsOnlyChange: (checked: boolean) => void;
  refresh: ConformaRefreshState;
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

const SHOW_DUPLICATES_HELP_TEXT =
  'When enabled, policy violations that share the same rule, message, and component but differ only by image digest (e.g. multi-arch builds) are shown as separate rows instead of being merged.';

const SHOW_POLICY_EXCEPTIONS_HELP_TEXT =
  'When enabled, the table shows only rules with policy exceptions — warnings for upcoming or volatile policy changes.';

const POLICY_EXCEPTION_FILTER_CATEGORY = 'Policy exception';
const POLICY_EXCEPTION_FILTER_LABEL = 'Policy exceptions only';

export const ConformaResultsToolbar: React.FC<ConformaResultsToolbarProps> = ({
  allResults,
  groupBy,
  onGroupByChange,
  allExpanded,
  onToggleExpandAll,
  showDuplicates,
  onShowDuplicatesChange,
  showPolicyExceptionsOnly,
  onShowPolicyExceptionsOnlyChange,
  refresh,
}) => {
  const { setFilters, onClearFilters } = React.useContext(FilterContext);
  const filters = useConformaFilters();
  const { name: nameFilter, status: statusFilter, component: componentFilter } = filters;

  const [isGroupByOpen, setIsGroupByOpen] = React.useState(false);

  const componentFilterObj = React.useMemo(
    () => createFilterObj(allResults, (r) => r.component),
    [allResults],
  );

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
        label="Component"
        filterKey="component"
        values={componentFilter}
        setValues={(component) => setFilters({ ...filters, component })}
        options={componentFilterObj}
        hasInlineFilter
        inlineFilterPlaceholderText="Filter components"
        inlineFilterThreshold={10}
      />
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
      <ToolbarFilter
        labels={showPolicyExceptionsOnly ? [POLICY_EXCEPTION_FILTER_LABEL] : []}
        deleteLabel={() => onShowPolicyExceptionsOnlyChange(false)}
        deleteLabelGroup={() => onShowPolicyExceptionsOnlyChange(false)}
        categoryName={POLICY_EXCEPTION_FILTER_CATEGORY}
      >
        <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
          <FlexItem>
            <Switch
              id="conforma-show-policy-exceptions"
              label="Show policy exceptions only"
              isChecked={showPolicyExceptionsOnly}
              onChange={(_event, checked) => onShowPolicyExceptionsOnlyChange(checked)}
              data-test="conforma-show-policy-exceptions"
            />
          </FlexItem>
          <FlexItem>
            <HelpTooltipIcon content={SHOW_POLICY_EXCEPTIONS_HELP_TEXT} />
          </FlexItem>
        </Flex>
      </ToolbarFilter>
      <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
        <FlexItem>
          <Switch
            id="conforma-show-duplicates"
            label="Show multi-arch duplicates"
            isChecked={showDuplicates}
            onChange={(_event, checked) => onShowDuplicatesChange(checked)}
            data-test="conforma-show-duplicates"
          />
        </FlexItem>
        <FlexItem>
          <HelpTooltipIcon content={SHOW_DUPLICATES_HELP_TEXT} />
        </FlexItem>
      </Flex>
      <ConformaRefreshIndicator refresh={refresh} />
    </BaseTextFilterToolbar>
  );
};
