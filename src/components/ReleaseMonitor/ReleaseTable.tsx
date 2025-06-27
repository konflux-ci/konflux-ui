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

  // const namespace = useNamespace();

  // return (
  //   <Table variant={TableVariant.compact}>
  //     <Thead>
  //       <Tr>
  //         {Object.values(columnNames).map((column) => (
  //           <Th key={column}>{column}</Th>
  //         ))}
  //       </Tr>
  //     </Thead>
  //     {releases.length === 0 ? (
  //       <Tbody>
  //         <Tr>
  //           <Td colSpan={Object.values(columnNames).length}>
  //             <ReleasesEmptyState />
  //           </Td>
  //         </Tr>
  //       </Tbody>
  //     ) : (
  //       <Tbody>
  //         {releases.map((release) => (
  //           <Tr key={release.name}>
  //             <Td>
  //               <Link
  //                 to={APPLICATION_DETAILS_PATH.createPath({
  //                   workspaceName: namespace,
  //                   applicationName: release.application,
  //                 })}
  //               >
  //                 {release.application}
  //               </Link>
  //             </Td>
  //             <Td>
  //               <Link
  //                 to={COMPONENT_DETAILS_PATH.createPath({
  //                   workspaceName: namespace,
  //                   applicationName: release.application,
  //                   componentName: release.component,
  //                 })}
  //               >
  //                 {release.component}
  //               </Link>
  //             </Td>
  //             <Td>
  //               <Link to={RELEASEPLAN_PATH.createPath({ workspaceName: namespace })}>
  //                 {release.releasePlan}
  //               </Link>
  //             </Td>
  //             <Td>{release.tenant}</Td>
  //             <Td>
  //               <Timestamp timestamp={release.completionTime} />
  //             </Td>
  //             <Td>
  //               <Link
  //                 to={APPLICATION_RELEASE_DETAILS_PATH.createPath({
  //                   workspaceName: namespace,
  //                   applicationName: release.application,
  //                   releaseName: release.name,
  //                 })}
  //               >
  //                 {release.name}
  //               </Link>
  //             </Td>
  //             <Td>
  //               <StatusIconWithText status={release.status as runStatus} />
  //             </Td>
  //           </Tr>
  //         ))}
  //       </Tbody>
  //     )}
  //   </Table>
  // );
};
