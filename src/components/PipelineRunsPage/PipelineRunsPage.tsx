import React from 'react';
import { Bullseye, PageSection, Spinner } from '@patternfly/react-core';
import ColumnManagement from '~/components/ColumnManagement/ColumnManagement';
import { PipelineRunLabel } from '~/consts/pipelinerun';
import { FeatureFlagIndicator } from '~/feature-flags/FeatureFlagIndicator';
import { useApplications } from '~/hooks/useApplications';
import { useAllComponents } from '~/hooks/useComponents';
import { usePipelineRunsV2 } from '~/hooks/usePipelineRunsV2';
import FilteredEmptyState from '~/shared/components/empty-state/FilteredEmptyState';
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
import {
  PIPELINE_RUN_EVENT_TYPE_OPTIONS,
  PIPELINE_RUN_STATUS_OPTIONS,
  PIPELINE_RUN_TYPE_OPTIONS,
  eventTypeFilterConfig,
  pipelineTypeFilterConfig,
  statusFilterConfig,
} from '~/utils/pipeline-run-filter-utils';
import PageLayout from '../PageLayout/PageLayout';
import { getPipelineRunsColumns } from './PipelineRunsColumns';
import { PipelineRunsEmptyState } from './PipelineRunsEmptyState';

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
  },
  {
    type: 'multiSelect',
    param: 'component',
    label: 'Component',
    mode: 'api',
    group: 'resource',
  },
  { ...eventTypeFilterConfig, group: 'resource' },
  { ...statusFilterConfig, group: 'attributes' },
  { ...pipelineTypeFilterConfig, group: 'attributes' },
] as const);

const TopFilter = defineFilters<PipelineRunKind>()([
  {
    type: 'boolean',
    param: 'archive',
    label: 'Include archived',
    group: 'archive',
  },
]);

const allFilterConfigs = [...filterConfigs, ...TopFilter];

export const PipelineRunsPage: React.FC = () => {
  const namespace = useNamespace();

  // Saved view
  const activeSavedView = useActiveSavedView('pipeline-runs');

  // Eager-load apps and components
  const [applications, appsLoaded] = useApplications(namespace);
  const [components, componentsLoaded] = useAllComponents(namespace);

  // Filter state
  const { filterValues, clientFilterValues, isFiltered, clearAll } =
    useFilterState(allFilterConfigs);

  // Build match expressions from API-mode filter values
  const selectedApps = React.useMemo(() => filterValues.app ?? [], [filterValues.app]);
  const selectedComponents = React.useMemo(
    () => filterValues.component ?? [],
    [filterValues.component],
  );

  // PR number chips from switchable search
  const prNumbers = filterValues.prNumber;
  const hasPrNumbers = Array.isArray(prNumbers) && prNumbers.length > 0;

  // Fetch when at least one app, component, or PR number is selected
  const hasRequiredFilters =
    selectedApps.length > 0 || selectedComponents.length > 0 || hasPrNumbers;

  // API-mode filter values
  const selectedEventTypes = React.useMemo(
    () => filterValues.eventType ?? [],
    [filterValues.eventType],
  );
  const selectedTypes = React.useMemo(() => filterValues.type ?? [], [filterValues.type]);

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
    if (hasPrNumbers) {
      expressions.push({
        key: PipelineRunLabel.PULL_REQUEST_NUMBER_LABEL,
        operator: 'In',
        values: prNumbers as string[],
      });
    }
    if (selectedEventTypes.length > 0) {
      expressions.push({
        key: PipelineRunLabel.COMMIT_EVENT_TYPE_LABEL,
        operator: 'In',
        values: selectedEventTypes,
      });
    }
    if (selectedTypes.length > 0) {
      expressions.push({
        key: PipelineRunLabel.PIPELINE_TYPE,
        operator: 'In',
        values: selectedTypes,
      });
    }
    return expressions;
  }, [
    selectedApps,
    selectedComponents,
    hasPrNumbers,
    prNumbers,
    selectedEventTypes,
    selectedTypes,
  ]);

  // Archive toggle
  const includeArchive = filterValues.archive === true;

  // Fetch pipeline runs
  const [pipelineRuns, plrLoaded, plrError, getNextPage, { isFetchingNextPage, hasNextPage }] =
    usePipelineRunsV2(hasRequiredFilters ? namespace : null, {
      selector: { matchExpressions },
      enableArchive: includeArchive,
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

  // Loading state
  if (!appsLoaded || !componentsLoaded) {
    return (
      <Bullseye>
        <Spinner data-test="pipeline-runs-spinner" />
      </Bullseye>
    );
  }

  const pageTitle = (
    <>
      {activeSavedView?.label ?? 'Pipeline Runs'}{' '}
      <FeatureFlagIndicator flags={['pipeline-runs-page']} />
    </>
  );

  const optionsMap = {
    app: appOptions,
    component: componentOptions,
    eventType: PIPELINE_RUN_EVENT_TYPE_OPTIONS,
    status: PIPELINE_RUN_STATUS_OPTIONS,
    type: PIPELINE_RUN_TYPE_OPTIONS,
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
      <PageSection isFilled={false}>
        <FilterToolbar
          configs={filterConfigs}
          options={optionsMap}
          groups={{
            resource: { variant: 'filter-group' },
            attributes: { variant: 'filter-group' },
            archive: { variant: 'filter-group' },
          }}
        >
          <ColumnManagement
            columns={columns}
            columnStateKey={columnStateKey}
            showColumnManagement
          />
        </FilterToolbar>
        {hasRequiredFilters ? (
          <TableContainer
            data={filteredData}
            unfilteredData={pipelineRuns}
            loaded={plrLoaded}
            emptyState={<FilteredEmptyState onClearFilters={clearAll} />}
            loadError={plrError as Error | undefined}
            noDataState={<PipelineRunsEmptyState />}
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
      </PageSection>
    </PageLayout>
  );
};
