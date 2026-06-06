import * as React from 'react';
import { Link } from 'react-router-dom';
import {
  EmptyStateBody,
  PageSectionVariants,
  PageSection,
  Title,
  TextContent,
  Text,
  TextVariants,
  Flex,
  FlexItem,
} from '@patternfly/react-core';
import emptySnapshotImgUrl from '~/assets/Snapshots.svg';
import ColumnManagementButton from '~/components/Filter/components/ColumnManagementButton';
import { columnManagementModalLauncher } from '~/components/modal/ColumnManagementModal';
import { useModalLauncher } from '~/components/modal/ModalProvider';
import { LEARN_MORE_SNAPSHOTS } from '~/consts/documentation';
import { PipelineRunEventType, PipelineRunLabel } from '~/consts/pipelinerun';
import { useK8sAndKarchResources } from '~/hooks/useK8sAndKarchResources';
import { SnapshotGroupVersionKind, SnapshotModel } from '~/models';
import { COMPONENT_DETAILS_PATH, SNAPSHOT_DETAILS_PATH } from '~/routes/paths';
import { ExternalLink } from '~/shared';
import ActionMenu from '~/shared/components/action-menu/ActionMenu';
import AppEmptyState from '~/shared/components/empty-state/AppEmptyState';
import FilteredEmptyState from '~/shared/components/empty-state/FilteredEmptyState';
import {
  defineFilters,
  useFilterState,
  useFilteredData,
  FilterToolbar,
} from '~/shared/components/Filter';
import {
  Table,
  TableContainer,
  useColumnState,
  type ColumnDefinition,
  type ColumnState,
} from '~/shared/components/TableV2';
import { Timestamp } from '~/shared/components/timestamp/Timestamp';
import { TriggerColumnData } from '~/shared/components/trigger-column-data/trigger-column-data';
import TruncatedLinkListWithPopover from '~/shared/components/truncated-link-list-with-popover/TruncatedLinkListWithPopover';
import { useNamespace } from '~/shared/providers/Namespace';
import { getErrorState } from '~/shared/utils/error-utils';
import { Snapshot } from '~/types/coreBuildService';
import { ResourceSource } from '~/types/k8s';
import { createCommitObjectFromSnapshot } from '~/utils/commits-utils';
import { textMatch } from '~/utils/text-filter-utils';
import { useSnapshotActions } from './snapshot-actions';

export type SnapshotsListViewProps = {
  applicationName: string;
};

const COLUMN_STATE_KEY = 'snapshots-list';

const filterConfigs = defineFilters<Snapshot>()([
  {
    type: 'switchableSearch',
    param: 'searchField',
    label: 'Search',
    fields: [
      {
        label: 'Name',
        value: 'name',
        param: 'name',
        filterFn: (item, value) => textMatch(item.metadata.name, value),
      },
      {
        label: 'Commit message',
        value: 'commitMessage',
        param: 'commitMessage',
        filterFn: (item, value) =>
          textMatch(
            item.metadata.annotations?.[PipelineRunLabel.TEST_SERVICE_COMMIT_TITLE] ?? '',
            value,
          ),
      },
    ],
  },
  {
    type: 'boolean',
    param: 'showMergedOnly',
    label: 'Hide Pull Request Snapshots',
  },
  {
    type: 'boolean',
    param: 'releasable',
    label: 'Show only releasable snapshots',
  },
] as const);

const SnapshotActionCell: React.FC<{
  snapshot: Snapshot;
  source: ResourceSource | undefined;
}> = ({ snapshot, source }) => {
  const actions = useSnapshotActions(snapshot, source);
  return <ActionMenu actions={actions} />;
};

