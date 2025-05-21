import * as React from 'react';
import { Link } from 'react-router-dom';
import { Table, Thead, Tr, Th, Tbody, Td, TableVariant } from '@patternfly/react-table';
import { Release } from '../../hooks/useGetAllReleases';
import {
  APPLICATION_DETAILS_PATH,
  APPLICATION_RELEASE_DETAILS_PATH,
  COMPONENT_DETAILS_PATH,
  RELEASEPLAN_PATH,
} from '../../routes/paths';
import FilteredEmptyState from '../../shared/components/empty-state/FilteredEmptyState';
import { Timestamp } from '../../shared/components/timestamp/Timestamp';
import { useNamespace } from '../../shared/providers/Namespace';
import { runStatus } from '../../utils/pipeline-utils';
import { StatusIconWithText } from '../topology/StatusIcon';
import { columnNames } from './types';

interface ReleaseTableProps {
  releases: Release[];
  onClearFilters: () => void;
}

export const ReleaseTable: React.FC<ReleaseTableProps> = ({ releases, onClearFilters }) => {
  const namespace = useNamespace();

  return (
    <Table variant={TableVariant.compact}>
      <Thead>
        <Tr>
          {Object.values(columnNames).map((column) => (
            <Th key={column}>{column}</Th>
          ))}
        </Tr>
      </Thead>
      {releases.length === 0 ? (
        <Tbody>
          <Tr>
            <Td colSpan={Object.values(columnNames).length}>
              <FilteredEmptyState onClearFilters={onClearFilters} />
            </Td>
          </Tr>
        </Tbody>
      ) : (
        <Tbody>
          {releases.map((release) => (
            <Tr key={release.name}>
              <Td>
                <Link
                  to={APPLICATION_DETAILS_PATH.createPath({
                    workspaceName: namespace,
                    applicationName: release.application,
                  })}
                >
                  {release.application}
                </Link>
              </Td>
              <Td>
                <Link
                  to={COMPONENT_DETAILS_PATH.createPath({
                    workspaceName: namespace,
                    applicationName: release.application,
                    componentName: release.component,
                  })}
                >
                  {release.component}
                </Link>
              </Td>
              <Td>
                <Link to={RELEASEPLAN_PATH.createPath({ workspaceName: namespace })}>
                  {release.releasePlan}
                </Link>
              </Td>
              <Td>{release.tenant}</Td>
              <Td>
                <Timestamp timestamp={release.completionTime} />
              </Td>
              <Td>
                <Link
                  to={APPLICATION_RELEASE_DETAILS_PATH.createPath({
                    workspaceName: namespace,
                    applicationName: release.application,
                    releaseName: release.name,
                  })}
                >
                  {release.name}
                </Link>
              </Td>
              <Td>
                <StatusIconWithText status={release.status as runStatus} />
              </Td>
            </Tr>
          ))}
        </Tbody>
      )}
    </Table>
  );
};
