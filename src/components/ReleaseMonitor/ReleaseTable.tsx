import * as React from 'react';
import { Bullseye, EmptyStateBody, Spinner, Text, TextVariants } from '@patternfly/react-core';
import { SortByDirection } from '@patternfly/react-table';
import { useSortedResources } from '~/hooks/useSortedResources';
import emptyStateImgUrl from '../../assets/Release.svg';
import { Table } from '../../shared';
import AppEmptyState from '../../shared/components/empty-state/AppEmptyState';
import { MonitoredReleaseKind } from '../../types';
import getReleasesListHeader, { SortableHeaders } from './ReleaseListHeader';
import ReleaseListRow from './ReleaseListRow';

interface ReleaseTableProps {
  releases: MonitoredReleaseKind[];
  loading: boolean;
}

const sortPaths: Record<SortableHeaders, string> = {
  [SortableHeaders.completionTime]: 'status.completionTime',
};

const ReleasesEmptyState: React.FC<React.PropsWithChildren<unknown>> = () => (
  <AppEmptyState emptyStateImg={emptyStateImgUrl} title="No releases found">
    <EmptyStateBody>
      <Text component={TextVariants.p}>
        You don&apos;t have available releases matching the current filters. Please try adjusting
        the filter conditions, or you may not have any releases in the selected namespaces, or your
        old releases were archived.
      </Text>
    </EmptyStateBody>
  </AppEmptyState>
);

export const ReleaseTable: React.FC<ReleaseTableProps> = ({ releases, loading }) => {
  const [activeSortIndex, setActiveSortIndex] = React.useState<number>(
    SortableHeaders.completionTime,
  );
  const [activeSortDirection, setActiveSortDirection] = React.useState<SortByDirection>(
    SortByDirection.asc,
  );
  const ReleaseListHeader = React.useMemo(
    () =>
      getReleasesListHeader(activeSortIndex, activeSortDirection, (_, index, direction) => {
        setActiveSortIndex(index);
        setActiveSortDirection(direction);
      }),
    [activeSortDirection, activeSortIndex],
  );

  const sortedReleases = useSortedResources(
    releases,
    activeSortIndex,
    activeSortDirection,
    sortPaths,
  );

  return (
    <>
      {loading ? (
        <Bullseye>
          <Spinner /> Loading..
        </Bullseye>
      ) : (
        <>
          {!sortedReleases?.length ? (
            <ReleasesEmptyState />
          ) : (
            <Table
              data={sortedReleases}
              aria-label="Release List"
              Header={ReleaseListHeader}
              Row={ReleaseListRow}
              loaded={releases.length > 0}
            />
          )}
        </>
      )}
    </>
  );
};
