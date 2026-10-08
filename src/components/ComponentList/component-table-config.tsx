import { Link } from 'react-router-dom';
import { Flex } from '@patternfly/react-core';
import { COMPONENT_DETAILS_V2_PATH, COMPONENT_VERSIONS_PATH } from '@routes/paths';
import GitRepoLink from '~/components/GitLink/GitRepoLink';
import LatestPushBuildSection from '~/components/LatestBuild/LatestPushBuildSection';
import { defineFilters } from '~/shared/components/Filter';
import { ColumnDefinition } from '~/shared/components/TableV2';
import { ComponentKind } from '~/types';
import { textMatch } from '~/utils/text-filter-utils';

export const componentsFilterConfig = defineFilters<ComponentKind>()([
  {
    type: 'search',
    param: 'name',
    label: 'Name',
    mode: 'client',
    filterFn: (item, value) => textMatch(item.metadata.name ?? '', value),
  },
]);

export const componentsTableColumns: ColumnDefinition<ComponentKind>[] = [
  {
    id: 'component',
    header: 'Component',
    accessorFn: (row) => row.metadata.name ?? '-',
    sortable: true,
    size: 2,
    nonHidable: true,
    cell: (info) => {
      const component = info.row.original;
      const versions = component.spec.source?.versions ?? [];

      return (
        <Flex direction={{ default: 'column' }}>
          <Link
            data-test="component-name"
            to={COMPONENT_DETAILS_V2_PATH.createPath({
              workspaceName: component.metadata.namespace,
              componentName: component.metadata.name,
            })}
          >
            <b>{component.metadata.name}</b>
          </Link>
          {component.spec.source?.url && (
            <GitRepoLink
              url={component.spec.source?.url}
              revision={versions.length === 1 ? versions[0].revision : undefined}
            />
          )}
        </Flex>
      );
    },
  },
  {
    id: 'versions',
    header: 'Versions',
    sortable: true,
    accessorFn: (row) => row.spec.source?.versions?.length ?? 0,
    cell: (info) => {
      const component = info.row.original;

      return (
        <Link
          data-test="component-versions"
          to={COMPONENT_VERSIONS_PATH.createPath({
            workspaceName: component.metadata?.namespace,
            componentName: component.metadata?.name,
          })}
        >
          {component.spec.source?.versions?.length ?? 0}
        </Link>
      );
    },
  },
  {
    id: 'latest-build',
    header: 'Latest build',
    sortable: false,
    size: 4,
    cell: (info) => <LatestPushBuildSection componentName={info.row.original.metadata.name} />,
  },
  // TODO: add build logs modal + actions
];
