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
  });

  const { name: nameFilter } = filters;

  const {
    data: snapshots,
    isLoading,
    clusterError,
    archiveError,
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
    return nameFilter
      ? snapshots?.filter((s) => s.metadata.name.indexOf(nameFilter) !== -1) || []
      : snapshots || [];
  }, [snapshots, nameFilter]);

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
            setText={(name) => setFilters({ name })}
            onClearFilters={onClearFilters}
            dataTest="snapshots-list-toolbar"
            totalColumns={snapshotColumns.length}
          />

          {filteredSnapshots.length === 0 ? (
            <FilteredEmptyState onClearFilters={onClearFilters} />
          ) : (
            <SnapshotsList snapshots={filteredSnapshots} applicationName={applicationName} />
          )}
        </>
      )}
    </PageSection>
  );
};

export default SnapshotsListView;
