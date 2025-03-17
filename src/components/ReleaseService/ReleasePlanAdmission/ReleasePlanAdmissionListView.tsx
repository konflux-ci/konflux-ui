import * as React from 'react';
import { Bullseye, PageSection, PageSectionVariants, Spinner } from '@patternfly/react-core';
import { FilterContext, FilterContextProvider } from '~/components/Filter/generic/FilterContext';
import { NameFilterToolbar } from '~/components/Filter/toolbars/NameFilterToolbar';
import { FULL_APPLICATION_TITLE } from '../../../consts/labels';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';
import { useReleasePlanAdmissions } from '../../../hooks/useReleasePlanAdmissions';
import { ReleasePlanAdmissionModel } from '../../../models/release-plan-admission';
import { Table, useDeepCompareMemoize } from '../../../shared';
import FilteredEmptyState from '../../../shared/components/empty-state/FilteredEmptyState';
import { useNamespace } from '../../../shared/providers/Namespace';
import { ReleasePlanAdmissionKind } from '../../../types/release-plan-admission';
import { withPageAccessCheck } from '../../PageAccess/withPageAccessCheck';
import { ReleaseServiceEmptyState } from '../ReleaseServiceEmptyState';
import ReleasePlanAdmissionListHeader from './ReleasePlanAdmissionListHeader';
import ReleasePlanAdmissionListRow from './ReleasePlanAdmissionListRow';

const ReleasePlanAdmissionListView: React.FC<React.PropsWithChildren<unknown>> = () => {
  const namespace = useNamespace();
  const [releasePlanAdmission, loaded] = useReleasePlanAdmissions(namespace);
  const { filters: unparsedFilters, setFilters, onClearFilters } = React.useContext(FilterContext);
  const filters = useDeepCompareMemoize({
    name: unparsedFilters.name ? (unparsedFilters.name as string) : '',
  });
  const { name: nameFilter } = filters;

  const filteredReleasePlanAdmission = React.useMemo(
    () =>
      loaded ? releasePlanAdmission.filter((r) => r.metadata.name.indexOf(nameFilter) !== -1) : [],
    [loaded, releasePlanAdmission, nameFilter],
  );

  useDocumentTitle(`Release Plan Admission | ${FULL_APPLICATION_TITLE}`);

  if (!loaded) {
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  }

  if (!releasePlanAdmission?.length) {
    return <ReleaseServiceEmptyState title="No Release Plan Admission found" />;
  }

  return (
    <PageSection padding={{ default: 'noPadding' }} variant={PageSectionVariants.light} isFilled>
      <NameFilterToolbar
        name={nameFilter}
        setName={(name) => setFilters({ name })}
        onClearFilters={onClearFilters}
        dataTest="release-plan-admission-list-toolbar"
      />
      {!filteredReleasePlanAdmission?.length ? (
        <FilteredEmptyState onClearFilters={() => onClearFilters()} />
      ) : (
        <Table
          data-test="release-plan-admission__table"
          data={filteredReleasePlanAdmission}
          aria-label="Release Plan Admission List"
          Header={ReleasePlanAdmissionListHeader}
          Row={ReleasePlanAdmissionListRow}
          loaded
          getRowProps={(obj: ReleasePlanAdmissionKind) => ({
            id: obj.metadata.uid,
          })}
        />
      )}
    </PageSection>
  );
};

const ReleasePlanAdmissionListViewWithContext = (
  props: React.ComponentProps<typeof ReleasePlanAdmissionListView>,
) => (
  <FilterContextProvider filterParams={['name']}>
    <ReleasePlanAdmissionListView {...props} />
  </FilterContextProvider>
);

export default withPageAccessCheck(ReleasePlanAdmissionListViewWithContext)({
  accessReviewResources: [{ model: ReleasePlanAdmissionModel, verb: 'list' }],
});
