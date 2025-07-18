import * as React from 'react';
import { useParams } from 'react-router-dom';
import { Bullseye, Spinner, Title } from '@patternfly/react-core';
import { RouterParams } from '@routes/utils';
import { FilterContext } from '~/components/Filter/generic/FilterContext';
import { BaseTextFilterToolbar } from '~/components/Filter/toolbars/BaseTextFIlterToolbar';
import { useReleasePlan } from '~/hooks/useReleasePlans';
import { useRelease } from '~/hooks/useReleases';
import { Table } from '~/shared';
import FilteredEmptyState from '~/shared/components/empty-state/FilteredEmptyState';
import { useNamespace } from '~/shared/providers/Namespace';
import {
  getFinalFromRelease,
  getManagedProcessingFromRelease,
  getNamespaceAndPRName,
  getTenantCollectorProcessingFromRelease,
  getTenantProcessingFromRelease,
} from '~/utils/release-utils';
import ReleasePipelineListHeader from './ReleasePipelineList/ReleasePipelineListHeader';
import ReleasePipelineListRow from './ReleasePipelineList/ReleasePipelineListRow';
import ReleasesEmptyState from './ReleasesEmptyState';

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

  const { filters, setFilters, onClearFilters } = React.useContext(FilterContext);
  const [release, loaded] = useRelease(namespace, releaseName);

  const [releasePlan, releasePlanLoaded] = useReleasePlan(namespace, release?.spec?.releasePlan);

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
  ].filter(Boolean);

  const filteredRuns = filters?.name
    ? allRuns.filter((run) =>
        run.pipelineRun.toLowerCase().includes((filters.name as string).toLowerCase()),
      )
    : allRuns;

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
        NoDataEmptyMsg={() => <ReleasesEmptyState />}
        Toolbar={
          <BaseTextFilterToolbar
            text={filters.name as string}
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
