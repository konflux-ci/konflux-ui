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
} from '@patternfly/react-core';
import { HelpTooltipIcon } from '~/shared';
import { FilterToolbar, type ToolbarGroupConfig } from '~/shared/components/Filter';
import type { FilterOption } from '~/shared/components/Filter';
import type { GroupByMode } from './conforma-grouping-utils';
import { filterConfigs, STATUS_FILTER_OPTIONS } from './conforma-table-config';

type ConformaResultsToolbarProps = {
  statusOptions?: FilterOption[];
  groupBy: GroupByMode;
  onGroupByChange: (value: GroupByMode) => void;
  allExpanded: boolean;
  onToggleExpandAll: () => void;
  showDuplicates: boolean;
  onShowDuplicatesChange: (checked: boolean) => void;
};

const groupByLabels: Record<GroupByMode, string> = {
  rule: 'Rule',
  component: 'Component',
};

const SHOW_DUPLICATES_HELP_TEXT =
  'When enabled, policy violations that share the same rule, message, and component but differ only by image digest (e.g. multi-arch builds) are shown as separate rows instead of being merged.';

const TOOLBAR_GROUPS: Record<string, ToolbarGroupConfig> = {};

export const ConformaResultsToolbar: React.FC<ConformaResultsToolbarProps> = ({
  statusOptions,
  groupBy,
  onGroupByChange,
  allExpanded,
  onToggleExpandAll,
  showDuplicates,
  onShowDuplicatesChange,
}) => {
  const [isGroupByOpen, setIsGroupByOpen] = React.useState(false);

  const options = React.useMemo(
    () => ({ status: statusOptions ?? STATUS_FILTER_OPTIONS }),
    [statusOptions],
  );

  return (
    <div data-test="conforma-results-toolbar">
      <FilterToolbar configs={filterConfigs} options={options} groups={TOOLBAR_GROUPS}>
        <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapMd' }}>
          <FlexItem>
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
          </FlexItem>
          <FlexItem>
            <Button
              variant={ButtonVariant.primary}
              onClick={onToggleExpandAll}
              data-test={allExpanded ? 'conforma-collapse-all' : 'conforma-expand-all'}
            >
              {allExpanded ? 'Collapse all' : 'Expand all'}
            </Button>
          </FlexItem>
          <FlexItem>
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
          </FlexItem>
        </Flex>
      </FilterToolbar>
    </div>
  );
};
