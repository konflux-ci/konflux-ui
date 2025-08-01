import * as React from 'react';
import { Link } from 'react-router-dom';
import { PipelineRunLabel } from '~/consts/pipelinerun';
import { useReleaseStatus } from '~/hooks/useReleaseStatus';
import {
  APPLICATION_DETAILS_PATH,
  APPLICATION_RELEASE_DETAILS_PATH,
  COMPONENT_DETAILS_PATH,
  RELEASEPLAN_PATH,
} from '../../routes/paths';
import { RowFunctionArgs, TableData } from '../../shared/components/table';
import { Timestamp } from '../../shared/components/timestamp/Timestamp';
import { MonitoredReleaseKind } from '../../types';
import { StatusIconWithText } from '../StatusIcon/StatusIcon';
import { releaseTableColumnClasses } from './ReleaseListHeader';

const ReleaseListRow: React.FC<RowFunctionArgs<MonitoredReleaseKind>> = ({ obj }) => {
  const status = useReleaseStatus(obj);

  return (
    <>
      <TableData className={releaseTableColumnClasses.name}>
        <Link
          to={APPLICATION_RELEASE_DETAILS_PATH.createPath({
            workspaceName: obj.metadata.namespace,
            applicationName: obj.metadata.labels?.[PipelineRunLabel.APPLICATION],
            releaseName: obj.metadata.name,
          })}
        >
          {obj.metadata.name}
        </Link>
      </TableData>

      <TableData className={releaseTableColumnClasses.status}>
        <StatusIconWithText status={status} />
      </TableData>

      <TableData className={releaseTableColumnClasses.completionTime}>
        <Timestamp timestamp={obj.status?.completionTime ?? ''} />
      </TableData>

      <TableData className={releaseTableColumnClasses.component}>
        <Link
          to={COMPONENT_DETAILS_PATH.createPath({
            workspaceName: obj.metadata.namespace,
            applicationName: obj.metadata.labels?.[PipelineRunLabel.APPLICATION],
            componentName: obj.metadata.labels?.[PipelineRunLabel.COMPONENT],
          })}
        >
          {obj.metadata.labels?.[PipelineRunLabel.COMPONENT]}
        </Link>
      </TableData>

      <TableData className={releaseTableColumnClasses.application}>
        <Link
          to={APPLICATION_DETAILS_PATH.createPath({
            workspaceName: obj.metadata.namespace,
            applicationName: obj.metadata.labels?.[PipelineRunLabel.APPLICATION],
          })}
        >
          {obj.metadata.labels?.[PipelineRunLabel.APPLICATION]}
        </Link>
      </TableData>

      <TableData className={releaseTableColumnClasses.releasePlan}>
        <Link to={RELEASEPLAN_PATH.createPath({ workspaceName: obj.metadata.namespace })}>
          {obj.spec.releasePlan}
        </Link>
      </TableData>

      <TableData className={releaseTableColumnClasses.namespace}>
        {obj.metadata.namespace}
      </TableData>
    </>
  );
};

export default ReleaseListRow;
