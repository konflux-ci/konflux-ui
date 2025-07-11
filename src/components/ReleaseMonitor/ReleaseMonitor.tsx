import * as React from 'react';
import { PageSection, PageSectionVariants } from '@patternfly/react-core';
import { PipelineRunLabel } from '~/consts/pipelinerun';
import { useGetAllReleases } from '../../hooks/useGetAllReleases';
import { useNamespaceInfo } from '../../shared/providers/Namespace';
import { MonitoredReleaseKind } from '../../types';
import PageLayout from '../PageLayout/PageLayout';
import { ReleaseFilters } from './ReleaseFilters';
import { ReleaseTable } from './ReleaseTable';

const ReleaseMonitor: React.FunctionComponent = () => {
  // Set up release filtering
  const [searchValue, setSearchValue] = React.useState('');
  const [applicationSelections, setApplicationSelections] = React.useState<string[]>([]);
  const [tenantSelections, setTenantSelections] = React.useState<string[]>([]);
  const [statusSelection, setStatusSelection] = React.useState('');
  const { namespaces, namespacesLoaded: loaded } = useNamespaceInfo();
  const { releases, loading } = useGetAllReleases(loaded, namespaces);
  const applications = Array.from(
    new Set(releases.map((release) => release.metadata.labels?.[PipelineRunLabel.APPLICATION])),
  );
  const tenants = Array.from(new Set(releases.map((release) => release.metadata.namespace)));

  const onSearchChange = (value: string) => {
    setSearchValue(value);
  };

  const onFilter = React.useCallback(
    (release: MonitoredReleaseKind) => {
      let searchValueInput: RegExp;
      try {
        searchValueInput = new RegExp(searchValue, 'i');
      } catch (err) {
        searchValueInput = new RegExp(searchValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      }

      const matchesSearchValue = release.spec.releasePlan.search(searchValueInput) >= 0;
      const matchesTenantValue = tenantSelections.includes(release.metadata.namespace);
      const matchesApplicationValue = applicationSelections.includes(
        release.metadata.labels?.[PipelineRunLabel.APPLICATION],
      );
      const matchesStatusValue =
        (release.status?.conditions[0].reason ?? 'Failed').toLowerCase() ===
        statusSelection.toLowerCase();

      return (
        (searchValue === '' || matchesSearchValue) &&
        (tenantSelections.length === 0 || matchesTenantValue) &&
        (applicationSelections.length === 0 || matchesApplicationValue) &&
        (statusSelection === '' || matchesStatusValue)
      );
    },
    [searchValue, tenantSelections, applicationSelections, statusSelection],
  );

  const filteredReleases = React.useMemo(() => {
    return releases.filter(onFilter);
  }, [releases, onFilter]);

  const onApplicationSelectionsChange = (selections: string[]) => {
    setApplicationSelections(selections);
  };

  const onTenantSelect = (itemId: string | number | undefined) => {
    if (itemId === undefined) {
      setTenantSelections([]);
      return;
    }
    const itemStr = itemId.toString();
    setTenantSelections(
      tenantSelections.includes(itemStr)
        ? tenantSelections.filter((selection) => selection !== itemStr)
        : [itemStr, ...tenantSelections],
    );
  };

  const onStatusSelect = (itemId: string | number | undefined) => {
    if (itemId === undefined) {
      setStatusSelection('');
      return;
    }
    const itemStr = itemId.toString();
    setStatusSelection(statusSelection === itemStr ? '' : itemStr);
  };

  const onClearFilters = () => {
    setSearchValue('');
    setApplicationSelections([]);
    setTenantSelections([]);
    setStatusSelection('');
  };

  return (
    <PageLayout title="Release Monitor" description="The dashboard to monitor your cared releases">
      <PageSection padding={{ default: 'noPadding' }} variant={PageSectionVariants.light} isFilled>
        <ReleaseFilters
          applications={applications}
          tenants={tenants}
          applicationSelections={applicationSelections}
          tenantSelections={tenantSelections}
          statusSelection={statusSelection}
          searchValue={searchValue}
          onSearchChange={onSearchChange}
          onApplicationSelectionsChange={onApplicationSelectionsChange}
          onTenantSelect={onTenantSelect}
          onStatusSelect={onStatusSelect}
          onClearFilters={onClearFilters}
        />
        <ReleaseTable releases={filteredReleases} loading={loading} />
      </PageSection>
    </PageLayout>
  );
};

export default ReleaseMonitor;
