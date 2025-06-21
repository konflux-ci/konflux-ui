import * as yup from 'yup';
import { GIT_URL, resourceNameYupValidation } from '../../utils/validation-utils';
import { ImportFormValues } from './type';

const componentSchema = yup.object({
  source: yup.object({
    git: yup.object({
      url: yup
        .string()
        .trim()
        .max(2000, 'Please enter a URL that is less than 2000 characters.')
        .matches(GIT_URL.PROTOCOL_REGEX, 'Must include a protocol (https://)')
        .matches(GIT_URL.DOMAIN_REGEX, 'Must include a domain (github/gitlab)')
        .matches(GIT_URL.USER_OR_REPO_REGEX, 'User or repository name is missing')
        .required('Required'),
      revision: yup.string(),
      context: yup.string(),
    }),
  }),
  componentName: resourceNameYupValidation,
  pipeline: yup.string().required('Required'),
});

export const formValidationSchema = yup.mixed().test(
  (values: ImportFormValues) =>
    yup
      .object({
        application: resourceNameYupValidation,
      })
      .concat(values.showComponent ? componentSchema : undefined)
      .validate(values, { abortEarly: false }) as unknown as boolean,
);
