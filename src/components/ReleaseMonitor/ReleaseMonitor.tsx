import * as React from 'react';
import { Link } from 'react-router-dom';
import {
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  Menu,
  MenuContent,
  MenuList,
  MenuItem,
  MenuToggle,
  Popper,
  ToolbarToggleGroup,
  PageSection,
  Badge,
  ToolbarGroup,
  ToolbarFilter,
  SearchInput,
  PageSectionVariants,
} from '@patternfly/react-core';
import { FilterIcon } from '@patternfly/react-icons/dist/esm/icons/filter-icon';
import { Table, Thead, Tr, Th, Tbody, Td, TableVariant } from '@patternfly/react-table';
import { Release, useGetAllReleases } from '../../hooks/useGetAllReleases';
import {
  APPLICATION_DETAILS_PATH,
  APPLICATION_RELEASE_DETAILS_PATH,
  COMPONENT_DETAILS_PATH,
  RELEASEPLAN_PATH,
} from '../../routes/paths';
import FilteredEmptyState from '../../shared/components/empty-state/FilteredEmptyState';
import { Timestamp } from '../../shared/components/timestamp/Timestamp';
import { useNamespaceInfo } from '../../shared/providers/Namespace';
import { runStatus } from '../../utils/pipeline-utils';
import PageLayout from '../PageLayout/PageLayout';
import { StatusIconWithText } from '../topology/StatusIcon';

const columnNames = {
  application: 'Application', // The application name
  component: 'Component', // The component, a number via link
  releasePlan: 'Release Plan', // The ReleasePlan via the application
  tenant: 'Namespace', // Tenant name
  completionTime: 'Completion Time', // Release end time
  name: 'Release Name', // The release trigger from the ReleasePlan
  status: 'Status', // The status of the release
};

