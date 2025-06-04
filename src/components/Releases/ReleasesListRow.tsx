import * as React from 'react';
import { Link } from 'react-router-dom';
import { useReleaseStatus } from '../../hooks/useReleaseStatus';
import {
  APPLICATION_RELEASE_DETAILS_PATH,
  PIPELINERUN_DETAILS_PATH,
  SNAPSHOT_DETAILS_PATH,
} from '../../routes/paths';
import ActionMenu from '../../shared/components/action-menu/ActionMenu';
import { RowFunctionArgs, TableData } from '../../shared/components/table';
import { Timestamp } from '../../shared/components/timestamp/Timestamp';
import { useNamespace } from '../../shared/providers/Namespace';
import { ReleaseKind } from '../../types';
import { calculateDuration } from '../../utils/pipeline-utils';
import {
  getNamespaceAndPRName,
  getTenantCollectorPipelineRunFromRelease,
  getManagedPipelineRunFromRelease,
  getTenantPipelineRunFromRelease,
  getFinalPipelineRunFromRelease,
} from '../../utils/release-utils';
import { StatusIconWithText } from '../StatusIcon/StatusIcon';
import { useReleaseActions } from './release-actions';
import { releasesTableColumnClasses } from './ReleasesListHeader';

const ReleasesListRow: React.FC<
  React.PropsWithChildren<RowFunctionArgs<ReleaseKind, { applicationName: string }>>
> = ({ obj, customData: { applicationName } }) => {
  const namespace = useNamespace();
  const status = useReleaseStatus(obj);
  const [managedPrNamespace, managedPipelineRun] = getNamespaceAndPRName(
    getManagedPipelineRunFromRelease(obj),
  );
  const [tenantPrNamespace, tenantPipelineRun] = getNamespaceAndPRName(
    getTenantPipelineRunFromRelease(obj),
  );
  const [tenantCollectorPrNamespace, tenantCollectorPipelineRun] = getNamespaceAndPRName(
    getTenantCollectorPipelineRunFromRelease(obj),
  );
  const [finalPrNamespace, finalPipelineRun] = getNamespaceAndPRName(
    getFinalPipelineRunFromRelease(obj),
  );
  const actions = useReleaseActions(obj);

  return (
    <>
      <TableData className={releasesTableColumnClasses.name}>
        <Link
          to={APPLICATION_RELEASE_DETAILS_PATH.createPath({
            workspaceName: namespace,
            applicationName,
            releaseName: obj.metadata.name,
          })}
        >
          {obj.metadata.name}
        </Link>
      </TableData>
      <TableData className={releasesTableColumnClasses.created}>
        <Timestamp timestamp={obj.metadata.creationTimestamp} />
      </TableData>
      <TableData className={releasesTableColumnClasses.duration}>
        {obj.status?.startTime != null
          ? calculateDuration(
              typeof obj.status?.startTime === 'string' ? obj.status?.startTime : '',
              typeof obj.status?.completionTime === 'string' ? obj.status?.completionTime : '',
            )
          : '-'}
      </TableData>
      <TableData className={releasesTableColumnClasses.status}>
        <StatusIconWithText dataTestAttribute="release-status" status={status} />
      </TableData>
      <TableData className={releasesTableColumnClasses.releasePlan}>
        {obj.spec.releasePlan}
      </TableData>
      <TableData className={releasesTableColumnClasses.releaseSnapshot}>
        <Link
          to={SNAPSHOT_DETAILS_PATH.createPath({
            workspaceName: namespace,
            applicationName,
            snapshotName: obj.spec.snapshot,
          })}
        >
          {obj.spec.snapshot}
        </Link>
      </TableData>
      <TableData className={releasesTableColumnClasses.tenantCollectorPipelineRun}>
        {tenantCollectorPipelineRun && tenantCollectorPrNamespace ? (
          <Link
            to={PIPELINERUN_DETAILS_PATH.createPath({
              workspaceName: tenantCollectorPrNamespace,
              applicationName,
              pipelineRunName: tenantCollectorPipelineRun,
            })}
          >
            {tenantCollectorPipelineRun}
          </Link>
        ) : (
          '-'
        )}
      </TableData>
      <TableData className={releasesTableColumnClasses.tenantPipelineRun}>
        {tenantPipelineRun && tenantPrNamespace ? (
          <Link
            to={PIPELINERUN_DETAILS_PATH.createPath({
              workspaceName: tenantPrNamespace,
              applicationName,
              pipelineRunName: tenantPipelineRun,
            })}
          >
            {tenantPipelineRun}
          </Link>
        ) : (
          '-'
        )}
      </TableData>
      <TableData className={releasesTableColumnClasses.managedPipelineRun}>
        {managedPipelineRun && managedPrNamespace ? (
          <Link
            to={PIPELINERUN_DETAILS_PATH.createPath({
              workspaceName: managedPrNamespace,
              applicationName,
              pipelineRunName: managedPipelineRun,
            })}
          >
            {managedPipelineRun}
          </Link>
        ) : (
          '-'
        )}
      </TableData>
      <TableData className={releasesTableColumnClasses.finalPipelineRun}>
        {finalPipelineRun && finalPrNamespace ? (
          <Link
            to={PIPELINERUN_DETAILS_PATH.createPath({
              workspaceName: finalPrNamespace,
              applicationName,
              pipelineRunName: finalPipelineRun,
            })}
          >
            {finalPipelineRun}
          </Link>
        ) : (
          '-'
        )}
      </TableData>
      <TableData className={releasesTableColumnClasses.kebab}>
        <ActionMenu actions={actions} />
      </TableData>
    </>
  );
};

export default ReleasesListRow;
