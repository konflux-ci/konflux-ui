import { Link } from 'react-router-dom';
import { PipelineRunLabel } from '~/consts/pipelinerun';
import { COMPONENT_DETAILS_V2_PATH } from '~/routes/paths';
import { Timestamp } from '~/shared';
import { ColumnDefinition } from '~/shared/components/TableV2';
import { ReleaseKind } from '~/types';
import { calculateDuration } from '~/utils/pipeline-utils';
import {
  getFinalPipelineRunFromRelease,
  getManagedPipelineRunFromRelease,
  getNamespaceAndPRName,
  getTenantCollectorPipelineRunFromRelease,
  getTenantPipelineRunFromRelease,
} from '~/utils/release-utils';
import ReleaseStatusCell from './ReleaseStatusCell';

export const RELEASES_LIST_COLUMN_STATE_KEY = 'releases-list';

export const RELEASES_LIST_COLUMNS: ColumnDefinition<ReleaseKind>[] = [
  {
    id: 'name',
    header: 'Name',
    nonHidable: true,
    accessorFn: (obj) => obj.metadata?.name,
    cell: (info) => {
      const obj = info.row.original;
      // TODO[KFLUXUI-1719]
      return obj.metadata?.name;
    },
  },
  {
    id: 'created',
    header: 'Created',
    accessorFn: (obj) => obj.metadata?.creationTimestamp,
    cell: (info) => {
      return <Timestamp timestamp={info.getValue() as string} />;
    },
  },
  {
    id: 'duration',
    header: 'Duration',
    accessorFn: (obj) =>
      obj.status?.startTime != null
        ? calculateDuration(
            typeof obj.status?.startTime === 'string' ? obj.status?.startTime : '',
            typeof obj.status?.completionTime === 'string' ? obj.status?.completionTime : '',
          )
        : '-',
  },
  {
    id: 'status',
    header: 'Status',
    accessorFn: () => null,
    cell: (info) => {
      const obj = info.row.original;
      return <ReleaseStatusCell release={obj} />;
    },
  },
  {
    id: 'component',
    header: 'Component',
    accessorFn: (obj) => obj?.metadata?.labels?.[PipelineRunLabel.COMPONENT],
    cell: (info) => {
      const componentName = info.getValue() as string | undefined;
      if (!componentName) return '-';
      return (
        <Link
          to={COMPONENT_DETAILS_V2_PATH.createPath({
            workspaceName: info.row.original.metadata?.namespace,
            componentName,
          })}
        >
          {componentName}
        </Link>
      );
    },
  },
  {
    id: 'releasePlan',
    header: 'Release Plan',
    accessorFn: (obj) => obj.spec.releasePlan ?? '-',
  },
  {
    id: 'releaseSnapshot',
    header: 'Release Snapshot',
    accessorFn: (obj) => obj.spec.snapshot,
    // TODO[KFLUXUI-1720]
    cell: (info) => info.getValue() as string,
  },
  {
    id: 'tenantCollectorPipelineRun',
    header: 'Tenant Collector',
    accessorFn: (obj) => {
      const [tenantCollectorPrNamespace, tenantCollectorPipelineRun] = getNamespaceAndPRName(
        getTenantCollectorPipelineRunFromRelease(obj),
      );
      if (!tenantCollectorPrNamespace || !tenantCollectorPipelineRun) return '-';
      return tenantCollectorPipelineRun;
    },
    // TODO[KFLUXUI-1721]
    cell: (info) => info.getValue() as string,
  },
  {
    id: 'tenantPipelineRun',
    header: 'Tenant Pipeline',
    accessorFn: (obj) => {
      const [tenantPrNamespace, tenantPipelineRun] = getNamespaceAndPRName(
        getTenantPipelineRunFromRelease(obj),
      );
      if (!tenantPrNamespace || !tenantPipelineRun) return '-';
      return tenantPipelineRun;
    },
    // TODO[KFLUXUI-1721]
    cell: (info) => info.getValue() as string,
  },

  {
    id: 'managedPipelineRun',
    header: 'Managed Pipeline',
    accessorFn: (obj) => {
      const [managedPrNamespace, managedPipelineRun] = getNamespaceAndPRName(
        getManagedPipelineRunFromRelease(obj),
      );
      if (!managedPrNamespace || !managedPipelineRun) return '-';
      return managedPipelineRun;
    },
    // TODO[KFLUXUI-1721]
    cell: (info) => info.getValue() as string,
  },

  {
    id: 'finalPipelineRun',
    header: 'Final Pipeline',
    accessorFn: (obj) => {
      const [finalPrNamespace, finalPipelineRun] = getNamespaceAndPRName(
        getFinalPipelineRunFromRelease(obj),
      );
      if (!finalPrNamespace || !finalPipelineRun) return '-';
      return finalPipelineRun;
    },
    // TODO[KFLUXUI-1721]
    cell: (info) => info.getValue() as string,
  },
];