const ReleaseMonitor: React.FunctionComponent = () => {
  // Set up release filtering
  const [searchValue, setSearchValue] = React.useState('');
  const [applicationSelections, setApplicationSelections] = React.useState<string[]>([]);
  const [tenantSelections, setTenantSelections] = React.useState<string[]>([]);
  const [statusSelection, setStatusSelection] = React.useState('');
  const { namespaces, namespacesLoaded: loaded } = useNamespaceInfo();
  const releases = useGetAllReleases(loaded, namespaces);
  const applications = Array.from(new Set(releases.map((release) => release.application)));
  const tenants = Array.from(new Set(releases.map((release) => release.tenant)));

  const onSearchChange = (value: string) => {
    setSearchValue(value);
  };

  const onFilter = (release: Release) => {
    // Search with search value
    let searchValueInput: RegExp;
    try {
      searchValueInput = new RegExp(searchValue, 'i');
    } catch (err) {
      searchValueInput = new RegExp(searchValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    }

    // Search with selections
    const matchesSearchValue = release.releasePlan.search(searchValueInput) >= 0;
    const matchesTenantValue = tenantSelections.includes(release.tenant);
    const matchesApplicationValue = applicationSelections.includes(release.application);
    const matchesStatusValue = release.status.toLowerCase() === statusSelection.toLowerCase();

    return (
      (searchValue === '' || matchesSearchValue) &&
      (tenantSelections.length === 0 || matchesTenantValue) &&
      (applicationSelections.length === 0 || matchesApplicationValue) &&
      (statusSelection === '' || matchesStatusValue)
    );
  };

  const filteredReleases = releases.filter(onFilter);

  // Set up name search input
  const searchInput = (
    <SearchInput
      placeholder="Filter by release plan name"
      value={searchValue}
      onChange={(_event, value) => onSearchChange(value)}
      onClear={() => onSearchChange('')}
    />
  );

  // Set up Application checkbox select
  const [isApplicationMenuOpen, setIsApplicationMenuOpen] = React.useState<boolean>(false);
  const applicationToggleRef = React.useRef<HTMLButtonElement>(null);
  const applicationMenuRef = React.useRef<HTMLDivElement>(null);
  const applicationContainerRef = React.useRef<HTMLDivElement>(null);

  const handApplicationMenuKeys = React.useCallback(
    (event: KeyboardEvent) => {
      if (isApplicationMenuOpen && applicationMenuRef.current?.contains(event.target as Node)) {
        if (event.key === 'Escape' || event.key === 'Tab') {
          setIsApplicationMenuOpen(!isApplicationMenuOpen);
          applicationToggleRef.current?.focus();
        }
      }
    },
    [isApplicationMenuOpen, applicationMenuRef],
  );

  const handleApplicationClickOutside = React.useCallback(
    (event: MouseEvent) => {
      if (isApplicationMenuOpen && !applicationMenuRef.current?.contains(event.target as Node)) {
        setIsApplicationMenuOpen(false);
      }
    },
    [isApplicationMenuOpen, applicationMenuRef],
  );

  React.useEffect(() => {
    window.addEventListener('keydown', handApplicationMenuKeys);
    window.addEventListener('click', handleApplicationClickOutside);
    return () => {
      window.removeEventListener('keydown', handApplicationMenuKeys);
      window.removeEventListener('click', handleApplicationClickOutside);
    };
  }, [handApplicationMenuKeys, handleApplicationClickOutside]);

  const onApplicationMenuToggleClick = (ev: React.MouseEvent) => {
    ev.stopPropagation(); // Stop handleClickOutside from handling
    setTimeout(() => {
      if (applicationMenuRef.current) {
        const firstElement = applicationMenuRef.current.querySelector('li > button:not(:disabled)');
        firstElement && (firstElement as HTMLElement).focus();
      }
    }, 0);
    setIsApplicationMenuOpen(!isApplicationMenuOpen);
  };

  function onApplicationMenuSelect(
    _event: React.MouseEvent | undefined,
    itemId: string | number | undefined,
  ) {
    if (typeof itemId === 'undefined') {
      return;
    }

    const itemStr = itemId.toString();

    setApplicationSelections(
      applicationSelections.includes(itemStr)
        ? applicationSelections.filter((selection) => selection !== itemStr)
        : [itemStr, ...applicationSelections],
    );
  }

  const applicationToggle = (
    <MenuToggle
      ref={applicationToggleRef}
      onClick={onApplicationMenuToggleClick}
      isExpanded={isApplicationMenuOpen}
      {...(applicationSelections.length > 0 && {
        badge: <Badge isRead>{applicationSelections.length}</Badge>,
      })}
      style={
        {
          width: '200px',
        } as React.CSSProperties
      }
    >
      Filter by application
    </MenuToggle>
  );

  const applicationMenu = (
    <Menu
      ref={applicationMenuRef}
      id="attribute-search-location-menu"
      onSelect={onApplicationMenuSelect}
      selected={applicationSelections}
    >
      <MenuContent>
        <MenuList>
          {applications.map((application) => (
            <MenuItem
              key={application}
              hasCheckbox
              isSelected={applicationSelections.includes(application)}
              itemId={application}
            >
              {application}
            </MenuItem>
          ))}
        </MenuList>
      </MenuContent>
    </Menu>
  );

  const applicationSelect = (
    <div ref={applicationContainerRef}>
      <Popper
        trigger={applicationToggle}
        triggerRef={applicationToggleRef}
        popper={applicationMenu}
        popperRef={applicationMenuRef}
        appendTo={applicationContainerRef.current || undefined}
        isVisible={isApplicationMenuOpen}
      />
    </div>
  );
  // Set up Application checkbox select end

  // Set up Tenant checkbox select
  const [isTenantMenuOpen, setIsTenantMenuOpen] = React.useState<boolean>(false);
  const tenantToggleRef = React.useRef<HTMLButtonElement>(null);
  const tenantMenuRef = React.useRef<HTMLDivElement>(null);
  const tenantContainerRef = React.useRef<HTMLDivElement>(null);

  const handTenantMenuKeys = React.useCallback(
    (event: KeyboardEvent) => {
      if (isTenantMenuOpen && tenantMenuRef.current?.contains(event.target as Node)) {
        if (event.key === 'Escape' || event.key === 'Tab') {
          setIsTenantMenuOpen(!isTenantMenuOpen);
          tenantToggleRef.current?.focus();
        }
      }
    },
    [isTenantMenuOpen, tenantMenuRef],
  );

  const handleTenantClickOutside = React.useCallback(
    (event: MouseEvent) => {
      if (isTenantMenuOpen && !tenantMenuRef.current?.contains(event.target as Node)) {
        setIsTenantMenuOpen(false);
      }
    },
    [isTenantMenuOpen, tenantMenuRef],
  );

  React.useEffect(() => {
    window.addEventListener('keydown', handTenantMenuKeys);
    window.addEventListener('click', handleTenantClickOutside);
    return () => {
      window.removeEventListener('keydown', handTenantMenuKeys);
      window.removeEventListener('click', handleTenantClickOutside);
    };
  }, [handTenantMenuKeys, handleTenantClickOutside]);

  const onTenantMenuToggleClick = (ev: React.MouseEvent) => {
    ev.stopPropagation(); // Stop handleClickOutside from handling
    setTimeout(() => {
      if (tenantMenuRef.current) {
        const firstElement = tenantMenuRef.current.querySelector('li > button:not(:disabled)');
        firstElement && (firstElement as HTMLElement).focus();
      }
    }, 0);
    setIsTenantMenuOpen(!isTenantMenuOpen);
  };

  function onTenantMenuSelect(
    _event: React.MouseEvent | undefined,
    itemId: string | number | undefined,
  ) {
    if (typeof itemId === 'undefined') {
      return;
    }

    const itemStr = itemId.toString();

    setTenantSelections(
      tenantSelections.includes(itemStr)
        ? tenantSelections.filter((selection) => selection !== itemStr)
        : [itemStr, ...tenantSelections],
    );
  }

  const tenantToggle = (
    <MenuToggle
      ref={tenantToggleRef}
      onClick={onTenantMenuToggleClick}
      isExpanded={isTenantMenuOpen}
      {...(tenantSelections.length > 0 && {
        badge: <Badge isRead>{tenantSelections.length}</Badge>,
      })}
      style={
        {
          width: '200px',
        } as React.CSSProperties
      }
    >
      Filter by tenant
    </MenuToggle>
  );

  const tenantMenu = (
    <Menu
      ref={tenantMenuRef}
      id="attribute-search-location-menu"
      onSelect={onTenantMenuSelect}
      selected={tenantSelections}
    >
      <MenuContent>
        <MenuList>
          {tenants.map((tenant) => (
            <MenuItem
              key={tenant}
              hasCheckbox
              isSelected={tenantSelections.includes(tenant)}
              itemId={tenant}
            >
              {tenant}
            </MenuItem>
          ))}
        </MenuList>
      </MenuContent>
    </Menu>
  );

  const tenantSelect = (
    <div ref={tenantContainerRef}>
      <Popper
        trigger={tenantToggle}
        triggerRef={tenantToggleRef}
        popper={tenantMenu}
        popperRef={tenantMenuRef}
        appendTo={tenantContainerRef.current || undefined}
        isVisible={isTenantMenuOpen}
      />
    </div>
  );
  // Set up Tenant checkbox select end

  // Set up status single select
  const [isStatusMenuOpen, setIsStatusMenuOpen] = React.useState<boolean>(false);
  const statusToggleRef = React.useRef<HTMLButtonElement>(null);
  const statusMenuRef = React.useRef<HTMLDivElement>(null);
  const statusContainerRef = React.useRef<HTMLDivElement>(null);

  const handleStatusMenuKeys = React.useCallback(
    (event: KeyboardEvent) => {
      if (isStatusMenuOpen && statusMenuRef.current?.contains(event.target as Node)) {
        if (event.key === 'Escape' || event.key === 'Tab') {
          setIsStatusMenuOpen(!isStatusMenuOpen);
          statusToggleRef.current?.focus();
        }
      }
    },
    [isStatusMenuOpen, statusMenuRef],
  );

  const handleStatusClickOutside = React.useCallback(
    (event: MouseEvent) => {
      if (isStatusMenuOpen && !statusMenuRef.current?.contains(event.target as Node)) {
        setIsStatusMenuOpen(false);
      }
    },
    [isStatusMenuOpen, statusMenuRef],
  );

  React.useEffect(() => {
    window.addEventListener('keydown', handleStatusMenuKeys);
    window.addEventListener('click', handleStatusClickOutside);
    return () => {
      window.removeEventListener('keydown', handleStatusMenuKeys);
      window.removeEventListener('click', handleStatusClickOutside);
    };
  }, [handleStatusMenuKeys, handleStatusClickOutside]);

  const onStatusToggleClick = (ev: React.MouseEvent) => {
    ev.stopPropagation(); // Stop handleClickOutside from handling
    setTimeout(() => {
      if (statusMenuRef.current) {
        const firstElement = statusMenuRef.current.querySelector('li > button:not(:disabled)');
        firstElement && (firstElement as HTMLElement).focus();
      }
    }, 0);
    setIsStatusMenuOpen(!isStatusMenuOpen);
  };

  function onStatusSelect(
    _event: React.MouseEvent | undefined,
    itemId: string | number | undefined,
  ) {
    if (typeof itemId === 'undefined') {
      return;
    }

    setStatusSelection(itemId.toString());
    setIsStatusMenuOpen(!isStatusMenuOpen);
  }

  const statusToggle = (
    <MenuToggle
      ref={statusToggleRef}
      onClick={onStatusToggleClick}
      isExpanded={isStatusMenuOpen}
      style={
        {
          width: '200px',
        } as React.CSSProperties
      }
    >
      Filter by status
    </MenuToggle>
  );

  const statusMenu = (
    <Menu
      ref={statusMenuRef}
      id="attribute-search-status-menu"
      onSelect={onStatusSelect}
      selected={statusSelection}
    >
      <MenuContent>
        <MenuList>
          <MenuItem itemId="Succeeded">Succeeded</MenuItem>
          <MenuItem itemId="Progressing">Progressing</MenuItem>
          <MenuItem itemId="Failed">Failed</MenuItem>
        </MenuList>
      </MenuContent>
    </Menu>
  );

  const statusSelect = (
    <div ref={statusContainerRef}>
      <Popper
        trigger={statusToggle}
        triggerRef={statusToggleRef}
        popper={statusMenu}
        popperRef={statusMenuRef}
        appendTo={statusContainerRef.current || undefined}
        isVisible={isStatusMenuOpen}
      />
    </div>
  );
  // Set up status selection end

  // Set up attribute selector
  const [activeAttributeMenu, setActiveAttributeMenu] = React.useState<
    'Application' | 'Release Plan' | 'Status' | 'Namespace'
  >('Application');
  const [isAttributeMenuOpen, setIsAttributeMenuOpen] = React.useState(false);
  const attributeToggleRef = React.useRef<HTMLButtonElement>(null);
  const attributeMenuRef = React.useRef<HTMLDivElement>(null);
  const attributeContainerRef = React.useRef<HTMLDivElement>(null);

  const handleAttribueMenuKeys = React.useCallback(
    (event: KeyboardEvent) => {
      if (!isAttributeMenuOpen) {
        return;
      }
      if (
        attributeMenuRef.current?.contains(event.target as Node) ||
        attributeToggleRef.current?.contains(event.target as Node)
      ) {
        if (event.key === 'Escape' || event.key === 'Tab') {
          setIsAttributeMenuOpen(!isAttributeMenuOpen);
          attributeToggleRef.current?.focus();
        }
      }
    },
    [isAttributeMenuOpen, attributeMenuRef],
  );

  const handleAttributeClickOutside = React.useCallback(
    (event: MouseEvent) => {
      if (isAttributeMenuOpen && !attributeMenuRef.current?.contains(event.target as Node)) {
        setIsAttributeMenuOpen(false);
      }
    },
    [isAttributeMenuOpen, attributeMenuRef],
  );

  React.useEffect(() => {
    window.addEventListener('keydown', handleAttribueMenuKeys);
    window.addEventListener('click', handleAttributeClickOutside);
    return () => {
      window.removeEventListener('keydown', handleAttribueMenuKeys);
      window.removeEventListener('click', handleAttributeClickOutside);
    };
  }, [handleAttribueMenuKeys, handleAttributeClickOutside]);

  const onAttributeToggleClick = (ev: React.MouseEvent) => {
    ev.stopPropagation(); // Stop handleClickOutside from handling
    setTimeout(() => {
      if (attributeMenuRef.current) {
        const firstElement = attributeMenuRef.current.querySelector('li > button:not(:disabled)');
        firstElement && (firstElement as HTMLElement).focus();
      }
    }, 0);
    setIsAttributeMenuOpen(!isAttributeMenuOpen);
  };

  const attributeToggle = (
    <MenuToggle
      ref={attributeToggleRef}
      onClick={onAttributeToggleClick}
      isExpanded={isAttributeMenuOpen}
      icon={<FilterIcon />}
    >
      {activeAttributeMenu}
    </MenuToggle>
  );
  const attributeMenu = (
    <Menu
      ref={attributeMenuRef}
      onSelect={(_ev, itemId) => {
        setActiveAttributeMenu(
          itemId?.toString() as 'Application' | 'Release Plan' | 'Status' | 'Namespace',
        );
        setIsAttributeMenuOpen(!isAttributeMenuOpen);
      }}
    >
      <MenuContent>
        <MenuList>
          <MenuItem itemId="Status">Status</MenuItem>
          <MenuItem itemId="Application">Application</MenuItem>
          <MenuItem itemId="Release Plan">Release Plan</MenuItem>
          <MenuItem itemId="Namespace">Namespace</MenuItem>
        </MenuList>
      </MenuContent>
    </Menu>
  );

  const attributeDropdown = (
    <div ref={attributeContainerRef}>
      <Popper
        trigger={attributeToggle}
        triggerRef={attributeToggleRef}
        popper={attributeMenu}
        popperRef={attributeMenuRef}
        appendTo={attributeContainerRef.current || undefined}
        isVisible={isAttributeMenuOpen}
      />
    </div>
  );

  const toolbar = (
    <Toolbar
      id="attribute-search-filter-toolbar"
      clearAllFilters={() => {
        setSearchValue('');
        setApplicationSelections([]);
        setTenantSelections([]);
        setStatusSelection('');
      }}
    >
      <ToolbarContent>
        <ToolbarToggleGroup toggleIcon={<FilterIcon />} breakpoint="xl">
          <ToolbarGroup variant="filter-group">
            <ToolbarItem>{attributeDropdown}</ToolbarItem>
            <ToolbarFilter
              chips={searchValue !== '' ? [searchValue] : ([] as string[])}
              deleteChip={() => setSearchValue('')}
              deleteChipGroup={() => setSearchValue('')}
              categoryName="releaseplan"
              showToolbarItem={activeAttributeMenu === 'Release Plan'}
            >
              {searchInput}
            </ToolbarFilter>
            <ToolbarFilter
              chips={statusSelection !== '' ? [statusSelection] : ([] as string[])}
              deleteChip={() => setStatusSelection('')}
              deleteChipGroup={() => setStatusSelection('')}
              categoryName="status"
              showToolbarItem={activeAttributeMenu === 'Status'}
            >
              {statusSelect}
            </ToolbarFilter>
            <ToolbarFilter
              chips={applicationSelections}
              deleteChip={(_, chip) => onApplicationMenuSelect(undefined, chip as string)}
              deleteChipGroup={() => setApplicationSelections([])}
              categoryName="application"
              showToolbarItem={activeAttributeMenu === 'Application'}
            >
              {applicationSelect}
            </ToolbarFilter>
            <ToolbarFilter
              chips={tenantSelections}
              deleteChip={(_, chip) => onTenantMenuSelect(undefined, chip as string)}
              deleteChipGroup={() => setTenantSelections([])}
              categoryName="tenant"
              showToolbarItem={activeAttributeMenu === 'Namespace'}
            >
              {tenantSelect}
            </ToolbarFilter>
          </ToolbarGroup>
        </ToolbarToggleGroup>
      </ToolbarContent>
    </Toolbar>
  );

  const onClearFilters = () => {
    setSearchValue('');
    setApplicationSelections([]);
    setTenantSelections([]);
    setStatusSelection('');
  };

  return (
    <PageLayout title="Release Monitor" description="The dashboard to monitor your cared releases">
      <PageSection padding={{ default: 'noPadding' }} variant={PageSectionVariants.light} isFilled>
        <div
          style={{
            backgroundColor: 'white',
          }}
        >
          {toolbar}
          <Table aria-label="Multiple sticky column table" variant={TableVariant.compact}>
            <Thead>
              <Tr>
                <Th modifier="nowrap">{columnNames.application}</Th>
                <Th modifier="nowrap">{columnNames.component}</Th>
                <Th modifier="nowrap">{columnNames.name}</Th>
                <Th modifier="nowrap">{columnNames.status}</Th>
                <Th modifier="nowrap">{columnNames.completionTime}</Th>
                <Th modifier="nowrap">{columnNames.releasePlan}</Th>
                <Th modifier="nowrap">{columnNames.tenant}</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredReleases.length > 0 &&
                filteredReleases.map((release) => (
                  <Tr key={`${release.component}-${release.releasePlan}-${release.name}`}>
                    <Td dataLabel={columnNames.application} modifier="nowrap">
                      <Link
                        to={APPLICATION_DETAILS_PATH.createPath({
                          workspaceName: release.tenant,
                          applicationName: release.application,
                        })}
                        title={release.application}
                      >
                        {release.application}
                      </Link>
                    </Td>
                    <Td dataLabel={columnNames.component} modifier="nowrap">
                      <Link
                        to={COMPONENT_DETAILS_PATH.createPath({
                          workspaceName: release.tenant,
                          applicationName: release.application,
                          componentName: release.component,
                        })}
                      >
                        {release.component}
                      </Link>
                    </Td>
                    <Td dataLabel={columnNames.name} modifier="nowrap">
                      <Link
                        to={APPLICATION_RELEASE_DETAILS_PATH.createPath({
                          workspaceName: release.tenant,
                          applicationName: release.application,
                          releaseName: release.name,
                        })}
                        title={release.name}
                      >
                        {release.name}
                      </Link>
                    </Td>
                    <Td dataLabel={columnNames.status} modifier="nowrap">
                      {(() => {
                        if (release.status === 'Failed') {
                          return (
                            <StatusIconWithText
                              status={runStatus.Failed}
                              dataTestAttribute={'taskrun-details status'}
                            />
                          );
                        } else if (release.status === 'Succeeded') {
                          return (
                            <StatusIconWithText
                              status={runStatus.Succeeded}
                              dataTestAttribute={'taskrun-details status'}
                            />
                          );
                        }
                        return (
                          <StatusIconWithText
                            status={runStatus['In Progress']}
                            dataTestAttribute={'taskrun-details status'}
                          />
                        );
                      })()}
                    </Td>
                    <Td dataLabel={columnNames.completionTime} modifier="nowrap">
                      <Timestamp timestamp={release.completionTime} />
                    </Td>
                    <Td dataLabel={columnNames.releasePlan} modifier="nowrap">
                      <Link
                        to={RELEASEPLAN_PATH.createPath({
                          workspaceName: release.tenant,
                        })}
                        title={release.releasePlan}
                      >
                        {release.releasePlan}
                      </Link>
                    </Td>
                    <Td dataLabel={columnNames.tenant} modifier="nowrap">
                      {release.tenant}
                    </Td>
                  </Tr>
                ))}
              {filteredReleases.length === 0 && (
                <Tr>
                  <Td colSpan={8}>
                    {/* <Bullseye>{emptyState}</Bullseye> */}
                    <FilteredEmptyState onClearFilters={onClearFilters} />
                  </Td>
                </Tr>
              )}
            </Tbody>
          </Table>
        </div>
      </PageSection>
    </PageLayout>
  );
};

export default ReleaseMonitor;
