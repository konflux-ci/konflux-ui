import React from 'react';
import {
  Stack,
  StackItem,
  Content,
  Alert,
  AlertVariant,
  Button,
  ButtonType,
  ButtonVariant,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalVariant,
} from '@patternfly/react-core';
import { K8sQueryDeleteResource } from '../../k8s';
import { RoleBindingModel } from '../../models';
import { RoleBinding } from '../../types';
import { RawComponentProps } from '../modal/createModalLauncher';

type Props = RawComponentProps & {
  rb: RoleBinding;
  username: string;
};

export const RevokeAccessModal: React.FC<React.PropsWithChildren<Props>> = ({
  rb,
  username,
  onClose,
  modalProps,
}) => {
  const [error, setError] = React.useState<string>();
  const [submitting, setSubmitting] = React.useState(false);
  const handleSubmit = React.useCallback(
    async (e) => {
      e.preventDefault();
      setSubmitting(true);
      setError(null);
      try {
        await K8sQueryDeleteResource({
          model: RoleBindingModel,
          queryOptions: {
            name: rb.metadata.name,
            ns: rb.metadata.namespace,
          },
        });
        onClose(null, { submitClicked: true });
      } catch (err) {
        setError((err as { message: string }).message || (err.toString() as string));
      }
    },
    [onClose, rb],
  );

  const { isOpen, onClose: handleClose, appendTo, title, titleIconVariant } = modalProps || {};

  return (
    <Modal isOpen={isOpen} onClose={handleClose} appendTo={appendTo} variant={ModalVariant.small}>
      <ModalHeader title={title} titleIconVariant={titleIconVariant} />
      <ModalBody>
        <Stack hasGutter>
          <StackItem>
            <Content>
              <Content component="p" data-test="description">
                The user <strong>{username}</strong> will lose access to this namespace and all of
                its applications, environments, and any other dependent items.
              </Content>
              <Content component="p">You can always grant the user access later.</Content>
            </Content>
          </StackItem>
          <StackItem>
            {error && (
              <Alert isInline variant={AlertVariant.danger} title="An error occurred">
                {error}
              </Alert>
            )}
          </StackItem>
        </Stack>
      </ModalBody>
      <ModalFooter>
        <Button
          type={ButtonType.submit}
          variant={ButtonVariant.danger}
          isLoading={submitting}
          onClick={handleSubmit}
          isDisabled={submitting}
          data-test="revoke-access"
        >
          Revoke
        </Button>
        <Button
          variant={ButtonVariant.link}
          onClick={() => onClose(null, { submitClicked: false })}
        >
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};
