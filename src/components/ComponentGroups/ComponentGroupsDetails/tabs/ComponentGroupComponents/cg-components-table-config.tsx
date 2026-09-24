import { Link } from 'react-router-dom';
import { Flex } from '@patternfly/react-core';
import { COMPONENT_DETAILS_V2_PATH, COMPONENT_VERSION_DETAILS_PATH } from '@routes/paths';
import GitRepoLink from '~/components/GitLink/GitRepoLink';
import LatestPushBuildSection from '~/components/LatestBuild/LatestPushBuildSection';
import { defineFilters } from '~/shared/components/Filter';
import { ColumnDefinition } from '~/shared/components/TableV2';
import { textMatch } from '~/utils/text-filter-utils';

export type CgComponentListItem = {
  componentName: string;
  namespace: string;
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
    id: 'component',
    header: 'Component',
    accessorFn: (row) => row.componentName,
    sortable: true,
    size: 2,
    nonHidable: true,
    cell: (info) => {
      const item = info.row.original;

      return (
        <Flex direction={{ default: 'column' }}>
          <Link
            data-test="component-name"
            to={COMPONENT_DETAILS_V2_PATH.createPath({
              workspaceName: item.namespace,
              componentName: item.componentName,
            })}
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
    id: 'latest-build',
    header: 'Latest build',
    sortable: false,
    size: 4,
    cell: (info) => (
      <LatestPushBuildSection
        componentName={info.row.original.componentName}
        version={info.row.original.version}
      />
    ),
  },
  // TODO: add build logs modal + actions
];
