import * as React from 'react';
import { useParams } from 'react-router-dom';
import { Alert, Button, Flex, FlexItem, Content, ModalVariant } from '@patternfly/react-core';
import { RouterParams } from '@routes/utils';
import { ComponentProps, createModalLauncher } from '~/components/modal/createModalLauncher';
import { COMMON_SECRETS_LABEL } from '~/consts/pipeline';
import { useNamespace } from '~/shared/providers/Namespace';
import { SecretKind } from '~/types';
import { unLinkSecretFromBuildServiceAccount } from '~/utils/service-account/service-account-utils';

type UnlinkSecretModalProps = ComponentProps & {
  secret: SecretKind;
};

export const UnlinkSecret: React.FC<React.PropsWithChildren<UnlinkSecretModalProps>> = ({
  onClose,
  secret,
}) => {
  const namespace = useNamespace();
  const { componentName } = useParams<RouterParams>();
  const [submitError, setSubmitError] = React.useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const isCommonSecret = secret?.metadata?.labels?.[COMMON_SECRETS_LABEL] === 'true';

  const handleSubmit = async () => {
    setSubmitError(undefined);
    setIsSubmitting(true);
    try {
      await unLinkSecretFromBuildServiceAccount(secret, {
        metadata: { name: componentName, namespace },
      });
      onClose?.(undefined, { submitClicked: false });
    } catch (err) {
      setSubmitError((err as Error)?.message || 'Failed to unlink secret');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Flex direction={{ default: 'column' }}>
      <FlexItem>
        <Content component="p">
          <strong>{secret?.metadata?.name}</strong> will be unlinked from{' '}
          <strong>{componentName}</strong>
        </Content>
      </FlexItem>
      {isCommonSecret && (
        <FlexItem>
          <Content component="p">
            <strong>Note:</strong> This is a common secret. Unlinking will remove its common secret
            label and prevent automatic linking to new components.
          </Content>
        </FlexItem>
      )}
      {submitError && (
        <FlexItem>
          <Alert
            variant="danger"
            title="Failed to unlink secret"
            isInline
            data-test="unlink-secret-error"
          >
            {submitError}
          </Alert>
        </FlexItem>
      )}
      <Flex gap={{ default: 'gapSm' }}>
        <FlexItem>
          <Button variant="primary" onClick={handleSubmit} isDisabled={!secret || isSubmitting}>
            Unlink
          </Button>
        </FlexItem>
        <FlexItem>
          <Button variant="tertiary" onClick={() => onClose?.(undefined, { submitClicked: false })}>
            Cancel
          </Button>
        </FlexItem>
      </Flex>
    </Flex>
  );
};

export const createUnlinkSecretModalLauncher = () =>
  createModalLauncher(UnlinkSecret, {
    'data-test': `unlink-secret-modal`,
    variant: ModalVariant.small,
    title: `Unlink Secret from a Component?`,
  });
