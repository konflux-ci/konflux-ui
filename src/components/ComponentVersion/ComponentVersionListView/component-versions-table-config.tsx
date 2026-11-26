import { Link } from 'react-router-dom';
import { COMPONENT_VERSION_DETAILS_PATH } from '@routes/paths';
import ComponentActionsCell from '~/components/Components/ComponentActionsCell';
import { ExternalLink } from '~/shared';
import { defineFilters } from '~/shared/components/Filter';
import { ColumnDefinition } from '~/shared/components/TableV2';
import { ComponentBuildPipeline, ComponentKind, ComponentSourceVersion } from '~/types';
import { getPipelineName } from '~/utils/component-utils';
import { createBranchUrl } from '~/utils/git-utils';
import { textMatch } from '~/utils/text-filter-utils';

export type ComponentVersionMeta = {
  namespace: string;
  componentName: string;
  repoUrl: string | undefined;
  component: ComponentKind | undefined | null;
  defaultPipeline: ComponentBuildPipeline | undefined;
};

export const COMPONENT_VERSIONS_COLUMN_STATE_KEY = 'component-versions-list';

export const COMPONENT_VERSIONS_FILTER_CONFIG = defineFilters<ComponentSourceVersion>()([
  {
    type: 'search',
    param: 'name',
    label: 'Name',
    mode: 'client',
    filterFn: (item, value) => textMatch(item.name ?? '', value),
  },
]);

export const COMPONENT_VERSIONS_TABLE_COLUMNS: ColumnDefinition<ComponentSourceVersion>[] = [
  {
    id: 'name',
    header: 'Version name',
    accessorFn: (row) => row.name,
    sortable: true,
    size: 2,
    nonHidable: true,
    cell: (info) => {
      const item = info.row.original;
      const { componentName, namespace } = (info.table.options.meta as ComponentVersionMeta) ?? {};

      return (
        <Link
          to={COMPONENT_VERSION_DETAILS_PATH.createPath({
            workspaceName: namespace,
            componentName,
            versionRevision: item.name,
          })}
        >
          {item.name}
        </Link>
      );
    },
  },
  {
    id: 'gitBranchOrTag',
    header: 'Git branch or tag',
    accessorFn: (row) => row.revision,
    sortable: true,
    cell: (info) => {
      const item = info.row.original;
      const { repoUrl } = (info.table.options.meta as ComponentVersionMeta) ?? {};
      const branchUrl = createBranchUrl(repoUrl, item.revision);

      return branchUrl ? (
        <ExternalLink href={branchUrl} text={item.revision} />
      ) : (
        item.revision || '-'
      );
    },
  },
  {
    id: 'pipeline',
    header: 'Pipeline',
    sortable: false,
    size: 4,
    cell: (info) => {
      const item = info.row.original;
      const { defaultPipeline } = (info.table.options.meta as ComponentVersionMeta) ?? {};
      const pipelineName = getPipelineName(item['build-pipeline'], defaultPipeline);

      return pipelineName ?? '-';
    },
  },
  {
    id: 'actions',
    header: ' ',
    nonHidable: true,
    pinned: 'end',
    accessorFn: () => null,
    cell: (info) => {
      const item = info.row.original;
      const { component } = (info.table.options.meta as ComponentVersionMeta) ?? {};

      return (
        <ComponentActionsCell
          component={component}
          version={item.name}
          label={`Actions for ${item.name}`}
        />
      );
    },
  },
];
