import * as React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Bullseye, Spinner, Stack } from '@patternfly/react-core';
import {
  PipelineRunsFilterToolbar,
  useFilteredData,
  FilterConfig,
} from '~/components/Filter/generic';
import { PipelineRunLabel } from '../../../consts/pipelinerun';
import { useApplication } from '../../../hooks/useApplications';
import { usePipelineRuns } from '../../../hooks/usePipelineRuns';
import { usePLRVulnerabilities } from '../../../hooks/useScanResults';
import { HttpError } from '../../../k8s/error';
import { Table } from '../../../shared';
import ErrorEmptyState from '../../../shared/components/empty-state/ErrorEmptyState';
import FilteredEmptyState from '../../../shared/components/empty-state/FilteredEmptyState';
import { useNamespace } from '../../../shared/providers/Namespace';
import { PipelineRunKind } from '../../../types';
import { pipelineRunStatus } from '../../../utils/pipeline-utils';
import PipelineRunEmptyState from '../PipelineRunEmptyState';
import { PipelineRunListHeaderWithVulnerabilities } from './PipelineRunListHeader';
import { PipelineRunListRowWithVulnerabilities } from './PipelineRunListRow';

type PipelineRunsListViewProps = {
  applicationName: string;
  componentName?: string;
  customFilter?: (plr: PipelineRunKind) => boolean;
};

const PipelineRunsListView: React.FC<React.PropsWithChildren<PipelineRunsListViewProps>> = ({
  applicationName,
  componentName,
  customFilter,
}) => {
  const namespace = useNamespace();
  const [application, applicationLoaded] = useApplication(namespace, applicationName);

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
            const type = plr?.metadata?.labels?.[PipelineRunLabel.PIPELINE_TYPE];
            if (type) {
              typeMap.set(type, (typeMap.get(type) || 0) + 1);
            }
          });
          return Array.from(typeMap.entries()).map(([type, count]) => ({
            value: type,
            label: type.charAt(0).toUpperCase() + type.slice(1), // Capitalize for display
            count,
          }));
        },
        filterFn: (item: PipelineRunKind, value: string[]) => {
          if (!Array.isArray(value) || value.length === 0) return true;
          const runType = item?.metadata?.labels?.[PipelineRunLabel.PIPELINE_TYPE];
          return value.includes(runType);
        },
      },
    ],
    [],
  );

  const [searchParams, setSearchParams] = useSearchParams();
  const name = searchParams.get('name') || '';

  const [pipelineRuns, loaded, error, getNextPage, { isFetchingNextPage, hasNextPage }] =
    usePipelineRuns(
      applicationLoaded ? namespace : null,
      React.useMemo(
        () => ({
          selector: {
            filterByCreationTimestampAfter: application?.metadata?.creationTimestamp,
            filterByName: name || undefined,
            matchLabels: {
              [PipelineRunLabel.APPLICATION]: applicationName,
              ...(componentName && {
                [PipelineRunLabel.COMPONENT]: componentName,
              }),
            },
          },
        }),
        [applicationName, componentName, application, name],
      ),
    );

  const sortedPipelineRuns = React.useMemo((): PipelineRunKind[] => {
    if (!pipelineRuns) return [];

    // @ts-expect-error: toSorted might not be in TS yet
    if (typeof pipelineRuns.toSorted === 'function') {
      // @ts-expect-error: toSorted might not be in TS yet
      return pipelineRuns.toSorted((a, b) =>
        b.status?.startTime?.localeCompare(a.status?.startTime),
      );
    }

    return [...pipelineRuns].sort((a, b) =>
      b.status?.startTime?.localeCompare(a.status?.startTime),
    );
  }, [pipelineRuns]);

  const baseFilteredRuns = React.useMemo(() => {
    return customFilter ? sortedPipelineRuns.filter(customFilter) : sortedPipelineRuns;
  }, [sortedPipelineRuns, customFilter]);

  const { filteredData: filteredPLRs, isFiltered: isStatusTypeFiltered } =
    useFilteredData<PipelineRunKind>(baseFilteredRuns, filterConfigs);

  const isFiltered = isStatusTypeFiltered;

  const vulnerabilities = usePLRVulnerabilities(name ? filteredPLRs : sortedPipelineRuns);

  const handleClearFilters = React.useCallback(() => {
    setSearchParams({});
  }, [setSearchParams]);

  const EmptyMsg = () => <FilteredEmptyState onClearFilters={handleClearFilters} />;
  const NoDataEmptyMsg = () => <PipelineRunEmptyState applicationName={applicationName} />;

  if (error) {
    const httpError = HttpError.fromCode(error ? (error as { code: number }).code : 404);
    return (
      <ErrorEmptyState
        httpError={httpError}
        title="Unable to load pipeline runs"
        body={httpError?.message.length ? httpError?.message : 'Something went wrong'}
      />
    );
  }

  return (
    <>
      {(isFiltered || sortedPipelineRuns.length > 0) && (
        <PipelineRunsFilterToolbar
          filterConfigs={filterConfigs}
          data={baseFilteredRuns}
          dataTestId="pipeline-runs-filter"
        />
      )}
      <Table
        data={filteredPLRs}
        unfilteredData={sortedPipelineRuns}
        EmptyMsg={isFiltered ? EmptyMsg : NoDataEmptyMsg}
        aria-label="Pipeline run List"
        customData={vulnerabilities}
        Header={PipelineRunListHeaderWithVulnerabilities}
        Row={PipelineRunListRowWithVulnerabilities}
        loaded={isFetchingNextPage || loaded}
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
    </>
  );
};

export default PipelineRunsListView;
