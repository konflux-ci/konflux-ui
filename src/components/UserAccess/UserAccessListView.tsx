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
import emptyStateImgUrl from '~/assets/Integration-test.svg';
import { FilterContext } from '~/components/Filter/generic/FilterContext';
import { BaseTextFilterToolbar } from '~/components/Filter/toolbars/BaseTextFIlterToolbar';
import { useRoleMap } from '~/hooks/useRole';
import { useRoleBindings } from '~/hooks/useRoleBindings';
import { RoleBindingModel } from '~/models';
import { logger } from '~/monitoring/logger';
import { useDeepCompareMemoize } from '~/shared';
import AppEmptyState from '~/shared/components/empty-state/AppEmptyState';
import FilteredEmptyState from '~/shared/components/empty-state/FilteredEmptyState';
import { useNamespace } from '~/shared/providers/Namespace';
import { getErrorState } from '~/shared/utils/error-utils';
import type { NamespaceRole, RoleBinding } from '~/types';
import { useAccessReviewForModel } from '~/utils/rbac';
import { ButtonWithAccessTooltip } from '../ButtonWithAccessTooltip';
import { UserAccessTableHeaderRow } from './RBListHeader';
import { UserAccessTableBodyRow } from './RBListRow';
import { splitRowKey, UserAccessChangeRoleModal } from './UserAccessChangeRoleModal';
import { createRBs, deleteRB, restoreRB } from './UserAccessForm/form-utils';
import {
  expandRoleBindingsToTableRows,
  filterUserAccessRows,
  type UserAccessTableRow,
} from './userAccessTableRows';
import './UserAccess.scss';

enum UserAccessFilterTypes {
  username = 'username',
  roleBindingName = 'roleBindingName',
}

const USER_ACCESS_FILTER_TYPE_LABELS: Record<UserAccessFilterTypes, string> = {
  [UserAccessFilterTypes.username]: 'Username',
  [UserAccessFilterTypes.roleBindingName]: 'Role binding',
};

function getUniqueSelectedUsers(rowKeys: Set<string>): Set<string> {
  return new Set([...rowKeys].map((rowKey) => splitRowKey(rowKey).username));
}

function getAllAffectedRoleBindings(users: Set<string>, bindings: RoleBinding[]): RoleBinding[] {
  return bindings.filter((rb) => rb.subjects?.some((subject) => users.has(subject.name)));
}

function roleBindingHasNonUserSubject(rb: RoleBinding): boolean {
  return (rb.subjects ?? []).some((subject) => subject.kind !== 'User');
}

/** Deep clone for rollback (Jest/jsdom may not expose `structuredClone`). */
function cloneRoleBindingSnapshot(rb: RoleBinding): RoleBinding {
  return JSON.parse(JSON.stringify(rb)) as RoleBinding;
}

async function deleteBindingsBestEffort(
  bindings: RoleBinding[],
  namespace: string,
  logMessage: string,
): Promise<void> {
  await Promise.all(
    bindings.map(async (rb) => {
      try {
        await deleteRB(rb);
      } catch (rollbackErr: unknown) {
        logger.warn(logMessage, {
          namespace,
          roleBindingName: rb.metadata?.name,
          error: rollbackErr instanceof Error ? rollbackErr.message : String(rollbackErr),
        });
      }
    }),
  );
}

