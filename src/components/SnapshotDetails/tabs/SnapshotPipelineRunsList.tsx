import * as React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Bullseye, Spinner, Title } from '@patternfly/react-core';
import { FilterContext } from '~/components/Filter/generic/FilterContext';
import { createFilterObj } from '~/components/Filter/utils/filter-utils';
import { FeatureFlagIndicator } from '~/feature-flags/FeatureFlagIndicator';
import {
  PIPELINE_RUN_COLUMNS_DEFINITIONS,
  DEFAULT_VISIBLE_PIPELINE_RUN_COLUMNS_SNAPSHOT_CONTEXT,
  NON_HIDABLE_PIPELINE_RUN_COLUMNS,
  PipelineRunColumnKeys,
} from '../../../consts/pipeline';
import { PipelineRunLabel } from '../../../consts/pipelinerun';
import { usePLRVulnerabilities } from '../../../hooks/useScanResults';
import { Table } from '../../../shared';
import FilteredEmptyState from '../../../shared/components/empty-state/FilteredEmptyState';
import ColumnManagement from '../../../shared/components/table/ColumnManagement';
import { useLocalStorage } from '../../../shared/hooks/useLocalStorage';
import { PipelineRunKind } from '../../../types';
import { pipelineRunStatus } from '../../../utils/pipeline-utils';
import { FilterConfig } from '../../Filter/generic/FilterConfig';
import { useFilteredData } from '../../Filter/generic/hooks/useFilteredData';
import { PipelineRunsFilterToolbar } from '../../Filter/toolbars/PipelineRunsFilterToolbar';
import PipelineRunEmptyState from '../../PipelineRun/PipelineRunEmptyState';
import { getPipelineRunListHeader } from '../../PipelineRun/PipelineRunListView/PipelineRunListHeader';
import { PipelineRunListRowWithColumns } from '../../PipelineRun/PipelineRunListView/PipelineRunListRow';

