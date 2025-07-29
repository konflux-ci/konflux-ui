import { Base64 } from 'js-base64';
import { attempt, isError } from 'lodash-es';
import * as yup from 'yup';
import { ImagePullSecretType, SecretTypeDropdownLabel, SourceSecretType } from '../types';

export const KONFLUX_USERNAME_REGEX = /^[-_a-zA-Z0-9@.]{2,45}$/;
export const KONFLUX_USERNAME_REGEX_MGS =
  'Must be 2 to 45 characters long and can only contain letters from a to Z, numbers from 0 to 9, underscores( _ ), hyphens( - ), periods( . ), or @ symbol.';
export const konfluxUsernameYupValidation = yup
  .string()
  .matches(KONFLUX_USERNAME_REGEX, KONFLUX_USERNAME_REGEX_MGS);

export const GIT_URL_REGEX =
  /^((((ssh|git|https?:?):\/\/:?)(([^\s@]+@|[^@]:?)[-\w.]+(:\d\d+:?)?(\/[-\w.~/?[\]!$&'()*+,;=:@%]*:?)?:?))|([^\s@]+@[-\w.]+:[-\w.~/?[\]!$&'()*+,;=:@%]*?:?))$/;

export const GIT_URL = {
  PROTOCOL_REGEX: /^https?:\/\//,
  DOMAIN_REGEX: /^(https?:\/\/)?(github|gitlab|bitbucket)\.[\w.-]+/,
  USER_OR_REPO_REGEX: /^https?:\/\/(github|gitlab|bitbucket)\.[\w.-]+\/[\w.-]+\/[\w.-]/,
};

export const RESOURCE_NAME_REGEX = /^[a-z]([-a-z0-9]*[a-z0-9])?$/;
export const RESOURCE_NAME_REGEX_MSG =
  'Must start with a letter and end with a letter or number. Valid characters include lowercase letters from a to z, numbers from 0 to 9, and hyphens ( - ).';

export const MAX_RESOURCE_NAME_LENGTH = 63;
export const RESOURCE_NAME_LENGTH_ERROR_MSG = `Must be no more than ${MAX_RESOURCE_NAME_LENGTH} characters.`;

// This regex validates a URL, where the protocol (http://, https://) is optional.
// It successfully matches various URL structures, including:
//
// 1. With protocol:         "https://issues.redhat.com/browse/RHTAP-123"
// 2. Without protocol:      "issues.redhat.com"
// 3. With query & fragment: "https://bugzilla.redhat.com/show_bug.cgi?id=456#c1"
// 4. With subdomain & port: "https://sub.issues.redhat.com:8443/browse/TEST-123"
export const URL_REGEX =
  /^(?:(?:(?:https?|ftp):)?\/\/)?(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u00a1-\uffff][a-z0-9\u00a1-\uffff_-]{0,62})?[a-z0-9\u00a1-\uffff]\.)+(?:[a-z\u00a1-\uffff]{2,}\.?))(?::\d{2,5})?(?:[/?#]\S*)?$/i;

export const URL_ERROR_MSG = `Invalid URL.`;

export const resourceNameYupValidation = yup
  .string()
  .matches(RESOURCE_NAME_REGEX, RESOURCE_NAME_REGEX_MSG)
  .max(MAX_RESOURCE_NAME_LENGTH, RESOURCE_NAME_LENGTH_ERROR_MSG)
  .required('Required');

export const SecretFromSchema = yup.object({
  secretName: resourceNameYupValidation.test(
    'existing-secret-test',
    'Secret already exists',
    (value) => {
      return value !== undefined;
    },
  ),
  type: yup.string(),
  source: yup.object().when('type', {
    is: SecretTypeDropdownLabel.source,
    then: yup.object({
      authType: yup.string(),
      username: yup.string().when('authType', {
        is: SourceSecretType.basic,
        then: yup.string().required('Required'),
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
      authType: yup.string().required('Required'),
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
          }),
      }),
    }),
  }),
});
