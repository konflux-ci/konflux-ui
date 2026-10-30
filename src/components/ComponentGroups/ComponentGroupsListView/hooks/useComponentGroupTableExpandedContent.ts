import React from 'react';
import { ExpandedState } from '@tanstack/react-table';
import { TableProps } from '~/shared/components/TableV2';
import { ComponentGroupKind } from '~/types';

type UseComponentGroupTableExpandedContentResult = {
  expanded: TableProps<ComponentGroupKind>['expanded'];
  handleExpandedChange: TableProps<ComponentGroupKind>['onExpandedChange'];
};

const useComponentGroupTableExpandedContent = (
  groups: ComponentGroupKind[],
): UseComponentGroupTableExpandedContentResult => {
  const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set());

  const expanded = React.useMemo<ExpandedState>(() => {
    const state: Record<string, boolean> = {};
    expandedRows.forEach((key) => {
      state[key] = true;
    });
    return state;
  }, [expandedRows]);

  const handleExpandedChange = React.useCallback(
    (updaterOrValue: ExpandedState | ((old: ExpandedState) => ExpandedState)) => {
      const next = typeof updaterOrValue === 'function' ? updaterOrValue(expanded) : updaterOrValue;
      setExpandedRows(
        next === true
          ? new Set(groups.map((group) => group.metadata?.name ?? '-'))
          : new Set(
              Object.entries(next)
                .filter(([, isExpanded]) => isExpanded)
                .map(([key]) => key),
            ),
      );
    },
    [expanded, groups],
  );

  return React.useMemo(
    () => ({
      expanded,
      handleExpandedChange,
    }),
    [expanded, handleExpandedChange],
  );
};

export default useComponentGroupTableExpandedContent;
