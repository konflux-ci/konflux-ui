import * as React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Bullseye, Spinner, Stack, Title } from '@patternfly/react-core';
import {
  PipelineRunsFilterToolbar,
  useFilteredData,
  FilterConfig,
} from '~/components/Filter/generic';
import { PipelineRunLabel } from '../../../../consts/pipelinerun';
import { usePipelineRunsForCommit } from '../../../../hooks/usePipelineRuns';
import { usePLRVulnerabilities } from '../../../../hooks/useScanResults';
import { HttpError } from '../../../../k8s/error';
import { RouterParams } from '../../../../routes/utils';
import { Table } from '../../../../shared';
import ErrorEmptyState from '../../../../shared/components/empty-state/ErrorEmptyState';
import FilteredEmptyState from '../../../../shared/components/empty-state/FilteredEmptyState';
import { useNamespace } from '../../../../shared/providers/Namespace';
import { PipelineRunKind } from '../../../../types';
import { pipelineRunStatus } from '../../../../utils/pipeline-utils';
import PipelineRunEmptyState from '../../../PipelineRun/PipelineRunEmptyState';
import { PipelineRunListHeaderWithVulnerabilities } from '../../../PipelineRun/PipelineRunListView/PipelineRunListHeader';
import { PipelineRunListRowWithVulnerabilities } from '../../../PipelineRun/PipelineRunListView/PipelineRunListRow';

const CommitsPipelineRunTab: React.FC = () => {
  const { applicationName, commitName } = useParams<RouterParams>();
  const namespace = useNamespace();
  const [, setSearchParams] = useSearchParams();
  const [pipelineRuns, loaded, error, getNextPage, { isFetchingNextPage, hasNextPage }] =
    usePipelineRunsForCommit(namespace, applicationName, commitName, undefined, false);

  // Define filter configurations using the new generic system
  const filterConfigs: FilterConfig[] = React.useMemo(
    () => [
      {
        type: 'search',
        param: 'search',
        mode: 'client',
        searchAttributes: {
          attributes: [
            { key: 'name', label: 'Name' },
            { key: 'commit', label: 'Commit' },
          ],
          defaultAttribute: 'name',
          getPlaceholder: (attribute) => `Filter by ${attribute.toLowerCase()}...`,
        },
      },
      {
        type: 'multiSelect',
        param: 'status',
        label: 'Status',
        mode: 'client',
        getOptions: (data: PipelineRunKind[]) => {
          const statusMap = new Map<string, number>();
          data.forEach((plr) => {
            const status = pipelineRunStatus(plr);
            if (status) {
              statusMap.set(status, (statusMap.get(status) || 0) + 1);
            }
          });
          return Array.from(statusMap.entries()).map(([status, count]) => ({
            value: status,
            label: status,
            count,
          }));
        },
        filterFn: (item: PipelineRunKind, value: string[]) => {
          if (!Array.isArray(value) || value.length === 0) return true;
          return value.includes(pipelineRunStatus(item));
        },
      },
      {
        type: 'multiSelect',
        param: 'type',
        label: 'Type',
        mode: 'client',
        getOptions: (data: PipelineRunKind[]) => {
          const typeMap = new Map<string, number>();
          data.forEach((plr) => {
            const type = plr?.metadata.labels[PipelineRunLabel.PIPELINE_TYPE];
            if (type) {
              typeMap.set(type, (typeMap.get(type) || 0) + 1);
            }
          });
          return Array.from(typeMap.entries()).map(([type, count]) => ({
            value: type,
            label: type.charAt(0).toUpperCase() + type.slice(1),
            count,
          }));
        },
        filterFn: (item: PipelineRunKind, value: string[]) => {
          if (!Array.isArray(value) || value.length === 0) return true;
          const runType = item?.metadata.labels[PipelineRunLabel.PIPELINE_TYPE];
          return value.includes(runType);
        },
      },
    ],
    [],
  );

  // Use the new generic filter system with type safety
  const { filteredData: filteredPLRs, isFiltered } = useFilteredData<PipelineRunKind>(
    pipelineRuns || [],
    filterConfigs,
  );

  const vulnerabilities = usePLRVulnerabilities(isFiltered ? filteredPLRs : pipelineRuns);

  if (error) {
    const httpError = HttpError.fromCode(error ? (error as { code: number }).code : 404);
    return (
      <ErrorEmptyState
        httpError={httpError}
        title="Unable to load pipeline runs"
        body={httpError?.message.length > 0 ? httpError?.message : 'Something went wrong'}
      />
    );
  }

  if (loaded && (!pipelineRuns || pipelineRuns.length === 0)) {
    return <PipelineRunEmptyState applicationName={applicationName} />;
  }

  const EmptyMsg = () => <FilteredEmptyState onClearFilters={() => setSearchParams({})} />;
  const NoDataEmptyMsg = () => <PipelineRunEmptyState applicationName={applicationName} />;

  return (
    <>
      <Title headingLevel="h4" className="pf-v5-c-title pf-v5-u-mt-lg pf-v5-u-mb-lg">
        Pipeline runs
      </Title>
      <div>
        {(isFiltered || (pipelineRuns && pipelineRuns.length > 0)) && (
          <PipelineRunsFilterToolbar
            filterConfigs={filterConfigs}
            data={pipelineRuns || []}
            dataTestId="commits-pipeline-runs-filter"
          />
        )}
        <Table
          key={`${pipelineRuns?.length || 0}-${vulnerabilities.fetchedPipelineRuns.length}`}
          unfilteredData={pipelineRuns || []}
          data={filteredPLRs}
          aria-label="Pipelinerun List"
          Header={PipelineRunListHeaderWithVulnerabilities}
          loaded={isFetchingNextPage || loaded}
          customData={vulnerabilities}
          EmptyMsg={isFiltered ? EmptyMsg : NoDataEmptyMsg}
          NoDataEmptyMsg={NoDataEmptyMsg}
          Row={PipelineRunListRowWithVulnerabilities}
          getRowProps={(obj: PipelineRunKind) => ({
            id: obj.metadata.name,
          })}
          isInfiniteLoading
          infiniteLoaderProps={{
            isRowLoaded: (args) => {
              return !!filteredPLRs[args.index];
            },
            loadMoreRows: () => {
              hasNextPage && !isFetchingNextPage && getNextPage?.();
            },
            rowCount: hasNextPage ? filteredPLRs.length + 1 : filteredPLRs.length,
          }}
        />
        {isFetchingNextPage ? (
          <Stack style={{ marginTop: 'var(--pf-v5-global--spacer--md)' }} hasGutter>
            <Bullseye>
              <Spinner size="lg" aria-label="Loading more pipeline runs" />
            </Bullseye>
          </Stack>
        ) : null}
      </div>
    </>
  );
};

export default CommitsPipelineRunTab;
