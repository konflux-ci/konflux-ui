import React from 'react';
import { Link } from 'react-router-dom';
import { Bullseye, EmptyStateBody, Spinner } from '@patternfly/react-core';
import { SECRET_CREATE_PATH } from '@routes/paths';
import { FilterContext } from '~/components/Filter/generic/FilterContext';
import { BaseTextFilterToolbar } from '~/components/Filter/toolbars/BaseTextFIlterToolbar';
import { HttpError } from '~/k8s/error';
import { useDeepCompareMemoize } from '~/shared';
import ErrorEmptyState from '~/shared/components/empty-state/ErrorEmptyState';
import secretEmptyStateIcon from '../../../assets/secret.svg';
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

  const [secrets, secretsLoaded, error] = useSecrets(namespace, true);
  const { filters: unparsedFilters, setFilters, onClearFilters } = React.useContext(FilterContext);
  const filters = useDeepCompareMemoize({
    name: unparsedFilters.name ? (unparsedFilters.name as string) : '',
  });
  const { name: nameFilter } = filters;
  const [canCreateRemoteSecret] = useAccessReviewForModel(SecretModel, 'create');

  const filteredRemoteSecrets = React.useMemo(() => {
    // apply name filter
    return nameFilter ? secrets.filter((s) => s.metadata.name.indexOf(nameFilter) !== -1) : secrets;
  }, [secrets, nameFilter]);

  const createSecretButton = React.useMemo(() => {
    return (
      <ButtonWithAccessTooltip
        component={(props) => (
          <Link {...props} to={SECRET_CREATE_PATH.createPath({ workspaceName: namespace })} />
        )}
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

  if (!secretsLoaded) {
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  }

  if (error || secrets === undefined) {
    const httpError = HttpError.fromCode(error ? (error as { code: number }).code : 404);
    return (
      <ErrorEmptyState
        httpError={httpError}
        title="Unable to load secrets"
        body={httpError?.message.length ? httpError?.message : 'Something went wrong'}
      />
    );
  }

  if (secrets.length === 0) return emptyState;

  return (
    <>
      <BaseTextFilterToolbar
        text={nameFilter}
        label="name"
        setText={(name) => setFilters({ name })}
        onClearFilters={onClearFilters}
        dataTest="secrets-list-toolbar"
      >
        {createSecretButton}
      </BaseTextFilterToolbar>
      {filteredRemoteSecrets.length === 0 ? (
        <FilteredEmptyState onClearFilters={() => onClearFilters()} />
      ) : (
        <SecretsList secrets={filteredRemoteSecrets} />
      )}
    </>
  );
};
export default SecretsListView;
