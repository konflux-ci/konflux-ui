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
  ModalFooter,
  ModalVariant,
  Select,
  SelectList,
  SelectOption,
  Spinner,
  Content,
} from '@patternfly/react-core';
import textStyles from '@patternfly/react-styles/css/utilities/Text/text.mjs';
import { useRoleMap } from '~/hooks/useRole';
import type { RoleBinding } from '~/types';
import { ButtonWithAccessTooltip } from '../ButtonWithAccessTooltip';
import { splitRowKey } from './userAccessTableRows';
import './UserAccess.scss';

const getRoleRefWeight = (
  roleRefName: string | undefined,
  roleRefWeights: Record<string, number>,
): number | undefined => {
  if (!roleRefName) {
    return undefined;
  }
  const weight = roleRefWeights[roleRefName];
  return weight === undefined ? undefined : weight;
};

const saveErrorMessage = (err: unknown): string => {
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return 'Unable to change roles. Please try again.';
};

export type UserAccessChangeRoleModalProps = {
  isOpen: boolean;
  onClose: () => void;
  selectedRowKeys: Set<string>;
  allAffectedRoleBindings: RoleBinding[];
  onSave: (newRoleRef: string) => Promise<void>;
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
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const currentRoleMap = React.useMemo(
    (): Record<string, string> => roleMap?.roleMap ?? {},
    [roleMap],
  );
  const roleRefWeights = React.useMemo(
    (): Record<string, number> => roleMap?.roleRefWeights ?? {},
    [roleMap],
  );

  const roleSelectOptions = React.useMemo(() => Object.entries(currentRoleMap), [currentRoleMap]);

  const unrankedRoleRefs = React.useMemo(() => {
    const refs = new Set<string>();
    for (const rb of allAffectedRoleBindings) {
      const roleRef = rb.roleRef?.name;
      if (roleRef && getRoleRefWeight(roleRef, roleRefWeights) === undefined) {
        refs.add(roleRef);
      }
    }
    if (
      modalSelectedRoleRef &&
      getRoleRefWeight(modalSelectedRoleRef, roleRefWeights) === undefined
    ) {
      refs.add(modalSelectedRoleRef);
    }
    return [...refs];
  }, [allAffectedRoleBindings, modalSelectedRoleRef, roleRefWeights]);

  const hasUnrankedRoles = unrankedRoleRefs.length > 0;

  const resetModalFields = () => {
    setModalSelectedRoleRef(undefined);
    setRoleSelectOpen(false);
    setSaveError(null);
  };

  const handleClose = () => {
    if (isSaving) {
      return;
    }
    onClose();
    resetModalFields();
  };

  const selectedCount = selectedRowKeys.size;

  const highestAffectedRoleWeight = React.useMemo(() => {
    const weights = allAffectedRoleBindings
      .map((rb) => getRoleRefWeight(rb.roleRef?.name, roleRefWeights))
      .filter((weight): weight is number => weight !== undefined);

    return weights.length === 0 ? undefined : Math.max(...weights);
  }, [allAffectedRoleBindings, roleRefWeights]);

  const getUserHighestRole = React.useMemo(() => {
    return (username: string): string => {
      const userRoleBindings = allAffectedRoleBindings.filter((rb) =>
        rb.subjects?.some((subject) => subject.name === username),
      );
      const allUserRoles = userRoleBindings.map((rb) => rb.roleRef.name);

      if (allUserRoles.length === 0) {
        return 'Unknown';
      }

      const highestRole = allUserRoles.reduce((max, role) => {
        const roleWeight = getRoleRefWeight(role, roleRefWeights);
        const maxWeight = getRoleRefWeight(max, roleRefWeights);
        if (roleWeight === undefined) {
          return max;
        }
        if (maxWeight === undefined) {
          return role;
        }
        return roleWeight > maxWeight ? role : max;
      }, allUserRoles[0]);

      return currentRoleMap[highestRole] ?? highestRole;
    };
  }, [allAffectedRoleBindings, currentRoleMap, roleRefWeights]);

  const isModalSaveDisabled = React.useMemo(() => {
    if (hasUnrankedRoles) {
      return true;
    }

    if (!modalSelectedRoleRef) {
      return true;
    }

    const selectedRoleWeight = getRoleRefWeight(modalSelectedRoleRef, roleRefWeights);
    if (selectedRoleWeight === undefined) {
      return true;
    }

    // One user selected -> allow downgrade
    if (selectedCount === 1) {
      return false;
    }

    if (highestAffectedRoleWeight === undefined) {
      return true;
    }

    // Downgrade exists?
    return highestAffectedRoleWeight > selectedRoleWeight;
  }, [
    hasUnrankedRoles,
    modalSelectedRoleRef,
    selectedCount,
    highestAffectedRoleWeight,
    roleRefWeights,
  ]);

  const handleSave = async () => {
    if (!modalSelectedRoleRef || isModalSaveDisabled) {
      return;
    }
    setSaveError(null);
    setIsSaving(true);
    try {
      await onSave(modalSelectedRoleRef);
      onClose();
      resetModalFields();
    } catch (err: unknown) {
      setSaveError(saveErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      title="Change role"
      aria-label="Change role"
      variant={ModalVariant.medium}
      onClose={handleClose}
      appendTo={() => document.querySelector('#hacDev-modal-container') ?? document.body}
    >
      <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }}>
        <FlexItem>
          <Content>
            Change role for {selectedCount} user{selectedCount !== 1 ? 's' : ''} (highest role
            displayed)
          </Content>
        </FlexItem>
        {hasUnrankedRoles ? (
          <FlexItem>
            <Alert variant={AlertVariant.danger} title="Unsupported roles" isInline>
              Cannot evaluate role changes for: {unrankedRoleRefs.join(', ')}. These role bindings
              reference roles that are not listed in the cluster Konflux configuration, or the
              configuration order is invalid. Update konflux-public-info or remove affected users
              before continuing.
            </Alert>
          </FlexItem>
        ) : null}
        <FlexItem>
          <Alert variant={AlertVariant.warning} title="Role change information" isInline>
            When changing access, the user will be removed from all role bindings in the current
            namespace and then added to the new role binding in the namespace. If any selected role
            binding contains multiple users, the role binding will be split and the users not
            selected will be added to the new role binding with the same role.
          </Alert>
        </FlexItem>
        <FlexItem>
          <List className="user-access-change-role-modal__user-list">
            {[...selectedRowKeys].map((rowKey) => {
              const { username, subjectKind } = splitRowKey(rowKey);

              return (
                <ListItem key={rowKey}>
                  <span className={textStyles.fontWeightBold}>
                    {username} ({subjectKind})
                  </span>
                  : {getUserHighestRole(username)}
                </ListItem>
              );
            })}
          </List>
        </FlexItem>

        <FlexItem>
          <Flex direction={{ default: 'column' }}>
            <FlexItem className="user-access-change-role-modal__role-label">
              <Content data-test="user-access-change-role-label">New role*</Content>
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
                      isDisabled={roleSelectOptions.length === 0 || isSaving}
                      isFullWidth
                    >
                      {modalSelectedRoleRef
                        ? (roleMap.roleMap[modalSelectedRoleRef] ?? modalSelectedRoleRef)
                        : 'Select a role'}
                    </MenuToggle>
                  )}
                  onSelect={(_, val) => {
                    if (typeof val === 'string') {
                      setModalSelectedRoleRef(val);
                    }
                    setRoleSelectOpen(false);
                    setSaveError(null);
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

            {saveError ? (
              <FlexItem>
                <Alert
                  variant={AlertVariant.danger}
                  title="Unable to change roles"
                  isInline
                  data-test="user-access-change-role-save-error"
                >
                  {saveError}
                </Alert>
              </FlexItem>
            ) : null}
          </Flex>
        </FlexItem>
      </Flex>
      <ModalFooter>
        {isSaving ? (
          <Button key="save" variant="primary" isDisabled isLoading>
            Save
          </Button>
        ) : (
          <ButtonWithAccessTooltip
            key="save"
            variant="primary"
            onClick={() => void handleSave()}
            isDisabled={isModalSaveDisabled}
            tooltip={
              hasUnrankedRoles
                ? 'Cannot change roles: one or more affected role bindings use a role that is not configured in this cluster.'
                : !modalSelectedRoleRef
                  ? 'No role selected. Select a role to save the changes.'
                  : 'You cannot save the changes. The selected role is not allowed to downgrade the users.'
            }
          >
            Save
          </ButtonWithAccessTooltip>
        )}
        <Button key="cancel" variant="link" onClick={handleClose} isDisabled={isSaving}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};
