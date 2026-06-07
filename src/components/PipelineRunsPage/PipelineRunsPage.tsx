import React from 'react';
import { Bullseye, Spinner } from '@patternfly/react-core';
import ColumnManagement from '~/components/ColumnManagement/ColumnManagement';
import { PipelineRunEventType, PipelineRunLabel, runStatus } from '~/consts/pipelinerun';
import { useApplications } from '~/hooks/useApplications';
import { useAllComponents } from '~/hooks/useComponents';
import { usePipelineRunsV2 } from '~/hooks/usePipelineRunsV2';
import {
  defineFilters,
  useFilterState,
  useFilteredData,
  FilterToolbar,
  buildOptions,
} from '~/shared/components/Filter';
import { useActiveSavedView, SavedViewStar } from '~/shared/components/SavedViews';
import { Table, TableContainer } from '~/shared/components/TableV2';
import { useNamespace } from '~/shared/providers/Namespace';
import { PipelineRunKind, ComponentKind } from '~/types';
import { pipelineRunStatus } from '~/utils/pipeline-utils';
import PageLayout from '../PageLayout/PageLayout';
import { getPipelineRunsColumns, PipelineRunEventTypeLabel } from './PipelineRunsColumns';
import { PipelineRunsEmptyState } from './PipelineRunsEmptyState';

const eventTypeOptions = Object.values(PipelineRunEventType).map((value) => ({
  label: PipelineRunEventTypeLabel[value as keyof typeof PipelineRunEventTypeLabel] ?? value,
  value,
}));

const filterConfigs = defineFilters<PipelineRunKind>()([
  {
    type: 'switchableSearch',
    param: 'searchField',
    label: 'Search',
    fields: [
      {
        label: 'Name',
        value: 'name',
        param: 'name',
        filterFn: (item, value) =>
          (item.metadata?.name ?? '').toLowerCase().includes(value.toLowerCase()),
      },
      {
        label: 'PR number',
        value: 'prNumber',
        param: 'prNumber',
        multiValue: true,
        filterFn: (item, value) =>
          (item.metadata?.labels?.[PipelineRunLabel.PULL_REQUEST_NUMBER_LABEL] ?? '') === value,
      },
    ],
  },
  {
    type: 'multiSelect',
    param: 'app',
    label: 'Application',
    mode: 'api',
    group: 'resource',
    filterFn: (item, values) =>
      values.includes(item.metadata?.labels?.[PipelineRunLabel.APPLICATION] ?? ''),
  },
  {
    type: 'multiSelect',
    param: 'component',
    label: 'Component',
    mode: 'api',
    group: 'resource',
    filterFn: (item, values) =>
      values.includes(item.metadata?.labels?.[PipelineRunLabel.COMPONENT] ?? ''),
  },
  {
    type: 'multiSelect',
    param: 'eventType',
    label: 'Event type',
    group: 'resource',
    filterFn: (item, values) =>
      values.includes(item.metadata?.labels?.[PipelineRunLabel.COMMIT_EVENT_TYPE_LABEL] ?? ''),
  },
  {
    type: 'multiSelect',
    param: 'status',
    label: 'Status',
    group: 'attributes',
    filterFn: (item, values) => values.includes(pipelineRunStatus(item)),
  },
  {
    type: 'multiSelect',
    param: 'type',
    label: 'Type',
    mode: 'api',
    group: 'attributes',
    filterFn: (item, values) =>
      values.includes(item.metadata?.labels?.[PipelineRunLabel.PIPELINE_TYPE] ?? ''),
  },
] as const);

const TopFilter = defineFilters<PipelineRunKind>()([
  {
    type: 'boolean',
    param: 'archive',
    label: 'Include archived',
    group: 'archive',
  },
]);

