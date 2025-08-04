import * as React from 'react';
import {
  Bullseye,
  EmptyStateBody,
  Flex,
  PageSection,
  PageSectionVariants,
  Spinner,
  Tooltip,
} from '@patternfly/react-core';
import { QuestionCircleIcon } from '@patternfly/react-icons/dist/js/icons/question-circle-icon';
import { GETTING_ACCESS_INTERNAL } from '~/consts/documentation';
import { useInstanceVisibility } from '~/hooks/useUIInstance';
import { KonfluxInstanceVisibility } from '~/types/konflux-public-info';
import emptyStateImgUrl from '../../assets/namespace.svg';
import { ExternalLink, Table, useDeepCompareMemoize } from '../../shared';
import AppEmptyState from '../../shared/components/empty-state/AppEmptyState';
import FilteredEmptyState from '../../shared/components/empty-state/FilteredEmptyState';
import { useNamespaceInfo } from '../../shared/providers/Namespace';
import { NamespaceKind } from '../../types';
import { FilterContext } from '../Filter/generic/FilterContext';
import { BaseTextFilterToolbar } from '../Filter/toolbars/BaseTextFIlterToolbar';
import PageLayout from '../PageLayout/PageLayout';
import { NamespaceListHeader } from './NamespaceListHeader';
import NamespaceListRow from './NamespaceListRow';

const NamespaceCreateButton = React.memo(() => {
  const instanceVisibility = useInstanceVisibility();

  if (instanceVisibility === KonfluxInstanceVisibility.PRIVATE) {
    return (
      <ExternalLink variant="primary" href={GETTING_ACCESS_INTERNAL}>
        Go to create namespace instructions
      </ExternalLink>
    );
  }

  return (
    <Tooltip content={<>Contact your platform engineer to create a new namespace.</>}>
      <Flex className="pf-v5-u-mt-sm" data-testid="namespace-create-tooltip">
        <QuestionCircleIcon />
      </Flex>
    </Tooltip>
  );
});

const NamespaceListView: React.FC<React.PropsWithChildren<unknown>> = () => {
  const { namespaces, namespacesLoaded: loaded } = useNamespaceInfo();

  const { filters: unparsedFilters, setFilters, onClearFilters } = React.useContext(FilterContext);
  const filters = useDeepCompareMemoize({
    name: unparsedFilters.name ? (unparsedFilters.name as string) : '',
  });
  const { name: nameFilter } = filters;

  namespaces?.sort((app1, app2) => app1.metadata.name.localeCompare(app2.metadata.name));
  const filteredNamespaces = React.useMemo(() => {
    const lowerCaseNameFilter = nameFilter.toLowerCase();
    return namespaces?.filter((app) => app.metadata.name.includes(lowerCaseNameFilter));
  }, [nameFilter, namespaces]);

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
              <BaseTextFilterToolbar
                text={nameFilter}
                label="name"
                setText={(name) => setFilters({ name })}
                onClearFilters={onClearFilters}
                dataTest="namespace-list-toolbar"
              >
                <NamespaceCreateButton />
              </BaseTextFilterToolbar>
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
                <FilteredEmptyState onClearFilters={() => onClearFilters()} />
              )}
            </>
          )}
        </PageSection>
      </PageLayout>
    </>
  );
};

export default NamespaceListView;
