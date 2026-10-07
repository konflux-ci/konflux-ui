import { Link } from 'react-router-dom';
import {
  GROUP_SNAPSHOT_DETAILS_PATH,
  COMPONENT_DETAILS_PATH,
  SNAPSHOT_DETAILS_PATH,
} from '@routes/paths';
import { PipelineRunLabel } from '~/consts/pipelinerun';
import { Timestamp } from '~/shared';
import { ComponentLink } from '~/shared/components/component-link/ComponentLink';
import { defineFilters } from '~/shared/components/Filter';
import { ColumnDefinition, type DefaultSort } from '~/shared/components/TableV2';
import { TriggerColumnData } from '~/shared/components/trigger-column-data/trigger-column-data';
import TruncatedLinkListWithPopover from '~/shared/components/truncated-link-list-with-popover/TruncatedLinkListWithPopover';
import { Snapshot } from '~/types/coreBuildService';
import { ResourceSource } from '~/types/k8s';
import { createCommitObjectFromSnapshot } from '~/utils/commits-utils';
import { textMatch } from '~/utils/text-filter-utils';
import { SnapshotActionCell } from './snapshot-actions';

export const SNAPSHOTS_LIST_COLUMN_STATE_KEY = 'snapshots-list';

export const SNAPSHOTS_DEFAULT_SORT: DefaultSort = { column: 'createdAt', direction: 'desc' };

const SHOW_MERGED_ONLY = 'showMergedOnly';
const RELEASABLE = 'releasable';

export const FILTER_BY_VALUES = {
  SHOW_MERGED_ONLY,
  RELEASABLE,
};

const FILTER_BY_LABELS = {
  [SHOW_MERGED_ONLY]: 'Hide Pull Request Snapshots',
  [RELEASABLE]: 'Show only releasable snapshots',
} as const;

export const filterOptions = {
  filterBy: Object.entries(FILTER_BY_LABELS).map(([value, label]) => ({ label, value })),
};

export const filterConfigs = defineFilters<Snapshot>()([
  {
    type: 'switchableSearch',
    param: 'searchField',
    label: 'Search',
    group: 'search-fields',
    fields: [
      {
        label: 'Name',
        value: 'name',
        param: 'name',
        filterFn: (item, value) => textMatch(item.metadata.name, value),
      },
      {
        label: 'Commit message',
        value: 'commitMessage',
        param: 'commitMessage',
        filterFn: (item, value) =>
          textMatch(
            item.metadata.annotations?.[PipelineRunLabel.TEST_SERVICE_COMMIT_TITLE] ?? '',
            value,
          ),
      },
    ],
  },
  {
    type: 'multiSelect',
    param: 'filterBy',
    label: 'Filter snapshots...',
    group: 'filter-by',
    mode: 'api',
  },
] as const);

export const SNAPSHOTS_LIST_COLUMNS: ColumnDefinition<Snapshot>[] = [
  {
    id: 'name',
    header: 'Name',
    accessorFn: (row) => row.metadata.name,
    size: 2,
    sortable: true,
    nonHidable: true,
    cell: (info) => {
      const namespace = info.table.options.meta?.namespace as string;
      const applicationName = info.table.options.meta?.applicationName as string;
      const groupName = info.table.options.meta?.groupName;
      if (typeof groupName === 'string')
        return (
          <Link
            to={GROUP_SNAPSHOT_DETAILS_PATH.createPath({
              workspaceName: namespace,
              groupName,
              snapshotName: info.row.original.metadata.name,
            })}
            data-test="snapshot-list-row-name"
          >
            {info.row.original.metadata.name}
          </Link>
        );
      return (
        <Link
          to={SNAPSHOT_DETAILS_PATH.createPath({
            workspaceName: namespace,
            applicationName,
            snapshotName: info.getValue() as string,
          })}
          data-test="snapshot-list-row-name"
        >
          {info.getValue() as string}
        </Link>
      );
    },
  },
  {
    id: 'createdAt',
    header: 'Created at',
    accessorFn: (row) => row.metadata.creationTimestamp,
    size: 2,
    sortable: true,
    cell: (info) => <Timestamp timestamp={(info.getValue() as string) ?? '-'} />,
  },
  {
    id: 'components',
    header: 'Components',
    accessorFn: (row) => row.spec.components ?? [],
    size: 2,
    cell: (info) => {
      const namespace = info.table.options.meta?.namespace as string;
      const applicationName = info.table.options.meta?.applicationName as string;
      return (
        <TruncatedLinkListWithPopover
          items={info.getValue() as Snapshot['spec']['components']}
          getKey={(component) => JSON.stringify([component.name, component.version])}
          renderItem={(component) =>
            info.table.options.meta?.groupName ? (
              <ComponentLink
                namespace={namespace}
                name={component.name}
                version={component.version}
              />
            ) : (
              <Link
                to={COMPONENT_DETAILS_PATH.createPath({
                  workspaceName: namespace,
                  applicationName,
                  componentName: component.name.trim(),
                })}
              >
                {component.name.trim()}
              </Link>
            )
          }
          popover={{
            header: 'More snapshot components',
            ariaLabel: 'More snapshot components',
            moreText: (count: number) => `${count} more`,
            dataTestPrefix: 'more-snapshot-components-popover',
          }}
        />
      );
    },
  },
  {
    id: 'commitMessage',
    header: 'Commit message',
    accessorFn: (row) => createCommitObjectFromSnapshot(row)?.shaTitle ?? '-',
    size: 3,
  },
  {
    id: 'reference',
    header: 'Reference',
    accessorFn: (row) => row,
    size: 3,
    cell: (info) => {
      const commit = createCommitObjectFromSnapshot(info.row.original);
      return (
        <TriggerColumnData
          repoOrg={commit?.repoOrg}
          repoName={commit?.repoName}
          repoURL={commit?.repoURL}
          prNumber={commit?.pullRequestNumber}
          eventType={commit?.eventType}
          commitSha={commit?.sha}
          shaUrl={commit?.shaURL}
        />
      );
    },
  },
  {
    id: 'actions',
    header: '',
    accessorFn: () => null,
    width: '48px',
    pinned: 'end',
    nonHidable: true,
    cell: (info) => {
      const getSourceFn = info.table.options.meta?.getSource as
        ((item: Snapshot) => ResourceSource | undefined) | undefined;
      const source = getSourceFn?.(info.row.original);
      return (
        <SnapshotActionCell
          snapshot={info.row.original}
          source={source}
          readOnly={Boolean(info.table.options.meta?.groupName)}
        />
      );
    },
  },
];
