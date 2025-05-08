import * as React from 'react';
import { ModalVariant } from '@patternfly/react-core';
import { Formik } from 'formik';
import { ComponentProps, createModalLauncher } from '../modal/createModalLauncher';
import { SecretSelector } from './SecretSelector';

type DeleteResourceModalProps = ComponentProps & {
  obj: string;
  model?: string;
  displayName?: string;
  isEntryNotRequired?: boolean;
  description?: React.ReactNode;
  submitCallback?: (obj: unknown, namespace?) => void;
};

export const LinkSecret: React.FC<React.PropsWithChildren<DeleteResourceModalProps>> = ({
  onClose,
}) => {
  const onReset = () => {
    onClose(null, { submitClicked: false });
  };

  return (
    <Formik onSubmit={() => {}} initialValues={{ resourceName: '' }} onReset={onReset}>
      {() => {
        return (
          <>
            <SecretSelector onClose={onReset} />
          </>
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
