import * as yup from 'yup';

export const contextModalValidationSchema = yup.object({
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
});
