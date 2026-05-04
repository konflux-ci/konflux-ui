import * as React from 'react';
import {
  Alert,
  AlertVariant,
  Button,
  capitalize,
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
import textStyles from '@patternfly/react-styles/css/utilities/Text/text.mjs';
import type { RoleBinding } from '~/types';
import { KONFLUX_ROLE_WEIGHT } from '../../__data__/role-data';
import { useRoleMap } from '../../hooks/useRole';
import { ButtonWithAccessTooltip } from '../ButtonWithAccessTooltip';

export const splitRowKey = (
  rowKey: string,
): {
  roleRefName: string;
  roleName: string;
  index: string;
  role: string;
  username: string;
} => {
  const segments = rowKey.split('__');
  return {
    roleRefName: segments[0],
    roleName: segments[0].split('-')[1],
    index: segments[1],
    role: segments[2],
    username: segments[3],
  };
};

export type UserAccessChangeRoleModalProps = {
  isOpen: boolean;
  onClose: () => void;
  selectedRowKeys: Set<string>;
  allAffectedRoleBindings: RoleBinding[];
  onSave: (newRoleRef: string) => void;
};

export const UserAccessChangeRoleModal: React.FC<UserAccessChangeRoleModalProps> = ({
  isOpen,
  onClose,
  selectedRowKeys,
  allAffectedRoleBindings,
  onSave,
}) => {
  const [roleMap, roleMapLoaded] = useRoleMap();
  const [isRoleSelectOpen, setRoleSelectOpen] = React.useState(false);
  const [modalSelectedRoleRef, setModalSelectedRoleRef] = React.useState<string | undefined>();

  const roleSelectOptions = React.useMemo(
    () => Object.entries(roleMap?.roleMap ?? {}).sort(([a], [b]) => a.localeCompare(b)),
    [roleMap],
  );

  const handleClose = () => {
    onClose();
    setModalSelectedRoleRef(undefined);
    setRoleSelectOpen(false);
  };

  const handleSave = (newRoleRef: string) => {
    onSave(newRoleRef);
    handleClose();
  };

  const selectedCount = selectedRowKeys.size;

  const isModalSaveDisabled = React.useMemo(() => {
    // eslint-disable-next-line no-console
    console.log('allAffectedRoleBindings from modal', allAffectedRoleBindings);

    // TODO: je potreba jeste najit nejvyssi role u uzivatelu selected (mtakac - contributor by sel upravit na maintainera a prislo by se o admina)
    if (!modalSelectedRoleRef) {
      return true;
    }

    const selectedRoleWeight = KONFLUX_ROLE_WEIGHT[modalSelectedRoleRef];
    if (selectedRoleWeight === undefined) {
      return true;
    }

    // One user selected -> allow downgrade
    if (selectedCount === 1) {
      return false;
    }

    const downgradeExists = [...selectedRowKeys].some((rowKey) => {
      const { roleRefName } = splitRowKey(rowKey);
      const currentRoleWeight = KONFLUX_ROLE_WEIGHT[roleRefName];
      return currentRoleWeight !== undefined && currentRoleWeight > selectedRoleWeight;
    });

    return downgradeExists;
  }, [modalSelectedRoleRef, selectedRowKeys, selectedCount, allAffectedRoleBindings]);

  return (
    <Modal
      isOpen={isOpen}
      title="Change role"
      variant={ModalVariant.medium}
      onClose={handleClose}
      appendTo={() => document.querySelector('#hacDev-modal-container') ?? document.body}
      actions={[
        <ButtonWithAccessTooltip
          key="save"
          variant="primary"
          onClick={() => handleSave(modalSelectedRoleRef)}
          isDisabled={isModalSaveDisabled}
          tooltip={
            !modalSelectedRoleRef
              ? 'No role selected. Select a role to save the changes.'
              : 'You cannot save the changes. The selected role is not allowed to downgrade the users.'
          }
        >
          Save
        </ButtonWithAccessTooltip>,
        <Button key="cancel" variant="link" onClick={handleClose}>
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
          <Alert variant={AlertVariant.warning} title="Role change information" isInline>
            When changing access, the user will be removed from all role bindings from current
            namespace and then added to the new role binding. If any role rinding remains empty, it
            will be deleted.
          </Alert>
        </FlexItem>
        <FlexItem>
          <List style={{ marginLeft: 'var(--pf-v5-global--spacer--md)' }}>
            {[...selectedRowKeys].map((rowKey) => {
              const { username, role, roleName: currentRoleName } = splitRowKey(rowKey);

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
      </Flex>
    </Modal>
  );
};
