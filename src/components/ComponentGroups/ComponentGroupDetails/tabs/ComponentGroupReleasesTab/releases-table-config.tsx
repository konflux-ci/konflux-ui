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
      return (
        <Link
          to="#"
          // TODO: handle navigate to Release Details page
          // will be done on https://redhat.atlassian.net/browse/KFLUXUI-1719
          // eslint-disable-next-line no-alert
          onClick={() => alert('TODO')}
          data-test="releases__row-name"
        >
          {obj.metadata?.name}
        </Link>
      );
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
    cell: (info) => (
      <Link
        to="#"
        // TODO: handle navigate to Snapshot Details page
        // will be done on https://redhat.atlassian.net/browse/KFLUXUI-1720
        // eslint-disable-next-line no-alert
        onClick={() => alert('TODO')}
      >
        {info.getValue() as string}
      </Link>
    ),
  },
  {
    id: 'tenantCollectorPipelineRun',
    header: 'Tenant Collector',
    accessorFn: () => null,
    cell: (info) => {
      const obj = info.row.original;
      const [tenantCollectorPrNamespace, tenantCollectorPipelineRun] = getNamespaceAndPRName(
        getTenantCollectorPipelineRunFromRelease(obj),
      );
      if (!tenantCollectorPipelineRun || !tenantCollectorPrNamespace) return '-';
      return (
        <Link
          to="#"
          // TODO: handle navigate to Pipeline Run Details page
          // will be done on https://redhat.atlassian.net/browse/KFLUXUI-1721
          // eslint-disable-next-line no-alert
          onClick={() => alert('TODO')}
        >
          {tenantCollectorPipelineRun}
        </Link>
      );
    },
  },
  {
    id: 'tenantPipelineRun',
    header: 'Tenant Pipeline',
    accessorFn: () => null,
    cell: (info) => {
      const obj = info.row.original;
      const [tenantPrNamespace, tenantPipelineRun] = getNamespaceAndPRName(
        getTenantPipelineRunFromRelease(obj),
      );
      if (!tenantPrNamespace || !tenantPipelineRun) return '-';
      return (
        <Link
          to="#"
          // TODO: handle navigate to Pipeline Run Details page
          // will be done on https://redhat.atlassian.net/browse/KFLUXUI-1721
          // eslint-disable-next-line no-alert
          onClick={() => alert('TODO')}
        >
          {tenantPipelineRun}
        </Link>
      );
    },
  },

  {
    id: 'managedPipelineRun',
    header: 'Managed Pipeline',
    accessorFn: () => null,
    cell: (info) => {
      const obj = info.row.original;
      const [managedPrNamespace, managedPipelineRun] = getNamespaceAndPRName(
        getManagedPipelineRunFromRelease(obj),
      );
      if (!managedPrNamespace || !managedPipelineRun) return '-';
      return (
        <Link
          to="#"
          // TODO: handle navigate to Pipeline Run Details page
          // will be done on https://redhat.atlassian.net/browse/KFLUXUI-1721
          // eslint-disable-next-line no-alert
          onClick={() => alert('TODO')}
        >
          {managedPipelineRun}
        </Link>
      );
    },
  },

  {
    id: 'finalPipelineRun',
    header: 'Final Pipeline',
    accessorFn: () => null,
    cell: (info) => {
      const obj = info.row.original;
      const [finalPrNamespace, finalPipelineRun] = getNamespaceAndPRName(
        getFinalPipelineRunFromRelease(obj),
      );
      if (!finalPrNamespace || !finalPipelineRun) return '-';
      return (
        <Link
          to="#"
          // TODO: handle navigate to Pipeline Run Details page
          // will be done on https://redhat.atlassian.net/browse/KFLUXUI-1721
          // eslint-disable-next-line no-alert
          onClick={() => alert('TODO')}
        >
          {finalPipelineRun}
        </Link>
      );
    },
  },
];
