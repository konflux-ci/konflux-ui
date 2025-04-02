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
import { useReleasePlans } from '../../../hooks/useReleasePlans';
import { useSearchParam } from '../../../hooks/useSearchParam';
import { ReleasePlanModel } from '../../../models';
import { Table } from '../../../shared';
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
  const [nameFilter, setNameFilter] = useSearchParam('name', '');
  const onClearFilters = () => setNameFilter('');

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
      <Toolbar data-test="release-plan-list-toolbar" clearAllFilters={onClearFilters}>
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
      {!filteredReleasePlans?.length ? (
        <FilteredEmptyState onClearFilters={onClearFilters} />
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

export default withPageAccessCheck(ReleasePlanListView)({
  accessReviewResources: [
    { model: ReleasePlanModel, verb: 'patch' },
    { model: ReleasePlanModel, verb: 'create' },
  ],
});
