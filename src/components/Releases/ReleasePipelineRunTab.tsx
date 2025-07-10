import * as React from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Bullseye,
  Spinner,
  Title,
  SearchInput,
  ToolbarItem,
  ToolbarContent,
  Toolbar,
} from '@patternfly/react-core';
import { Table, Thead, Tr, Th, Tbody, Td } from '@patternfly/react-table';
import { PIPELINE_RUNS_DETAILS_PATH, SNAPSHOT_DETAILS_PATH } from '@routes/paths';
import { RouterParams } from '@routes/utils';
import { useReleasePlan } from '~/hooks/useReleasePlans';
import { useRelease } from '~/hooks/useReleases';
import { useReleaseStatus } from '~/hooks/useReleaseStatus';
import { Timestamp } from '~/shared';
import { useNamespace } from '~/shared/providers/Namespace';
import { calculateDuration } from '~/utils/pipeline-utils';
import {
  getFinalFromRelease,
  getManagedProcessingFromRelease,
  getNamespaceAndPRName,
  getTenantCollectorProcessingFromRelease,
  getTenantProcessingFromRelease,
} from '~/utils/release-utils';
import { StatusIconWithText } from '../topology/StatusIcon';

interface PipelineRunProcessing {
  type: string;
  startTime: string | null;
  completionTime: string;
  snapshot: string;
  pipelineRun: string;
  prNamespace: string;
}

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'startTime', label: 'Start Time' },
  { key: 'duration', label: 'Duration' },
  { key: 'status', label: 'Status' },
  { key: 'type', label: 'Type' },
  { key: 'snapshot', label: 'Snapshot' },
  { key: 'namespace', label: 'Namespace' },
];

const createPipelineRunEntry = (
  type: string,
  processing: {
    completionTime?: string;
    pipelineRun?: string;
    startTime?: string;
    roleBinding?: string;
  },
  snapshot: string,
): PipelineRunProcessing | null => {
  if (!processing?.pipelineRun) return null;
  const [prNamespace, pipelineRun] = getNamespaceAndPRName(processing.pipelineRun);
  if (!pipelineRun || !prNamespace) return null;

  return {
    type,
    startTime: processing.startTime ?? null,
    completionTime: processing.completionTime ?? '',
    snapshot,
    pipelineRun,
    prNamespace,
  };
};

const ReleasePipelineRunTab: React.FC = () => {
  const { releaseName } = useParams<RouterParams>();
  const namespace = useNamespace();
  const [release] = useRelease(namespace, releaseName);
  const [releasePlan, releasePlanLoaded] = useReleasePlan(namespace, release.spec.releasePlan);
  const status = useReleaseStatus(release);
  const [searchValue, setSearchValue] = React.useState('');

  if (!releasePlanLoaded) {
    return (
      <Bullseye>
        <Spinner size="lg" />
      </Bullseye>
    );
  }

  const allRuns: PipelineRunProcessing[] = [
    createPipelineRunEntry(
      'Tenant Collector',
      getTenantCollectorProcessingFromRelease(release),
      release.spec.snapshot,
    ),
    createPipelineRunEntry(
      'Tenant',
      getTenantProcessingFromRelease(release),
      release.spec.snapshot,
    ),
    createPipelineRunEntry('Final', getFinalFromRelease(release), release.spec.snapshot),
    createPipelineRunEntry(
      'Managed',
      getManagedProcessingFromRelease(release),
      release.spec.snapshot,
    ),
  ].filter((run): run is PipelineRunProcessing => run !== undefined && run !== null);

  const filteredRuns = allRuns.filter((run) =>
    run.pipelineRun.toLowerCase().includes(searchValue.toLowerCase()),
  );

  const renderCell = (run: PipelineRunProcessing, key: string) => {
    switch (key) {
      case 'name':
        return (
          <Link
            to={`${PIPELINE_RUNS_DETAILS_PATH.createPath({
              workspaceName: run.prNamespace,
              applicationName: releasePlan.spec.application,
              pipelineRunName: run.pipelineRun,
            })}${releaseName ? `?releaseName=${releaseName}` : ''}`}
            state={{ isPrNamespaceChanged: Boolean(namespace !== run.prNamespace) }}
          >
            {run.pipelineRun}
          </Link>
        );
      case 'startTime':
        return <Timestamp timestamp={run.startTime ?? '-'} />;
      case 'duration':
        return calculateDuration(run.startTime || '', run.completionTime || '') || '-';
      case 'status':
        return <StatusIconWithText status={status} dataTestAttribute="release-details status" />;
      case 'type':
        return run.type;
      case 'snapshot':
        return (
          <Link
            to={SNAPSHOT_DETAILS_PATH.createPath({
              workspaceName: namespace,
              applicationName: releasePlan.spec.application,
              snapshotName: run.snapshot,
            })}
            state={{ isPrNamespaceChanged: Boolean(run?.prNamespace !== namespace) }}
          >
            {run.snapshot}
          </Link>
        );
      case 'namespace':
        return run.prNamespace;
      default:
        return '-';
    }
  };

  return (
    <>
      <Title headingLevel="h3" className="pf-v5-c-title pf-v5-u-mt-lg pf-v5-u-pl-lg">
        Pipeline runs
      </Title>
      <Toolbar>
        <ToolbarContent>
          <ToolbarItem className="">
            <SearchInput
              value={searchValue}
              onChange={(_, value) => setSearchValue(value)}
              onClear={() => setSearchValue('')}
              placeholder="Search by name..."
              aria-label="Search by pipeline run name"
            />
          </ToolbarItem>
        </ToolbarContent>
      </Toolbar>
      <Table aria-label="release-pipeline-runs-table" className="pf-v5-u-mt-md">
        <Thead>
          <Tr>
            {columns.map((col) => (
              <Th key={col.key}>{col.label}</Th>
            ))}
          </Tr>
        </Thead>
        <Tbody>
          {filteredRuns.map((run) => (
            <Tr key={run.pipelineRun}>
              {columns.map((col) => (
                <Td key={col.key} dataLabel={col.label}>
                  {renderCell(run, col.key)}
                </Td>
              ))}
            </Tr>
          ))}
        </Tbody>
      </Table>
    </>
  );
};

export default ReleasePipelineRunTab;
