import * as React from 'react';
import {
  Bullseye,
  Button,
  InputGroup,
  PageSection,
  PageSectionVariants,
  Spinner,
  TextInput,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
} from '@patternfly/react-core';
import { FilterIcon } from '@patternfly/react-icons/dist/esm/icons';
import { FULL_APPLICATION_TITLE } from '../../../consts/labels';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';
import { useReleasePlanAdmissions } from '../../../hooks/useReleasePlanAdmissions';
import { useSearchParam } from '../../../hooks/useSearchParam';
import { ReleasePlanAdmissionModel } from '../../../models/release-plan-admission';
import { Table } from '../../../shared';
import FilteredEmptyState from '../../../shared/components/empty-state/FilteredEmptyState';
import { ReleasePlanAdmissionKind } from '../../../types/release-plan-admission';
import { withPageAccessCheck } from '../../PageAccess/withPageAccessCheck';
import { useWorkspaceInfo } from '../../Workspace/useWorkspaceInfo';
import { ReleaseServiceEmptyState } from '../ReleaseServiceEmptyState';
import ReleasePlanAdmissionListHeader from './ReleasePlanAdmissionListHeader';
import ReleasePlanAdmissionListRow from './ReleasePlanAdmissionListRow';

const ReleasePlanAdmissionListView: React.FC<React.PropsWithChildren<unknown>> = () => {
  const { namespace, workspace } = useWorkspaceInfo();
  const [releasePlanAdmission, loaded] = useReleasePlanAdmissions(namespace, workspace);
  const [nameFilter, setNameFilter] = useSearchParam('name', '');
  const onClearFilters = () => setNameFilter('');

  const filteredReleasePlanAdmission = React.useMemo(
    () => releasePlanAdmission.filter((r) => r.metadata.name.indexOf(nameFilter) !== -1),
    [releasePlanAdmission, nameFilter],
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
      <Toolbar data-test="release-plan-admission-list-toolbar" clearAllFilters={onClearFilters}>
        <ToolbarContent>
          <ToolbarGroup align={{ default: 'alignLeft' }}>
            <ToolbarItem>
              <InputGroup>
                <Button variant="control">
                  <FilterIcon /> Name
                </Button>
                <TextInput
                  name="nameInput"
                  data-test="name-input-filter"
                  type="search"
                  aria-label="name filter"
                  placeholder="Filter by name..."
                  onChange={(_, value: string) => setNameFilter(value)}
                  value={nameFilter}
                />
              </InputGroup>
            </ToolbarItem>
          </ToolbarGroup>
        </ToolbarContent>
      </Toolbar>
      {!filteredReleasePlanAdmission?.length ? (
        <FilteredEmptyState onClearFilters={onClearFilters} />
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

export default withPageAccessCheck(ReleasePlanAdmissionListView)({
  accessReviewResources: [{ model: ReleasePlanAdmissionModel, verb: 'list' }],
});
