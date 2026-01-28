import React from 'react';
import { Alert, HelperText, HelperTextItem, Title, TitleSizes } from '@patternfly/react-core';
import { useField } from 'formik';
import { Base64 } from 'js-base64';
import DropdownField from '../../../shared/components/formik-fields/DropdownField';
import { ImagePullSecretType } from '../../../types';
import EncodedFileUploadField from './EncodedFileUploadField';
import { MultiImageCredentialForm } from './MultiImageCredentialForm';

type RegistryValidation = {
  registry: string;
  isValid: boolean;
};

// Pattern: username:password
const AUTH_PATTERN = /^[^:]+:.+$/;

// Valid docker config filenames: .dockercfg or any .json file
const isValidDockerConfigFile = (filename?: string): boolean => {
  if (!filename) return true; // Allow if no filename (manual text entry)
  const lowerName = filename.toLowerCase();
  return lowerName.endsWith('.dockercfg') || lowerName.endsWith('.json');
};

export const ImagePullSecretForm: React.FC<React.PropsWithChildren<unknown>> = () => {
  const [{ value: type }] = useField<ImagePullSecretType>('image.authType');
  const [registryValidations, setRegistryValidations] = React.useState<RegistryValidation[]>([]);
  const [fileTypeError, setFileTypeError] = React.useState<string>();

  const validateDockerConfig = React.useCallback((decodedContent: string, filename?: string) => {
    // Handle empty input (e.g., file cleared)
    if (!decodedContent || decodedContent.trim() === '') {
      setRegistryValidations([]);
      setFileTypeError(undefined);
      return;
    }

    // Check file extension first
    if (!isValidDockerConfigFile(filename)) {
      setFileTypeError(`Invalid file type. Please upload a .dockercfg or .json file.`);
      setRegistryValidations([]);
      return;
    }
    setFileTypeError(undefined);
    try {
      const config = JSON.parse(decodedContent) as { auths?: Record<string, { auth?: string }> };
      const validations: RegistryValidation[] = [];
      if (config.auths) {
        Object.entries(config.auths).forEach(([registry, credentials]) => {
          const auth = credentials?.auth;
          if (auth) {
            try {
              const decodedAuth = Base64.decode(auth);
              // Check if decoded string contains valid ASCII characters
              const isValidBase64 = /^[\x20-\x7E]+$/.test(decodedAuth);
              const isValid = isValidBase64 && AUTH_PATTERN.test(decodedAuth);
              validations.push({ registry, isValid });
            } catch {
              // Base64 decode failed
              validations.push({ registry, isValid: false });
            }
          } else {
            // No auth field
            validations.push({ registry, isValid: false });
          }
        });
      }
      setRegistryValidations(validations);
    } catch {
      setRegistryValidations([]);
    }
  }, []);

  return (
    <>
      <DropdownField
        name="image.authType"
        label="Authentication type"
        helpText="Select how you want to authenticate"
        items={[
          { key: 'imageRegistryCreds', value: ImagePullSecretType.ImageRegistryCreds },
          { key: 'uploadConfigFile', value: ImagePullSecretType.UploadConfigFile },
        ]}
        required
        className="secret-type-subform__dropdown"
        validateOnChange
      />
      {type === ImagePullSecretType.ImageRegistryCreds ? (
        <>
          <Title size={TitleSizes.md} headingLevel="h4">
            Image registry credentials
            <HelperText style={{ fontWeight: 100 }}>
              <HelperTextItem variant="indeterminate">
                You can create one or more image registry credentials
              </HelperTextItem>
            </HelperText>
          </Title>
          <MultiImageCredentialForm name="image.registryCreds" />
        </>
      ) : (
        <>
          <EncodedFileUploadField
            name="image.dockerconfig"
            id="text-file-docker-config"
            label="Upload a .dockercfg or .docker/config.json file"
            helpText="This file contains configuration details and credentials to connect to a secure image registry"
            required
            onValidate={validateDockerConfig}
          />
          {fileTypeError && (
            <Alert variant="danger" isInline title={fileTypeError} style={{ marginTop: '1rem' }} />
          )}
          {!fileTypeError &&
            registryValidations.length > 0 &&
            registryValidations.map(({ registry, isValid }) => (
              <Alert
                key={registry}
                variant={isValid ? 'success' : 'danger'}
                isInline
                title={`${registry}: ${isValid ? 'Valid credentials format' : 'Invalid credentials format'}`}
                style={{ marginTop: '1rem' }}
              />
            ))}
        </>
      )}
    </>
  );
};
