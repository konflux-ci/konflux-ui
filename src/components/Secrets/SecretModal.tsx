import * as React from 'react';
import { Button, Modal, ModalBoxBody, ModalVariant } from '@patternfly/react-core';
import { Formik } from 'formik';
import { isEmpty, merge } from 'lodash-es';
import {
  ImportSecret,
  SecretTypeDropdownLabel,
  SourceSecretType,
  BuildTimeSecret,
  CurrentComponentRef,
  ImagePullSecretType,
  SecretForComponentOption,
} from '../../types';
import { SecretFromSchema } from '../../utils/validation-utils';
import { RawComponentProps } from '../modal/createModalLauncher';
import SecretForm from './SecretForm';

import './SecretModal.scss';

const createPartnerTaskSecret = (
  secret: ImportSecret,
  onSubmit: (v: ImportSecret) => void,
  onClose: (event: KeyboardEvent | React.MouseEvent) => void,
) => {
  onSubmit && onSubmit(secret);
  onClose(null);
};

export type SecretModalValues = ImportSecret & {
  existingSecrets: BuildTimeSecret[];
};

function createEmptySecretModalValues(
  existingSecrets: BuildTimeSecret[],
  currentComponent?: null | CurrentComponentRef,
): SecretModalValues {
  const defaultKeyValues = [{ key: '', value: '', readOnlyKey: false }];
  return {
    secretName: '',
    type: SecretTypeDropdownLabel.opaque,
    opaque: {
      keyValues: defaultKeyValues,
    },
    image: {
      authType: ImagePullSecretType.ImageRegistryCreds,
      registryCreds: [
        {
          registry: '',
          username: '',
          password: '',
          email: '',
        },
      ],
      dockerconfig: '',
    },
    source: {
      authType: SourceSecretType.basic,
    },
    existingSecrets,
    currentComponent,
    relatedComponents: [],
    secretForComponentOption: SecretForComponentOption.none,
  };
}

type SecretModalProps = RawComponentProps & {
  existingSecrets: BuildTimeSecret[];
  onSubmit: (value: SecretModalValues) => void;
  currentComponent?: null | CurrentComponentRef;
  initialSecret?: Partial<ImportSecret>;
  isEdit?: boolean;
};

const SecretModal: React.FC<React.PropsWithChildren<SecretModalProps>> = ({
  modalProps,
  onSubmit,
  existingSecrets,
  currentComponent,
  initialSecret,
  isEdit = false,
}) => {
  const initialValues = React.useMemo((): SecretModalValues => {
    const defaults = createEmptySecretModalValues(existingSecrets, currentComponent);
    if (!initialSecret || Object.keys(initialSecret).length === 0) {
      return defaults;
    }
    const merged = merge({}, defaults, initialSecret) as SecretModalValues;
    merged.existingSecrets = existingSecrets;
    merged.currentComponent = currentComponent;
    return merged;
  }, [existingSecrets, currentComponent, initialSecret]);

  return (
    <Formik
      onSubmit={(v) => createPartnerTaskSecret(v, onSubmit, modalProps.onClose)}
      initialValues={initialValues}
      validationSchema={SecretFromSchema}
      // enableReinitialize
    >
      {(props) => {
        return (
          <Modal
            {...modalProps}
            title={isEdit ? 'Edit build secret' : 'Create new build secret'}
            description="Keep your data secure with a build-time secret."
            variant={ModalVariant.medium}
            data-test="build-secret-modal"
            className="build-secret-modal"
            actions={[
              <Button
                key="confirm"
                variant="primary"
                type="submit"
                onClick={() => {
                  props.handleSubmit();
                }}
                isDisabled={!props.dirty || !isEmpty(props.errors) || props.isSubmitting}
              >
                {isEdit ? 'Save' : 'Create'}
              </Button>,
              <Button key="cancel" variant="link" onClick={modalProps.onClose}>
                Cancel
              </Button>,
            ]}
          >
            <ModalBoxBody>
              <SecretForm existingSecrets={existingSecrets} currentComponent={currentComponent} />
            </ModalBoxBody>
          </Modal>
        );
      }}
    </Formik>
  );
};

export default SecretModal;
