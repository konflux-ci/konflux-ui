import * as React from 'react';
import { Link } from 'react-router-dom';
import {
  Bullseye,
  Divider,
  EmptyStateActions,
  EmptyStateBody,
  Spinner,
} from '@patternfly/react-core';
import { USER_ACCESS_GRANT_PAGE } from '@routes/paths';
import emptyStateImgUrl from '../../assets/Integration-test.svg';
import { useRoleBindings } from '../../hooks/useRoleBindings';
import { RoleBindingModel } from '../../models';
import { Table, useDeepCompareMemoize } from '../../shared';
import AppEmptyState from '../../shared/components/empty-state/AppEmptyState';
import FilteredEmptyState from '../../shared/components/empty-state/FilteredEmptyState';
import { useNamespace } from '../../shared/providers/Namespace';
import { RoleBinding } from '../../types';
import { useAccessReviewForModel } from '../../utils/rbac';
import { ButtonWithAccessTooltip } from '../ButtonWithAccessTooltip';
import { FilterContext } from '../Filter/generic/FilterContext';
import { BaseTextFilterToolbar } from '../Filter/toolbars/BaseTextFIlterToolbar';
import { RBListHeader } from './RBListHeader';
import { RBListRow } from './RBListRow';

const UserAccessEmptyState: React.FC<
  React.PropsWithChildren<{
    canCreateRB: boolean;
  }>
> = ({ canCreateRB }) => {
  const namespace = useNamespace();

  return (
    <AppEmptyState
      data-test="user-access__empty"
      emptyStateImg={emptyStateImgUrl}
      title="Grant user access"
    >
      <EmptyStateBody>
        See a list of all the users that have access to your namespace.
      </EmptyStateBody>
      <EmptyStateActions>
        <ButtonWithAccessTooltip
          variant="primary"
          component={(props) => (
            <Link {...props} to={USER_ACCESS_GRANT_PAGE.createPath({ workspaceName: namespace })} />
          )}
          isDisabled={!canCreateRB}
          tooltip="You cannot grant access in this namespace"
          analytics={{
            link_name: 'grant-access',
            namespace,
          }}
        >
          Grant access
        </ButtonWithAccessTooltip>
      </EmptyStateActions>
    </AppEmptyState>
  );
};

export const UserAccessListView: React.FC<React.PropsWithChildren<unknown>> = () => {
  const namespace = useNamespace();
  const [canCreateRB] = useAccessReviewForModel(RoleBindingModel, 'create');
  const { filters: unparsedFilters, setFilters, onClearFilters } = React.useContext(FilterContext);
  const filters = useDeepCompareMemoize({
    username: unparsedFilters.username ? (unparsedFilters.username as string) : '',
  });
  const { username: usernameFilter } = filters;
  const [roleBindings, loaded] = useRoleBindings(namespace);

  const filterRBs = React.useMemo(
    () =>
      roleBindings.filter(
        (rb) =>
          !rb.subjects ||
          rb.subjects?.some((subject) =>
            subject.name.toLowerCase().includes(usernameFilter.toLowerCase()),
          ),
      ),
    [roleBindings, usernameFilter],
  );
  if (!loaded) {
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );

    if (!filterRBs) {
      return <UserAccessEmptyState canCreateRB={canCreateRB} />;
    }
  }

  return (
    <>
      <BaseTextFilterToolbar
        text={usernameFilter}
        label="username"
        setText={(username) => setFilters({ username })}
        onClearFilters={onClearFilters}
        dataTest="user-access-list-toolbar"
      >
        <ButtonWithAccessTooltip
          variant="primary"
          component={(props) => (
            <Link {...props} to={USER_ACCESS_GRANT_PAGE.createPath({ workspaceName: namespace })} />
          )}
          isDisabled={!canCreateRB}
          tooltip="You cannot grant access in this namespace"
          analytics={{
            link_name: 'grant-access',
            namespace,
          }}
        >
          Grant access
        </ButtonWithAccessTooltip>
      </BaseTextFilterToolbar>
      <Divider style={{ paddingTop: 'var(--pf-v5-global--spacer--md)' }} />
      {filterRBs.length ? (
        <Table
          data={filterRBs}
          aria-label="User access list"
          Header={RBListHeader}
          Row={RBListRow}
          loaded
          getRowProps={(obj: RoleBinding) => ({
            id: obj.metadata.name,
          })}
        />
      ) : (
        <FilteredEmptyState onClearFilters={() => onClearFilters()} />
      )}
    </>
  );
};
