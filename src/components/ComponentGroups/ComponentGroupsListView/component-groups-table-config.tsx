import { Link } from 'react-router-dom';
import { Flex, FlexItem } from '@patternfly/react-core';
import {
  COMPONENT_DETAILS_V2_PATH,
  COMPONENT_VERSION_DETAILS_PATH,
  GROUP_DETAILS_PATH,
} from '@routes/paths';
import { Timestamp } from '~/shared';
import { defineFilters } from '~/shared/components/Filter';
import { ColumnDefinition } from '~/shared/components/TableV2';
import { ComponentGroupKind, ComponentState } from '~/types';
import { textMatch } from '~/utils/text-filter-utils';

export type ComponentGroupTableRow = ComponentGroupKind & {
  latestPromotedBuild?: ComponentState;
};

const parsePromotedBuildTime = (time?: string): number => {
  const parsed = Date.parse(time ?? '');
  return Number.isNaN(parsed) ? Number.NEGATIVE_INFINITY : parsed;
};

export const getLatestPromotedBuild = (builds: ComponentState[]): ComponentState | undefined =>
  builds.reduce<ComponentState | undefined>((latest, build) => {
    if (!latest) {
      return build;
    }

    const latestTime = parsePromotedBuildTime(latest.lastPromotedBuildTime);
    const buildTime = parsePromotedBuildTime(build.lastPromotedBuildTime);

    return buildTime > latestTime ? build : latest;
  }, undefined);

export const enrichComponentGroupsForTable = (
  groups: ComponentGroupKind[],
): ComponentGroupTableRow[] =>
  groups.map((group) => ({
    ...group,
    latestPromotedBuild: getLatestPromotedBuild(group.status?.globalCandidateList ?? []),
  }));

export const componentGroupsFilterConfig = defineFilters<ComponentGroupTableRow>()([
  {
    type: 'search',
    param: 'name',
    label: 'Name',
    mode: 'client',
    filterFn: (item, value) => textMatch(item.metadata?.name ?? '', value),
  },
]);

export const getComponentGroupsTableColumns = (
  namespace: string,
): ColumnDefinition<ComponentGroupTableRow>[] => [
  {
    id: 'name',
    header: 'Name',
    accessorFn: (row) => row.metadata?.name ?? '-',
    sortable: true,
    size: 2,
    nonHidable: true,
    cell: (info) => {
      const groupName = info.row.original.metadata?.name ?? '-';

      return (
        <Link
          data-test="component-group-name"
          to={GROUP_DETAILS_PATH.createPath({
            workspaceName: namespace,
            groupName,
          })}
        >
          {groupName}
        </Link>
      );
    },
  },
  {
    id: 'components',
    header: 'Components',
    accessorFn: (row) => row.spec.components.length,
    nonHidable: true,
    cell: (info) => <span data-test="component-group-components">{info.getValue() as number}</span>,
  },
  {
    id: 'last-build',
    header: 'Last promoted build',
    accessorFn: (row) => row.latestPromotedBuild,
    nonHidable: true,
    size: 2,
    cell: (info) => {
      const latestBuild = info.getValue() as ComponentState | undefined;

      if (!latestBuild) {
        return <span data-test="component-group-no-build">No Builds yet</span>;
      }

      return (
        <Flex direction={{ default: 'row' }} spaceItems={{ default: 'spaceItemsSm' }}>
          <FlexItem>
            <Link
              data-test="component-group-latest-build"
              to={
                latestBuild.version
                  ? COMPONENT_VERSION_DETAILS_PATH.createPath({
                      workspaceName: namespace,
                      componentName: latestBuild.name,
                      versionRevision: latestBuild.version,
                    })
                  : COMPONENT_DETAILS_V2_PATH.createPath({
                      workspaceName: namespace,
                      componentName: latestBuild.name,
                    })
              }
            >
              {latestBuild.name}
              {latestBuild.version ? <> on {latestBuild.version}</> : null}
            </Link>
          </FlexItem>
          <FlexItem>•</FlexItem>
          <FlexItem>
            <Timestamp timestamp={latestBuild.lastPromotedBuildTime ?? ''} />
          </FlexItem>
        </Flex>
      );
    },
  },
];
