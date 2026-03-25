import { Base64 } from 'js-base64';
import { attempt, isError } from 'lodash-es';
import * as yup from 'yup';
import { ImagePullSecretType, SecretTypeDropdownLabel, SourceSecretType } from '../../../types';
import { resourceNameYupValidation } from '../../../utils/validation-utils';

export const secretFormValidationSchema = ({ isEditMode = false }: { isEditMode?: boolean } = {}) =>
  yup.object({
    name: resourceNameYupValidation,
    type: yup.string(),
    opaque: yup.object().when('type', (type, schema) =>
      type === SecretTypeDropdownLabel.opaque
        ? yup.object({
            keyValues: yup.array().of(
              yup.object({
                key: yup.string().required('Required'),
                value: yup.string().required('Required'),
              }),
            ),
          })
        : schema,
    ),
    image: yup.object().when('type', (type, schema) =>
      type === SecretTypeDropdownLabel.image
        ? yup.object({
            authType: yup.string(),
            registryCreds: yup.array().when('authType', (authType, regSchema) =>
              authType === ImagePullSecretType.ImageRegistryCreds
                ? yup.array().of(
                    yup.object({
                      registry: yup.string().required('Required'),
                      username: yup.string().required('Required'),
                      password: isEditMode ? yup.string() : yup.string().required('Required'),
                    }),
                  )
                : regSchema,
            ),
            dockerconfig: yup.string().when('authType', (authType, dockerSchema) =>
              authType === ImagePullSecretType.UploadConfigFile
                ? yup
                    .string()
                    .required('Required')
                    .test(
                      'json-validation-test',
                      'Configuration file should be in JSON format.',
                      (value) => {
                        const parsedData = attempt(JSON.parse, value ? Base64.decode(value) : '');
                        const hasError = isError(parsedData);
                        return !hasError;
                      },
                    )
                    .test(
                      'auth-format-validation-test',
                      'Invalid credentials format. Expected format: username:password',
                      (value) => {
                        if (!value) return true; // Let required handle empty values
                        try {
                          const config = JSON.parse(Base64.decode(value)) as {
                            auths?: Record<string, { auth?: string }>;
                          };
                          if (!config.auths) return true; // No auths to validate
                          // Pattern: username:password
                          const authPattern = /^[^:]+:.+$/;
                          return Object.values(config.auths).every((creds) => {
                            const auth = creds?.auth;
                            if (!auth) return false;
                            try {
                              const decodedAuth = Base64.decode(auth);
                              // Check for valid printable ASCII and correct format
                              const isValidAscii = /^[\x20-\x7E]+$/.test(decodedAuth);
                              return isValidAscii && authPattern.test(decodedAuth);
                            } catch {
                              return false;
                            }
                          });
                        } catch {
                          return false;
                        }
                      },
                    )
                : dockerSchema,
            ),
          })
        : schema,
    ),
    source: yup.object().when('type', (type, schema) =>
      type === SecretTypeDropdownLabel.source
        ? yup.object({
            authType: yup.string(),
            username: yup
              .string()
              .when('authType', (authType, basicSchema) =>
                authType === SourceSecretType.basic ? yup.string() : basicSchema,
              ),
            password: yup
              .string()
              .when('authType', (authType, basicSchema) =>
                authType === SourceSecretType.basic
                  ? isEditMode
                    ? yup.string()
                    : yup.string().required('Required')
                  : basicSchema,
              ),
            ['ssh-privatekey']: yup
              .string()
              .when('authType', (authType, sshSchema) =>
                authType === SourceSecretType.ssh
                  ? isEditMode
                    ? yup.string()
                    : yup.string().required('Required')
                  : sshSchema,
              ),
          })
        : schema,
    ),
  });
