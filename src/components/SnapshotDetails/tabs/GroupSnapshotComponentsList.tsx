import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState, Title } from '@patternfly/react-core';
import { COMPONENT_DETAILS_V2_PATH, COMPONENT_VERSION_DETAILS_PATH } from '@routes/paths';
import GitRepoLink from '~/components/GitLink/GitRepoLink';
import SnapshotComponentImage from '~/components/SnapshotDetails/tabs/SnapshotComponentImage';
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
          <Link
            to={COMPONENT_DETAILS_V2_PATH.createPath({
              workspaceName: namespace,
              componentName: row.original.name,
            })}
          >
            {row.original.name}
          </Link>
        ),
      },
      {
        id: 'version',
        header: 'Version',
        accessorFn: (c) => c.version ?? '-',
        cell: ({ row }) =>
          row.original.version ? (
            <Link
              to={COMPONENT_VERSION_DETAILS_PATH.createPath({
                workspaceName: namespace,
                componentName: row.original.name,
                versionRevision: row.original.version,
              })}
            >
              {row.original.version}
            </Link>
          ) : (
            '-'
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
