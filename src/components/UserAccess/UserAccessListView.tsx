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
import emptyStateImgUrl from '../../assets/Integration-test.svg';
import { useSearchParam } from '../../hooks/useSearchParam';
import { SpaceBindingRequestModel } from '../../models';
import { Table } from '../../shared';
import AppEmptyState from '../../shared/components/empty-state/AppEmptyState';
import FilteredEmptyState from '../../shared/components/empty-state/FilteredEmptyState';
import { WorkspaceBinding } from '../../types';
import { useAccessReviewForModel } from '../../utils/rbac';
import { ButtonWithAccessTooltip } from '../ButtonWithAccessTooltip';
import { useWorkspaceInfo } from '../Workspace/useWorkspaceInfo';
import { SBRListHeader } from './SBRListHeader';
import { SBRListRow } from './SBRListRow';

const UserAccessEmptyState: React.FC<
  React.PropsWithChildren<{
    canCreateSBR: boolean;
  }>
> = ({ canCreateSBR }) => {
  const { workspace } = useWorkspaceInfo();

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
          component={(props) => <Link {...props} to={`/workspaces/${workspace}/access/grant`} />}
          isDisabled={!canCreateSBR}
          tooltip="You cannot grant access in this namespace"
          analytics={{
            link_name: 'grant-access',
            workspace,
          }}
        >
          Grant access
        </ButtonWithAccessTooltip>
      </EmptyStateActions>
    </AppEmptyState>
  );
};

export const UserAccessListView: React.FC<React.PropsWithChildren<unknown>> = () => {
  const { workspace, workspaceResource } = useWorkspaceInfo();
  const [canCreateSBR] = useAccessReviewForModel(SpaceBindingRequestModel, 'create');
  const [usernameFilter, setUsernameFilter, clearFilters] = useSearchParam('name', '');

  const filteredSBRs = React.useMemo(
    () =>
      workspaceResource?.status?.bindings?.filter((binding) =>
        binding.masterUserRecord.includes(usernameFilter.toLowerCase()),
      ),
    [usernameFilter, workspaceResource],
  );

  if (!workspaceResource) {
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  }

  if (!workspaceResource.status?.bindings?.length) {
    return <UserAccessEmptyState canCreateSBR={canCreateSBR} />;
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
                  <Link {...props} to={`/workspaces/${workspace}/access/grant`} />
                )}
                isDisabled={!canCreateSBR}
                tooltip="You cannot grant access in this namespace"
                analytics={{
                  link_name: 'grant-access',
                  workspace,
                }}
              >
                Grant access
              </ButtonWithAccessTooltip>
            </ToolbarItem>
          </ToolbarGroup>
        </ToolbarContent>
      </Toolbar>
      <Divider style={{ background: 'white', paddingTop: 'var(--pf-v5-global--spacer--md)' }} />
      {filteredSBRs.length ? (
        <Table
          data={filteredSBRs}
          aria-label="User access list"
          Header={SBRListHeader}
          Row={SBRListRow}
          loaded
          getRowProps={(obj: WorkspaceBinding) => ({
            id: obj.masterUserRecord,
          })}
        />
      ) : (
        <FilteredEmptyState onClearFilters={clearFilters} />
      )}
    </>
  );
};
