import * as React from 'react';
import { ExpandableSection, EmptyState } from '@patternfly/react-core';
import { useNudgeConfig } from '~/hooks/useNudgeConfig';
import { TableContainer, Table } from '~/shared/components/TableV2';
import { useNamespace } from '~/shared/providers/Namespace';
import { getErrorState } from '~/shared/utils/error-utils';
import { ComponentKind } from '~/types';
import { getNudgingTableColumns } from './nudging-table-config';
import { getIncomingNudges, getOutgoingNudges } from './nudging-utils';

type NudgingSectionProps = {
  component: ComponentKind;
  direction: 'outgoing' | 'incoming';
};

const SECTION_COPY = {
  outgoing: {
    title: 'Nudges',
    testId: 'nudges-section',
    empty: 'No outgoing nudge relationships.',
  },
  incoming: {
    title: 'Nudged by',
    testId: 'nudged-by-section',
    empty: 'No incoming nudge relationships.',
  },
} as const;

const NudgingSection: React.FC<NudgingSectionProps> = ({ component, direction }) => {
  const namespace = useNamespace();
  const [nudgeConfig, loaded, error] = useNudgeConfig(namespace);
  const [expanded, setExpanded] = React.useState(true);

  const copy = SECTION_COPY[direction];
  const nudges = React.useMemo(
    () =>
      direction === 'outgoing'
        ? getOutgoingNudges(nudgeConfig, component.metadata?.name)
        : getIncomingNudges(nudgeConfig, component.metadata?.name),
    [direction, nudgeConfig, component.metadata?.name],
  );
  const columns = React.useMemo(
    () => getNudgingTableColumns(direction, namespace),
    [direction, namespace],
  );

  return (
    <div className="pf-v6-u-mt-md" data-test={copy.testId}>
      <ExpandableSection
        isExpanded={expanded}
        toggleContent={loaded ? `${copy.title} (${nudges.length})` : copy.title}
        data-test={`${copy.testId}-toggle`}
        onToggle={() => setExpanded((x) => !x)}
      >
        {error ? (
          getErrorState(error, loaded, copy.title.toLowerCase(), true)
        ) : (
          <TableContainer
            data={nudges}
            unfilteredData={nudges}
            loaded={loaded}
            noDataState={
              <EmptyState
                titleText={copy.empty}
                headingLevel="h4"
                data-test="nudging-empty-state"
              />
            }
          >
            <Table
              data={nudges}
              columns={columns}
              getRowId={(row) => `${row.from}/${row.to}`}
              aria-label={copy.title}
              data-test="nudging-table"
            />
          </TableContainer>
        )}
      </ExpandableSection>
    </div>
  );
};

export default React.memo(NudgingSection);
