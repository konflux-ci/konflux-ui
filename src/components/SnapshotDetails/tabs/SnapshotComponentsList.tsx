import * as React from 'react';
import { useParams } from 'react-router-dom';
import { PageSection, PageSectionVariants, Text, Title } from '@patternfly/react-core';
import { ChatContextTarget, withChatContextRowPropsIfEnabled } from '~/components/AIChat';
import { FilterContext } from '~/components/Filter/generic/FilterContext';
import { BaseTextFilterToolbar } from '~/components/Filter/toolbars/BaseTextFIlterToolbar';
import { useIsOnFeatureFlag } from '~/feature-flags/hooks';
import { RouterParams } from '~/routes/utils';
import { filterByText } from '~/utils/text-filter-utils';
import { Table, useDeepCompareMemoize } from '../../../shared';
import FilteredEmptyState from '../../../shared/components/empty-state/FilteredEmptyState';
import { ComponentKind } from '../../../types';
import SnapshotComponentsEmptyState from './SnapshotComponentsEmptyState';
import SnapshotComponentsListHeader from './SnapshotComponentsListHeader';
import SnapshotComponentsListRow, { SnapshotComponentTableData } from './SnapshotComponentsListRow';

interface SnapshotComponentsListProps {
  applicationName?: string;
  components: SnapshotComponentTableData[];
}

const SnapshotComponentsList: React.FC<React.PropsWithChildren<SnapshotComponentsListProps>> = ({
  applicationName,
  components,
}) => {
  const { snapshotName } = useParams<RouterParams>();
  const isChatEnabled = useIsOnFeatureFlag('ai-chat');
  const tableContextId = `snapshot-components-${snapshotName}`;
  const { filters: unparsedFilters, setFilters, onClearFilters } = React.useContext(FilterContext);
  const filters = useDeepCompareMemoize({
    name: unparsedFilters.name ? (unparsedFilters.name as string) : '',
  });
  const { name: nameFilter } = filters;

  const filteredComponents = React.useMemo(
    () => filterByText(components, nameFilter, (c) => c.metadata?.name),
    [nameFilter, components],
  );

  return (
    <PageSection padding={{ default: 'noPadding' }} variant={PageSectionVariants.light} isFilled>
      <>
        <Title size="lg" headingLevel="h2" className="pf-c-title pf-u-mt-lg pf-u-mb-sm">
          Components
        </Title>
        {!components || components.length === 0 ? (
          <SnapshotComponentsEmptyState applicationName={applicationName} />
        ) : (
          <>
            <Text className="pf-u-mb-lg">Component builds that are included in this snapshot</Text>
            <BaseTextFilterToolbar
              text={nameFilter}
              label="name"
              setText={(name) => setFilters({ name })}
              onClearFilters={onClearFilters}
              dataTest="component-list-toolbar"
            />
            {filteredComponents.length > 0 ? (
              <ChatContextTarget
                id={tableContextId}
                label="Snapshot components table"
                description="Component builds included in this snapshot"
              >
                <Table
                  data={filteredComponents}
                  aria-label="Component List"
                  Header={SnapshotComponentsListHeader}
                  Row={SnapshotComponentsListRow}
                  loaded
                  getRowProps={(obj: ComponentKind) =>
                    withChatContextRowPropsIfEnabled(
                      isChatEnabled,
                      { id: obj.metadata.uid },
                      {
                        id: `snapshot-component-row-${snapshotName}-${obj.metadata.name}`,
                        label: obj.metadata.name,
                        description: 'Snapshot component table row',
                        parentContextId: tableContextId,
                      },
                    )
                  }
                />
              </ChatContextTarget>
            ) : (
              <FilteredEmptyState onClearFilters={() => onClearFilters()} />
            )}
          </>
        )}
      </>
    </PageSection>
  );
};

export default SnapshotComponentsList;
