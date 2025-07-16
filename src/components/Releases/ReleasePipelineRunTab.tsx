import * as React from 'react';
import { useParams } from 'react-router-dom';
import { Bullseye, Spinner, Title, EmptyStateBody } from '@patternfly/react-core';
import { RouterParams } from '@routes/utils';
import { FilterContext } from '~/components/Filter/generic/FilterContext';
import { BaseTextFilterToolbar } from '~/components/Filter/toolbars/BaseTextFIlterToolbar';
import { useReleasePlan } from '~/hooks/useReleasePlans';
import { useRelease } from '~/hooks/useReleases';
import { useReleaseStatus } from '~/hooks/useReleaseStatus';
import { Table, useDeepCompareMemoize } from '~/shared';
import AppEmptyState from '~/shared/components/empty-state/AppEmptyState';
import FilteredEmptyState from '~/shared/components/empty-state/FilteredEmptyState';
import { useNamespace } from '~/shared/providers/Namespace';
import {
  getFinalFromRelease,
  getManagedProcessingFromRelease,
  getNamespaceAndPRName,
  getTenantCollectorProcessingFromRelease,
  getTenantProcessingFromRelease,
} from '~/utils/release-utils';
import emptyStateImgUrl from '../../assets/secret.svg';
import ReleasePipelineListHeader from './ReleasePipelineList/ReleasePipelineListHeader';
import ReleasePipelineListRow from './ReleasePipelineList/ReleasePipelineListRow';

interface PipelineRunProcessing {
  type: string;
  startTime: string | null;
  completionTime: string;
  snapshot: string;
  pipelineRun: string;
  prNamespace: string;
}

const createPipelineRunEntry = (
  type: string,
  processing: {
    completionTime?: string;
    pipelineRun?: string;
    startTime?: string;
    roleBinding?: string;
  },
  snapshot: string,
): PipelineRunProcessing | null => {
  if (!processing?.pipelineRun) return null;
  const [prNamespace, pipelineRun] = getNamespaceAndPRName(processing.pipelineRun);
  if (!pipelineRun || !prNamespace) return null;

  return {
    type,
    startTime: processing.startTime ?? null,
    completionTime: processing.completionTime ?? '',
    snapshot,
    pipelineRun,
    prNamespace,
  };
};

const ReleasePipelineRunTab: React.FC = () => {
  const { releaseName } = useParams<RouterParams>();
  const namespace = useNamespace();

  const { filters: unparsedFilters, setFilters, onClearFilters } = React.useContext(FilterContext);
  const [release, loaded] = useRelease(namespace, releaseName);

  const [releasePlan, releasePlanLoaded] = useReleasePlan(namespace, release?.spec?.releasePlan);
  const status = useReleaseStatus(release);

  const filters = useDeepCompareMemoize({
    name: unparsedFilters.name ? (unparsedFilters.name as string) : '',
  });

  if (!releasePlanLoaded || !loaded) {
    return (
      <Bullseye>
        <Spinner size="lg" />
      </Bullseye>
    );
  }

  const allRuns: PipelineRunProcessing[] = [
    createPipelineRunEntry(
      'Tenant Collector',
      getTenantCollectorProcessingFromRelease(release),
      release.spec.snapshot,
    ),
    createPipelineRunEntry(
      'Tenant',
      getTenantProcessingFromRelease(release),
      release.spec.snapshot,
    ),
    createPipelineRunEntry('Final', getFinalFromRelease(release), release.spec.snapshot),
    createPipelineRunEntry(
      'Managed',
      getManagedProcessingFromRelease(release),
      release.spec.snapshot,
    ),
  ].filter((run) => run !== undefined && run !== null);

  const { name: nameFilter } = filters;

  const filteredRuns = allRuns.filter((run) =>
    run.pipelineRun.toLowerCase().includes(nameFilter.toLowerCase()),
  );

  const NoDataEmptyMessage = () => (
    <AppEmptyState
      emptyStateImg={emptyStateImgUrl}
      title="No linked secrets found"
      data-test="linked-secrets-list-no-data-empty-message"
    >
      <EmptyStateBody>This release has no pipeline runs yet.</EmptyStateBody>
    </AppEmptyState>
  );

  const EmptyMessage = () => <FilteredEmptyState onClearFilters={onClearFilters} />;

  return (
    <>
      <Title headingLevel="h3" className="pf-v5-c-title pf-v5-u-mt-lg pf-v5-u-pl-lg">
        Pipeline runs
      </Title>
      <Table
        data={filteredRuns}
        unfilteredData={allRuns}
        EmptyMsg={EmptyMessage}
        NoDataEmptyMsg={NoDataEmptyMessage}
        Toolbar={
          <BaseTextFilterToolbar
            text={filters.name}
            label="name"
            setText={(name) => setFilters({ ...filters, name })}
            onClearFilters={onClearFilters}
            data-test="release-pipeline-runs-toolbar"
          />
        }
        aria-label="release-pipeline-runs-table"
        Header={ReleasePipelineListHeader}
        Row={(props) => (
          <ReleasePipelineListRow
            {...props}
            obj={props.obj as PipelineRunProcessing}
            releasePlan={releasePlan}
            releaseName={releaseName}
            namespace={namespace}
            status={status}
          />
        )}
        loaded={releasePlanLoaded}
        getRowProps={(obj: PipelineRunProcessing) => ({
          id: obj.pipelineRun,
        })}
        virtualize
      />
    </>
  );
};

export default ReleasePipelineRunTab;
