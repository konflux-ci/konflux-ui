import * as React from 'react';
import { Link } from 'react-router-dom';
import { PIPELINE_RUNS_DETAILS_PATH, SNAPSHOT_DETAILS_PATH } from '@routes/paths';
import { TableData, Timestamp } from '~/shared';
import { ReleasePlanKind } from '~/types/coreBuildService';
import { calculateDuration } from '~/utils/pipeline-utils';
import { releasePipelineRunListColumnClasses } from './ReleasePipelineListHeader';

// Type defined in ReleasePipelineRunTab.tsx to avoid duplication
type PipelineRunColumnKeys =
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
  visibleColumns: Set<PipelineRunColumnKeys>;
};

const PipelineRunListRow: React.FC<PipelineRunListRowProps> = ({
  obj: run,
  releasePlan,
  releaseName,
  namespace,
  visibleColumns,
}) => {
  const showBackButton = namespace !== run?.prNamespace;

  const columnComponents = {
    name: (
      <TableData key="name" className={releasePipelineRunListColumnClasses.name}>
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
      <TableData key="startTime" className={releasePipelineRunListColumnClasses.startTime}>
        <Timestamp timestamp={run.startTime || undefined} />
      </TableData>
    ),
    duration: (
      <TableData key="duration" className={releasePipelineRunListColumnClasses.duration}>
        {run.startTime ? calculateDuration(run.startTime, run.completionTime) : '-'}
      </TableData>
    ),
    type: (
      <TableData key="type" className={releasePipelineRunListColumnClasses.type}>
        {run.type}
      </TableData>
    ),
    snapshot: (
      <TableData key="snapshot" className={releasePipelineRunListColumnClasses.snapshot}>
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
      <TableData key="namespace" className={releasePipelineRunListColumnClasses.namespace}>
        {run.prNamespace}
      </TableData>
    ),
    status: (
      <TableData key="status" className={releasePipelineRunListColumnClasses.status}>
        {run.completionTime ? 'Completed' : run.startTime ? 'Running' : 'Pending'}
      </TableData>
    ),
    completionTime: (
      <TableData
        key="completionTime"
        className={releasePipelineRunListColumnClasses.completionTime}
      >
        <Timestamp timestamp={run.completionTime || undefined} />
      </TableData>
    ),
  };

  // Define the order of columns to maintain consistent ordering
  const columnOrder: PipelineRunColumnKeys[] = [
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
