import { Base64 } from 'js-base64';
import { attempt, isError } from 'lodash-es';
import * as yup from 'yup';
import { ImagePullSecretType, SecretTypeDropdownLabel, SourceSecretType } from '../../../types';
import { resourceNameYupValidation } from '../../../utils/validation-utils';

export const secretFormValidationSchema = yup.object({
  name: resourceNameYupValidation,
  type: yup.string(),
  opaque: yup.object().when('type', {
    is: SecretTypeDropdownLabel.opaque,
    then: yup.object({
      keyValues: yup.array().of(
        yup.object({
          key: yup.string().required('Required'),
          value: yup.string().required('Required'),
        }),
      ),
    }),
  }),
  image: yup.object().when('type', {
    is: SecretTypeDropdownLabel.image,
    then: yup.object({
      authType: yup.string(),
      registryCreds: yup.array().when('authType', {
        is: ImagePullSecretType.ImageRegistryCreds,
        then: yup.array().of(
          yup.object({
            registry: yup.string().required('Required'),
            username: yup.string().required('Required'),
            password: yup.string().required('Required'),
          }),
        ),
      }),
      dockerconfig: yup.string().when('authType', {
        is: ImagePullSecretType.UploadConfigFile,
        then: yup
          .string()
          .required('Required')
          .test('json-validation-test', 'Configuration file should be in JSON format.', (value) => {
            const parsedData = attempt(JSON.parse, value ? Base64.decode(value) : '');
            const hasError = isError(parsedData);
            return !hasError;
          })
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
          ),
      }),
    }),
  }),
  source: yup.object().when('type', {
    is: SecretTypeDropdownLabel.source,
    then: yup.object({
      authType: yup.string(),
      username: yup.string().when('authType', {
        is: SourceSecretType.basic,
        then: yup.string(),
      }),
      password: yup.string().when('authType', {
        is: SourceSecretType.basic,
        then: yup.string().required('Required'),
      }),
      ['ssh-privatekey']: yup.string().when('authType', {
        is: SourceSecretType.ssh,
        then: yup.string().required('Required'),
      }),
    }),
  }),
});