type SnapshotPipelineRunListProps = {
  snapshotPipelineRuns: PipelineRunKind[];
  applicationName: string;
  loaded: boolean;
  getNextPage;
  customFilter?: (plr: PipelineRunKind) => boolean;
  nextPageProps;
};
const SnapshotPipelineRunsList: React.FC<React.PropsWithChildren<SnapshotPipelineRunListProps>> = ({
  snapshotPipelineRuns,
  applicationName,
  loaded,
  getNextPage,
  nextPageProps,
  customFilter,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [isColumnManagementOpen, setIsColumnManagementOpen] = React.useState(false);
  const [visibleColumnKeys, setVisibleColumnKeys] = useLocalStorage<string[]>(
    `snapshot-pipeline-runs-columns-${applicationName}`,
  );

  const safeVisibleColumns = React.useMemo((): Set<PipelineRunColumnKeys> => {
    if (Array.isArray(visibleColumnKeys) && visibleColumnKeys.length > 0) {
      return new Set(visibleColumnKeys as PipelineRunColumnKeys[]);
    }
    return new Set(DEFAULT_VISIBLE_PIPELINE_RUN_COLUMNS_SNAPSHOT_CONTEXT);
  }, [visibleColumnKeys]);

  const statusFilterObj = React.useMemo(
    () =>
      filterPipelineRuns(
        snapshotPipelineRuns,
        {
          name: filters.name,
          commit: filters.commit,
          status: [],
          type: filters.type,
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
            label: type,
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

  // Apply custom filter if provided
  const filteredByCustomFilter = React.useMemo(() => {
    return customFilter ? snapshotPipelineRuns.filter(customFilter) : snapshotPipelineRuns;
  }, [snapshotPipelineRuns, customFilter]);

  // Use the new generic filter system with type safety
  const { filteredData: filteredPLRs, isFiltered } = useFilteredData<PipelineRunKind>(
    filteredByCustomFilter || [],
    filterConfigs,
  );

  const vulnerabilities = usePLRVulnerabilities(isFiltered ? filteredPLRs : snapshotPipelineRuns);

  const handleClearFilters = React.useCallback(() => {
    const newParams = new URLSearchParams(searchParams);
    filterConfigs.forEach((config) => {
      if (config.type === 'search' && config.searchAttributes) {
        // Clear all search attribute parameters
        config.searchAttributes.attributes.forEach((attr) => {
          newParams.delete(attr.key);
        });
      } else {
        newParams.delete(config.param);
      }
    });
    setSearchParams(newParams);
  }, [searchParams, setSearchParams, filterConfigs]);

  const EmptyMsg = () => <FilteredEmptyState onClearFilters={handleClearFilters} />;
  const NoDataEmptyMsg = () => <PipelineRunEmptyState applicationName={applicationName} />;

  if (!loaded) {
    return (
      <Bullseye data-test="snapshot-plr-loading">
        <Spinner />
      </Bullseye>
    );
  }

  if (!snapshotPipelineRuns || snapshotPipelineRuns.length === 0) {
    return <PipelineRunEmptyState applicationName={applicationName} />;
  }

  return (
    <>
      <Title
        headingLevel="h4"
        className="pf-v5-c-title pf-v5-u-mt-lg pf-v5-u-mb-lg"
        data-test="snapshot-plr-title"
      >
        Pipeline runs <FeatureFlagIndicator flags={['pipelineruns-kubearchive']} />
      </Title>
      {(isFiltered || snapshotPipelineRuns.length > 0) && (
        <PipelineRunsFilterToolbar
          filters={filters}
          setFilters={setFilters}
          onClearFilters={onClearFilters}
          typeOptions={typeFilterObj}
          statusOptions={statusFilterObj}
          openColumnManagement={() => setIsColumnManagementOpen(true)}
          totalColumns={PIPELINE_RUN_COLUMNS_DEFINITIONS.length}
        />
      )}
      <Table
        key={`${snapshotPipelineRuns.length}-${vulnerabilities.fetchedPipelineRuns.length}`}
        data={filteredPLRs}
        aria-label="Pipeline run List"
        customData={vulnerabilities}
        Header={getPipelineRunListHeader(safeVisibleColumns)}
        Row={(props) => (
          <PipelineRunListRowWithColumns
            obj={props.obj as PipelineRunKind}
            columns={props.columns || []}
            customData={vulnerabilities}
            index={props.index}
            visibleColumns={safeVisibleColumns}
          />
        )}
        unfilteredData={snapshotPipelineRuns}
        EmptyMsg={isFiltered ? EmptyMsg : NoDataEmptyMsg}
        loaded
        getRowProps={(obj: PipelineRunKind) => ({
          id: obj.metadata.name,
        })}
        isInfiniteLoading
        infiniteLoaderProps={{
          isRowLoaded: (args) => {
            return !!filteredPLRs[args.index];
          },
          loadMoreRows: () => {
            nextPageProps.hasNextPage && !nextPageProps.isFetchingNextPage && getNextPage?.();
          },
          rowCount: nextPageProps.hasNextPage ? filteredPLRs.length + 1 : filteredPLRs.length,
        }}
      />
      <ColumnManagement<PipelineRunColumnKeys>
        isOpen={isColumnManagementOpen}
        onClose={() => setIsColumnManagementOpen(false)}
        visibleColumns={safeVisibleColumns}
        onVisibleColumnsChange={(cols) => setVisibleColumnKeys(Array.from(cols))}
        columns={PIPELINE_RUN_COLUMNS_DEFINITIONS}
        defaultVisibleColumns={DEFAULT_VISIBLE_PIPELINE_RUN_COLUMNS_SNAPSHOT_CONTEXT}
        nonHidableColumns={NON_HIDABLE_PIPELINE_RUN_COLUMNS}
        title="Manage pipeline run columns"
        description="Selected columns will be displayed in the pipeline runs table."
      />
    </>
  );
};

export default SnapshotPipelineRunsList;
