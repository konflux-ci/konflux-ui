import * as React from 'react';
import { Link } from 'react-router-dom';
import {
  Bullseye,
  Button,
  Divider,
  EmptyStateActions,
  EmptyStateBody,
  InputGroup,
  InputGroupItem,
  Spinner,
  TextInput,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
} from '@patternfly/react-core';
import { FilterIcon } from '@patternfly/react-icons/dist/esm/icons';
import { USER_ACCESS_GRANT_PAGE } from '@routes/paths';
import emptyStateImgUrl from '../../assets/Integration-test.svg';
import { useRoleBindings } from '../../hooks/useRoleBindings';
import { useSearchParam } from '../../hooks/useSearchParam';
import { RoleBindingModel } from '../../models';
import { Table } from '../../shared';
import AppEmptyState from '../../shared/components/empty-state/AppEmptyState';
import FilteredEmptyState from '../../shared/components/empty-state/FilteredEmptyState';
import { useNamespace } from '../../shared/providers/Namespace';
import { RoleBinding } from '../../types';
import { useAccessReviewForModel } from '../../utils/rbac';
import { ButtonWithAccessTooltip } from '../ButtonWithAccessTooltip';
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
  const [usernameFilter, setUsernameFilter, clearFilters] = useSearchParam('name', '');
  const [roleBindings, loaded] = useRoleBindings(namespace);

  const filterRBs = React.useMemo(
    () =>
      roleBindings.filter((rb) =>
        rb.subjects.some((subject) =>
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
      <Toolbar usePageInsets clearAllFilters={clearFilters}>
        <ToolbarContent className="pf-v5-u-pl-0">
          <ToolbarGroup align={{ default: 'alignLeft' }}>
            <ToolbarItem>
              <InputGroup>
                <InputGroupItem>
                  <Button variant="control">
                    <FilterIcon /> All usernames
                  </Button>
                </InputGroupItem>
                <InputGroupItem isFill>
                  <TextInput
                    name="nameInput"
                    data-test="name-input-filter"
                    type="search"
                    aria-label="username filter"
                    placeholder="Search by username..."
                    onChange={(_ev, name) => setUsernameFilter(name)}
                    value={usernameFilter}
                  />
                </InputGroupItem>
              </InputGroup>
            </ToolbarItem>
            <ToolbarItem>
              <ButtonWithAccessTooltip
                variant="primary"
                component={(props) => (
                  <Link
                    {...props}
                    to={USER_ACCESS_GRANT_PAGE.createPath({ workspaceName: namespace })}
                  />
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
            </ToolbarItem>
          </ToolbarGroup>
        </ToolbarContent>
      </Toolbar>
      <Divider style={{ background: 'white', paddingTop: 'var(--pf-v5-global--spacer--md)' }} />
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
        <FilteredEmptyState onClearFilters={clearFilters} />
      )}
    </>
  );
};
