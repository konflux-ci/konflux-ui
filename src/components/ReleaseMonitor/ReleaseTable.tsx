import * as React from 'react';
import { EmptyStateBody, Text, TextVariants } from '@patternfly/react-core';
import { SortByDirection } from '@patternfly/react-table';
import emptyStateImgUrl from '../../assets/Release.svg';
import { Release } from '../../hooks/useGetAllReleases';
import { Table } from '../../shared';
import AppEmptyState from '../../shared/components/empty-state/AppEmptyState';
import getReleasesListHeader, { SortableHeaders } from './ReleaseListHeader';
import ReleaseListRow from './ReleaseListRow';

interface ReleaseTableProps {
  releases: Release[];
}

const ReleasesEmptyState: React.FC<React.PropsWithChildren<unknown>> = () => (
  <AppEmptyState emptyStateImg={emptyStateImgUrl} title="No releases found">
    <EmptyStateBody>
      <Text component={TextVariants.p}>
        You don&apos;t have availables releases on the currrent filters please try to reselect
        conditions. Or you don&apos;t release anything on the Namespaces or your old releases were
        archived.
      </Text>
    </EmptyStateBody>
  </AppEmptyState>
);

export const ReleaseTable: React.FC<ReleaseTableProps> = ({ releases }) => {
  const [activeSortIndex, setActiveSortIndex] = React.useState<number>(SortableHeaders.name);
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

  return (
    <>
      {!releases?.length ? (
        <ReleasesEmptyState />
      ) : (
        <Table
          data={releases}
          aria-label="Release List"
          Header={ReleaseListHeader}
          Row={ReleaseListRow}
          loaded={releases.length > 0}
        />
      )}
    </>
  );
};
