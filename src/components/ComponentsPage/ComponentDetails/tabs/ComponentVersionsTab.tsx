import * as React from 'react';
import { useParams } from 'react-router-dom';
import {
  Bullseye,
  Pagination,
  SearchInput,
  Spinner,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from '@patternfly/react-core';
import { DetailsSection } from '~/components/DetailsPage';
import { IfFeature } from '~/feature-flags/hooks';
import { useComponent } from '~/hooks/useComponents';
import type { ComponentVersionRow } from '~/hooks/useComponentVersions';
import { useComponentVersions } from '~/hooks/useComponentVersions';
import { Table } from '~/shared';
import { useDebounceCallback } from '~/shared/hooks/useDebounceCallback';
import { useNamespace } from '~/shared/providers/Namespace/useNamespaceInfo';
import { getErrorState } from '~/shared/utils/error-utils';
import ComponentVersionsListHeader from './ComponentVersionsListHeader';
import ComponentVersionsListRow, {
  ComponentVersionsListRowCustomData,
} from './ComponentVersionsListRow';

const DEFAULT_PER_PAGE = 10;

const ComponentVersionsTab: React.FC = () => {
  const { componentName } = useParams();
  const namespace = useNamespace();
  const [component, componentLoaded, componentError] = useComponent(
    namespace,
    componentName ?? '',
    true,
  );
  const [versions, versionsLoaded, versionsError] = useComponentVersions(
    namespace,
    component?.metadata?.name ?? componentName ?? undefined,
  );

  const [nameFilter, setNameFilter] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(DEFAULT_PER_PAGE);

  const onNameFilter = useDebounceCallback((value: string) => {
    setNameFilter(value);
    setPage(1);
  }, 400);

  const filteredVersions = React.useMemo(() => {
    if (!nameFilter.trim()) return versions;
    const lower = nameFilter.toLowerCase().trim();
    return versions.filter((v) => v.name.toLowerCase().includes(lower));
  }, [versions, nameFilter]);

  const paginatedVersions = React.useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredVersions.slice(start, start + perPage);
  }, [filteredVersions, page, perPage]);

  const customData: ComponentVersionsListRowCustomData = React.useMemo(
    () => ({
      component: component ?? null,
      applicationName: component?.spec?.application,
      namespace,
      componentName: componentName ?? '',
    }),
    [component, namespace, componentName],
  );

  React.useEffect(() => {
    setPage(1);
  }, [nameFilter]);

  if (!componentName) {
    return null;
  }

  if (!componentLoaded || !versionsLoaded) {
    return (
      <Bullseye>
        <Spinner data-test="spinner" />
      </Bullseye>
    );
  }

  if (componentError) {
    return getErrorState(componentError, componentLoaded, 'component');
  }

  if (versionsError) {
    return getErrorState(versionsError, versionsLoaded, 'versions');
  }

  const totalCount = filteredVersions.length;
  const emptyState =
    versions.length === 0 ? (
      <p>No branches with pipeline runs found for this component.</p>
    ) : totalCount === 0 ? (
      <p>No versions match your search.</p>
    ) : null;

  const VersionsToolbar = (
    <Toolbar usePageInsets>
      <ToolbarContent>
        <ToolbarItem className="pf-v5-u-ml-0">
          <SearchInput
            name="versions-name-filter"
            data-test="versions-name-filter"
            type="search"
            aria-label="Find by name"
            placeholder="Find by name"
            onChange={(_event, value) => onNameFilter(value)}
            value={nameFilter}
          />
        </ToolbarItem>
        <ToolbarItem alignSelf="center" style={{ marginLeft: 'auto' }}>
          <Pagination
            isCompact
            itemCount={totalCount}
            page={page}
            perPage={perPage}
            onSetPage={(_e, newPage) => setPage(newPage)}
            onPerPageSelect={(_e, newPerPage) => {
              setPerPage(newPerPage);
              setPage(1);
            }}
            perPageOptions={[
              { title: '10', value: 10 },
              { title: '20', value: 20 },
              { title: '50', value: 50 },
            ]}
          />
        </ToolbarItem>
      </ToolbarContent>
    </Toolbar>
  );

  return (
    <IfFeature flag="components-page">
      <DetailsSection
        title="Versions"
        description="Branches that have pipeline runs for this component. Select a version to view its overview and activity."
      >
        {emptyState ? (
          <>
            {VersionsToolbar}
            {emptyState}
          </>
        ) : (
          <Table
            virtualize={false}
            data={paginatedVersions}
            unfilteredData={filteredVersions}
            aria-label="Component versions"
            Toolbar={VersionsToolbar}
            Header={ComponentVersionsListHeader}
            Row={ComponentVersionsListRow}
            customData={customData}
            loaded={versionsLoaded}
            getRowProps={(obj: ComponentVersionRow) => ({
              id: `version-row-${obj.name}`,
            })}
          />
        )}
      </DetailsSection>
    </IfFeature>
  );
};

export default ComponentVersionsTab;
