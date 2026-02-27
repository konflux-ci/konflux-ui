import React from 'react';
import { SortByDirection } from '@patternfly/react-table';
import { FilterContext } from '~/components/Filter/generic/FilterContext';
import { BaseTextFilterToolbar } from '~/components/Filter/toolbars/BaseTextFIlterToolbar';
import { useComponent } from '~/hooks/useComponents';
import { useSortedResources } from '~/hooks/useSortedResources';
import { Table } from '~/shared';
import FilteredEmptyState from '~/shared/components/empty-state/FilteredEmptyState';
import { useNamespace } from '~/shared/providers/Namespace';
import { getErrorState } from '~/shared/utils/error-utils';
import getVersionListHeader, { SortableHeaders } from './ComponentVersionListHeader';
import { ComponentVersionListRow, VersionListRowCustomData } from './ComponentVersionListRow';

type ComponentVersionListViewProps = {
  componentName: string;
};

const sortPaths: Record<SortableHeaders, string> = {
  [SortableHeaders.name]: 'name',
  [SortableHeaders.revision]: 'revision',
};

const ComponentVersionListView: React.FC<
  React.PropsWithChildren<ComponentVersionListViewProps>
> = ({ componentName }) => {
  const namespace = useNamespace();
  const { filters: unparsedFilters, setFilters, onClearFilters } = React.useContext(FilterContext);
  const nameFilter = unparsedFilters.name ? (unparsedFilters.name as string) : '';

  const [component, compLoaded, compError] = useComponent(namespace, componentName);

  const [activeSortIndex, setActiveSortIndex] = React.useState<number>(SortableHeaders.name);
  const [activeSortDirection, setActiveSortDirection] = React.useState<SortByDirection>(
    SortByDirection.asc,
  );

  const versions = React.useMemo(
    () => component?.spec?.source?.versions ?? [],
    [component?.spec?.source?.versions],
  );

  const filteredVersions = React.useMemo(
    () => versions.filter((v) => v.name.toLowerCase().includes(nameFilter.trim().toLowerCase())),
    [versions, nameFilter],
  );

  const sortedVersions = useSortedResources(
    filteredVersions,
    activeSortIndex,
    activeSortDirection,
    sortPaths,
  );

  const repoUrl = component?.spec?.source?.url;
  const defaultPipeline = component?.spec?.['default-build-pipeline'];

  const customData = React.useMemo<VersionListRowCustomData>(
    () => ({ repoUrl, defaultPipeline, componentName }),
    [repoUrl, defaultPipeline, componentName],
  );

  const Header = React.useMemo(
    () =>
      getVersionListHeader(activeSortIndex, activeSortDirection, (_, index, direction) => {
        setActiveSortIndex(index);
        setActiveSortDirection(direction);
      }),
    [activeSortIndex, activeSortDirection],
  );

  const EmptyMsg = React.useCallback(
    () => <FilteredEmptyState onClearFilters={onClearFilters} />,
    [onClearFilters],
  );

  if (compError) {
    return getErrorState(compError, compLoaded, 'Component versions');
  }

  const isFiltered = nameFilter.length > 0;

  return (
    <>
      {(isFiltered || versions.length > 0) && (
        <BaseTextFilterToolbar
          text={nameFilter}
          label="name"
          setText={(newName) => setFilters({ name: newName })}
          onClearFilters={onClearFilters}
          dataTest="version-list-toolbar"
        />
      )}
      <Table
        data={sortedVersions}
        unfilteredData={versions}
        EmptyMsg={EmptyMsg}
        aria-label="Component Version List"
        Header={Header}
        Row={ComponentVersionListRow}
        customData={customData}
        loaded={compLoaded}
      />
    </>
  );
};

export default ComponentVersionListView;
