import * as React from 'react';
import { PageSection, PageSectionVariants, Text, Title } from '@patternfly/react-core';
import { FilterContext } from '~/components/Filter/generic/FilterContext';
import { BaseTextFilterToolbar } from '~/components/Filter/toolbars/BaseTextFIlterToolbar';
import { Table, useDeepCompareMemoize } from '../../../shared';
import FilteredEmptyState from '../../../shared/components/empty-state/FilteredEmptyState';
import { ComponentKind } from '../../../types';
import SnapshotComponentsEmptyState from './SnapshotComponentsEmptyState';
import SnapshotComponentsListHeader from './SnapshotComponentsListHeader';
import SnapshotComponentsListRow, { SnapshotComponentTableData } from './SnapshotComponentsListRow';

interface SnapshotComponentsListProps {
  applicationName?: string;
  components: SnapshotComponentTableData[];
}

const SnapshotComponentsList: React.FC<React.PropsWithChildren<SnapshotComponentsListProps>> = ({
  applicationName,
  components,
}) => {
  const { filters: unparsedFilters, setFilters, onClearFilters } = React.useContext(FilterContext);
  const filters = useDeepCompareMemoize({
    name: unparsedFilters.name ? (unparsedFilters.name as string) : '',
  });
  const { name: nameFilter } = filters;

  const filteredComponents = React.useMemo(
    () =>
      components.filter(
        (component) =>
          !nameFilter ||
          (component.metadata && component.metadata?.name.indexOf(nameFilter.trim()) !== -1),
      ),
    [nameFilter, components],
  );

  return (
    <PageSection padding={{ default: 'noPadding' }} variant={PageSectionVariants.light} isFilled>
      <>
        <Title size="lg" headingLevel="h2" className="pf-c-title pf-u-mt-lg pf-u-mb-sm">
          Components
        </Title>
        {!components || components.length === 0 ? (
          <SnapshotComponentsEmptyState applicationName={applicationName} />
        ) : (
          <>
            <Text className="pf-u-mb-lg">Component builds that are included in this snapshot</Text>
            <BaseTextFilterToolbar
              text={nameFilter}
              label="name"
              setText={(name) => setFilters({ name })}
              onClearFilters={onClearFilters}
              dataTest="component-list-toolbar"
            />
            {filteredComponents.length > 0 ? (
              <Table
                data={filteredComponents}
                aria-label="Component List"
                Header={SnapshotComponentsListHeader}
                Row={SnapshotComponentsListRow}
                loaded
                getRowProps={(obj: ComponentKind) => ({
                  id: obj.metadata.uid,
                })}
              />
            ) : (
              <FilteredEmptyState onClearFilters={() => onClearFilters()} />
            )}
          </>
        )}
      </>
    </PageSection>
  );
};

export default SnapshotComponentsList;
