import * as React from 'react';
import { Bullseye, Flex, Spinner, Stack } from '@patternfly/react-core';
import { FilterContext } from '~/components/Filter/generic/FilterContext';
import PipelineRunsFilterToolbarV2 from '~/components/Filter/toolbars/PipelineRunsFilterToolbarV2';
import { createFilterObj } from '~/components/Filter/utils/filter-utils';
import {
  filterPipelineRunsV2,
  PipelineRunsFilterStateV2,
} from '~/components/Filter/utils/pipelineruns-filter-utils-v2';
import { SESSION_STORAGE_KEYS } from '~/consts/constants';
import { useComponent } from '~/hooks/useComponents';
import { useVisibleColumns } from '~/hooks/useVisibleColumns';
import { getErrorState } from '~/shared/utils/error-utils';
import {
  PIPELINE_RUN_COLUMNS_DEFINITIONS,
  DEFAULT_VISIBLE_PIPELINE_RUN_COLUMNS,
  NON_HIDABLE_PIPELINE_RUN_COLUMNS,
  PipelineRunColumnKeys,
} from '../../../consts/pipeline';
import { PipelineRunLabel } from '../../../consts/pipelinerun';
import { usePipelineRunsV2 } from '../../../hooks/usePipelineRunsV2';
import { usePLRVulnerabilities } from '../../../hooks/useScanResults';
import { Table, useDeepCompareMemoize } from '../../../shared';
import FilteredEmptyState from '../../../shared/components/empty-state/FilteredEmptyState';
import ColumnManagement from '../../../shared/components/table/ColumnManagement';
import { useNamespace } from '../../../shared/providers/Namespace';
import { PipelineRunKind } from '../../../types';
import { statuses } from '../../../utils/commits-utils';
import { pipelineRunStatus } from '../../../utils/pipeline-utils';
import { pipelineRunTypes } from '../../../utils/pipelinerun-utils';
import PipelineRunEmptyStateV2 from '../PipelineRunEmptyStateV2';
import { getPipelineRunListHeader } from './PipelineRunListHeader';
import { PipelineRunListRowWithColumns } from './PipelineRunListRow';

type PipelineRunsListViewPropsV2 = {
  componentName: string;
  versionName?: string;
};

