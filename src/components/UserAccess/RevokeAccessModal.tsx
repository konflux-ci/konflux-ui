import React from 'react';
import {
  Modal,
  Stack,
  StackItem,
  TextContent,
  Text,
  Alert,
  AlertVariant,
  Button,
  ButtonType,
  ButtonVariant,
  ModalVariant,
} from '@patternfly/react-core';
import { K8sQueryDeleteResource } from '../../k8s';
import { SpaceBindingRequestModel } from '../../models';
import { WorkspaceBinding } from '../../types';
import { RawComponentProps } from '../modal/createModalLauncher';
import { invalidateWorkspaceQuery } from '../Workspace/utils';

type Props = RawComponentProps & {
  sbr: WorkspaceBinding['bindingRequest'];
  username: string;
};

export const RevokeAccessModal: React.FC<React.PropsWithChildren<Props>> = ({
  sbr,
  username,
  onClose,
  modalProps,
}) => {
  const [error, setError] = React.useState<string>();
  const [submitting, setSubmitting] = React.useState(false);
  const handleSubmit = React.useCallback(
    async (e) => {
      e.preventDefault();
      setSubmitting(false);
      setError(null);
      try {
        await K8sQueryDeleteResource({
          model: SpaceBindingRequestModel,
          queryOptions: {
            name: sbr.name,
            ns: sbr.namespace,
          },
        });
        await invalidateWorkspaceQuery();
        onClose(null, { submitClicked: true });
      } catch (err) {
        setError((err as { message: string }).message || (err.toString() as string));
      }
    },
    [onClose, sbr],
  );

  return (
    <Modal {...modalProps} variant={ModalVariant.small}>
      <Stack hasGutter>
        <StackItem>
          <TextContent>
            <Text data-test="description">
              The user <strong>{username}</strong> will lose access to this workspace and all of its
              applications, environments, and any other dependent items.
            </Text>
            <Text>You can always grant the user access later.</Text>
          </TextContent>
        </StackItem>
        <StackItem>
          {error && (
            <Alert isInline variant={AlertVariant.danger} title="An error occurred">
              {error}
            </Alert>
          )}
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
        </StackItem>
      </Stack>
    </Modal>
  );
};
