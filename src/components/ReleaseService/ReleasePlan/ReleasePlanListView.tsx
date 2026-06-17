import * as React from 'react';
import { Bullseye, PageSection, PageSectionVariants, Spinner } from '@patternfly/react-core';
import { ChatContextTarget, withChatContextRowPropsIfEnabled } from '~/components/AIChat';
import { FilterContext, FilterContextProvider } from '~/components/Filter/generic/FilterContext';
import { BaseTextFilterToolbar } from '~/components/Filter/toolbars/BaseTextFIlterToolbar';
import { useIsOnFeatureFlag } from '~/feature-flags/hooks';
import { useApplications } from '~/hooks/useApplications';
import { useLocalStorage } from '~/shared/hooks/useLocalStorage';
import { getErrorState } from '~/shared/utils/error-utils';
import { filterByText } from '~/utils/text-filter-utils';
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
  const isChatEnabled = useIsOnFeatureFlag('ai-chat');
  const tableContextId = `release-plans-${namespace}`;
  const [applications, appLoaded, appError] = useApplications(namespace);
  const [releasePlans, releasePlansLoaded, releasePlansError] = useReleasePlans(namespace);
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
    if (!releasePlansLoaded || !releasePlans) {
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
  }, [releasePlansLoaded, appLoaded, releasePlans, applications]);

  const filteredReleasePlans = React.useMemo(
    () => filterByText(releasePlanWithApplicationData, nameFilter, (r) => r.metadata.name),
    [releasePlanWithApplicationData, nameFilter],
  );

  useDocumentTitle(`Release Plan | ${FULL_APPLICATION_TITLE}`);

  if (!releasePlansLoaded || !appLoaded) {
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  }

  if (appError || releasePlansError) {
    return getErrorState(
      appError || releasePlansError,
      appLoaded && releasePlansLoaded,
      'release plans',
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
        <ChatContextTarget
          id={tableContextId}
          label="Release plans table"
          description="All release plans in this namespace"
        >
          <Table
            data-test="release-plan__table"
            data={filteredReleasePlans}
            aria-label="Release List"
            Header={getReleasePlanListHeader(safeVisibleColumns)}
            Row={ReleasePlanListRow}
            customData={{ visibleColumns: safeVisibleColumns }}
            loaded
            getRowProps={(obj: ReleaseKind) =>
              withChatContextRowPropsIfEnabled(
                isChatEnabled,
                { id: obj.metadata.uid },
                {
                  id: `release-plan-row-${obj.metadata.name}`,
                  label: obj.metadata.name,
                  description: 'Release plan table row',
                  parentContextId: tableContextId,
                },
              )
            }
          />
        </ChatContextTarget>
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
  accessReviewResources: [{ model: ReleasePlanModel, verb: 'list' }],
});
