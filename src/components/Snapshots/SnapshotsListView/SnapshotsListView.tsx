import * as React from 'react';
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
import ColumnManagement from '~/components/ColumnManagement/ColumnManagement';
import { LEARN_MORE_SNAPSHOTS } from '~/consts/documentation';
import { PipelineRunEventType, PipelineRunLabel } from '~/consts/pipelinerun';
import { useK8sAndKarchResources } from '~/hooks/useK8sAndKarchResources';
import { SnapshotGroupVersionKind, SnapshotModel } from '~/models';
import { ExternalLink } from '~/shared';
import AppEmptyState from '~/shared/components/empty-state/AppEmptyState';
import FilteredEmptyState from '~/shared/components/empty-state/FilteredEmptyState';
import { useFilterState, useFilteredData, FilterToolbar } from '~/shared/components/Filter';
import { Table, TableContainer } from '~/shared/components/TableV2';
import { useNamespace } from '~/shared/providers/Namespace';
import { getErrorState } from '~/shared/utils/error-utils';
import { Snapshot } from '~/types/coreBuildService';
import {
  FILTER_BY_VALUES,
  filterConfigs,
  filterOptions,
  SNAPSHOTS_LIST_COLUMN_STATE_KEY,
  SNAPSHOTS_LIST_COLUMNS,
} from './snapshots-table-config';

export type SnapshotsListViewProps = {
  applicationName: string;
};

const SnapshotsListView: React.FC<React.PropsWithChildren<SnapshotsListViewProps>> = ({
  applicationName,
}) => {
  const namespace = useNamespace();
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
      enableArchive: filterValues.filterBy.includes(FILTER_BY_VALUES.RELEASABLE),
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
        filterValues.filterBy.includes(FILTER_BY_VALUES.SHOW_MERGED_ONLY) &&
        s.metadata.labels?.[PipelineRunLabel.TEST_COMMIT_EVENT_TYPE_LABEL] ===
          PipelineRunEventType.PULL
      ) {
        return false;
      }
      return true;
    });
  }, [textFiltered, filterValues.filterBy]);

  const meta = React.useMemo(
    () => ({ namespace, applicationName, getSource }),
    [namespace, applicationName, getSource],
  );

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
            <FilterToolbar configs={filterConfigs} options={filterOptions}>
              <ColumnManagement<Snapshot>
                columns={SNAPSHOTS_LIST_COLUMNS}
                columnStateKey={SNAPSHOTS_LIST_COLUMN_STATE_KEY}
                showColumnManagement
              />
            </FilterToolbar>
          ) : undefined
        }
      >
        <Table
          data={finalFilteredSnapshots}
          columns={SNAPSHOTS_LIST_COLUMNS}
          getRowId={(obj) => obj.metadata.uid ?? obj.metadata.name}
          aria-label="Snapshots List"
          enableSorting
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          fetchNextPage={fetchNextPage}
          columnStateKey={SNAPSHOTS_LIST_COLUMN_STATE_KEY}
          meta={meta}
        />
      </TableContainer>
    </PageSection>
  );
};

export default SnapshotsListView;
