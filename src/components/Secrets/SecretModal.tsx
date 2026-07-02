import * as React from 'react';
import {
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalVariant,
} from '@patternfly/react-core';
import { Formik, yupToFormErrors } from 'formik';
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
import { isUsingExistingClusterSecret } from '../../utils/secrets/secret-utils';
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
    labels: [{ key: '', value: '' }],
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

  const validate = React.useCallback(
    (values: SecretModalValues) => {
      const isUsingExisting = isUsingExistingClusterSecret(
        values.secretName,
        values.type,
        existingSecrets,
      );
      try {
        SecretFromSchema.validateSync(values, {
          abortEarly: false,
          context: { isUsingExisting },
        });
        return {};
      } catch (err) {
        return yupToFormErrors(err);
      }
    },
    [existingSecrets],
  );

  const { isOpen, onClose: handleClose, appendTo, ...rest } = modalProps || {};

  return (
    <Formik<SecretModalValues>
      onSubmit={(v) => createPartnerTaskSecret(v, onSubmit, handleClose)}
      initialValues={initialValues}
      validate={validate}
    >
      {(props) => {
        const isUsingExisting = isUsingExistingClusterSecret(
          props.values.secretName,
          props.values.type,
          existingSecrets,
        );
        const canSubmit =
          (props.dirty || isUsingExisting) && isEmpty(props.errors) && !props.isSubmitting;

        return (
          <Modal
            {...rest}
            isOpen={isOpen}
            onClose={handleClose}
            appendTo={appendTo}
            variant={ModalVariant.medium}
            data-test="build-secret-modal"
            className="build-secret-modal"
          >
            <ModalHeader
              title={isEdit ? 'Edit build secret' : 'Create or use new build secret'}
              description="Keep your data secure with a build-time secret."
            />
            <ModalBody>
              <SecretForm
                existingSecrets={existingSecrets}
                currentComponent={currentComponent}
                isEdit={isEdit}
              />
            </ModalBody>
            <ModalFooter>
              <Button
                key="confirm"
                variant="primary"
                type="submit"
                onClick={() => {
                  props.handleSubmit();
                }}
                isDisabled={!canSubmit}
              >
                {isEdit ? 'Save' : isUsingExisting ? 'Use' : 'Create'}
              </Button>
              <Button key="cancel" variant="link" onClick={handleClose}>
                Cancel
              </Button>
            </ModalFooter>
          </Modal>
        );
      }}
    </Formik>
  );
};

export default SecretModal;
