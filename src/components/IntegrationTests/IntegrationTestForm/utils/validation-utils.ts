import * as yup from 'yup';
import { resourceNameYupValidation } from '../../../../utils/validation-utils';

export const integrationTestValidationSchema = yup.object({
  integrationTest: yup.object({
    name: resourceNameYupValidation,
    url: yup
      .string()
      .required('Required')
      .max(2000, 'Please enter a URL that is less than 2000 characters.'),
    path: yup
      .string()
      .required('Required')
      .max(2000, 'Please enter a path that is less than 2000 characters.'),
    contexts: yup
      .array()
      .of(
        yup.object().shape({
          name: yup.string(),
          description: yup.string(),
        }),
      )
      .required('Required')
      .min(1),
  }),
});
