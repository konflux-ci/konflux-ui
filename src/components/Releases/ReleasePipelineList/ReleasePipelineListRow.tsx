import * as React from 'react';
import { Link } from 'react-router-dom';
import { PIPELINE_RUNS_DETAILS_PATH, SNAPSHOT_DETAILS_PATH } from '@routes/paths';
import { TableData, Timestamp } from '~/shared';
import { ReleasePlanKind } from '~/types/coreBuildService';
import { calculateDuration } from '~/utils/pipeline-utils';
import { getDynamicReleasePipelineColumnClasses } from './ReleasePipelineListHeader';

// Type defined in ReleasePipelineRunTab.tsx to avoid duplication
type ReleasePipelineRunColumnKeys =
  | 'name'
  | 'startTime'
  | 'duration'
  | 'type'
  | 'snapshot'
  | 'namespace'
  | 'status'
  | 'completionTime';

interface PipelineRunProcessing {
  type: string;
  startTime: string | null;
  completionTime: string;
  snapshot: string;
  pipelineRun: string;
  prNamespace: string;
}

type PipelineRunListRowProps = {
  obj: PipelineRunProcessing;
  releasePlan: ReleasePlanKind;
  releaseName?: string;
  namespace: string;
  visibleColumns: Set<ReleasePipelineRunColumnKeys>;
};

const PipelineRunListRow: React.FC<PipelineRunListRowProps> = ({
  obj: run,
  releasePlan,
  releaseName,
  namespace,
  visibleColumns,
}) => {
  const showBackButton = namespace !== run?.prNamespace;

  // Use dynamic classes based on visible columns
  const columnClasses = getDynamicReleasePipelineColumnClasses(visibleColumns);

  const columnComponents = {
    name: (
      <TableData key="name" className={columnClasses.name}>
        <Link
          to={`${PIPELINE_RUNS_DETAILS_PATH.createPath({
            workspaceName: run.prNamespace,
            applicationName: releasePlan.spec.application,
            pipelineRunName: run.pipelineRun,
          })}${releaseName ? `?releaseName=${releaseName}` : ''}`}
          state={{ showBackButton }}
        >
          {run.pipelineRun}
        </Link>
      </TableData>
    ),
    startTime: (
      <TableData key="startTime" className={columnClasses.startTime}>
        <Timestamp timestamp={run.startTime || undefined} />
      </TableData>
    ),
    duration: (
      <TableData key="duration" className={columnClasses.duration}>
        {run.startTime ? calculateDuration(run.startTime, run.completionTime) : '-'}
      </TableData>
    ),
    type: (
      <TableData key="type" className={columnClasses.type}>
        {run.type}
      </TableData>
    ),
    snapshot: (
      <TableData key="snapshot" className={columnClasses.snapshot}>
        <Link
          to={SNAPSHOT_DETAILS_PATH.createPath({
            workspaceName: namespace,
            applicationName: releasePlan.spec.application,
            snapshotName: run.snapshot,
          })}
          state={{ showBackButton }}
        >
          {run.snapshot}
        </Link>
      </TableData>
    ),
    namespace: (
      <TableData key="namespace" className={columnClasses.namespace}>
        {run.prNamespace}
      </TableData>
    ),
    status: (
      <TableData key="status" className={columnClasses.status}>
        {run.completionTime ? 'Completed' : run.startTime ? 'Running' : 'Pending'}
      </TableData>
    ),
    completionTime: (
      <TableData key="completionTime" className={columnClasses.completionTime}>
        <Timestamp timestamp={run.completionTime || undefined} />
      </TableData>
    ),
  };

  // Define the order of columns to maintain consistent ordering
  const columnOrder: ReleasePipelineRunColumnKeys[] = [
    'name',
    'startTime',
    'duration',
    'type',
    'snapshot',
    'namespace',
    'status',
    'completionTime',
  ];

  return (
    <>
      {columnOrder
        .filter((columnKey) => visibleColumns.has(columnKey))
        .map((columnKey) => columnComponents[columnKey])}
    </>
  );
};

export default PipelineRunListRow;
