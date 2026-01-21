import * as React from 'react';
import {
  Bullseye,
  EmptyStateBody,
  PageSectionVariants,
  PageSection,
  Spinner,
  Title,
  TextContent,
  Text,
  TextVariants,
  Flex,
  FlexItem,
  Switch,
} from '@patternfly/react-core';
import { FilterContext } from '~/components/Filter/generic/FilterContext';
import { BaseTextFilterToolbar } from '~/components/Filter/toolbars/BaseTextFIlterToolbar';
import { ExternalLink, useDeepCompareMemoize } from '~/shared';
import { getErrorState } from '~/shared/utils/error-utils';
import emptySnapshotImgUrl from '../../../assets/Snapshots.svg';
import { LEARN_MORE_SNAPSHOTS } from '../../../consts/documentation';
import { PipelineRunLabel } from '../../../consts/pipelinerun';
import { useK8sAndKarchResources } from '../../../hooks/useK8sAndKarchResources';
import { SnapshotGroupVersionKind, SnapshotModel } from '../../../models';
import AppEmptyState from '../../../shared/components/empty-state/AppEmptyState';
import FilteredEmptyState from '../../../shared/components/empty-state/FilteredEmptyState';
import { useNamespace } from '../../../shared/providers/Namespace';
import { Snapshot } from '../../../types/coreBuildService';
import SnapshotsList from './SnapshotsList';
import { snapshotColumns } from './SnapshotsListHeader';
import { SnapshotsListViewProps } from './types';

const SnapshotsListView: React.FC<React.PropsWithChildren<SnapshotsListViewProps>> = ({
  applicationName,
}) => {
  const namespace = useNamespace();
  const { filters: unparsedFilters, setFilters, onClearFilters } = React.useContext(FilterContext);
  const filters = useDeepCompareMemoize({
    name: unparsedFilters.name ? (unparsedFilters.name as string) : '',
    showMergedOnly: unparsedFilters.showMergedOnly
      ? (unparsedFilters.showMergedOnly as boolean)
      : false,
  });

  const { name: nameFilter, showMergedOnly } = filters;

  const {
    data: snapshots,
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
  );

  const filteredSnapshots = React.useMemo(() => {
    // apply name filter
    let filtered = nameFilter
      ? snapshots?.filter((s) => s.metadata.name.indexOf(nameFilter) !== -1) || []
      : snapshots || [];

    if (showMergedOnly) {
      filtered = filtered.filter(
        (s) => s.metadata.labels?.[PipelineRunLabel.TEST_COMMIT_EVENT_TYPE_LABEL] === 'push',
      );
    }

    return filtered;
  }, [snapshots, nameFilter, showMergedOnly]);

  if (isLoading) {
    return (
      <Bullseye>
        <Spinner data-test="spinner" />
      </Bullseye>
    );
  }

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
      {!snapshots || snapshots.length === 0 ? (
        <AppEmptyState
          emptyStateImg={emptySnapshotImgUrl}
          title="No snapshots found"
          data-test="snapshots-empty-state"
        >
          <EmptyStateBody>
            Snapshots are created automatically by push events or pull request events. Snapshots can
            also created by created by manually if needed. Once created, Snapshots will be displayed
            on this page.
          </EmptyStateBody>
        </AppEmptyState>
      ) : (
        <>
          <BaseTextFilterToolbar
            text={nameFilter}
            label="name"
            setText={(name) => setFilters({ ...unparsedFilters, name })}
            onClearFilters={onClearFilters}
            dataTest="snapshots-list-toolbar"
            totalColumns={snapshotColumns.length}
          >
            <Switch
              id="show-merged-snapshots-only-switch"
              label="Hide Pull Request Snapshots"
              isChecked={showMergedOnly}
              onChange={(_event, checked) =>
                setFilters({ ...unparsedFilters, showMergedOnly: checked })
              }
            />
          </BaseTextFilterToolbar>

          {filteredSnapshots.length === 0 ? (
            <FilteredEmptyState onClearFilters={onClearFilters} />
          ) : (
            <SnapshotsList
              snapshots={filteredSnapshots}
              applicationName={applicationName}
              infiniteLoadingProps={{ hasNextPage, isFetchingNextPage, fetchNextPage }}
            />
          )}
        </>
      )}
    </PageSection>
  );
};

export default SnapshotsListView;
