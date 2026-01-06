import * as React from 'react';
import { Link } from 'react-router-dom';
import { Alert, AlertVariant, EmptyStateBody } from '@patternfly/react-core';
import { capitalize } from 'lodash-es';
import { FilterContext } from '~/components/Filter/generic/FilterContext';
import { MultiSelect } from '~/components/Filter/generic/MultiSelect';
import { BaseTextFilterToolbar } from '~/components/Filter/toolbars/BaseTextFIlterToolbar';
import { createFilterObj } from '~/components/Filter/utils/filter-utils';
import { useLatestBuildPipelinesForNamespace } from '~/hooks/useLatestBuildPipelinesForNamespace';
import { getErrorState } from '~/shared/utils/error-utils';
import { statuses } from '~/utils/commits-utils';
import { pipelineRunStatus } from '~/utils/pipeline-utils';
import emptyStateImgUrl from '../../assets/Components.svg';
import { PipelineRunLabel } from '../../consts/pipelinerun';
import { useAllComponents } from '../../hooks/useComponents';
import { ComponentModel } from '../../models';
import { IMPORT_PATH } from '../../routes/paths';
import { Table, useDeepCompareMemoize } from '../../shared';
import AppEmptyState from '../../shared/components/empty-state/AppEmptyState';
import FilteredEmptyState from '../../shared/components/empty-state/FilteredEmptyState';
import { useNamespace } from '../../shared/providers/Namespace/useNamespaceInfo';
import { ComponentKind } from '../../types';
import { useAccessReviewForModel } from '../../utils/rbac';
import { ButtonWithAccessTooltip } from '../ButtonWithAccessTooltip';
import ComponentsListHeader from '../Components/ComponentsListView/ComponentsListHeader';
import ComponentsListRow from '../Components/ComponentsListView/ComponentsListRow';

const ComponentList: React.FC = () => {
  const namespace = useNamespace();

  const { filters: unparsedFilters, setFilters, onClearFilters } = React.useContext(FilterContext);
  const filters = useDeepCompareMemoize({
    name: unparsedFilters.name ? (unparsedFilters.name as string) : '',
    status: unparsedFilters.status ? (unparsedFilters.status as string[]) : [],
  });

  const { name: nameFilter, status: statusFilter } = filters;

  const [components, componentsLoaded, componentsError] = useAllComponents(namespace);
  const [canCreateComponent] = useAccessReviewForModel(ComponentModel, 'create');

  const componentNames = React.useMemo(() => components.map((c) => c.metadata.name), [components]);

  const [pipelineRuns, pipelineRunsLoaded, pipelineRunsError] = useLatestBuildPipelinesForNamespace(
    namespace,
    componentNames,
  );

  const componentsWithLatestBuild = React.useMemo(() => {
    if (!componentsLoaded || componentsError) {
      return [];
    }
    return components.map((c) => ({
      ...c,
      latestBuildPipelineRun: pipelineRuns?.find(
        (plr) => plr.metadata?.labels?.[PipelineRunLabel.COMPONENT] === c.metadata.name,
      ),
    }));
  }, [components, componentsError, componentsLoaded, pipelineRuns]);

  const filteredComponents = React.useMemo(
    () =>
      componentsWithLatestBuild.filter((component) => {
        const compStatus = statusFilter?.length
          ? pipelineRunStatus(component.latestBuildPipelineRun)
          : 'unknown';

        return (
          (!nameFilter || component.metadata.name.indexOf(nameFilter) !== -1) &&
          (!statusFilter?.length || statusFilter.includes(capitalize(compStatus)))
        );
      }),
    [componentsWithLatestBuild, statusFilter, nameFilter],
  );

  const statusFilterObj = React.useMemo(
    () =>
      createFilterObj(
        componentsWithLatestBuild,
        (c) => pipelineRunStatus(c.latestBuildPipelineRun),
        statuses,
      ),
    [componentsWithLatestBuild],
  );

  const NoDataEmptyMessage = () => (
    <AppEmptyState emptyStateImg={emptyStateImgUrl} title="Start building your components">
      <EmptyStateBody>
        A component is an image built from source code in a repository.
        <br />
        To get started, create your first component.
      </EmptyStateBody>
      <ButtonWithAccessTooltip
        variant="primary"
        component={(props) => (
          <Link
            {...props}
            to={IMPORT_PATH.createPath({
              workspaceName: namespace,
            })}
          />
        )}
        isDisabled={!canCreateComponent}
        tooltip="You don't have access to add a component"
        analytics={{
          link_name: 'add-component',
          link_location: 'components-list-empty-state',
          namespace,
        }}
      >
        Add component
      </ButtonWithAccessTooltip>
    </AppEmptyState>
  );
  const EmptyMessage = () => (
    <FilteredEmptyState
      onClearFilters={onClearFilters}
      data-test="components-list-view__all-filtered"
    />
  );

  const toolbar = (
    <BaseTextFilterToolbar
      text={nameFilter}
      label="name"
      setText={(name) => setFilters({ ...filters, name })}
      onClearFilters={onClearFilters}
      dataTest="component-list-toolbar"
    >
      <MultiSelect
        label="Status"
        filterKey="status"
        values={statusFilter}
        setValues={(status) => setFilters({ ...filters, status })}
        options={statusFilterObj}
      />
      <ButtonWithAccessTooltip
        variant="secondary"
        component={(p) => (
          <Link
            {...p}
            data-test="add-component-button"
            to={IMPORT_PATH.createPath({ workspaceName: namespace })}
          />
        )}
        isDisabled={!canCreateComponent}
        tooltip="You don't have access to add a component"
        analytics={{
          link_name: 'add-component',
          namespace,
        }}
      >
        Add component
      </ButtonWithAccessTooltip>
    </BaseTextFilterToolbar>
  );

  if (componentsError) {
    return getErrorState(componentsError, componentsLoaded, 'components');
  }

  return (
    <>
      {pipelineRunsLoaded && pipelineRunsError ? (
        <Alert
          className="pf-v5-u-mt-md"
          variant={AlertVariant.warning}
          isInline
          title="Error while fetching pipeline runs"
        >
          {(pipelineRunsError as { message: string })?.message}{' '}
        </Alert>
      ) : null}
      <div data-test="component-list">
        <Table
          virtualize={false}
          data={filteredComponents}
          unfilteredData={componentsWithLatestBuild}
          EmptyMsg={EmptyMessage}
          NoDataEmptyMsg={NoDataEmptyMessage}
          Toolbar={toolbar}
          aria-label="Components List"
          Header={ComponentsListHeader}
          Row={ComponentsListRow}
          loaded={componentsLoaded}
          customData={{ pipelineRunsLoaded }}
          getRowProps={(obj: ComponentKind) => ({
            id: `${obj.metadata.name}-component-list-item`,
            'aria-label': obj.metadata.name,
          })}
        />
      </div>
    </>
  );
};

export default ComponentList;
