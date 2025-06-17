import * as React from 'react';
import { ModalVariant } from '@patternfly/react-core';
import { Formik } from 'formik';
import { ComponentProps, createModalLauncher } from '../../modal/createModalLauncher';
import { SecretSelector } from './SecretSelector';
import './LinkSecret.scss';

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
          <div className="link-secret">
            <SecretSelector onClose={onReset} />
          </div>
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
