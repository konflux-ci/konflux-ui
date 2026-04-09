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
import { FilterContext } from '~/components/Filter/generic/FilterContext';
import { BaseTextFilterToolbar } from '~/components/Filter/toolbars/BaseTextFIlterToolbar';
import { getErrorState } from '~/shared/utils/error-utils';
import { textMatch } from '~/utils/text-filter-utils';
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
  // const roleBindings = mockRoleBindingsWithMultipleUsers;

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

  React.useEffect(() => {
    const allowed = new Set(filterRBs.map((r) => r.rowKey));
    setSelectedRowKeys((prev) => {
      const next = new Set<string>();
      prev.forEach((k) => {
        if (allowed.has(k)) {
          next.add(k);
        }
      });
      if (next.size === prev.size && [...prev].every((k) => next.has(k))) {
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
          filterRBs.forEach((r) => next.add(r.rowKey));
        } else {
          filterRBs.forEach((r) => next.delete(r.rowKey));
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
          {selectedCount > 0 ? (
            <Text data-test="user-access-selected-count" component="small">
              {selectedCount} selected
            </Text>
          ) : null}
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
    </>
  );
};
