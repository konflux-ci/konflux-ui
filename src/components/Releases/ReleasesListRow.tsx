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

type ReleaseColumnKeys = 'name' | 'created' | 'duration' | 'status' | 'releasePlan' | 'releaseSnapshot' | 'tenantCollectorPipelineRun' | 'tenantPipelineRun' | 'managedPipelineRun' | 'finalPipelineRun';

interface ReleasesListRowProps extends RowFunctionArgs<ReleaseKind, { applicationName: string }> {
  visibleColumns?: Set<ReleaseColumnKeys>;
}

const ReleasesListRow: React.FC<React.PropsWithChildren<ReleasesListRowProps>> = ({ 
  obj, 
  customData: { applicationName },
  visibleColumns 
}) => {
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

  const columnOrder: ReleaseColumnKeys[] = ['name', 'created', 'duration', 'status', 'releasePlan', 'releaseSnapshot', 'tenantCollectorPipelineRun', 'tenantPipelineRun', 'managedPipelineRun', 'finalPipelineRun'];

  const columnComponents: Record<ReleaseColumnKeys, React.ReactNode> = {
    name: (
      <TableData key="name" className={releasesTableColumnClasses.name}>
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
    ),
    created: (
      <TableData key="created" className={releasesTableColumnClasses.created}>
        <Timestamp timestamp={obj.metadata.creationTimestamp} />
      </TableData>
    ),
    duration: (
      <TableData key="duration" className={releasesTableColumnClasses.duration}>
        {obj.status?.startTime != null
          ? calculateDuration(
              typeof obj.status?.startTime === 'string' ? obj.status?.startTime : '',
              typeof obj.status?.completionTime === 'string' ? obj.status?.completionTime : '',
            )
          : '-'}
      </TableData>
    ),
    status: (
      <TableData key="status" className={releasesTableColumnClasses.status}>
        <StatusIconWithText dataTestAttribute="release-status" status={status} />
      </TableData>
    ),
    releasePlan: (
      <TableData key="releasePlan" className={releasesTableColumnClasses.releasePlan}>
        {obj.spec.releasePlan}
      </TableData>
    ),
    releaseSnapshot: (
      <TableData key="releaseSnapshot" className={releasesTableColumnClasses.releaseSnapshot}>
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
    ),
    tenantCollectorPipelineRun: (
      <TableData key="tenantCollectorPipelineRun" className={releasesTableColumnClasses.tenantCollectorPipelineRun}>
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
    ),
    tenantPipelineRun: (
      <TableData key="tenantPipelineRun" className={releasesTableColumnClasses.tenantPipelineRun}>
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
    ),
    managedPipelineRun: (
      <TableData key="managedPipelineRun" className={releasesTableColumnClasses.managedPipelineRun}>
        {managedPipelineRun && managedPrNamespace ? (
          <Link
            to={PIPELINERUN_DETAILS_PATH.createPath({
              workspaceName: managedPrNamespace,
              applicationName,
              pipelineRunName: managedPipelineRun,
            })}
            state={{ showBackButton: Boolean(namespace !== managedPrNamespace) }}
          >
            {managedPipelineRun}
          </Link>
        ) : (
          '-'
        )}
      </TableData>
    ),
    finalPipelineRun: (
      <TableData key="finalPipelineRun" className={releasesTableColumnClasses.finalPipelineRun}>
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
    ),
  };

  return (
    <>
      {visibleColumns 
        ? columnOrder
            .filter(columnKey => visibleColumns.has(columnKey))
            .map(columnKey => columnComponents[columnKey])
        : Object.values(columnComponents)}
      <TableData className={releasesTableColumnClasses.kebab}>
        <ActionMenu actions={actions} />
      </TableData>
    </>
  );
};

export default ReleasesListRow;
