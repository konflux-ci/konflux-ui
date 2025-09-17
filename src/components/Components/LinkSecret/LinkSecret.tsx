import * as React from 'react';
import { ModalVariant, Stack, StackItem } from '@patternfly/react-core';
import { Formik } from 'formik';
import { ComponentProps, createModalLauncher } from '../../modal/createModalLauncher';
import { SecretSelector } from './SecretSelector';

type LinkSecretModalProps = ComponentProps & {
  onClose: () => void;
};

export const LinkSecret: React.FC<React.PropsWithChildren<LinkSecretModalProps>> = ({
  onClose,
}) => {
  const onReset = () => {
    onClose(null, { submitClicked: false });
  };

  return (
    <Formik onSubmit={() => {}} initialValues={{ resourceName: '' }} onReset={onReset}>
      {() => {
        return (
          <Stack hasGutter={true}>
            <StackItem>
              <SecretSelector onClose={onReset} />
            </StackItem>
          </Stack>
        );
      }}
    </Formik>
  );
};

export const createLinkSecretModalLauncher = () =>
  createModalLauncher(LinkSecret, {
    'data-test': `link-secret-modal`,
    variant: ModalVariant.small,
    title: `Link Secrets?`,
  });
