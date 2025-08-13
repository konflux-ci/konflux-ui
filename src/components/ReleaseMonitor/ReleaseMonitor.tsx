import * as React from 'react';
import { PageSection, PageSectionVariants } from '@patternfly/react-core';
import { PipelineRunLabel } from '~/consts/pipelinerun';
import { FeatureFlagIndicator } from '~/feature-flags/FeatureFlagIndicator';
import { HttpError } from '~/k8s/error';
import ErrorEmptyState from '~/shared/components/empty-state/ErrorEmptyState';
import { useGetAllReleases } from '../../hooks/useGetAllReleases';
import { MonitoredReleaseKind } from '../../types';
import PageLayout from '../PageLayout/PageLayout';
import { ReleaseFilters } from './ReleaseFilters';
import { ReleaseTable } from './ReleaseTable';

const ReleaseMonitor: React.FunctionComponent = () => {
  const [searchValue, setSearchValue] = React.useState('');
  const [applicationSelections, setApplicationSelections] = React.useState<string[]>([]);
  const [tenantSelections, setTenantSelections] = React.useState<string[]>([]);
  const [statusSelection, setStatusSelection] = React.useState('');
  const { releases, loading, error } = useGetAllReleases();
  const applications = React.useMemo(() => {
    return Array.from(
      new Set(releases.map((release) => release.metadata.labels?.[PipelineRunLabel.APPLICATION])),
    );
  }, [releases]);
  const tenants = React.useMemo(() => {
    return Array.from(new Set(releases.map((release) => release.metadata.namespace)));
  }, [releases]);

  const onFilter = React.useCallback(
    (release: MonitoredReleaseKind) => {
      const matchesSearchValue = release.spec.releasePlan.includes(searchValue);
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

  if (error) {
    return (
      <ErrorEmptyState
        httpError={HttpError.fromCode(500)}
        title="Unable to load release"
        body={(error as { message: string }).message}
      />
    );
  }

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
    <PageLayout
      title={
        <>
          Release Monitor <FeatureFlagIndicator flags={['release-monitor']} fullLabel />
        </>
      }
      description="The dashboard to monitor your cared releases"
    >
      <PageSection padding={{ default: 'noPadding' }} variant={PageSectionVariants.light} isFilled>
        <ReleaseFilters
          applications={applications}
          tenants={tenants}
          applicationSelections={applicationSelections}
          tenantSelections={tenantSelections}
          statusSelection={statusSelection}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
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
