import * as React from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  APPLICATION_RELEASE_LIST_PATH,
  PIPELINE_RUNS_DETAILS_PATH,
  SNAPSHOT_DETAILS_PATH,
} from '@routes/paths';
import { TableData, Timestamp } from '~/shared';
import { ReleasePlanKind } from '~/types/coreBuildService';
import { calculateDuration } from '~/utils/pipeline-utils';
import { releasePipelineRunListColumnClasses } from './ReleasePipelineListHeader';

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
};

const RELEASE_DETAILS_LINK_TEXT = 'Back to release details';

const PipelineRunListRow: React.FC<PipelineRunListRowProps> = ({
  obj: run,
  releasePlan,
  releaseName,
  namespace,
}) => {
  const { applicationName } = useParams();
  const showBackButton = namespace !== run?.prNamespace;

  const backButtonState = showBackButton
    ? {
        backButtonLink: APPLICATION_RELEASE_LIST_PATH.createPath({
          workspaceName: namespace,
          applicationName,
        }),
        backButtonText: RELEASE_DETAILS_LINK_TEXT,
      }
    : {};

  return (
    <>
      <TableData className={releasePipelineRunListColumnClasses.name}>
        <Link
          to={`${PIPELINE_RUNS_DETAILS_PATH.createPath({
            workspaceName: run.prNamespace,
            applicationName: releasePlan.spec.application,
            pipelineRunName: run.pipelineRun,
          })}${releaseName ? `?releaseName=${releaseName}` : ''}`}
          state={backButtonState}
        >
          {run.pipelineRun}
        </Link>
      </TableData>
      <TableData className={releasePipelineRunListColumnClasses.startTime}>
        <Timestamp timestamp={run.startTime ?? '-'} />
      </TableData>
      <TableData className={releasePipelineRunListColumnClasses.duration}>
        {calculateDuration(run.startTime || '', run.completionTime || '') || '-'}
      </TableData>
      <TableData className={releasePipelineRunListColumnClasses.type}>{run.type}</TableData>
      <TableData className={releasePipelineRunListColumnClasses.snapshot}>
        <Link
          to={SNAPSHOT_DETAILS_PATH.createPath({
            workspaceName: namespace,
            applicationName: releasePlan.spec.application,
            snapshotName: run.snapshot,
          })}
          state={backButtonState}
        >
          {run.snapshot}
        </Link>
      </TableData>
      <TableData className={releasePipelineRunListColumnClasses.namespace}>
        {run.prNamespace}
      </TableData>
    </>
  );
};

export default PipelineRunListRow;
