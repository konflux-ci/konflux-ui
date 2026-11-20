import React from 'react';
import { useParams } from 'react-router-dom';
import { PageSection } from '@patternfly/react-core';
import { ComponentGroupComponentsEmptyState } from '~/components/ComponentGroups/ComponentGroupDetails/tabs/ComponentGroupComponents/ComponentGroupComponentsEmptyState';
import PageLayout from '~/components/PageLayout/PageLayout';
import { useComponentGroup } from '~/hooks/useComponentGroups';
import { useComponentsByNameV2 } from '~/hooks/useComponentsV2';
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
  const allReferences = React.useMemo(
    () => (groupLoaded && !groupError && group ? group.spec.components : []),
    [group, groupError, groupLoaded],
  );
  const componentNames = React.useMemo(
    () =>
      allReferences
        .filter((c) => !c.kind || c.kind.toLowerCase() === 'component')
        .map((c) => c.name),
    [allReferences],
  );

  const [components, compLoaded, compError] = useComponentsByNameV2(
    namespace,
    componentNames,
    true,
  );
  const componentsMap = React.useMemo(
    () => (components ? new Map(components.map((c) => [c.metadata.name, c])) : new Map()),
    [components],
  );

  const listItems: CgComponentListItem[] = React.useMemo(() => {
    if (!group || !groupLoaded || groupError || !compLoaded) {
      return [];
    }

    return allReferences.map((ref) => {
      const isComponentGroup = ref.kind?.toLowerCase() === 'componentgroup';
      const version = ref.componentVersion?.version;
      const latestCandidate = getLatestPromotedBuild(
        group.status?.globalCandidateList ?? [],
        ref.name,
        version,
      );

      return {
        componentName: ref.name,
        namespace,
        kind: ref.kind,
        gitUrl: isComponentGroup ? undefined : componentsMap.get(ref.name)?.spec.source?.url,
        imageUrl: isComponentGroup ? undefined : latestCandidate?.lastPromotedImage,
        version: isComponentGroup ? undefined : (version ?? latestCandidate?.version),
      };
    });
  }, [group, namespace, groupLoaded, groupError, compLoaded, componentsMap, allReferences]);

  const { filteredData } = useFilteredData(cgComponentsFilterConfig, listItems, clientFilterValues);

  const loaded = groupLoaded && compLoaded;
  if (groupError) {
    return getErrorState(groupError, groupLoaded, 'group components');
  }
  if (!!componentNames?.length && compError) {
    return getErrorState(compError, compLoaded, 'group components');
  }

  return (
    <PageLayout
      title="Components"
      description="A component is an image built from source code in a repository. One or more components that run together form a component group."
    >
      <PageSection>
        <TableContainer
          data={filteredData}
          unfilteredData={listItems}
          loaded={loaded}
          emptyState={<FilteredEmptyState onClearFilters={clearAll} />}
          noDataState={<ComponentGroupComponentsEmptyState />}
          toolbar={
            isFiltered || listItems.length > 0 ? (
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
