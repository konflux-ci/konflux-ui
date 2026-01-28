import * as React from 'react';
import { Bullseye, PageSection, PageSectionVariants, Spinner } from '@patternfly/react-core';
import { FilterContext, FilterContextProvider } from '~/components/Filter/generic/FilterContext';
import { BaseTextFilterToolbar } from '~/components/Filter/toolbars/BaseTextFIlterToolbar';
import { getErrorState } from '~/shared/utils/error-utils';
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
  const [releasePlanAdmissions, rpaLoaded, rpaError] = useReleasePlanAdmissions(namespace);
  const { filters: unparsedFilters, setFilters, onClearFilters } = React.useContext(FilterContext);
  const filters = useDeepCompareMemoize({
    name: unparsedFilters.name ? (unparsedFilters.name as string) : '',
  });
  const { name: nameFilter } = filters;

  const filteredReleasePlanAdmission = React.useMemo(
    () =>
      releasePlanAdmissions
        ? releasePlanAdmissions.filter((r) => r.metadata.name.indexOf(nameFilter) !== -1)
        : [],
    [releasePlanAdmissions, nameFilter],
  );

  useDocumentTitle(`Release Plan Admission | ${FULL_APPLICATION_TITLE}`);

  if (!rpaLoaded) {
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  }

  if (rpaError) {
    return getErrorState(rpaError, rpaLoaded, 'release plan admissions');
  }

  if (!releasePlanAdmissions?.length) {
    return <ReleaseServiceEmptyState title="No Release Plan Admission found" />;
  }

  return (
    <PageSection padding={{ default: 'noPadding' }} variant={PageSectionVariants.light} isFilled>
      <BaseTextFilterToolbar
        text={nameFilter}
        label="name"
        setText={(name) => setFilters({ name })}
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
          Row={(props) => {
            const obj = props.obj as ReleasePlanAdmissionKind;

            return <ReleasePlanAdmissionListRow {...props} obj={obj} customData={{ namespace }} />;
          }}
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
