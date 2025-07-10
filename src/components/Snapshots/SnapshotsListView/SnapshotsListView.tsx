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
import emptySnapshotImgUrl from '../../../assets/snapshots/empty-snapshot.png';
import { PipelineRunLabel } from '../../../consts/pipelinerun';
import { useK8sAndKarchResources } from '../../../hooks/useK8sAndKarchResources';
import { HttpError } from '../../../k8s/error';
import { SnapshotGroupVersionKind, SnapshotModel } from '../../../models';
import AppEmptyState from '../../../shared/components/empty-state/AppEmptyState';
import ErrorEmptyState from '../../../shared/components/empty-state/ErrorEmptyState';
import FilteredEmptyState from '../../../shared/components/empty-state/FilteredEmptyState';
import { useNamespace } from '../../../shared/providers/Namespace';
import { Snapshot } from '../../../types/coreBuildService';
import SnapshotsColumnManagement from './SnapshotsColumnManagement';
import SnapshotsList from './SnapshotsList';
import { SnapshotsListViewProps } from './types';
import { useSnapshotsColumnManagement } from './useSnapshotsColumnManagement';

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
    visibleColumns,
    isColumnManagementOpen,
    closeColumnManagement,
    handleVisibleColumnsChange,
    isColumnVisible,
  } = useSnapshotsColumnManagement();

  const {
    data: snapshots,
    isLoading,
    hasError,
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

  //todo: change for the approved image
  const emptyState = (
    <AppEmptyState
      emptyStateImg={emptySnapshotImgUrl}
      title="No snapshots found"
      data-test="snapshots-empty-state"
    >
      <EmptyStateBody>
        Snapshots are created automatically by push events or pull request events. Snapshots can
        also created by created by manually if needed. Once created, Snapshots will be displayed on
        this page.
      </EmptyStateBody>
    </AppEmptyState>
  );

  if (hasError) {
    return <ErrorEmptyState httpError={HttpError.fromCode(500)} title="Unable to load snapshots" />;
  }

  if (isLoading) {
    return (
      <Bullseye>
        <Spinner data-test="spinner" />
      </Bullseye>
    );
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
          <ExternalLink href="https://konflux-ci.dev/docs/testing/integration/snapshots/">
            Learn more
          </ExternalLink>
        </Text>
      </TextContent>

      {!snapshots || snapshots.length === 0 ? (
        emptyState
      ) : (
        <>
          <Flex
            justifyContent={{ default: 'justifyContentFlexStart' }}
            alignItems={{ default: 'alignItemsCenter' }}
          >
            <FlexItem>
              <BaseTextFilterToolbar
                text={nameFilter}
                label="name"
                setText={(name) => setFilters({ name })}
                onClearFilters={onClearFilters}
                dataTest="snapshots-list-toolbar"
              />
            </FlexItem>
          </Flex>

          {filteredSnapshots.length === 0 ? (
            <FilteredEmptyState onClearFilters={onClearFilters} />
          ) : (
            <SnapshotsList
              snapshots={filteredSnapshots}
              applicationName={applicationName}
              visibleColumns={visibleColumns}
              isColumnVisible={isColumnVisible}
            />
          )}

          <SnapshotsColumnManagement
            isOpen={isColumnManagementOpen}
            onClose={closeColumnManagement}
            visibleColumns={visibleColumns}
            onVisibleColumnsChange={handleVisibleColumnsChange}
          />
        </>
      )}
    </PageSection>
  );
};

export default SnapshotsListView;
