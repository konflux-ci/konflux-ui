import * as React from 'react';
import { useParams } from 'react-router-dom';
import ColumnManagement from '~/components/ColumnManagement/ColumnManagement';
import { PipelineRunLabel } from '~/consts/pipelinerun';
import { useK8sAndKarchResources } from '~/hooks/useK8sAndKarchResources';
import { ReleaseGroupVersionKind, ReleaseModel } from '~/models';
import { RouterParams } from '~/routes/utils';
import ActionMenu from '~/shared/components/action-menu/ActionMenu';
import FilteredEmptyState from '~/shared/components/empty-state/FilteredEmptyState';
import ListLayout from '~/shared/components/list-layout/ListLayout';
import { Table, TableContainer, SortDropdown, ColumnDefinition } from '~/shared/components/TableV2';
import { useNamespace } from '~/shared/providers/Namespace';
import { ReleaseKind } from '~/types';
import { textMatch } from '~/utils/text-filter-utils';
import { FilterContext } from '../Filter/generic/FilterContext';
import { ReleasesFilterToolbar } from '../Filter/toolbars/ReleasesFilterToolbar';
import {
  RELEASES_LIST_COLUMNS,
  RELEASES_LIST_COLUMN_STATE_KEY,
} from '../Release/releases-table-config';
import { useReleaseActions } from './release-actions';
import ReleasesEmptyState from './ReleasesEmptyState';

const FilterTypes = {
  name: 'name',
  releasePlan: 'release plan',
  releaseSnapshot: 'release snapshot',
} as const;
type FilterType = (typeof FilterTypes)[keyof typeof FilterTypes];

const ActionsCell: React.FC<{ release: ReleaseKind }> = ({ release }) => (
  <ActionMenu actions={useReleaseActions(release)} />
);

const columns: ColumnDefinition<ReleaseKind>[] = [
  ...RELEASES_LIST_COLUMNS,
  {
    id: 'actions',
    header: '',
    cell: (info) => <ActionsCell release={info.row.original} />,
    pinned: 'end',
    nonHidable: true,
  },
];

const DEFAULT_VISIBLE_COLUMNS = [
  'name',
  'created',
  'duration',
  'status',
  'component',
  'releasePlan',
  'releaseSnapshot',
  'actions',
];

const ReleasesListView: React.FC = () => {
  const { applicationName } = useParams<RouterParams>();
  const namespace = useNamespace();
  const {
    data: releases,
    isLoading,
    hasError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useK8sAndKarchResources<ReleaseKind>(
    {
      groupVersionKind: ReleaseGroupVersionKind,
      namespace,
      isList: true,
      selector: applicationName
        ? { matchLabels: { [PipelineRunLabel.APPLICATION]: applicationName } }
        : undefined,
    },
    ReleaseModel,
  );
  const [filterType, setFilterType] = React.useState<FilterType>(FilterTypes.name);
  const { filters: unparsedFilters, setFilters, onClearFilters } = React.useContext(FilterContext);
  const searchFilter = (unparsedFilters[filterType] as string) ?? '';
  const filteredReleases = React.useMemo(() => {
    if (filterType === FilterTypes.name)
      return releases.filter((r) => textMatch(r.metadata.name, searchFilter));
    if (filterType === FilterTypes.releasePlan)
      return releases.filter((r) => textMatch(r.spec.releasePlan, searchFilter));
    return releases.filter((r) => textMatch(r.spec.snapshot, searchFilter));
  }, [filterType, releases, searchFilter]);

  return (
    <ListLayout title="Releases">
      <TableContainer
        data={filteredReleases}
        unfilteredData={releases}
        loaded={!isLoading}
        loadError={hasError ? new Error('Unable to load releases') : undefined}
        emptyState={<FilteredEmptyState onClearFilters={onClearFilters} />}
        noDataState={<ReleasesEmptyState />}
        toolbar={
          <ReleasesFilterToolbar
            value={searchFilter}
            dropdownItems={Object.values(FilterTypes)}
            onInput={(value) => setFilters({ [filterType]: value })}
            onFilterTypeChange={(value) => {
              setFilters({ [filterType]: '' });
              setFilterType(value as FilterType);
            }}
            totalColumns={columns.length}
            sortControl={
              <SortDropdown
                columns={columns}
                columnStateKey={RELEASES_LIST_COLUMN_STATE_KEY}
                defaultVisibleColumns={DEFAULT_VISIBLE_COLUMNS}
                defaultSort={{ column: 'created', direction: 'desc' }}
              />
            }
            columnManagement={
              <ColumnManagement<ReleaseKind>
                columns={columns}
                columnStateKey={RELEASES_LIST_COLUMN_STATE_KEY}
                defaultVisibleColumns={DEFAULT_VISIBLE_COLUMNS}
                defaultSort={{ column: 'created', direction: 'desc' }}
                showColumnManagement
              />
            }
          />
        }
      >
        <Table
          data-test="releases__table"
          data={filteredReleases}
          columns={columns}
          getRowId={(obj) => obj.metadata?.uid ?? obj.metadata?.name ?? ''}
          aria-label="Release List"
          columnStateKey={RELEASES_LIST_COLUMN_STATE_KEY}
          enableSorting
          defaultVisibleColumns={DEFAULT_VISIBLE_COLUMNS}
          defaultSort={{ column: 'created', direction: 'desc' }}
          meta={{ currentNamespace: namespace, applicationName }}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          fetchNextPage={fetchNextPage}
        />
      </TableContainer>
    </ListLayout>
  );
};

export default ReleasesListView;