export const PipelineRunsPage: React.FC = () => {
  const namespace = useNamespace();

  // Saved view
  const activeSavedView = useActiveSavedView('pipeline-runs');

  // Eager-load apps and components
  const [applications, appsLoaded] = useApplications(namespace);
  const [components, componentsLoaded] = useAllComponents(namespace);

  // Filter state
  const { filterValues, clientFilterValues, isFiltered } = useFilterState([
    ...filterConfigs,
    ...TopFilter,
  ]);

  // Build match expressions from API-mode filter values
  const selectedApps = React.useMemo(() => filterValues.app ?? [], [filterValues.app]);
  const selectedComponents = React.useMemo(
    () => filterValues.component ?? [],
    [filterValues.component],
  );

  // Only fetch when at least one app or component is selected
  const hasRequiredFilters = selectedApps.length > 0 || selectedComponents.length > 0;

  const matchExpressions = React.useMemo(() => {
    const expressions: Array<{ key: string; operator: string; values: string[] }> = [];
    if (selectedApps.length > 0) {
      expressions.push({
        key: PipelineRunLabel.APPLICATION,
        operator: 'In',
        values: selectedApps,
      });
    }
    if (selectedComponents.length > 0) {
      expressions.push({
        key: PipelineRunLabel.COMPONENT,
        operator: 'In',
        values: selectedComponents,
      });
    }
    return expressions;
  }, [selectedApps, selectedComponents]);

  // Fetch pipeline runs
  const [pipelineRuns, plrLoaded, plrError, getNextPage, { isFetchingNextPage, hasNextPage }] =
    usePipelineRunsV2(hasRequiredFilters ? namespace : null, {
      selector: { matchExpressions },
    });

  // Client-side filtering
  const { filteredData } = useFilteredData(filterConfigs, pipelineRuns, clientFilterValues);

  // Column definitions
  const columns = React.useMemo(() => getPipelineRunsColumns(namespace), [namespace]);

  // Column state key: saved view's key or default
  const columnStateKey = activeSavedView?.columnStateKey ?? 'prns-columns';

  // Build filter options
  const appOptions = React.useMemo(
    () => buildOptions(applications ?? [], (app) => app.metadata?.name ?? ''),
    [applications],
  );

  // Narrow component options by selected apps
  const filteredComponents = React.useMemo(() => {
    if (selectedApps.length === 0) return components ?? [];
    return (components ?? []).filter((c: ComponentKind) =>
      selectedApps.includes(c.spec?.application ?? ''),
    );
  }, [components, selectedApps]);
  const componentOptions = React.useMemo(
    () => buildOptions(filteredComponents, (c) => c.metadata?.name ?? ''),
    [filteredComponents],
  );

  const statusOptions = React.useMemo(
    () => Object.values(runStatus).map((s) => ({ label: s, value: s })),
    [],
  );

  const typeOptions = React.useMemo(
    () =>
      buildOptions(
        pipelineRuns ?? [],
        (plr) => plr.metadata?.labels?.[PipelineRunLabel.PIPELINE_TYPE] ?? '',
      ),
    [pipelineRuns],
  );

  // Loading state
  if (!appsLoaded || !componentsLoaded) {
    return (
      <Bullseye>
        <Spinner data-test="pipeline-runs-spinner" />
      </Bullseye>
    );
  }

  const pageTitle = activeSavedView?.label ?? 'Pipeline Runs';

  const optionsMap = {
    app: appOptions,
    component: componentOptions,
    eventType: eventTypeOptions,
    status: statusOptions,
    type: typeOptions,
  };

  return (
    <PageLayout
      title={pageTitle}
      description="Monitor pipeline runs across applications and components."
      customActions={
        <FilterToolbar configs={TopFilter}>
          <SavedViewStar
            resourceKey="pipeline-runs"
            columnKeyPrefix="prns-columns"
            currentColumnStateKey={columnStateKey}
            isFiltered={isFiltered}
            activeSavedView={activeSavedView}
          />
        </FilterToolbar>
      }
    >
      <FilterToolbar
        configs={filterConfigs}
        options={optionsMap}
        groups={{
          resource: { variant: 'filter-group' },
          attributes: { variant: 'filter-group' },
          archive: { variant: 'filter-group' },
        }}
      >
        <ColumnManagement columns={columns} columnStateKey={columnStateKey} showColumnManagement />
      </FilterToolbar>
      {hasRequiredFilters ? (
        <TableContainer
          data={filteredData}
          unfilteredData={pipelineRuns}
          loaded={plrLoaded}
          loadError={plrError as Error | undefined}
          emptyState={<PipelineRunsEmptyState />}
        >
          <Table
            data={filteredData}
            columns={columns}
            getRowId={(row) => row.metadata?.uid ?? row.metadata?.name ?? ''}
            aria-label="Pipeline runs"
            columnStateKey={columnStateKey}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            fetchNextPage={getNextPage}
          />
        </TableContainer>
      ) : (
        <PipelineRunsEmptyState />
      )}
    </PageLayout>
  );
};
