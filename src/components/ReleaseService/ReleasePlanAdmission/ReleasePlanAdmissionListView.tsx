import * as React from 'react';
import { Bullseye, PageSection, PageSectionVariants, Spinner } from '@patternfly/react-core';
import { ChatContextTarget, withChatContextRowPropsIfEnabled } from '~/components/AIChat';
import { FilterContext, FilterContextProvider } from '~/components/Filter/generic/FilterContext';
import { BaseTextFilterToolbar } from '~/components/Filter/toolbars/BaseTextFIlterToolbar';
import { useIsOnFeatureFlag } from '~/feature-flags/hooks';
import { getErrorState } from '~/shared/utils/error-utils';
import { filterByText } from '~/utils/text-filter-utils';
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
  const isChatEnabled = useIsOnFeatureFlag('ai-chat');
  const tableContextId = `release-plan-admissions-${namespace}`;
  const [releasePlanAdmissions, rpaLoaded, rpaError] = useReleasePlanAdmissions(namespace);
  const { filters: unparsedFilters, setFilters, onClearFilters } = React.useContext(FilterContext);
  const filters = useDeepCompareMemoize({
    name: unparsedFilters.name ? (unparsedFilters.name as string) : '',
  });
  const { name: nameFilter } = filters;

  const filteredReleasePlanAdmission = React.useMemo(
    () => filterByText(releasePlanAdmissions ?? [], nameFilter, (r) => r.metadata.name),
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
        <ChatContextTarget
          id={tableContextId}
          label="Release plan admissions table"
          description="All release plan admissions in this namespace"
        >
          <Table
            data-test="release-plan-admission__table"
            data={filteredReleasePlanAdmission}
            aria-label="Release Plan Admission List"
            Header={ReleasePlanAdmissionListHeader}
            Row={(props) => {
              const obj = props.obj as ReleasePlanAdmissionKind;

              return <ReleasePlanAdmissionListRow {...props} obj={obj} />;
            }}
            loaded
            getRowProps={(obj: ReleasePlanAdmissionKind) =>
              withChatContextRowPropsIfEnabled(
                isChatEnabled,
                { id: obj.metadata.uid },
                {
                  id: `release-plan-admission-row-${obj.metadata.name}`,
                  label: obj.metadata.name,
                  description: 'Release plan admission table row',
                  parentContextId: tableContextId,
                },
              )
            }
          />
        </ChatContextTarget>
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
