import * as React from 'react';
import { useParams } from 'react-router-dom';
import { Button, ModalVariant } from '@patternfly/react-core';
import { Formik } from 'formik';
import { RouterParams } from '@routes/utils';
import { useComponent } from '~/hooks/useComponents';
import { useNamespace } from '~/shared/providers/Namespace';
import { ComponentKind, SecretKind } from '~/types';
import { ComponentProps, createModalLauncher } from '../modal/createModalLauncher';
import { unlinkSecretFromComponent } from './unlink-secret-utils';

type UnlinkSecretModalProps = ComponentProps & {
  secret: SecretKind;
  onClose: () => void;
};

export const UnlinkSecret: React.FC<React.PropsWithChildren<UnlinkSecretModalProps>> = ({
  onClose,
  secret,
}) => {
  const namespace = useNamespace();
  const { componentName } = useParams<RouterParams>();
  const component: ComponentKind = useComponent(namespace, componentName)[0];
  const onReset = () => {
    onClose(null, { submitClicked: false });
  };

  const handleSubmit = () => {
    unlinkSecretFromComponent(secret, component);
    onReset();
  };

  return (
    <Formik onSubmit={() => {}} initialValues={{}} onReset={onReset}>
      {() => {
        return (
          <>
            <span style={{ fontWeight: 'bold' }}>{secret?.metadata?.name}</span> will be unlinked
            from <span style={{ fontWeight: 'bold' }}>{component?.metadata?.name}</span>
            <div style={{ marginTop: '1rem' }}>
              <Button
                variant="primary"
                onClick={handleSubmit}
                isDisabled={!secret || !component}
                style={{ marginRight: '0.5rem' }}
              >
                Unlink
              </Button>
              <Button variant="tertiary" onClick={() => onReset()}>
                Cancel
              </Button>
            </div>
          </>
        );
      }}
    </Formik>
  );
};

export const createUnlinkSecretModalLauncher = () =>
  createModalLauncher(UnlinkSecret, {
    'data-test': `unlink-secret-modal`,
    variant: ModalVariant.small,
    title: `Unlink Secret from  a Component?`,
    titleIconVariant: 'warning',
  });
