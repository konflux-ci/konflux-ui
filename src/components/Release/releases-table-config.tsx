import { Link } from 'react-router-dom';
import { PipelineRunLabel } from '~/consts/pipelinerun';
import {
  APPLICATION_RELEASE_DETAILS_PATH,
  APPLICATION_RELEASE_LIST_PATH,
  COMPONENT_DETAILS_V2_PATH,
  PIPELINERUN_DETAILS_PATH,
  SNAPSHOT_DETAILS_PATH,
} from '~/routes/paths';
import { Timestamp } from '~/shared';
import { defineFilters } from '~/shared/components/Filter';
import { CellContext, ColumnDefinition } from '~/shared/components/TableV2';
import { ReleaseKind } from '~/types';
import { nameSearchFilter } from '~/utils/common-filter-configs';
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

export const COMPONENT_GROUP_RELEASES_LIST_COLUMN_STATE_KEY = 'component-group-releases-list';

export const RELEASES_LIST_FILTERS = defineFilters<ReleaseKind>()([nameSearchFilter]);

const pipelineRunCell =
  (getPipelineRun: (release: ReleaseKind) => string, withBackButton = false) =>
  (info: CellContext<ReleaseKind, string>) => {
    const [workspaceName, pipelineRunName] = getNamespaceAndPRName(
      getPipelineRun(info.row.original),
    );
    const { currentNamespace, applicationName } = info.table.options.meta ?? {};
    const releaseApplication =
      info.row.original.metadata?.labels?.[PipelineRunLabel.APPLICATION] ?? applicationName;
    if (!workspaceName || !pipelineRunName) {
      return '-';
    }
    if (typeof releaseApplication !== 'string' || !releaseApplication) {
      return pipelineRunName;
    }
    const backButtonState =
      withBackButton &&
      typeof currentNamespace === 'string' &&
      currentNamespace.length > 0 &&
      typeof releaseApplication === 'string' &&
      releaseApplication.length > 0 &&
      workspaceName !== currentNamespace
        ? {
            backButtonLink: APPLICATION_RELEASE_LIST_PATH.createPath({
              workspaceName: currentNamespace,
              applicationName: releaseApplication,
            }),
            backButtonText: 'Back to release list',
          }
        : undefined;
    return (
      <Link
        to={PIPELINERUN_DETAILS_PATH.createPath({
          workspaceName,
          applicationName: releaseApplication,
          pipelineRunName,
        })}
        state={backButtonState}
      >
        {pipelineRunName}
      </Link>
    );
  };

export const RELEASES_LIST_COLUMNS: ColumnDefinition<ReleaseKind>[] = [
  {
    id: 'name',
    header: 'Name',
    nonHidable: true,
    pinned: 'start',
    sortable: true,
    accessorFn: (obj) => obj.metadata?.name,
    cell: (info) => {
      const obj = info.row.original;
      // TODO[KFLUXUI-1719]: Route Component Group releases to the group-specific Release details page.
      const releaseApplication = obj.metadata?.labels?.[PipelineRunLabel.APPLICATION];
      if (!obj.metadata?.namespace || !releaseApplication || !obj.metadata?.name) {
        return obj.metadata?.name ?? '-';
      }
      return (
        <Link
          to={APPLICATION_RELEASE_DETAILS_PATH.createPath({
            workspaceName: obj.metadata.namespace,
            applicationName: releaseApplication,
            releaseName: obj.metadata.name,
          })}
        >
          {obj.metadata.name}
        </Link>
      );
    },
  },
  {
    id: 'created',
    header: 'Created',
    sortable: true,
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
      const workspaceName = info.row.original.metadata?.namespace;
      if (!componentName || !workspaceName) return '-';
      return (
        <Link
          to={COMPONENT_DETAILS_V2_PATH.createPath({
            workspaceName,
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
    // TODO[KFLUXUI-1720]: Route Component Group releases to the group-specific Snapshot details page.
    cell: (info) => {
      const snapshot = info.getValue() as string;
      const releaseNamespace = info.row.original.metadata?.namespace;
      const { currentNamespace, applicationName } = info.table.options.meta ?? {};
      if (!snapshot || !releaseNamespace) return '-';
      const releaseApplication =
        info.row.original.metadata?.labels?.[PipelineRunLabel.APPLICATION] ?? applicationName;
      const backButtonState =
        typeof currentNamespace === 'string' &&
        currentNamespace.length > 0 &&
        typeof releaseApplication === 'string' &&
        releaseApplication.length > 0 &&
        releaseNamespace !== currentNamespace
          ? {
              backButtonLink: APPLICATION_RELEASE_LIST_PATH.createPath({
                workspaceName: currentNamespace,
                applicationName: releaseApplication,
              }),
              backButtonText: 'Back to release list',
            }
          : undefined;
      if (typeof releaseApplication !== 'string' || !releaseApplication) return snapshot;
      return (
        <Link
          to={SNAPSHOT_DETAILS_PATH.createPath({
            workspaceName: releaseNamespace,
            applicationName: releaseApplication,
            snapshotName: snapshot,
          })}
          state={backButtonState}
        >
          {snapshot}
        </Link>
      );
    },
  },
  {
    id: 'tenantCollectorPipelineRun',
    header: 'Tenant Collector',
    // TODO[KFLUXUI-1721]: Route Component Group releases to the group-specific PipelineRun details page.
    accessorFn: (obj) => {
      const [tenantCollectorPrNamespace, tenantCollectorPipelineRun] = getNamespaceAndPRName(
        getTenantCollectorPipelineRunFromRelease(obj),
      );
      if (!tenantCollectorPrNamespace || !tenantCollectorPipelineRun) return '-';
      return tenantCollectorPipelineRun;
    },
    cell: pipelineRunCell(getTenantCollectorPipelineRunFromRelease),
  },
  {
    id: 'tenantPipelineRun',
    header: 'Tenant Pipeline',
    // TODO[KFLUXUI-1721]: Route Component Group releases to the group-specific PipelineRun details page.
    accessorFn: (obj) => {
      const [tenantPrNamespace, tenantPipelineRun] = getNamespaceAndPRName(
        getTenantPipelineRunFromRelease(obj),
      );
      if (!tenantPrNamespace || !tenantPipelineRun) return '-';
      return tenantPipelineRun;
    },
    cell: pipelineRunCell(getTenantPipelineRunFromRelease),
  },

  {
    id: 'managedPipelineRun',
    header: 'Managed Pipeline',
    // TODO[KFLUXUI-1721]: Route Component Group releases to the group-specific PipelineRun details page.
    accessorFn: (obj) => {
      const [managedPrNamespace, managedPipelineRun] = getNamespaceAndPRName(
        getManagedPipelineRunFromRelease(obj),
      );
      if (!managedPrNamespace || !managedPipelineRun) return '-';
      return managedPipelineRun;
    },
    cell: pipelineRunCell(getManagedPipelineRunFromRelease, true),
  },

  {
    id: 'finalPipelineRun',
    header: 'Final Pipeline',
    // TODO[KFLUXUI-1721]: Route Component Group releases to the group-specific PipelineRun details page.
    accessorFn: (obj) => {
      const [finalPrNamespace, finalPipelineRun] = getNamespaceAndPRName(
        getFinalPipelineRunFromRelease(obj),
      );
      if (!finalPrNamespace || !finalPipelineRun) return '-';
      return finalPipelineRun;
    },
    cell: pipelineRunCell(getFinalPipelineRunFromRelease, true),
  },
];