const SnapshotsListView: React.FC<React.PropsWithChildren<SnapshotsListViewProps>> = ({
  applicationName,
}) => {
  const namespace = useNamespace();
  const showModal = useModalLauncher();
  const { filterValues, clientFilterValues, clearAll, isFiltered } = useFilterState(filterConfigs);

  const {
    data: snapshots,
    getSource,
    isLoading,
    clusterError,
    archiveError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useK8sAndKarchResources<Snapshot>(
    {
      groupVersionKind: SnapshotGroupVersionKind,
      namespace,
      isList: true,
      selector: {
        matchLabels: {
          [PipelineRunLabel.APPLICATION]: applicationName,
        },
      },
    },
    SnapshotModel,
    undefined,
    undefined,
    {
      enableArchive: !filterValues.releasable,
    },
  );

  const { filteredData: textFiltered } = useFilteredData(
    filterConfigs,
    snapshots ?? [],
    clientFilterValues,
  );

  const finalFilteredSnapshots = React.useMemo(() => {
    return textFiltered.filter((s) => {
      if (
        filterValues.showMergedOnly &&
        s.metadata.labels?.[PipelineRunLabel.TEST_COMMIT_EVENT_TYPE_LABEL] ===
          PipelineRunEventType.PULL
      ) {
        return false;
      }
      return true;
    });
  }, [textFiltered, filterValues.showMergedOnly]);

  const getComponentLink = React.useCallback(
    (component: string) => (
      <Link
        key={component}
        to={COMPONENT_DETAILS_PATH.createPath({
          workspaceName: namespace,
          applicationName,
          componentName: component.trim(),
        })}
      >
        {component.trim()}
      </Link>
    ),
    [namespace, applicationName],
  );

  const columns: ColumnDefinition<Snapshot>[] = React.useMemo(
    () => [
      {
        id: 'name',
        header: 'Name',
        accessorFn: (row) => row.metadata.name,
        size: 2,
        sortable: true,
        nonHidable: true,
        cell: (info) => (
          <Link
            to={SNAPSHOT_DETAILS_PATH.createPath({
              workspaceName: namespace,
              applicationName,
              snapshotName: info.getValue() as string,
            })}
            data-test="snapshot-list-row-name"
          >
            {info.getValue() as string}
          </Link>
        ),
      },
      {
        id: 'createdAt',
        header: 'Created at',
        accessorFn: (row) => row.metadata.creationTimestamp,
        size: 2,
        sortable: true,
        cell: (info) => <Timestamp timestamp={(info.getValue() as string) ?? '-'} />,
      },
      {
        id: 'components',
        header: 'Components',
        accessorFn: (row) => row.spec.components?.map((c) => c.name) ?? [],
        size: 2,
        cell: (info) => (
          <TruncatedLinkListWithPopover
            items={info.getValue() as string[]}
            renderItem={getComponentLink}
            popover={{
              header: 'More snapshot components',
              ariaLabel: 'More snapshot components',
              moreText: (count: number) => `${count} more`,
              dataTestPrefix: 'more-snapshot-components-popover',
            }}
          />
        ),
      },
      {
        id: 'commitMessage',
        header: 'Commit message',
        accessorFn: (row) => createCommitObjectFromSnapshot(row)?.shaTitle ?? '-',
        size: 3,
      },
      {
        id: 'reference',
        header: 'Reference',
        accessorFn: (row) => row,
        size: 3,
        cell: (info) => {
          const commit = createCommitObjectFromSnapshot(info.row.original);
          return (
            <TriggerColumnData
              repoOrg={commit?.repoOrg}
              repoName={commit?.repoName}
              repoURL={commit?.repoURL}
              prNumber={commit?.pullRequestNumber}
              eventType={commit?.eventType}
              commitSha={commit?.sha}
              shaUrl={commit?.shaURL}
            />
          );
        },
      },
      {
        id: 'actions',
        header: '',
        accessorFn: () => null,
        width: '48px',
        pinned: 'end',
        nonHidable: true,
        cell: (info) => {
          const source = getSource?.(info.row.original);
          return <SnapshotActionCell snapshot={info.row.original} source={source} />;
        },
      },
    ],
    [namespace, applicationName, getComponentLink, getSource],
  );

  const { columnState, setColumnState } = useColumnState(COLUMN_STATE_KEY, columns);

  const defaultColumnState: ColumnState = React.useMemo(
    () => ({ visibleColumns: columns.map((c) => c.id) }),
    [columns],
  );

  const columnInfoForModal = React.useMemo(
    () =>
      columns.map((c) => ({
        id: c.id,
        header: typeof c.header === 'string' ? c.header : c.id,
        nonHidable: c.nonHidable,
        pinned: c.pinned,
      })),
    [columns],
  );

  const openColumnManagement = React.useCallback(() => {
    showModal(
      columnManagementModalLauncher({
        columns: columnInfoForModal,
        columnState,
        defaultColumnState,
        onSave: setColumnState,
      }),
    );
  }, [showModal, columnInfoForModal, columnState, defaultColumnState, setColumnState]);

  if (clusterError && archiveError) {
    // Don't display cluster error if the code is 404 as this error is expected
    if (
      typeof clusterError === 'object' &&
      clusterError !== null &&
      'code' in clusterError &&
      clusterError.code !== 404
    ) {
      return getErrorState(clusterError, !isLoading, 'snapshots');
    }

    return getErrorState(archiveError, !isLoading, 'snapshots');
  }

  return (
    <PageSection padding={{ default: 'noPadding' }} variant={PageSectionVariants.light} isFilled>
      <Flex
        justifyContent={{ default: 'justifyContentSpaceBetween' }}
        alignItems={{ default: 'alignItemsCenter' }}
      >
        <FlexItem>
          <Title size="lg" headingLevel="h3" className="pf-v5-c-title pf-v5-u-mt-lg pf-v5-u-mb-sm">
            Snapshots
          </Title>
        </FlexItem>
      </Flex>

      <TextContent>
        <Text component={TextVariants.p}>
          A snapshot is a point-in-time, immutable record of an application&apos;s container images.{' '}
          <ExternalLink href={LEARN_MORE_SNAPSHOTS}>Learn more</ExternalLink>
        </Text>
      </TextContent>

      <TableContainer
        data={finalFilteredSnapshots}
        unfilteredData={snapshots ?? []}
        loaded={!isLoading}
        emptyState={<FilteredEmptyState onClearFilters={clearAll} />}
        noDataState={
          <AppEmptyState
            emptyStateImg={emptySnapshotImgUrl}
            title="No snapshots found"
            data-test="snapshots-empty-state"
          >
            <EmptyStateBody>
              Snapshots are created automatically by push events or pull request events. Snapshots
              can also be created manually if needed. Once created, Snapshots will be displayed on
              this page.
            </EmptyStateBody>
          </AppEmptyState>
        }
        toolbar={
          isFiltered || (snapshots ?? []).length > 0 ? (
            <FilterToolbar configs={filterConfigs}>
              <ColumnManagementButton onClick={openColumnManagement} totalColumns={9} />
            </FilterToolbar>
          ) : undefined
        }
      >
        <Table
          data={finalFilteredSnapshots}
          columns={columns}
          getRowId={(obj) => obj.metadata.uid ?? obj.metadata.name}
          aria-label="Snapshots List"
          enableSorting
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          fetchNextPage={fetchNextPage}
          columnStateKey={COLUMN_STATE_KEY}
        />
      </TableContainer>
    </PageSection>
  );
};

export default SnapshotsListView;
