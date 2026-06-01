import * as React from 'react';
import {
  Button,
  ButtonVariant,
  MenuToggle,
  SearchInput,
  Select,
  SelectList,
  SelectOption,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
} from '@patternfly/react-core';
import { CONFORMA_RESULT_STATUS } from '~/types/conforma';
import type { GroupByMode } from './conforma-grouping-utils';

type ConformaResultsToolbarProps = {
  searchText: string;
  onSearchChange: (value: string) => void;
  groupBy: GroupByMode;
  onGroupByChange: (value: GroupByMode) => void;
  statusFilters: string[];
  onStatusFiltersChange: (values: string[]) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
};

const statusOptions = [
  CONFORMA_RESULT_STATUS.violations,
  CONFORMA_RESULT_STATUS.warnings,
  CONFORMA_RESULT_STATUS.successes,
];

const groupByLabels: Record<GroupByMode, string> = {
  rule: 'Rule',
  component: 'Component',
};

export const ConformaResultsToolbar: React.FC<ConformaResultsToolbarProps> = ({
  searchText,
  onSearchChange,
  groupBy,
  onGroupByChange,
  statusFilters,
  onStatusFiltersChange,
  onExpandAll,
  onCollapseAll,
}) => {
  const [isGroupByOpen, setIsGroupByOpen] = React.useState(false);
  const [isStatusOpen, setIsStatusOpen] = React.useState(false);

  const statusToggleText =
    statusFilters.length > 0 ? `Status (${statusFilters.length})` : 'Status';

  return (
    <Toolbar data-test="conforma-results-toolbar">
      <ToolbarContent>
        <ToolbarItem>
          <SearchInput
            placeholder="Search by rule or com..."
            value={searchText}
            onChange={(_e, value) => onSearchChange(value)}
            onClear={() => onSearchChange('')}
            data-test="conforma-search-input"
          />
        </ToolbarItem>

        <ToolbarItem>
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
        </ToolbarItem>

        <ToolbarItem>
          <Select
            toggle={(toggleRef) => (
              <MenuToggle
                ref={toggleRef}
                isExpanded={isStatusOpen}
                onClick={() => setIsStatusOpen(!isStatusOpen)}
                data-test="conforma-status-filter"
              >
                {statusToggleText}
              </MenuToggle>
            )}
            onSelect={(_, value) => {
              const strValue = value as string;
              const next = statusFilters.includes(strValue)
                ? statusFilters.filter((s) => s !== strValue)
                : [...statusFilters, strValue];
              onStatusFiltersChange(next);
            }}
            selected={statusFilters}
            isOpen={isStatusOpen}
            onOpenChange={setIsStatusOpen}
          >
            <SelectList>
              {statusOptions.map((status) => (
                <SelectOption
                  key={status}
                  value={status}
                  hasCheckbox
                  isSelected={statusFilters.includes(status)}
                >
                  {status}
                </SelectOption>
              ))}
            </SelectList>
          </Select>
        </ToolbarItem>

        <ToolbarGroup align={{ default: 'alignRight' }}>
          <ToolbarItem>
            <Button
              variant={ButtonVariant.link}
              onClick={onExpandAll}
              data-test="conforma-expand-all"
            >
              Expand all
            </Button>
          </ToolbarItem>
          <ToolbarItem>
            <Button
              variant={ButtonVariant.link}
              onClick={onCollapseAll}
              data-test="conforma-collapse-all"
            >
              Collapse all
            </Button>
          </ToolbarItem>
        </ToolbarGroup>
      </ToolbarContent>
    </Toolbar>
  );
};
