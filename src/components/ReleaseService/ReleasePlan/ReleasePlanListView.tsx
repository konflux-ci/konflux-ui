import * as React from 'react';
import { Bullseye, PageSection, PageSectionVariants, Spinner } from '@patternfly/react-core';
import { FilterContext, FilterContextProvider } from '~/components/Filter/generic/FilterContext';
import { BaseTextFilterToolbar } from '~/components/Filter/toolbars/BaseTextFIlterToolbar';
import { useApplications } from '~/hooks/useApplications';
import { useLocalStorage } from '~/hooks/useLocalStorage';
import { FULL_APPLICATION_TITLE } from '../../../consts/labels';
import {
  RELEASE_PLAN_COLUMNS_DEFINITIONS,
  DEFAULT_VISIBLE_RELEASE_PLAN_COLUMNS,
  NON_HIDABLE_RELEASE_PLAN_COLUMNS,
  ReleasePlanColumnKeys,
} from '../../../consts/release';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';
import { useReleasePlans } from '../../../hooks/useReleasePlans';
import { ReleasePlanModel } from '../../../models';
import { Table, useDeepCompareMemoize } from '../../../shared';
import FilteredEmptyState from '../../../shared/components/empty-state/FilteredEmptyState';
import ColumnManagement from '../../../shared/components/table/ColumnManagement';
import { useNamespace } from '../../../shared/providers/Namespace';
import { ReleaseKind } from '../../../types';
import { withPageAccessCheck } from '../../PageAccess/withPageAccessCheck';
import { ReleaseServiceEmptyState } from '../ReleaseServiceEmptyState';
import { getReleasePlanListHeader } from './ReleasePlanListHeader';
import ReleasePlanListRow, { ReleasePlanWithApplicationData } from './ReleasePlanListRow';

const ReleasePlanListView: React.FC<React.PropsWithChildren<unknown>> = () => {
  const namespace = useNamespace();
  const [applications, appLoaded] = useApplications(namespace);
  const [releasePlans, loaded] = useReleasePlans(namespace);
  const { filters: unparsedFilters, setFilters, onClearFilters } = React.useContext(FilterContext);

  // Column management state
  const [isColumnManagementOpen, setIsColumnManagementOpen] = React.useState(false);
  const [persistedColumns, setPersistedColumns] = useLocalStorage<string[]>('release-plan-columns');

  const safeVisibleColumns = React.useMemo((): Set<ReleasePlanColumnKeys> => {
    if (Array.isArray(persistedColumns) && persistedColumns.length > 0) {
      return new Set(persistedColumns as ReleasePlanColumnKeys[]);
    }
    return new Set(DEFAULT_VISIBLE_RELEASE_PLAN_COLUMNS);
  }, [persistedColumns]);
  const filters = useDeepCompareMemoize({
    name: unparsedFilters.name ? (unparsedFilters.name as string) : '',
  });
  const { name: nameFilter } = filters;

  const releasePlanWithApplicationData: ReleasePlanWithApplicationData[] = React.useMemo(() => {
    if (!loaded || !releasePlans) {
      return [];
    }
    return appLoaded && applications
      ? releasePlans.map((rpa) => {
          const application = applications.find(
            (app) => app.metadata?.name === rpa.spec.application,
          );
          return { ...rpa, application };
        })
      : releasePlans;
  }, [loaded, appLoaded, releasePlans, applications]);

  const filteredReleasePlans = React.useMemo(
    () => releasePlanWithApplicationData.filter((r) => r.metadata.name.indexOf(nameFilter) !== -1),
    [releasePlanWithApplicationData, nameFilter],
  );

  useDocumentTitle(`Release Plan | ${FULL_APPLICATION_TITLE}`);

  if (!loaded) {
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  }

  if (!releasePlans?.length) {
    return <ReleaseServiceEmptyState title="No Release Plan found" />;
  }

  return (
    <PageSection padding={{ default: 'noPadding' }} variant={PageSectionVariants.light} isFilled>
      <BaseTextFilterToolbar
        text={nameFilter}
        label="name"
        setText={(name) => setFilters({ name })}
        onClearFilters={onClearFilters}
        dataTest="release-plan-list-toolbar"
        openColumnManagement={() => setIsColumnManagementOpen(true)}
        totalColumns={RELEASE_PLAN_COLUMNS_DEFINITIONS.length}
      />
      {!filteredReleasePlans?.length ? (
        <FilteredEmptyState onClearFilters={() => onClearFilters()} />
      ) : (
        <Table
          data-test="release-plan__table"
          data={filteredReleasePlans}
          aria-label="Release List"
          Header={getReleasePlanListHeader(safeVisibleColumns)}
          Row={ReleasePlanListRow}
          customData={{ visibleColumns: safeVisibleColumns }}
          loaded
          getRowProps={(obj: ReleaseKind) => ({
            id: obj.metadata.uid,
          })}
        />
      )}
      <ColumnManagement<ReleasePlanColumnKeys>
        isOpen={isColumnManagementOpen}
        onClose={() => setIsColumnManagementOpen(false)}
        visibleColumns={safeVisibleColumns}
        onVisibleColumnsChange={(cols) => setPersistedColumns(Array.from(cols))}
        columns={RELEASE_PLAN_COLUMNS_DEFINITIONS}
        defaultVisibleColumns={DEFAULT_VISIBLE_RELEASE_PLAN_COLUMNS}
        nonHidableColumns={NON_HIDABLE_RELEASE_PLAN_COLUMNS}
        title="Manage release plan columns"
        description="Selected columns will be displayed in the release plans table."
      />
    </PageSection>
  );
};

const ReleasePlanListViewWithContext = (
  props: React.ComponentProps<typeof ReleasePlanListView>,
) => (
  <FilterContextProvider filterParams={['name']}>
    <ReleasePlanListView {...props} />
  </FilterContextProvider>
);

export default withPageAccessCheck(ReleasePlanListViewWithContext)({
  accessReviewResources: [
    { model: ReleasePlanModel, verb: 'patch' },
    { model: ReleasePlanModel, verb: 'create' },
  ],
});
