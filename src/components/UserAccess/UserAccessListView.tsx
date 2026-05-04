import * as React from 'react';
import { Link } from 'react-router-dom';
import {
  Bullseye,
  Divider,
  EmptyStateActions,
  EmptyStateBody,
  Flex,
  MenuToggle,
  Select,
  SelectList,
  SelectOption,
  Spinner,
  Text,
} from '@patternfly/react-core';
import { FilterIcon } from '@patternfly/react-icons/dist/esm/icons/filter-icon';
import { Table, TableGridBreakpoint, Tbody, Thead } from '@patternfly/react-table';
import { USER_ACCESS_GRANT_PAGE } from '@routes/paths';
import { defaultKonfluxRoleMap } from '~/__data__/role-data';
import { FilterContext } from '~/components/Filter/generic/FilterContext';
import { BaseTextFilterToolbar } from '~/components/Filter/toolbars/BaseTextFIlterToolbar';
import { getErrorState } from '~/shared/utils/error-utils';
import type { NamespaceRole } from '~/types';
import emptyStateImgUrl from '../../assets/Integration-test.svg';
import { useRoleBindings } from '../../hooks/useRoleBindings';
import { RoleBindingModel } from '../../models';
import { useDeepCompareMemoize } from '../../shared';
import AppEmptyState from '../../shared/components/empty-state/AppEmptyState';
import FilteredEmptyState from '../../shared/components/empty-state/FilteredEmptyState';
import { useNamespace } from '../../shared/providers/Namespace';
import { useAccessReviewForModel } from '../../utils/rbac';
import { ButtonWithAccessTooltip } from '../ButtonWithAccessTooltip';
import { UserAccessTableHeaderRow } from './RBListHeader';
import { UserAccessTableBodyRow } from './RBListRow';
import { splitRowKey, UserAccessChangeRoleModal } from './UserAccessChangeRoleModal';
import { createRBs, deleteRB } from './UserAccessForm/form-utils';
import {
  expandRoleBindingsToTableRows,
  filterUserAccessRows,
  type UserAccessTableRow,
} from './userAccessTableRows';

enum UserAccessFilterTypes {
  username = 'username',
  roleBindingName = 'roleBindingName',
}

