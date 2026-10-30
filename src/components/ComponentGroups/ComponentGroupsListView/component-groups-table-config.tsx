import { Link } from 'react-router-dom';
import { Flex, FlexItem, Label } from '@patternfly/react-core';
import {
  COMPONENT_DETAILS_V2_PATH,
  COMPONENT_VERSION_DETAILS_PATH,
  GROUP_DETAILS_PATH,
} from '@routes/paths';
import { Timestamp } from '~/shared';
import { defineFilters } from '~/shared/components/Filter';
import { ColumnDefinition } from '~/shared/components/TableV2';
import { ComponentGroupKind } from '~/types';
import { getLatestPromotedBuild } from '~/utils/component-group-utils';
import { textMatch } from '~/utils/text-filter-utils';

export const componentGroupsFilterConfig = defineFilters<ComponentGroupKind>()([
  {
    type: 'search',
    param: 'name',
    label: 'Name',
    mode: 'client',
    filterFn: (item, value) => textMatch(item.metadata?.name ?? '', value),
  },
] as const);

export const componentGroupsTableColumns: ColumnDefinition<ComponentGroupKind>[] = [
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
            workspaceName: info.row.original.metadata?.namespace,
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
    accessorFn: (row) => row.spec?.components?.length ?? 0,
    nonHidable: true,
    cell: (info) => <span data-test="component-group-components">{info.getValue() as number}</span>,
  },
  {
    id: 'last-build',
    header: 'Last promoted build',
    accessorFn: (row) =>
      getLatestPromotedBuild(row.status?.globalCandidateList ?? [])?.lastPromotedBuildTime,
    nonHidable: true,
    size: 2,
    cell: (info) => {
      const namespace = info.row.original.metadata?.namespace;
      const latestBuild = getLatestPromotedBuild(
        info.row.original.status?.globalCandidateList ?? [],
      );

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
  {
    id: 'promotion-status',
    header: 'Promotion status',
    nonHidable: true,
    cell: (info) => {
      const group = info.row.original;

      const candidateList = group.status?.globalCandidateList ?? [];
      const promoted = candidateList.filter((c) => c.lastPromotedImage).length;
      const total = candidateList.length;

      if (total === 0) {
        return <span data-test="component-group-no-builds">-</span>;
      }

      const allPromoted = promoted === total;
      return (
        <Label
          data-test="component-group-promotion-status"
          color={allPromoted ? 'green' : promoted === 0 ? 'grey' : 'orange'}
        >
          {promoted}/{total} promoted
        </Label>
      );
    },
  },
] as const;
