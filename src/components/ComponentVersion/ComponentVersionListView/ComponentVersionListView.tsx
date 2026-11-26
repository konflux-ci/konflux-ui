import React from 'react';
import ColumnManagement from '~/components/ColumnManagement/ColumnManagement';
import { useComponentV2 } from '~/hooks/useComponentsV2';
import FilteredEmptyState from '~/shared/components/empty-state/FilteredEmptyState';
import { FilterToolbar, useFilteredData, useFilterState } from '~/shared/components/Filter';
import { SortDropdown, Table, TableContainer } from '~/shared/components/TableV2';
import { useNamespace } from '~/shared/providers/Namespace';
import { getErrorState } from '~/shared/utils/error-utils';
import { ComponentSourceVersion, ComponentVersion } from '~/types/component';
import {
  COMPONENT_VERSIONS_COLUMN_STATE_KEY,
  COMPONENT_VERSIONS_TABLE_COLUMNS,
  COMPONENT_VERSIONS_FILTER_CONFIG,
  ComponentVersionMeta,
} from './component-versions-table-config';

type ComponentVersionListViewProps = {
  componentName: string;
};

const EMPTY_VERSIONS: ComponentVersion[] = [];

const ComponentVersionListView: React.FC<
  React.PropsWithChildren<ComponentVersionListViewProps>
> = ({ componentName }) => {
  const namespace = useNamespace();

  const [component, compLoaded, compError] = useComponentV2(namespace, componentName);

  const versions = component?.spec?.source?.versions ?? EMPTY_VERSIONS;

  const repoUrl = component?.spec?.source?.url;
  const defaultPipeline = component?.spec?.['default-build-pipeline'];

  const { clientFilterValues, clearAll, isFiltered } = useFilterState(
    COMPONENT_VERSIONS_FILTER_CONFIG,
  );

  const { filteredData: textFiltered } = useFilteredData(
    COMPONENT_VERSIONS_FILTER_CONFIG,
    versions ?? [],
    clientFilterValues,
  );

  const meta = React.useMemo<ComponentVersionMeta>(
    () => ({ repoUrl, defaultPipeline, componentName, component, namespace }),
    [repoUrl, defaultPipeline, componentName, component, namespace],
  );

  const EmptyMsg = React.useCallback(
    () => <FilteredEmptyState onClearFilters={clearAll} />,
    [clearAll],
  );

  if (compError) {
    return getErrorState(compError, compLoaded, 'Component versions');
  }

  return (
    <TableContainer
      data={textFiltered}
      unfilteredData={versions ?? []}
      loaded={compLoaded}
      emptyState={<EmptyMsg />}

      toolbar={
        isFiltered || (versions ?? []).length > 0 ? (
          <FilterToolbar configs={COMPONENT_VERSIONS_FILTER_CONFIG}>
            <SortDropdown
              columns={COMPONENT_VERSIONS_TABLE_COLUMNS}
              columnStateKey={COMPONENT_VERSIONS_COLUMN_STATE_KEY}
            />
            <ColumnManagement<ComponentSourceVersion>
              columns={COMPONENT_VERSIONS_TABLE_COLUMNS}
              columnStateKey={COMPONENT_VERSIONS_COLUMN_STATE_KEY}
              showColumnManagement
            />
          </FilterToolbar>
        ) : undefined
      }
    >
      <Table
        data={textFiltered}
        columns={COMPONENT_VERSIONS_TABLE_COLUMNS}
        getRowId={(obj) => obj.name}
        aria-label="Component Versions List"
        enableSorting
        columnStateKey={COMPONENT_VERSIONS_COLUMN_STATE_KEY}
        meta={meta}
      />
    </TableContainer>
  );
};

export default ComponentVersionListView;