const USER_ACCESS_FILTER_TYPE_LABELS: Record<UserAccessFilterTypes, string> = {
  [UserAccessFilterTypes.username]: 'Username',
  [UserAccessFilterTypes.roleBindingName]: 'Role binding',
};

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
  const [filterDropdownOpen, setFilterDropdownOpen] = React.useState(false);
  const [activeFilter, setActiveFilter] = React.useState(UserAccessFilterTypes.username);
  const filters = useDeepCompareMemoize({
    username: unparsedFilters.username ? (unparsedFilters.username as string) : '',
    roleBindingName: unparsedFilters.roleBindingName
      ? (unparsedFilters.roleBindingName as string)
      : '',
  });
  const { username: usernameFilter, roleBindingName: roleBindingNameFilter } = filters;
  const [roleBindings, loaded, error] = useRoleBindings(namespace);

  const tableRows = React.useMemo(
    () => expandRoleBindingsToTableRows(roleBindings),
    [roleBindings],
  );

  const filterRBs = React.useMemo((): UserAccessTableRow[] => {
    return filterUserAccessRows(
      tableRows,
      activeFilter === UserAccessFilterTypes.username
        ? { username: usernameFilter }
        : { roleBindingName: roleBindingNameFilter },
    );
  }, [tableRows, usernameFilter, roleBindingNameFilter, activeFilter]);

  const [selectedRowKeys, setSelectedRowKeys] = React.useState<Set<string>>(() => new Set());
  const [isChangeAccessModalOpen, setChangeAccessModalOpen] = React.useState(false);

  React.useEffect(() => {
    const allowed = new Set(filterRBs.map((row) => row.rowKey));
    setSelectedRowKeys((prev) => {
      const next = new Set<string>();
      prev.forEach((key) => {
        if (allowed.has(key)) {
          next.add(key);
        }
      });
      if (next.size === prev.size && [...prev].every((key) => next.has(key))) {
        return prev;
      }
      return next;
    });
  }, [filterRBs]);

  const onSelectAll = React.useCallback(
    (_event: React.FormEvent<HTMLInputElement>, isSelecting: boolean) => {
      setSelectedRowKeys((prev) => {
        const next = new Set(prev);
        if (isSelecting) {
          filterRBs.forEach((row) => next.add(row.rowKey));
        } else {
          filterRBs.forEach((row) => next.delete(row.rowKey));
        }
        return next;
      });
    },
    [filterRBs],
  );

  const onSelectRow = React.useCallback((rowKey: string, isSelected: boolean) => {
    setSelectedRowKeys((prev) => {
      const next = new Set(prev);
      if (isSelected) {
        next.add(rowKey);
      } else {
        next.delete(rowKey);
      }
      return next;
    });
  }, []);

  const getUniqueSelectedUsers = React.useCallback(() => {
    const allSelectedUsers = [...selectedRowKeys].map((rowKey) => splitRowKey(rowKey).username);
    return new Set(allSelectedUsers);
  }, [selectedRowKeys]);

  const getAllAffectedRoleBindings = React.useCallback(() => {
    return roleBindings.filter((rb) => {
      return rb.subjects?.some((subject) => getUniqueSelectedUsers().has(subject.name));
    });
  }, [roleBindings, getUniqueSelectedUsers]);

  const handleModalSave = async (newRoleRef: string) => {
    const newRole = defaultKonfluxRoleMap.roleMap[newRoleRef];

    const uniqueSelectedUsers = getUniqueSelectedUsers();
    const allAffectedRoleBindings = getAllAffectedRoleBindings();

    // Users on multi-subject bindings who were not selected must keep their current role
    const notSelectedUsersFromMultiSubjectRbs = allAffectedRoleBindings
      .filter((rb) => rb.subjects?.length > 1)
      .flatMap((rb) => {
        const currentRole = defaultKonfluxRoleMap.roleMap[rb.roleRef.name];
        return (
          rb.subjects
            ?.filter((subject) => !uniqueSelectedUsers.has(subject.name))
            .map((subject): [string, NamespaceRole] => [subject.name, currentRole]) ?? []
        );
      });
    // console.log('notSelectedUsersFromMultiSubjectRbs', notSelectedUsersFromMultiSubjectRbs);

    const applyChange = async (dryRun?: boolean) => {
      // Delete all affected RBs, dryRun doesn't affect deleteRB (always deleted)
      if (!dryRun) {
        await Promise.all(allAffectedRoleBindings.map((rb) => deleteRB(rb, dryRun)));
      }

      // Create new role bindings for the selected users
      const newRoleBindings = await createRBs(
        { usernames: [...uniqueSelectedUsers], role: newRole, roleMap: defaultKonfluxRoleMap },
        namespace,
        dryRun,
      );
      // eslint-disable-next-line no-console
      console.log('newRoleBindings', newRoleBindings);

      // Recreate RBs from multi-subject RBs that should not be affected
      const preservedRoleBindings = [];
      for (const [username, preservedRole] of notSelectedUsersFromMultiSubjectRbs) {
        preservedRoleBindings.push(
          await createRBs(
            {
              usernames: [username],
              role: preservedRole,
              roleMap: defaultKonfluxRoleMap,
            },
            namespace,
            dryRun,
          ),
        );
      }
      // console.log('preservedRoleBindings', preservedRoleBindings);
    };

    try {
      await applyChange(true);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log('error while applying change in UserAccessListView', err);
    }

    // const newRoleBindings = await editRB({usernames: ["userb"], role: newRole, roleMap: defaultKonfluxRoleMap}, roleBindings[3], true);
    // console.log('newRoleBindings', newRoleBindings);
    // const newRoleBindings = await editRB({usernames: ["1pepik"], role: newRole, roleMap: defaultKonfluxRoleMap}, roleBindings[1], true);
    // console.log('newRoleBindings', newRoleBindings);
  };

  const selectedCount = selectedRowKeys.size;
  const allVisibleSelected =
    filterRBs.length > 0 && filterRBs.every((r) => selectedRowKeys.has(r.rowKey));

  const errorState = getErrorState(error, loaded, 'role bindings');
  if (errorState) {
    return errorState;
  }

  if (!loaded) {
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  }

  if (!roleBindings.length) {
    return <UserAccessEmptyState canCreateRB={canCreateRB} />;
  }

  return (
    <>
      <Flex spaceItems={{ default: 'spaceItemsNone' }}>
        <Select
          toggle={(toggleRef) => (
            <MenuToggle
              ref={toggleRef}
              icon={<FilterIcon />}
              data-test="user-access-list-filter-dropdown"
              isExpanded={filterDropdownOpen}
              onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
            >
              {USER_ACCESS_FILTER_TYPE_LABELS[activeFilter]}
            </MenuToggle>
          )}
          onSelect={(_, val) => {
            const newFilter = val as string;
            setActiveFilter(newFilter as UserAccessFilterTypes);
            setFilters({ ...unparsedFilters, [activeFilter]: '', [newFilter]: '' });
            setFilterDropdownOpen(false);
          }}
          selected={activeFilter}
          isOpen={filterDropdownOpen}
          onOpenChange={setFilterDropdownOpen}
        >
          <SelectList>
            <SelectOption
              key={UserAccessFilterTypes.username}
              value={UserAccessFilterTypes.username}
            >
              Username
            </SelectOption>
            <SelectOption
              key={UserAccessFilterTypes.roleBindingName}
              value={UserAccessFilterTypes.roleBindingName}
            >
              Role binding
            </SelectOption>
          </SelectList>
        </Select>

        <BaseTextFilterToolbar
          text={
            activeFilter === UserAccessFilterTypes.username ? usernameFilter : roleBindingNameFilter
          }
          label={activeFilter === UserAccessFilterTypes.username ? 'username' : 'role binding name'}
          setText={(value) => {
            setFilters({ ...unparsedFilters, [activeFilter]: value });
          }}
          onClearFilters={onClearFilters}
          dataTest="user-access-list-toolbar"
          noLeftPadding
        >
          <Text data-test="user-access-selected-count" component="small">
            {selectedCount} user{selectedCount !== 1 ? 's' : ''} selected
          </Text>
          <ButtonWithAccessTooltip
            variant="secondary"
            type="button"
            onClick={() => setChangeAccessModalOpen(true)}
            isDisabled={selectedCount === 0}
            tooltip="No users selected. Select at least one user to change access."
            analytics={{
              link_name: 'change-access',
              namespace,
            }}
          >
            Change access
          </ButtonWithAccessTooltip>
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
        </BaseTextFilterToolbar>
      </Flex>
      <Divider style={{ paddingTop: 'var(--pf-v5-global--spacer--md)' }} />
      {filterRBs.length ? (
        <Table
          aria-label="User access list"
          variant="compact"
          gridBreakPoint={TableGridBreakpoint.none}
        >
          <Thead>
            <UserAccessTableHeaderRow
              headerSelect={{
                isAllSelected: allVisibleSelected,
                isDisabled: filterRBs.length === 0,
                onSelectAll,
              }}
            />
          </Thead>
          <Tbody>
            {filterRBs.map((row, rowIndex) => (
              <UserAccessTableBodyRow
                key={row.rowKey}
                obj={row}
                rowIndex={rowIndex}
                isSelected={selectedRowKeys.has(row.rowKey)}
                onSelectRow={onSelectRow}
              />
            ))}
          </Tbody>
        </Table>
      ) : (
        <FilteredEmptyState onClearFilters={() => onClearFilters()} />
      )}
      <UserAccessChangeRoleModal
        isOpen={isChangeAccessModalOpen}
        onClose={() => setChangeAccessModalOpen(false)}
        selectedRowKeys={selectedRowKeys}
        allAffectedRoleBindings={getAllAffectedRoleBindings()}
        onSave={(newRoleRef) => handleModalSave(newRoleRef)}
      />
    </>
  );
};
