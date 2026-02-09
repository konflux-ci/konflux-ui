import * as yup from 'yup';

export const BugSectionValidationSchema = yup.object({
  bug: yup.object({
    title: yup.string().required('Required').max(400, 'Should be less than 400 characters.'),
    description: yup
      .string()
      .required('Required')
      .max(2000, 'Should be less than 2000 characters.'),
  }),
});

export const FeatureSectionValidationSchema = yup.object({
  feature: yup.object({
    title: yup.string().required('Required').max(400, 'Should be less than 400 characters.'),
    description: yup
      .string()
      .required('Required')
      .max(2000, 'Should be less than 2000 characters.'),
  }),
});

export const FeedbackSectionValidationSchema = yup.object({
  feedback: yup.object({
    scale: yup.number().required('Required'),
    description: yup
      .string()
      .required('Required')
      .max(2000, 'Should be less than 2000 characters.'),
  }),
});
