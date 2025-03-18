import * as React from 'react';
import { Bullseye, PageSection, PageSectionVariants, Spinner } from '@patternfly/react-core';
import { FilterContext, FilterContextProvider } from '~/components/Filter/generic/FilterContext';
import { NameFilterToolbar } from '~/components/Filter/toolbars/NameFilterToolbar';
import { FULL_APPLICATION_TITLE } from '../../../consts/labels';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';
import { useReleasePlans } from '../../../hooks/useReleasePlans';
import { ReleasePlanModel } from '../../../models';
import { Table, useDeepCompareMemoize } from '../../../shared';
import FilteredEmptyState from '../../../shared/components/empty-state/FilteredEmptyState';
import { useNamespace } from '../../../shared/providers/Namespace';
import { ReleaseKind } from '../../../types';
import { withPageAccessCheck } from '../../PageAccess/withPageAccessCheck';
import { ReleaseServiceEmptyState } from '../ReleaseServiceEmptyState';
import ReleasePlanListHeader from './ReleasePlanListHeader';
import ReleasePlanListRow from './ReleasePlanListRow';

const ReleasePlanListView: React.FC<React.PropsWithChildren<unknown>> = () => {
  const namespace = useNamespace();
  const [releasePlans, loaded] = useReleasePlans(namespace);
  const { filters: unparsedFilters, setFilters, onClearFilters } = React.useContext(FilterContext);
  const filters = useDeepCompareMemoize({
    name: unparsedFilters.name ? (unparsedFilters.name as string) : '',
  });
  const { name: nameFilter } = filters;

  const filteredReleasePlans = React.useMemo(
    () => (loaded ? releasePlans.filter((r) => r.metadata.name.indexOf(nameFilter) !== -1) : []),
    [releasePlans, nameFilter, loaded],
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
      <NameFilterToolbar
        name={nameFilter}
        setName={(name) => setFilters({ name })}
        onClearFilters={onClearFilters}
        dataTest="release-plan-list-toolbar"
      />
      {!filteredReleasePlans?.length ? (
        <FilteredEmptyState onClearFilters={() => onClearFilters()} />
      ) : (
        <Table
          data-test="release-plan__table"
          data={filteredReleasePlans}
          aria-label="Release List"
          Header={ReleasePlanListHeader}
          Row={ReleasePlanListRow}
          loaded
          getRowProps={(obj: ReleaseKind) => ({
            id: obj.metadata.uid,
          })}
        />
      )}
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
