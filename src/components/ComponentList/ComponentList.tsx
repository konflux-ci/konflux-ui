import * as React from 'react';
import { EmptyStateBody, Text, TextContent, TextVariants, Title } from '@patternfly/react-core';
import { FilterContext } from '~/components/Filter/generic/FilterContext';
import { BaseTextFilterToolbar } from '~/components/Filter/toolbars/BaseTextFIlterToolbar';
import { FeatureFlagIndicator } from '~/feature-flags/FeatureFlagIndicator';
import { useAllComponents } from '~/hooks/useComponents';
import { getErrorState } from '~/shared/utils/error-utils';
import emptyStateImgUrl from '../../assets/Components.svg';
import { Table, useDeepCompareMemoize } from '../../shared';
import AppEmptyState from '../../shared/components/empty-state/AppEmptyState';
import FilteredEmptyState from '../../shared/components/empty-state/FilteredEmptyState';
import { useNamespace } from '../../shared/providers/Namespace/useNamespaceInfo';
import { ComponentKind } from '../../types';
import { ButtonWithAccessTooltip } from '../ButtonWithAccessTooltip';
import ComponentsListHeader from './ComponentListHeader';
import ComponentsListRow from './ComponentListRow';
import './ComponentList.scss';

const ComponentList: React.FC = () => {
  const namespace = useNamespace();

  const { filters: unparsedFilters, setFilters, onClearFilters } = React.useContext(FilterContext);
  const filters = useDeepCompareMemoize({
    name: unparsedFilters.name ? (unparsedFilters.name as string) : '',
  });

  const { name: nameFilter } = filters;

  const [allComponents, allComponentsLoaded, allComponentsError] = useAllComponents(namespace);

  const components = React.useMemo(() => {
    if (!allComponentsLoaded || allComponentsError) {
      return [];
    }
    return allComponents;
  }, [allComponents, allComponentsError, allComponentsLoaded]);

  const filteredComponents = React.useMemo(
    () =>
      components.filter((component) => {
        return !nameFilter || component.metadata.name.indexOf(nameFilter) !== -1;
      }),
    [components, nameFilter],
  );

  const NoDataEmptyMessage = () => (
    <AppEmptyState
      className="component-list__empty-state"
      emptyStateImg={emptyStateImgUrl}
      title=""
    >
      <EmptyStateBody>
        A component is an image built from source code in a repository.
        <br />
        To get started, add a component.
      </EmptyStateBody>
      <ButtonWithAccessTooltip variant="primary" tooltip="You don't have access to add a component">
        Add component
      </ButtonWithAccessTooltip>
    </AppEmptyState>
  );

  const EmptyMessage = () => (
    <FilteredEmptyState
      onClearFilters={onClearFilters}
      data-test="components-list-view__all-filtered"
      className="component-list__empty-state"
    />
  );

  const toolbar = (
    <BaseTextFilterToolbar
      text={nameFilter}
      label="name"
      setText={(name) => setFilters({ ...filters, name })}
      onClearFilters={onClearFilters}
      dataTest="component-list-toolbar"
    />
  );

  if (allComponentsError) {
    return getErrorState(allComponentsError, allComponentsLoaded, 'components');
  }

  return (
    <>
      <Title headingLevel="h3" className="pf-v5-u-mt-lg pf-v5-u-mb-sm pf-v5-u-pl-md">
        Components
        <span className="pf-v5-u-ml-sm">
          <FeatureFlagIndicator flags={['components-page']} />
        </span>
      </Title>
      <TextContent className="pf-v5-u-pl-md">
        <Text component={TextVariants.p}>
          A component is an image built from source code in a repository.
        </Text>
      </TextContent>
      <div data-test="component-list">
        <Table
          virtualize={false}
          data={filteredComponents}
          unfilteredData={components}
          EmptyMsg={EmptyMessage}
          NoDataEmptyMsg={NoDataEmptyMessage}
          Toolbar={toolbar}
          aria-label="Components List"
          Header={ComponentsListHeader}
          Row={ComponentsListRow}
          loaded={allComponentsLoaded}
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
