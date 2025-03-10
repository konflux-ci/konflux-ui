import * as React from 'react';
import {
  Bullseye,
  EmptyStateBody,
  PageSection,
  PageSectionVariants,
  SearchInput,
  Spinner,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from '@patternfly/react-core';
import { debounce } from 'lodash-es';
import emptyStateImgUrl from '../../assets/namespace.svg';
import { useSearchParam } from '../../hooks/useSearchParam';
import { ExternalLink, Table } from '../../shared';
import AppEmptyState from '../../shared/components/empty-state/AppEmptyState';
import FilteredEmptyState from '../../shared/components/empty-state/FilteredEmptyState';
import { useNamespaceInfo } from '../../shared/providers/Namespace';
import { NamespaceKind } from '../../types';
import PageLayout from '../PageLayout/PageLayout';
import { NamespaceListHeader } from './NamespaceListHeader';
import NamespaceListRow from './NamespaceListRow';

const NamespaceCreateButton = () => (
  <ExternalLink
    variant="primary"
    href="https://konflux.pages.redhat.com/docs/users/getting-started/getting-access.html"
  >
    Go to create namespace instructions
  </ExternalLink>
);

const NamespaceListView: React.FC<React.PropsWithChildren<unknown>> = () => {
  const { namespaces, namespacesLoaded: loaded } = useNamespaceInfo();

  const [nameFilter, setNameFilter] = useSearchParam('name', '');

  namespaces?.sort(
    (app1, app2) =>
      +new Date(app2.metadata?.creationTimestamp) - +new Date(app1.metadata?.creationTimestamp),
  );
  const filteredNamespaces = React.useMemo(() => {
    const lowerCaseNameFilter = nameFilter.toLowerCase();
    return namespaces?.filter((app) => app.metadata.name.includes(lowerCaseNameFilter));
  }, [nameFilter, namespaces]);

  const onClearFilters = () => {
    setNameFilter('');
  };

  const onNameInput = debounce((n: string) => {
    setNameFilter(n);
  }, 600);

  if (!loaded) {
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  }

  return (
    <>
      <PageLayout title="Namespaces" description="A namespace contains 1 or more applications">
        <PageSection
          padding={{ default: 'noPadding' }}
          variant={PageSectionVariants.light}
          isFilled
        >
          {!namespaces || namespaces.length === 0 ? (
            <AppEmptyState
              className="pf-v5-u-mx-lg"
              isXl
              emptyStateImg={emptyStateImgUrl}
              title="No namespaces found"
            >
              <EmptyStateBody>
                Manage your application on your own and share with your team using namespaces.
                <br />
                To create a namespace using GitOps, follow the instruction.
              </EmptyStateBody>
              <NamespaceCreateButton />
            </AppEmptyState>
          ) : (
            <>
              <Toolbar usePageInsets>
                <ToolbarContent>
                  <ToolbarItem className="pf-v5-u-ml-0">
                    <SearchInput
                      name="nameInput"
                      data-test="name-input-filter"
                      type="search"
                      aria-label="name filter"
                      placeholder="Filter by name..."
                      onChange={(_, n) => onNameInput(n)}
                      value={nameFilter}
                    />
                  </ToolbarItem>
                  <ToolbarItem>
                    <NamespaceCreateButton />
                  </ToolbarItem>
                </ToolbarContent>
              </Toolbar>
              {filteredNamespaces.length !== 0 ? (
                <Table
                  data={filteredNamespaces}
                  aria-label="Namespace List"
                  Header={NamespaceListHeader}
                  Row={NamespaceListRow}
                  loaded
                  getRowProps={(obj: NamespaceKind) => ({
                    id: obj.metadata?.name,
                  })}
                />
              ) : (
                <FilteredEmptyState onClearFilters={onClearFilters} />
              )}
            </>
          )}
        </PageSection>
      </PageLayout>
    </>
  );
};

export default NamespaceListView;
