import React from 'react';
import { useParams } from 'react-router-dom';
import {
  TextContent,
  Text,
  TextVariants,
  PageSection,
  PageSectionVariants,
  Bullseye,
  Spinner,
  EmptyStateBody,
  Button,
} from '@patternfly/react-core';
import { SortByDirection } from '@patternfly/react-table';
import emptyStateImgUrl from '../../../assets/secret.svg';
import { useComponent } from '../../../hooks/useComponents';
import { useLinkedSecrets } from '../../../hooks/useLinkedSecrets';
import { useSearchParam } from '../../../hooks/useSearchParam';
import { useSortedResources } from '../../../hooks/useSortedResources';
import { HttpError } from '../../../k8s/error';
import {
  COMPONENT_DETAILS_PATH,
  COMPONENT_LIST_PATH,
  COMPONENT_LINKED_SECRETS_PATH,
} from '../../../routes/paths';
import { RouterParams } from '../../../routes/utils';
import { Table } from '../../../shared/components';
import AppEmptyState from '../../../shared/components/empty-state/AppEmptyState';
import ErrorEmptyState from '../../../shared/components/empty-state/ErrorEmptyState';
import FilteredEmptyState from '../../../shared/components/empty-state/FilteredEmptyState';
import { useNamespace } from '../../../shared/providers/Namespace';
import { SecretKind } from '../../../types';
import { useApplicationBreadcrumbs } from '../../../utils/breadcrumb-utils';
import PageLayout from '../../PageLayout/PageLayout';
import getListHeader, { SortableHeaders } from './LinkedSecretsListHeader';
import { LinkedSecretsListRow } from './LinkedSecretsListRow';
import { LinkedSecretsToolbar } from './LinkedSecretsToolbar';

const sortPaths: Record<SortableHeaders, string> = {
  [SortableHeaders.secretName]: 'metadata.name',
  [SortableHeaders.type]: 'type',
};

export const LinkedSecretsListView: React.FC = () => {
  const { componentName, applicationName } = useParams<RouterParams>();
  const namespace = useNamespace();
  const applicationBreadcrumbs = useApplicationBreadcrumbs();
  const [component, componentLoaded, componentError] = useComponent(namespace, componentName);
  const [activeSortIndex, setActiveSortIndex] = React.useState<number>(SortableHeaders.secretName);
  const [activeSortDirection, setActiveSortDirection] = React.useState<SortByDirection>(
    SortByDirection.asc,
  );
  const [linkedSecrets, linkedSecretsLoaded, linkedSecretsError] = useLinkedSecrets(
    namespace,
    componentName,
  );

  const [nameFilter, setNameFilter] = useSearchParam('name', '');

  const onClearFilters = () => {
    setNameFilter('');
  };

  const LinkedSecretsListHeader = React.useMemo(
    () =>
      getListHeader(activeSortIndex, activeSortDirection, (_, index, direction) => {
        setActiveSortIndex(index);
        setActiveSortDirection(direction);
      }),
    [activeSortDirection, activeSortIndex],
  );

  const sortedLinkedSecrets = useSortedResources(
    linkedSecrets,
    activeSortIndex,
    activeSortDirection,
    sortPaths,
  );

  const filteredLinkedSecrets = React.useMemo(
    () =>
      sortedLinkedSecrets?.filter((linkedSecret) => {
        return !nameFilter || linkedSecret.metadata.name.includes(nameFilter);
      }),
    [sortedLinkedSecrets, nameFilter],
  );

  if (!componentLoaded || !linkedSecretsLoaded) {
    return (
      <Bullseye>
        <Spinner data-test="spinner" />
      </Bullseye>
    );
  }

  if (componentError || linkedSecretsError) {
    const error = componentError ?? linkedSecretsError;
    const httpError = HttpError.fromCode((error as { code: number }).code);
    return (
      <ErrorEmptyState
        data-test="linked-secrets-list-view_error-empty-state"
        httpError={httpError}
        title="Unable to load linked secrets"
        body={httpError?.message.length ? httpError?.message : 'Something went wrong'}
      />
    );
  }

  const EmptyMessage = () => (
    <FilteredEmptyState
      onClearFilters={onClearFilters}
      data-test="linked-secrets-list-view_filtered-empty-state"
    />
  );

  const NoDataEmptyMessage = () => (
    <AppEmptyState
      emptyStateImg={emptyStateImgUrl}
      title="No linked secrets found"
      data-test="linked-secrets-list-no-data-empty-message"
    >
      <EmptyStateBody>
        To get started, select link secrets to link already existing secrets
      </EmptyStateBody>
      <Button
        variant="primary"
        // TODO: the "link secrets" functionality will be implemented in another ticket
        // eslint-disable-next-line no-alert
        onClick={() => alert('TODO')}
        style={{ marginTop: 'var(--pf-v5-global--spacer--md)' }}
      >
        Link secrets
      </Button>
    </AppEmptyState>
  );

  return (
    <>
      <PageLayout
        title="Manage linked secrets"
        description={<>You can add new secrets to this component or unlink existing secrets.</>}
        breadcrumbs={[
          ...applicationBreadcrumbs,
          {
            path: COMPONENT_LIST_PATH.createPath({
              workspaceName: namespace,
              applicationName,
            }),
            name: 'components',
          },
          {
            path: COMPONENT_DETAILS_PATH.createPath({
              workspaceName: namespace,
              applicationName,
              componentName,
            }),
            name: component.metadata.name,
          },
          {
            path: COMPONENT_LINKED_SECRETS_PATH.createPath({
              workspaceName: namespace,
              applicationName,
              componentName,
            }),
            name: 'Manage linked secrets',
          },
        ]}
      >
        <PageSection variant={PageSectionVariants.light} isFilled>
          <TextContent>
            <Text component={TextVariants.p}>Linked secrets</Text>
          </TextContent>

          <Table
            virtualize={false}
            data={filteredLinkedSecrets}
            unfilteredData={sortedLinkedSecrets}
            Toolbar={<LinkedSecretsToolbar />}
            EmptyMsg={EmptyMessage}
            NoDataEmptyMsg={NoDataEmptyMessage}
            aria-label="Linked Secrets List"
            Header={LinkedSecretsListHeader}
            Row={LinkedSecretsListRow}
            loaded={linkedSecretsLoaded}
            getRowProps={(obj: SecretKind) => ({
              id: `${obj.metadata.name}-linked-secrets-list-item`,
              'aria-label': obj.metadata.name,
            })}
          />
        </PageSection>
      </PageLayout>
    </>
  );
};
