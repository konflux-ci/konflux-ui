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
  Select,
  MenuToggle,
  SelectOption,
  SelectList,
  capitalize,
} from '@patternfly/react-core';
import { FilterIcon } from '@patternfly/react-icons/dist/esm/icons/filter-icon';
import { FilterContext } from '~/components/Filter/generic/FilterContext';
import { BaseTextFilterToolbar } from '~/components/Filter/toolbars/BaseTextFIlterToolbar';
import { ExternalLink, useDeepCompareMemoize } from '~/shared';
import { getErrorState } from '~/shared/utils/error-utils';
import emptySnapshotImgUrl from '../../../assets/Snapshots.svg';
import { LEARN_MORE_SNAPSHOTS } from '../../../consts/documentation';
import { PipelineRunEventType, PipelineRunLabel } from '../../../consts/pipelinerun';
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
  const [isOpen, setIsOpen] = React.useState(false);
  const filterOptions = ['name', 'commitMessage'];
  const [activeFilter, setActiveFilter] = React.useState(filterOptions[0]);
  const filters = useDeepCompareMemoize({
    name: unparsedFilters.name ? (unparsedFilters.name as string) : '',
    commitMessage: unparsedFilters.commitMessage ? (unparsedFilters.commitMessage as string) : '',
    showMergedOnly: unparsedFilters.showMergedOnly
      ? (unparsedFilters.showMergedOnly as boolean)
      : false,
    releasable: unparsedFilters.releasable
      ? unparsedFilters.releasable === true || unparsedFilters.releasable === 'true'
      : false,
  });

  const { name: nameFilter, commitMessage: commitMessageFilter, showMergedOnly } = filters;
  const releasableFilter = filters.releasable ?? false;

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
    undefined,
    undefined,
    {
      enableArchive: !releasableFilter,
    },
  );

  const filteredSnapshots = React.useMemo(() => {
    return (snapshots || []).filter((s) => {
      if (
        showMergedOnly &&
        s.metadata.labels?.[PipelineRunLabel.TEST_COMMIT_EVENT_TYPE_LABEL] ===
          PipelineRunEventType.PULL
      ) {
        return false;
      }
      if (nameFilter && !s.metadata.name.toLowerCase().includes(nameFilter.toLowerCase())) {
        return false;
      }

      const commitTitle =
        s.metadata.annotations?.[PipelineRunLabel.TEST_SERVICE_COMMIT_TITLE]?.toLowerCase() ?? '';
      if (commitMessageFilter && !commitTitle.includes(commitMessageFilter.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [snapshots, nameFilter, showMergedOnly, commitMessageFilter]);

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
            also be created manually if needed. Once created, Snapshots will be displayed on this
            page.
          </EmptyStateBody>
        </AppEmptyState>
      ) : (
        <>
          <Flex spaceItems={{ default: 'spaceItemsNone' }}>
            <Select
              toggle={(toggleRef) => (
                <MenuToggle
                  ref={toggleRef}
                  icon={<FilterIcon />}
                  data-test="snapshots-list-filter-dropdown"
                  isExpanded={isOpen}
                  onClick={() => setIsOpen(!isOpen)}
                >
                  {capitalize(activeFilter)}
                </MenuToggle>
              )}
              onSelect={(_, val) => {
                const newFilter = val as string;
                setActiveFilter(newFilter);
                setFilters({ ...unparsedFilters, [activeFilter]: '', [newFilter]: '' });
                setIsOpen(false);
              }}
              selected={activeFilter}
              isOpen={isOpen}
              onOpenChange={setIsOpen}
            >
              <SelectList>
                {filterOptions.map((ft) => (
                  <SelectOption key={ft} value={ft}>
                    {capitalize(ft)}
                  </SelectOption>
                ))}
              </SelectList>
            </Select>

            <BaseTextFilterToolbar
              text={activeFilter === 'name' ? nameFilter : commitMessageFilter}
              label={activeFilter}
              setText={(value) => {
                setFilters({ ...unparsedFilters, [activeFilter]: value });
              }}
              onClearFilters={onClearFilters}
              totalColumns={snapshotColumns.length}
              noLeftPadding={true}
            >
              <Switch
                id="show-merged-snapshots-only-switch"
                label="Hide Pull Request Snapshots"
                isChecked={showMergedOnly}
                onChange={(_event, checked) =>
                  setFilters({ ...unparsedFilters, showMergedOnly: checked })
                }
              />
              <Switch
                id="releasable"
                label="Show only releasable snapshots"
                isChecked={releasableFilter}
                onChange={(_event, checked) => setFilters({ ...filters, releasable: checked })}
              />
            </BaseTextFilterToolbar>
          </Flex>

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