/** Restore in reverse deletion order so dependent bindings behave predictably. */
async function restoreBindingsBestEffort(
  snapshots: RoleBinding[],
  namespace: string,
): Promise<void> {
  for (let i = snapshots.length - 1; i >= 0; i -= 1) {
    const snap = snapshots[i];
    try {
      await restoreRB(snap);
    } catch (rollbackErr: unknown) {
      logger.warn('Failed to restore RoleBinding during rollback', {
        namespace,
        roleBindingName: snap.metadata?.name,
        error: rollbackErr instanceof Error ? rollbackErr.message : String(rollbackErr),
      });
    }
  }
}

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
  const [canDeleteRB] = useAccessReviewForModel(RoleBindingModel, 'delete');
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
  const [roleMap, roleMapLoaded] = useRoleMap();

  const currentRoleMap = React.useMemo(
    () => (roleMapLoaded && roleMap ? roleMap?.roleMap : {}),
    [roleMap, roleMapLoaded],
  );

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
          filterRBs.forEach((row) => {
            if (row.subject) {
              next.add(row.rowKey);
            }
          });
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

  const handleModalSave = React.useCallback(
    async (newRoleRef: string) => {
      const selectedUsernames = getUniqueSelectedUsers(selectedRowKeys);
      const rawBindings = getAllAffectedRoleBindings(selectedUsernames, roleBindings);

      if (rawBindings.some(roleBindingHasNonUserSubject)) {
        throw new Error(
          'Cannot change roles when a selected subject shares a role binding with a non-User subject (Group or ServiceAccount). Edit or split that role binding in the cluster, then try again.',
        );
      }

      // Filter out affected rows not requiring changes (single subject and same role)
      const usernamesSkippingTargetRoleCreate = new Set<string>();
      const toDelete = rawBindings.filter((rb) => {
        const hasSingleTargetRole = rb.subjects?.length === 1 && rb.roleRef?.name === newRoleRef;
        const username = rb.subjects?.[0]?.name;

        if (hasSingleTargetRole && username) {
          usernamesSkippingTargetRoleCreate.add(username);
        }
        return !hasSingleTargetRole;
      });

      const usernamesNeedingTargetRoleCreate = [...selectedUsernames].filter(
        (username) => !usernamesSkippingTargetRoleCreate.has(username),
      );

      const preservedFromMultiSubject = toDelete
        .filter((rb) => (rb.subjects?.length ?? 0) > 1)
        .flatMap((rb) => {
          const currentRole = currentRoleMap[rb.roleRef.name] as NamespaceRole;
          return (
            rb.subjects
              ?.filter((subject) => !selectedUsernames.has(subject.name))
              .map((subject): [string, NamespaceRole] => [subject.name, currentRole]) ?? []
          );
        });

      const newRole = currentRoleMap[newRoleRef] as NamespaceRole;
      const deletionSnapshots: RoleBinding[] = [];
      const createdBindings: RoleBinding[] = [];

      try {
        for (const rb of toDelete) {
          const snap = cloneRoleBindingSnapshot(rb);
          await deleteRB(rb);
          deletionSnapshots.push(snap);
        }

        if (usernamesNeedingTargetRoleCreate.length > 0) {
          createdBindings.push(
            ...(await createRBs(
              { usernames: usernamesNeedingTargetRoleCreate, role: newRole, roleMap },
              namespace,
            )),
          );
        }

        for (const [username, preservedRole] of preservedFromMultiSubject) {
          createdBindings.push(
            ...(await createRBs(
              { usernames: [username], role: preservedRole, roleMap },
              namespace,
            )),
          );
        }

        setSelectedRowKeys(new Set());
      } catch (err: unknown) {
        await deleteBindingsBestEffort(
          createdBindings,
          namespace,
          'Failed to delete partially created RoleBinding after user access change failure',
        );
        await restoreBindingsBestEffort(deletionSnapshots, namespace);
        logger.error(
          'Error while applying user access change in UserAccessListView',
          err instanceof Error ? err : new Error(String(err)),
          { namespace },
        );
        throw err;
      }
    },
    [currentRoleMap, namespace, roleBindings, roleMap, selectedRowKeys],
  );

  const allAffectedRoleBindingsForModal = React.useMemo(
    () => getAllAffectedRoleBindings(getUniqueSelectedUsers(selectedRowKeys), roleBindings),
    [roleBindings, selectedRowKeys],
  );

  const selectedCount = selectedRowKeys.size;

  /** Rows with a selectable checkbox (bindings without subjects are shown but cannot be selected). */
  const selectableVisibleRows = filterRBs.filter((r) => r.subject);
  const allVisibleSelected =
    selectableVisibleRows.length > 0 &&
    selectableVisibleRows.every((r) => selectedRowKeys.has(r.rowKey));

  const canModifyAllSelectedUsers = React.useMemo(() => {
    if (!canCreateRB || !canDeleteRB) {
      return false;
    }

    const selected = new Set(selectedRowKeys);
    for (const row of tableRows) {
      if (!selected.has(row.rowKey)) {
        continue;
      }
      if (!row.subject || row.subject.kind !== 'User') {
        return false;
      }
    }
    return true;
  }, [canCreateRB, canDeleteRB, selectedRowKeys, tableRows]);

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
            setFilters({
              ...unparsedFilters,
              [activeFilter]: '',
              [newFilter]: unparsedFilters[activeFilter],
            });
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
            isDisabled={selectedCount === 0 || !canModifyAllSelectedUsers}
            tooltip={
              selectedCount === 0
                ? 'No users selected. Select at least one user to change access.'
                : "You don't have permission to change access for some selected users."
            }
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
      <Divider className="user-access-list-view__toolbar-divider" />
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
                isDisabled: selectableVisibleRows.length === 0,
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
        allAffectedRoleBindings={allAffectedRoleBindingsForModal}
        onSave={handleModalSave}
      />
    </>
  );
};
