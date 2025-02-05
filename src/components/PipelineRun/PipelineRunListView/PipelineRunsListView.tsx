import * as React from 'react';
import { Bullseye, Spinner, Stack } from '@patternfly/react-core';
import { PipelineRunLabel } from '../../../consts/pipelinerun';
import { useComponents } from '../../../hooks/useComponents';
import { usePipelineRuns } from '../../../hooks/usePipelineRuns';
import { usePipelineRunsFilter } from '../../../hooks/usePipelineRunsFilter';
import { usePLRVulnerabilities } from '../../../hooks/useScanResults';
import { HttpError } from '../../../k8s/error';
import { Table } from '../../../shared';
import ErrorEmptyState from '../../../shared/components/empty-state/ErrorEmptyState';
import FilteredEmptyState from '../../../shared/components/empty-state/FilteredEmptyState';
import { PipelineRunKind } from '../../../types';
import { statuses } from '../../../utils/commits-utils';
import { pipelineRunStatus } from '../../../utils/pipeline-utils';
import { pipelineRunTypes } from '../../../utils/pipelinerun-utils';
import { createFilterObj } from '../../Filter/utils/pipelineruns-filter-utils';
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
  const [components, componentsLoaded] = useComponents(namespace, workspace, applicationName);
  const {
    filterPLRs,
    filterState: { nameFilter, onLoadName },
    filterToolbar,
    onClearFilters,
  } = usePipelineRunsFilter();

  const [pipelineRuns, loaded, error, getNextPage, { isFetchingNextPage, hasNextPage }] =
    usePipelineRuns(
      componentsLoaded ? namespace : null,
      workspace,
      React.useMemo(
        () => ({
          selector: {
            matchLabels: {
              [PipelineRunLabel.APPLICATION]: applicationName,
            },
            ...(!onLoadName && {
              matchExpressions: [
                {
                  key: `${PipelineRunLabel.COMPONENT}`,
                  operator: 'In',
                  values: componentName
                    ? [componentName]
                    : components?.map((c) => c.metadata?.name),
                },
              ],
            }),
            ...(onLoadName && { filterByName: onLoadName.trim().toLowerCase() }),
          },
        }),
        [applicationName, componentName, components, onLoadName],
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
    () => filterPLRs(pipelineRuns).filter((plr) => !customFilter || customFilter(plr)),
    [filterPLRs, pipelineRuns, customFilter],
  );

  const vulnerabilities = usePLRVulnerabilities(nameFilter ? filteredPLRs : pipelineRuns);

  const EmptyMsg = () => <FilteredEmptyState onClearFilters={onClearFilters} />;
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
      <Table
        data={filteredPLRs}
        unfilteredData={pipelineRuns}
        NoDataEmptyMsg={NoDataEmptyMsg}
        EmptyMsg={EmptyMsg}
        Toolbar={filterToolbar(statusFilterObj, typeFilterObj)}
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
