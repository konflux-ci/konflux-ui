import * as React from 'react';
import { Link } from 'react-router-dom';
import { Release } from '~/hooks/useGetAllReleases';
import {
  APPLICATION_DETAILS_PATH,
  APPLICATION_RELEASE_DETAILS_PATH,
  COMPONENT_DETAILS_PATH,
  RELEASEPLAN_PATH,
} from '../../routes/paths';
import { RowFunctionArgs, TableData } from '../../shared/components/table';
import { Timestamp } from '../../shared/components/timestamp/Timestamp';
import { runStatus } from '../../utils/pipeline-utils';
import { StatusIconWithText } from '../StatusIcon/StatusIcon';
import { releaseTableColumnClasses } from './ReleaseListHeader';

const ReleaseListRow: React.FC<React.PropsWithChildren<RowFunctionArgs<Release>>> = ({ obj }) => {
  return (
    <>
      <TableData className={releaseTableColumnClasses.name}>
        <Link
          to={APPLICATION_RELEASE_DETAILS_PATH.createPath({
            workspaceName: obj.tenant,
            applicationName: obj.application,
            releaseName: obj.name,
          })}
        >
          {obj.name}
        </Link>
      </TableData>

      <TableData className={releaseTableColumnClasses.status}>
        <StatusIconWithText status={obj.status as runStatus} />
      </TableData>

      <TableData className={releaseTableColumnClasses.completionTime}>
        <Timestamp timestamp={obj.completionTime} />
      </TableData>

      <TableData className={releaseTableColumnClasses.component}>
        <Link
          to={COMPONENT_DETAILS_PATH.createPath({
            workspaceName: obj.tenant,
            applicationName: obj.application,
            componentName: obj.component,
          })}
        >
          {obj.component}
        </Link>
      </TableData>

      <TableData className={releaseTableColumnClasses.application}>
        <Link
          to={APPLICATION_DETAILS_PATH.createPath({
            workspaceName: obj.tenant,
            applicationName: obj.application,
          })}
        >
          {obj.application}
        </Link>
      </TableData>

      <TableData className={releaseTableColumnClasses.releasePlan}>
        <Link to={RELEASEPLAN_PATH.createPath({ workspaceName: obj.tenant })}>
          {obj.releasePlan}
        </Link>
      </TableData>

      <TableData className={releaseTableColumnClasses.namespace}>{obj.tenant}</TableData>
    </>
  );
};

export default ReleaseListRow;
