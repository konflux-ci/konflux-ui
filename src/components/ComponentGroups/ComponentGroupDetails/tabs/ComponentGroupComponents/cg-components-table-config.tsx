import { Link } from 'react-router-dom';
import { Flex } from '@patternfly/react-core';
import {
  COMPONENT_DETAILS_V2_PATH,
  COMPONENT_VERSION_DETAILS_PATH,
  GROUP_DETAILS_PATH,
} from '@routes/paths';
import SpecComponentTypeLabel from '~/components/ComponentGroups/SpecComponentTypeLabel';
import GitRepoLink from '~/components/GitLink/GitRepoLink';
import LatestPushBuildSection from '~/components/LatestBuild/LatestPushBuildSection';
import { defineFilters } from '~/shared/components/Filter';
import { ColumnDefinition } from '~/shared/components/TableV2';
import { ComponentReferenceKind } from '~/types';
import { textMatch } from '~/utils/text-filter-utils';

export type CgComponentListItem = {
  componentName: string;
  namespace: string;
  kind?: ComponentReferenceKind;
  gitUrl?: string;
  imageUrl?: string;
  version?: string;
};

export const cgComponentsFilterConfig = defineFilters<CgComponentListItem>()([
  {
    type: 'search',
    param: 'name',
    label: 'Name',
    mode: 'client',
    filterFn: (item, value) => textMatch(item.componentName ?? '', value),
  },
]);

export const cgComponentsTableColumns: ColumnDefinition<CgComponentListItem>[] = [
  {
    id: 'name',
    header: 'Name',
    accessorFn: (row) => row.componentName,
    sortable: true,
    size: 2,
    nonHidable: true,
    cell: (info) => {
      const item = info.row.original;
      const isComponentGroup = item.kind?.toLowerCase() === 'componentgroup';

      return (
        <Flex direction={{ default: 'column' }}>
          <Link
            data-test="component-name"
            to={
              isComponentGroup
                ? GROUP_DETAILS_PATH.createPath({
                    workspaceName: item.namespace,
                    groupName: item.componentName,
                  })
                : COMPONENT_DETAILS_V2_PATH.createPath({
                    workspaceName: item.namespace,
                    componentName: item.componentName,
                  })
            }
          >
            <b>{item.componentName}</b>
          </Link>
          {item.gitUrl && <GitRepoLink url={item.gitUrl} revision={item.version} />}
          {/* // TODO: add ImageUrlDisplayV2, which does not use applications */}
        </Flex>
      );
    },
  },
  {
    id: 'version',
    header: 'Version',
    accessorFn: (row) => row.version,
    sortable: true,
    nonHidable: true,
    cell: (info) => {
      const item = info.row.original;
      const isComponentGroup = item.kind?.toLowerCase() === 'componentgroup';

      if (isComponentGroup) {
        return '-';
      }

      return item.version ? (
        <Link
          to={COMPONENT_VERSION_DETAILS_PATH.createPath({
            workspaceName: item.namespace,
            componentName: item.componentName,
            versionRevision: item.version,
          })}
        >
          {item.version}
        </Link>
      ) : (
        '-'
      );
    },
  },
  {
    id: 'type',
    header: 'Type',
    accessorFn: (row) => row.kind,
    sortable: true,
    cell: (info) => {
      const item = info.row.original;
      return <SpecComponentTypeLabel component={item} />;
    },
  },
  {
    id: 'latest-build',
    header: 'Latest build',
    sortable: false,
    size: 4,
    cell: (info) => {
      const item = info.row.original;
      const isComponentGroup = item.kind?.toLowerCase() === 'componentgroup';

      if (isComponentGroup) {
        return '-';
      }

      return (
        <LatestPushBuildSection
          componentName={info.row.original.componentName}
          version={info.row.original.version}
        />
      );
    },
  },
  // TODO: add build logs modal + actions
];
