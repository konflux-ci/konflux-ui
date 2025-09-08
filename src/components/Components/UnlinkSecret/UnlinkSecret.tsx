import * as React from 'react';
import { useParams } from 'react-router-dom';
import { Button, Flex, FlexItem, Text, ModalVariant, Alert } from '@patternfly/react-core';
import { RouterParams } from '@routes/utils';
import { COMMON_SECRETS_LABEL } from '~/consts/pipeline';
import { useComponent } from '~/hooks/useComponents';
import { useNamespace } from '~/shared/providers/Namespace';
import { SecretKind } from '~/types';
import { ComponentProps, createModalLauncher } from '../../modal/createModalLauncher';
import { unLinkSecretFromBuildServiceAccount } from '../../Secrets/utils/service-account-utils';

type UnlinkSecretModalProps = ComponentProps & {
  secret: SecretKind;
};

export const UnlinkSecret: React.FC<React.PropsWithChildren<UnlinkSecretModalProps>> = ({
  onClose,
  secret,
}) => {
  const namespace = useNamespace();
  const { componentName } = useParams<RouterParams>();
  const [component, compLoaded, compError] = useComponent(namespace, componentName);
  const isCommonSecret = secret?.metadata?.labels?.[COMMON_SECRETS_LABEL] === 'true';

  const handleSubmit = () => {
    unLinkSecretFromBuildServiceAccount(secret, component)
      .then()
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.warn(err);
      });
    onClose(null, { submitClicked: false });
  };

  return (
    <Flex direction={{ default: 'column' }}>
      <FlexItem>
        <Text component="p">
          <strong>{secret?.metadata?.name}</strong> will be unlinked from{' '}
          <strong>{component?.metadata?.name}</strong>
        </Text>
      </FlexItem>
      {isCommonSecret && (
        <FlexItem>
          <Text>
            <strong>Note:</strong> This is a common secret. Unlinking will remove its common secret
            label and prevent automatic linking to new components.
          </Text>
        </FlexItem>
      )}
      {compError && (
        <FlexItem>
          <Alert variant="danger" title="Unable to load component" isInline />
        </FlexItem>
      )}
      <Flex gap={{ default: 'gapSm' }}>
        <FlexItem>
          <Button
            variant="primary"
            onClick={handleSubmit}
            isDisabled={!secret || !compLoaded || !!compError}
          >
            Unlink
          </Button>
        </FlexItem>
        <FlexItem>
          <Button variant="tertiary" onClick={() => onClose(null, { submitClicked: false })}>
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
    titleIconVariant: 'warning',
  });
