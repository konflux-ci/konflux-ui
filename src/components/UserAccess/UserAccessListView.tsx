import * as React from 'react';
import { Link } from 'react-router-dom';
import {
  Alert,
  AlertVariant,
  Bullseye,
  Button,
  capitalize,
  Divider,
  EmptyStateActions,
  EmptyStateBody,
  Flex,
  FlexItem,
  List,
  ListItem,
  MenuToggle,
  Modal,
  ModalVariant,
  Select,
  SelectList,
  SelectOption,
  Spinner,
  Text,
} from '@patternfly/react-core';
import { FilterIcon } from '@patternfly/react-icons/dist/esm/icons/filter-icon';
import textStyles from '@patternfly/react-styles/css/utilities/Text/text.mjs';
import { Table, TableGridBreakpoint, Tbody, Thead } from '@patternfly/react-table';
import { USER_ACCESS_GRANT_PAGE } from '@routes/paths';
// import { mockRoleBindingsWithMultipleUsers } from '~/__data__/rolebinding-data';
import { FilterContext } from '~/components/Filter/generic/FilterContext';
import { BaseTextFilterToolbar } from '~/components/Filter/toolbars/BaseTextFIlterToolbar';
import { getErrorState } from '~/shared/utils/error-utils';
import emptyStateImgUrl from '../../assets/Integration-test.svg';
import { useRoleMap } from '../../hooks/useRole';
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

const KONFLUX_ROLE_ORDER: Record<string, number> = {
  'konflux-admin-user-actions': 3,
  'konflux-maintainer-user-actions': 2,
  'konflux-contributor-user-actions': 1,
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
  const [isChangeAccessModalOpen, setChangeAccessModalOpen] = React.useState(false);
  const [roleMap, roleMapLoaded] = useRoleMap();
  const [isRoleSelectOpen, setRoleSelectOpen] = React.useState(false);
  const [modalSelectedRoleRef, setModalSelectedRoleRef] = React.useState<string | undefined>();

  const roleSelectOptions = React.useMemo(
    () => Object.entries(roleMap?.roleMap ?? {}).sort(([a], [b]) => a.localeCompare(b)),
    [roleMap],
  );

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

  const handleModalClose = () => {
    setChangeAccessModalOpen(false);
    setModalSelectedRoleRef(undefined);
    setRoleSelectOpen(false);
  };

  const handleModalSave = () => {
    // console.log('modal save');
    // console.log('selectedRowKeys', [...selectedRowKeys]);
    handleModalClose();

    // Row-key format: roleRefName__index__SubjectKind__subjectName
  };

  const selectedCount = selectedRowKeys.size;
  const allVisibleSelected =
    filterRBs.length > 0 && filterRBs.every((r) => selectedRowKeys.has(r.rowKey));

  const splitRowKey = (rowKey: string) => {
    const segments = rowKey.split('__');
    return {
      roleRefName: segments[0],
      roleName: segments[0].split('-')[1],
      index: segments[1],
      role: segments[2],
      name: segments[3],
    };
  };

  const isModalSaveDisabled = React.useMemo(() => {
    if (!modalSelectedRoleRef) {
      return true;
    }

    const selectedRoleWeight = KONFLUX_ROLE_ORDER[modalSelectedRoleRef];
    if (selectedRoleWeight === undefined) {
      return true;
    }

    // Readabilty
    const downgradeExists = [...selectedRowKeys].some((rowKey) => {
      const { roleRefName } = splitRowKey(rowKey);
      const currentRoleWeight = KONFLUX_ROLE_ORDER[roleRefName];
      return currentRoleWeight !== undefined && currentRoleWeight > selectedRoleWeight;
    });

    return downgradeExists;
  }, [modalSelectedRoleRef, selectedRowKeys]);

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
      <Modal
        isOpen={isChangeAccessModalOpen}
        title="Change role"
        variant={ModalVariant.medium}
        onClose={handleModalClose}
        appendTo={() => document.querySelector('#hacDev-modal-container') ?? document.body}
        actions={[
          <ButtonWithAccessTooltip
            key="save"
            variant="primary"
            onClick={handleModalSave}
            isDisabled={isModalSaveDisabled}
            tooltip={
              !modalSelectedRoleRef
                ? 'No role selected. Select a role to save the changes.'
                : 'You cannot save the changes. The selected role is not allowed to downgrade the users.'
            }
          >
            Save
          </ButtonWithAccessTooltip>,
          <Button key="cancel" variant="link" onClick={handleModalClose}>
            Cancel
          </Button>,
        ]}
      >
        <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }}>
          <FlexItem>
            <Text>
              Change role for {selectedCount} user{selectedCount !== 1 ? 's' : ''}
            </Text>
          </FlexItem>
          <FlexItem>
            <Alert variant={AlertVariant.info} title="Role information" isInline>
              TODO: Add role changes information here.
            </Alert>
          </FlexItem>
          <FlexItem>
            <List style={{ marginLeft: 'var(--pf-v5-global--spacer--md)' }}>
              {[...selectedRowKeys].map((rowKey) => {
                const { name: username, role, roleName: currentRoleName } = splitRowKey(rowKey);

                return (
                  <ListItem key={rowKey}>
                    <span className={textStyles.fontWeightBold}>
                      {username} ({role})
                    </span>
                    : {capitalize(currentRoleName)}
                  </ListItem>
                );
              })}
            </List>
          </FlexItem>

          <FlexItem>
            <Flex direction={{ default: 'column' }}>
              <FlexItem style={{ marginBottom: 'var(--pf-v5-global--spacer--xs)' }}>
                <Text data-test="user-access-change-role-label">New role*</Text>
              </FlexItem>
              <FlexItem>
                {roleMapLoaded && roleMap ? (
                  <Select
                    toggle={(toggleRef) => (
                      <MenuToggle
                        ref={toggleRef}
                        data-test="user-access-change-role-select"
                        isExpanded={isRoleSelectOpen}
                        onClick={() => setRoleSelectOpen(!isRoleSelectOpen)}
                        isDisabled={roleSelectOptions.length === 0}
                        isFullWidth
                      >
                        {modalSelectedRoleRef
                          ? roleMap.roleMap[modalSelectedRoleRef] ?? modalSelectedRoleRef
                          : 'Select a role'}
                      </MenuToggle>
                    )}
                    onSelect={(_, val) => {
                      setModalSelectedRoleRef(val as string);
                      setRoleSelectOpen(false);
                    }}
                    selected={modalSelectedRoleRef}
                    isOpen={isRoleSelectOpen}
                    onOpenChange={setRoleSelectOpen}
                  >
                    <SelectList>
                      {roleSelectOptions.map(([refName, displayName]) => (
                        <SelectOption key={refName} value={refName}>
                          {displayName}
                        </SelectOption>
                      ))}
                    </SelectList>
                  </Select>
                ) : (
                  <Spinner size="sm" />
                )}
              </FlexItem>
            </Flex>
          </FlexItem>
          {/* <FlexItem>
          <Alert title="Tasks running in background" variant={AlertVariant.warning} isInline>
            <p>Please keep this window open while we link secrets to the service accounts.</p>
          </Alert>
          </FlexItem> */}
        </Flex>
      </Modal>
    </>
  );
};
