import React from 'react';
import { useParams } from 'react-router-dom';
import { PageSection } from '@patternfly/react-core';
import { ComponentGroupComponentsEmptyState } from '~/components/ComponentGroups/ComponentGroupsDetails/tabs/ComponentGroupComponents/ComponentGroupComponentsEmptyState';
import PageLayout from '~/components/PageLayout/PageLayout';
import { useComponentGroup } from '~/hooks/useComponentGroups';
import { useComponentsByName } from '~/hooks/useComponents';
import FilteredEmptyState from '~/shared/components/empty-state/FilteredEmptyState';
import { FilterToolbar, useFilteredData, useFilterState } from '~/shared/components/Filter';
import { Table, TableContainer } from '~/shared/components/TableV2';
import { useNamespace } from '~/shared/providers/Namespace';
import { getErrorState } from '~/shared/utils/error-utils';
import { getLatestPromotedBuild } from '~/utils/component-group-utils';
import {
  CgComponentListItem,
  cgComponentsFilterConfig,
  cgComponentsTableColumns,
} from './cg-components-table-config';

const ComponentGroupComponentsList: React.FC = () => {
  const namespace = useNamespace();
  const { groupName } = useParams();
  const { clientFilterValues, clearAll, isFiltered } = useFilterState(cgComponentsFilterConfig);

  const [group, groupLoaded, groupError] = useComponentGroup(namespace, groupName, true);
  const componentNames =
    groupLoaded && !groupError && group ? group.spec.components.map((c) => c.name) : [];

  const [components, compLoaded, compError] = useComponentsByName(namespace, componentNames, true);
  const componentsMap = React.useMemo(
    () => (components ? new Map(components.map((c) => [c.metadata.name, c])) : new Map()),
    [components],
  );

  const componentListItems: CgComponentListItem[] = React.useMemo(
    () =>
      group && groupLoaded && !groupError && compLoaded && !compError
        ? group.spec.components.map((c) => {
            const version = c.componentVersion?.version;
            const latestCandidate = getLatestPromotedBuild(
              group.status?.globalCandidateList ?? [],
              c.name,
              version,
            );
            return {
              componentName: c.name,
              namespace,
              gitUrl: componentsMap.get(c.name)?.spec.source?.url,
              imageUrl: latestCandidate?.lastPromotedImage,
              version: version ?? latestCandidate?.version ?? '',
            };
          })
        : [],
    [group, namespace, groupLoaded, groupError, compLoaded, compError, componentsMap],
  );

  const { filteredData } = useFilteredData(
    cgComponentsFilterConfig,
    componentListItems,
    clientFilterValues,
  );

  const error = groupError ?? compError;
  const loaded = groupLoaded && compLoaded;
  if (error) {
    return getErrorState(error, loaded, 'group components');
  }

  return (
    <PageLayout
      title="Components"
      description="A component is an image built from source code in a repository. One or more components that run together form an component group."
    >
      <PageSection>
        <TableContainer
          data={filteredData}
          unfilteredData={componentListItems}
          loaded={loaded}
          emptyState={<FilteredEmptyState onClearFilters={clearAll} />}
          noDataState={<ComponentGroupComponentsEmptyState />}
          toolbar={
            isFiltered || componentListItems.length > 0 ? (
              <FilterToolbar configs={cgComponentsFilterConfig} />
            ) : undefined
          }
        >
          <Table
            data={filteredData}
            columns={cgComponentsTableColumns}
            getRowId={(row) => `${row.componentName}-${row.version}`}
            aria-label="Group component list"
            enableSorting
          />
        </TableContainer>
      </PageSection>
    </PageLayout>
  );
};

export default ComponentGroupComponentsList;
