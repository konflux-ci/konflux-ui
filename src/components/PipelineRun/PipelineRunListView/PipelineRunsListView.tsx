import * as React from 'react';
import { Bullseye, Spinner, Stack } from '@patternfly/react-core';
import { PipelineRunLabel } from '../../../consts/pipelinerun';
import { useApplication } from '../../../hooks/useApplications';
import { usePipelineRuns } from '../../../hooks/usePipelineRuns';
import { usePLRVulnerabilities } from '../../../hooks/useScanResults';
import { HttpError } from '../../../k8s/error';
import { Table } from '../../../shared';
import ErrorEmptyState from '../../../shared/components/empty-state/ErrorEmptyState';
import FilteredEmptyState from '../../../shared/components/empty-state/FilteredEmptyState';
import { PipelineRunKind } from '../../../types';
import { statuses } from '../../../utils/commits-utils';
import { pipelineRunStatus } from '../../../utils/pipeline-utils';
import { pipelineRunTypes } from '../../../utils/pipelinerun-utils';
import PipelineRunsFilterToolbar from '../../Filter/PipelineRunsFilterToolbar';
import { createFilterObj } from '../../Filter/utils/pipelineruns-filter-utils';
import { PipelineRunsFilterContext } from '../../Filter/utils/PipelineRunsFilterContext';
import { useWorkspaceInfo } from '../../Workspace/useWorkspaceInfo';
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
  const { namespace, workspace } = useWorkspaceInfo();
  const [application, applicationLoaded] = useApplication(namespace, workspace, applicationName);
  const {
    nameFilter,
    setNameFilter,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    clearAllFilters,
  } = React.useContext(PipelineRunsFilterContext);

  const [pipelineRuns, loaded, error, getNextPage, { isFetchingNextPage, hasNextPage }] =
    usePipelineRuns(
      applicationLoaded ? namespace : null,
      workspace,
      React.useMemo(
        () => ({
          selector: {
            filterByCreationTimestampAfter: application?.metadata?.creationTimestamp,
            matchLabels: {
              [PipelineRunLabel.APPLICATION]: applicationName,
              ...(!nameFilter &&
                componentName && {
                  [PipelineRunLabel.COMPONENT]: componentName,
                }),
            },
            ...(nameFilter && {
              filterByName: nameFilter.trim().toLowerCase(),
            }),
          },
        }),
        [applicationName, componentName, application, nameFilter],
      ),
    );

  const statusFilterObj = React.useMemo(
    () => createFilterObj(pipelineRuns, (plr) => pipelineRunStatus(plr), statuses, customFilter),
    [pipelineRuns, customFilter],
  );

  const typeFilterObj = React.useMemo(
    () =>
      createFilterObj(
        pipelineRuns,
        (plr) => plr?.metadata.labels[PipelineRunLabel.PIPELINE_TYPE],
        pipelineRunTypes,
        customFilter,
      ),
    [pipelineRuns, customFilter],
  );

  const filteredPLRs = React.useMemo(
    () =>
      pipelineRuns
        .filter((plr) => {
          const runType = plr?.metadata.labels[PipelineRunLabel.PIPELINE_TYPE];
          return (
            (!nameFilter ||
              plr.metadata.name.indexOf(nameFilter) >= 0 ||
              plr.metadata.labels?.[PipelineRunLabel.COMPONENT]?.indexOf(
                nameFilter.trim().toLowerCase(),
              ) >= 0) &&
            (!statusFilter.length || statusFilter.includes(pipelineRunStatus(plr))) &&
            (!typeFilter.length || typeFilter.includes(runType))
          );
        })
        .filter((plr) => !customFilter || customFilter(plr)),
    [pipelineRuns, customFilter, nameFilter, statusFilter, typeFilter],
  );

  const vulnerabilities = usePLRVulnerabilities(nameFilter ? filteredPLRs : pipelineRuns);

  const EmptyMsg = () => <FilteredEmptyState onClearFilters={clearAllFilters} />;
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

  const isFiltered = nameFilter.length > 0 || typeFilter.length > 0 || statusFilter.length > 0;

  return (
    <>
      <Table
        data={filteredPLRs}
        unfilteredData={pipelineRuns}
        EmptyMsg={isFiltered ? EmptyMsg : NoDataEmptyMsg}
        Toolbar={
          !isFiltered && pipelineRuns.length === 0 ? null : (
            <PipelineRunsFilterToolbar
              nameFilter={nameFilter}
              setNameFilter={setNameFilter}
              statusFilters={statusFilter}
              setStatusFilters={setStatusFilter}
              typeFilters={typeFilter}
              setTypeFilters={setTypeFilter}
              clearAllFilters={clearAllFilters}
              statusOptions={statusFilterObj}
              typeOptions={typeFilterObj}
            />
          )
        }
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
