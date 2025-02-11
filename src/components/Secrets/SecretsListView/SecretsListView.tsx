import React from 'react';
import { Link } from 'react-router-dom';
import {
  Bullseye,
  EmptyStateBody,
  SearchInput,
  Spinner,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from '@patternfly/react-core';
import secretEmptyStateIcon from '../../../assets/secret.svg';
import { useSearchParam } from '../../../hooks/useSearchParam';
import { useSecrets } from '../../../hooks/useSecrets';
import { SecretModel } from '../../../models';
import AppEmptyState from '../../../shared/components/empty-state/AppEmptyState';
import FilteredEmptyState from '../../../shared/components/empty-state/FilteredEmptyState';
import { useNamespace } from '../../../shared/providers/Namespace';
import { useAccessReviewForModel } from '../../../utils/rbac';
import { ButtonWithAccessTooltip } from '../../ButtonWithAccessTooltip';
import SecretsList from './SecretsList';

const SecretsListView: React.FC = () => {
  const namespace = useNamespace();

  const [secrets, secretsLoaded] = useSecrets(namespace);
  const [nameFilter, setNameFilter, unsetNameFilter] = useSearchParam('name', '');
  const [canCreateRemoteSecret] = useAccessReviewForModel(SecretModel, 'create');

  const filteredRemoteSecrets = React.useMemo(() => {
    // apply name filter
    return nameFilter ? secrets.filter((s) => s.metadata.name.indexOf(nameFilter) !== -1) : secrets;
  }, [secrets, nameFilter]);

  const createSecretButton = React.useMemo(() => {
    return (
      <ButtonWithAccessTooltip
        component={(props) => <Link {...props} to={`/workspaces/${namespace}/secrets/create`} />}
        isDisabled={!canCreateRemoteSecret}
        tooltip="You don't have access to create a secret"
        analytics={{
          link_name: 'add-secret',
          namespace,
        }}
      >
        Add secret
      </ButtonWithAccessTooltip>
    );
  }, [canCreateRemoteSecret, namespace]);

  const emptyState = (
    <AppEmptyState
      emptyStateImg={secretEmptyStateIcon}
      title="Easily manage your build and deployment secrets"
      data-test="secrets-empty-state"
    >
      <EmptyStateBody>
        A secret is a sensitive piece of information, such as a crendential, access token, API key
        or encryption key,
        <br /> used to securely access various resources or services. You can easily manage all your
        secrets from one place.
        <br />
        To get started, add a secret
      </EmptyStateBody>
      {<div className="pf-u-mt-xl">{createSecretButton}</div>}
    </AppEmptyState>
  );

  const onClearFilters = React.useCallback(() => {
    unsetNameFilter();
  }, [unsetNameFilter]);

  if (!secretsLoaded) {
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  }
  if (secrets.length === 0) return emptyState;

  return (
    <>
      <Toolbar collapseListedFiltersBreakpoint="xl" clearFiltersButtonText="Clear filters">
        <ToolbarContent className="pf-u-pl-0">
          {secrets.length > 0 ? (
            <>
              <ToolbarItem>
                <SearchInput
                  name="nameInput"
                  data-test="env-name-filter-input"
                  type="search"
                  aria-label="name filter"
                  placeholder="Search secrets"
                  value={nameFilter}
                  onChange={(_, name) => setNameFilter(name)}
                />
              </ToolbarItem>
            </>
          ) : null}
          <ToolbarItem>{createSecretButton}</ToolbarItem>
        </ToolbarContent>
      </Toolbar>
      {filteredRemoteSecrets.length === 0 ? (
        <FilteredEmptyState onClearFilters={onClearFilters} />
      ) : (
        <SecretsList secrets={filteredRemoteSecrets} />
      )}
    </>
  );
};
export default SecretsListView;