const PipelineRunsListViewV2: React.FC<React.PropsWithChildren<PipelineRunsListViewPropsV2>> = ({
  componentName,
  versionName,
}) => {
  const namespace = useNamespace();
  const { filters: unparsedFilters, setFilters, onClearFilters } = React.useContext(FilterContext);
  const filters: PipelineRunsFilterStateV2 = useDeepCompareMemoize({
    name: unparsedFilters.name ? (unparsedFilters.name as string) : '',
    status: unparsedFilters.status ? (unparsedFilters.status as string[]) : [],
    type: unparsedFilters.type ? (unparsedFilters.type as string[]) : [],
    version: unparsedFilters.version ? (unparsedFilters.version as string[]) : [],
  });

  const {
    name: nameFilter,
    status: statusFilter,
    type: typeFilter,
    version: versionFilter,
  } = filters;

  const [visibleColumns, setVisibleColumns] = useVisibleColumns(
    SESSION_STORAGE_KEYS.PIPELINES_VISIBLE_COLUMNS,
    DEFAULT_VISIBLE_PIPELINE_RUN_COLUMNS,
  );
  const [isColumnManagementOpen, setIsColumnManagementOpen] = React.useState(false);

  const [component, compLoaded, compError] = useComponent(namespace, componentName, true);

  const [pipelineRuns, plrLoaded, plrError, getNextPage, { isFetchingNextPage, hasNextPage }] =
    usePipelineRunsV2(
      compLoaded && !compError ? namespace : null,
      React.useMemo(
        () => ({
          selector: {
            filterByCreationTimestampAfter: component.metadata?.creationTimestamp,
            filterByName: nameFilter || undefined,
            matchLabels: {
              [PipelineRunLabel.COMPONENT]: componentName,
              ...(versionName && {
                [PipelineRunLabel.COMPONENT_VERSION]: versionName,
              }),
            },
          },
        }),
        [component.metadata?.creationTimestamp, componentName, nameFilter, versionName],
      ),
    );

  const sortedPipelineRuns = React.useMemo((): PipelineRunKind[] => {
    if (!pipelineRuns) return [];

    // @ts-expect-error: toSorted might not be in TS yet
    if (typeof pipelineRuns.toSorted === 'function') {
      // @ts-expect-error: toSorted might not be in TS yet
      return pipelineRuns.toSorted((a, b) =>
        String(b.status?.startTime || '').localeCompare(String(a.status?.startTime || '')),
      );
    }

    return pipelineRuns.sort((a, b) =>
      String(b.status?.startTime || '').localeCompare(String(a.status?.startTime || '')),
    ) as PipelineRunKind[];
  }, [pipelineRuns]);

  const statusFilterObj = React.useMemo(
    () => createFilterObj(sortedPipelineRuns, (plr) => pipelineRunStatus(plr), statuses),
    [sortedPipelineRuns],
  );

  const typeFilterObj = React.useMemo(
    () =>
      createFilterObj(
        sortedPipelineRuns,
        (plr) => plr?.metadata.labels[PipelineRunLabel.PIPELINE_TYPE],
        pipelineRunTypes,
      ),
    [sortedPipelineRuns],
  );

  const allVersions = React.useMemo(
    () => component?.spec?.source?.versions ?? [],
    [component?.spec?.source?.versions],
  );

  const allVersionBranches = React.useMemo(() => allVersions.map((v) => v.revision), [allVersions]);

  const versionLabelMap = React.useMemo(
    () => Object.fromEntries(allVersions.map((v) => [v.revision, v.name])),
    [allVersions],
  );

  // TODO: temporary until item count is not removed from MultiSelect
  const versionFilterObj = Object.fromEntries(allVersionBranches.map((b) => [b, 0]));

  const filteredPLRs = React.useMemo(
    () => filterPipelineRunsV2(sortedPipelineRuns, filters, componentName),
    [sortedPipelineRuns, filters, componentName],
  );

  const vulnerabilities = usePLRVulnerabilities(nameFilter ? filteredPLRs : sortedPipelineRuns);

  const EmptyMsg = () => <FilteredEmptyState onClearFilters={() => onClearFilters()} />;
  const NoDataEmptyMsg = () => <PipelineRunEmptyStateV2 />;

  const error = compError ?? plrError;
  if (error) {
    return getErrorState(error, plrLoaded, 'pipeline runs');
  }

  const isFiltered =
    nameFilter.length > 0 ||
    typeFilter.length > 0 ||
    statusFilter.length > 0 ||
    (!versionName && versionFilter.length > 0);

  return (
    <Flex direction={{ default: 'column' }}>
      {(isFiltered || sortedPipelineRuns.length > 0) && (
        <PipelineRunsFilterToolbarV2
          filters={filters}
          setFilters={setFilters}
          onClearFilters={onClearFilters}
          typeOptions={typeFilterObj}
          statusOptions={statusFilterObj}
          versionOptions={!versionName ? versionFilterObj : undefined}
          versionLabels={!versionName ? versionLabelMap : undefined}
          openColumnManagement={() => setIsColumnManagementOpen(true)}
          totalColumns={PIPELINE_RUN_COLUMNS_DEFINITIONS.length}
        />
      )}
      <Table
        data={filteredPLRs}
        unfilteredData={sortedPipelineRuns}
        EmptyMsg={isFiltered ? EmptyMsg : NoDataEmptyMsg}
        aria-label="Pipeline run List"
        customData={vulnerabilities}
        Header={getPipelineRunListHeader(visibleColumns)}
        Row={(props) => (
          // TODO: use new rows which use the new component model
          <PipelineRunListRowWithColumns
            obj={props.obj as PipelineRunKind}
            columns={props.columns || []}
            customData={vulnerabilities}
            index={props.index}
            visibleColumns={visibleColumns}
          />
        )}
        loaded={isFetchingNextPage || plrLoaded}
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
      <ColumnManagement<PipelineRunColumnKeys>
        isOpen={isColumnManagementOpen}
        onClose={() => setIsColumnManagementOpen(false)}
        visibleColumns={visibleColumns}
        onVisibleColumnsChange={setVisibleColumns}
        columns={PIPELINE_RUN_COLUMNS_DEFINITIONS}
        defaultVisibleColumns={DEFAULT_VISIBLE_PIPELINE_RUN_COLUMNS}
        nonHidableColumns={NON_HIDABLE_PIPELINE_RUN_COLUMNS}
        title="Manage pipeline run columns"
        description="Selected columns will be displayed in the pipeline runs table."
      />
    </Flex>
  );
};

export default PipelineRunsListViewV2;
