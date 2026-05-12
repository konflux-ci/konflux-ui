import * as React from 'react';
import {
  Alert,
  AlertVariant,
  Button,
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
import { useRoleMap } from '~/hooks/useRole';
import type { RoleBinding } from '~/types';
import { ROLE_WEIGHT_MAP } from '~/utils/rbac';
import { ButtonWithAccessTooltip } from '../ButtonWithAccessTooltip';

export type UserAccessChangeRoleModalProps = {
  isOpen: boolean;
  onClose: () => void;
  selectedRowKeys: Set<string>;
  allAffectedRoleBindings: RoleBinding[];
  onSave: (newRoleRef: string) => void;
};

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
  const currentRoleMap = React.useMemo(() => roleMap?.roleMap ?? {}, [roleMap]);

  const roleSelectOptions = React.useMemo(() => Object.entries(currentRoleMap), [currentRoleMap]);

  const handleClose = () => {
    onClose();
    setModalSelectedRoleRef(undefined);
    setRoleSelectOpen(false);
  };

  const handleSave = () => {
    if (!modalSelectedRoleRef) {
      return;
    }
    onSave(modalSelectedRoleRef);
    handleClose();
  };

  const selectedCount = selectedRowKeys.size;

  const highestAffectedRoleWeight = React.useMemo(() => {
    const weights = allAffectedRoleBindings
      .map((rb) => ROLE_WEIGHT_MAP[currentRoleMap[rb.roleRef?.name ?? ''] ?? ''])
      .filter((weight): weight is number => weight !== undefined);

    return weights.length === 0 ? undefined : Math.max(...weights);
  }, [allAffectedRoleBindings, currentRoleMap]);

  const getUserHighestRole = React.useMemo(() => {
    const roleLabels = currentRoleMap as Record<string, string>;

    return (username: string): string => {
      const userRoleBindings = allAffectedRoleBindings.filter((rb) =>
        rb.subjects?.some((subject) => subject.name === username),
      );
      const allUserRoles = userRoleBindings.map((rb) => rb.roleRef.name);

      if (allUserRoles.length === 0) {
        return 'Unknown';
      }

      const highestRole = allUserRoles.reduce((max, role) => {
        const roleWeight = ROLE_WEIGHT_MAP[role] ?? 0;
        const maxWeight = ROLE_WEIGHT_MAP[max] ?? 0;
        return roleWeight > maxWeight ? role : max;
      }, allUserRoles[0]);

      return roleLabels[highestRole];
    };
  }, [allAffectedRoleBindings, currentRoleMap]);

  const isModalSaveDisabled = React.useMemo(() => {
    if (!modalSelectedRoleRef) {
      return true;
    }

    const selectedRoleWeight = ROLE_WEIGHT_MAP[currentRoleMap[modalSelectedRoleRef] ?? ''];
    if (selectedRoleWeight === undefined) {
      return true;
    }

    // One user selected -> allow downgrade
    if (selectedCount === 1) {
      return false;
    }

    if (highestAffectedRoleWeight === undefined) {
      return false;
    }

    // Downgrade exists?
    return highestAffectedRoleWeight > selectedRoleWeight;
  }, [modalSelectedRoleRef, selectedCount, highestAffectedRoleWeight, currentRoleMap]);

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
          onClick={() => handleSave()}
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
            Change role for {selectedCount} user{selectedCount !== 1 ? 's' : ''} (highest role
            displayed)
          </Text>
        </FlexItem>
        <FlexItem>
          <Alert variant={AlertVariant.warning} title="Role change information" isInline>
            When changing access, the user will be removed from all role bindings in the current
            namespace and then added to the new role binding in the namespace. If any selected role
            binding contains multiple users, the role binding will be split and the users not
            selected will be added to the new role binding with the same role.
          </Alert>
        </FlexItem>
        <FlexItem>
          <List style={{ marginLeft: 'var(--pf-v5-global--spacer--md)' }}>
            {[...selectedRowKeys].map((rowKey) => {
              const { username, role } = splitRowKey(rowKey);

              return (
                <ListItem key={rowKey}>
                  <span className={textStyles.fontWeightBold}>
                    {username} ({role})
                  </span>
                  : {getUserHighestRole(username)}
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
