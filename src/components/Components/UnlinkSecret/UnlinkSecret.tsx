import * as React from 'react';
import { useParams } from 'react-router-dom';
import { Button, ModalVariant } from '@patternfly/react-core';
import { RouterParams } from '@routes/utils';
import { useComponent } from '~/hooks/useComponents';
import { useNamespace } from '~/shared/providers/Namespace';
import { ComponentKind, SecretKind } from '~/types';
import { ComponentProps, createModalLauncher } from '../../modal/createModalLauncher';
import { unLinkSecretFromBuildServiceAccount } from '../../Secrets/utils/service-account-utils';
import './UnlinkSecret.scss';

type UnlinkSecretModalProps = ComponentProps & {
  secret: SecretKind;
};

export const UnlinkSecret: React.FC<React.PropsWithChildren<UnlinkSecretModalProps>> = ({
  onClose,
  secret,
}) => {
  const namespace = useNamespace();
  const { componentName } = useParams<RouterParams>();
  const component: ComponentKind = useComponent(namespace, componentName)[0];

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
    <>
      <strong>{secret?.metadata?.name}</strong>
      will be unlinked from <strong>{component?.metadata?.name}</strong>
      <div>
        <Button variant="primary" onClick={handleSubmit} isDisabled={!secret || !component}>
          Unlink
        </Button>
        <Button variant="tertiary" onClick={() => onClose(null, { submitClicked: false })}>
          Cancel
        </Button>
      </div>
    </>
  );
};

export const createUnlinkSecretModalLauncher = () =>
  createModalLauncher(UnlinkSecret, {
    'data-test': `unlink-secret-modal`,
    variant: ModalVariant.small,
    title: `Unlink Secret from  a Component?`,
    titleIconVariant: 'warning',
  });
