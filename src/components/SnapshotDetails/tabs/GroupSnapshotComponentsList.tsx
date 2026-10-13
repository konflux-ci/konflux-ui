import { useMemo } from 'react';
import { EmptyState, Title } from '@patternfly/react-core';
import GitRepoLink from '~/components/GitLink/GitRepoLink';
import SnapshotComponentImage from '~/components/SnapshotDetails/tabs/SnapshotComponentImage';
import { ComponentLink } from '~/shared/components/component-link/ComponentLink';
import FilteredEmptyState from '~/shared/components/empty-state/FilteredEmptyState';
import {
  defineFilters,
  FilterToolbar,
  useFilteredData,
  useFilterState,
} from '~/shared/components/Filter';
import { ColumnDefinition, Table, TableContainer } from '~/shared/components/TableV2';
import { useNamespace } from '~/shared/providers/Namespace';
import { Snapshot } from '~/types/coreBuildService';
import { textMatch } from '~/utils/text-filter-utils';

type SnapshotComponent = Snapshot['spec']['components'][number];
const filters = defineFilters<SnapshotComponent>()([
  {
    type: 'search',
    param: 'name',
    label: 'Name',
    filterFn: (component, value) => textMatch(component.name, value),
  },
] as const);
const GroupSnapshotComponentsList = ({ components }: { components: SnapshotComponent[] }) => {
  const namespace = useNamespace();
  const { clientFilterValues, clearAll } = useFilterState(filters);
  const { filteredData } = useFilteredData(filters, components, clientFilterValues);
  const columns = useMemo<ColumnDefinition<SnapshotComponent>[]>(
    () => [
      {
        id: 'name',
        header: 'Name',
        accessorFn: (c) => c.name,
        sortable: true,
        cell: ({ row }) => (
          <ComponentLink
            namespace={namespace}
            name={row.original.name}
            version={row.original.version}
          />
        ),
      },
      {
        id: 'image',
        header: 'Container Image',
        size: 3,
        accessorFn: (c) => c.containerImage,
        cell: ({ row }) => <SnapshotComponentImage {...row.original} />,
      },
      {
        id: 'source',
        header: 'Git URL',
        size: 2,
        cell: ({ row }) =>
          row.original.source?.git?.url ? <GitRepoLink url={row.original.source.git.url} /> : '-',
      },
      {
        id: 'revision',
        header: 'Revision',
        size: 2,
        accessorFn: (c) => c.source?.git?.revision ?? '-',
        cell: ({ row }) =>
          row.original.source?.git?.url && row.original.source.git.revision ? (
            <GitRepoLink
              url={row.original.source.git.url}
              revision={row.original.source.git.revision}
            />
          ) : (
            (row.original.source?.git?.revision ?? '-')
          ),
      },
    ],
    [namespace],
  );
  return (
    <>
      <Title headingLevel="h2" size="lg" className="pf-v6-u-mb-md">
        Components
      </Title>
      <TableContainer
        data={filteredData}
        unfilteredData={components}
        loaded
        noDataState={<EmptyState titleText="No components in this snapshot" headingLevel="h3" />}
        emptyState={<FilteredEmptyState onClearFilters={clearAll} />}
        toolbar={<FilterToolbar configs={filters} />}
      >
        <Table
          data={filteredData}
          columns={columns}
          getRowId={(c) => JSON.stringify([c.name, c.version])}
          aria-label="Snapshot components"
          enableSorting
        />
      </TableContainer>
    </>
  );
};
export default GroupSnapshotComponentsList;
