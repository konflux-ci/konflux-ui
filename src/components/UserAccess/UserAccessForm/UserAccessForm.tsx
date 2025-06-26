import React from 'react';
import { Form, PageSection, PageSectionVariants } from '@patternfly/react-core';
import { FormikProps, useFormikContext } from 'formik';
import isEmpty from 'lodash/isEmpty';
import PageLayout from '../../../components/PageLayout/PageLayout';
import { FormFooter } from '../../../shared';
import { useNamespace } from '../../../shared/providers/Namespace';
import { UserAccessFormValues } from './form-utils';
import { RoleSection } from './RoleSection';
import { UsernameSection } from './UsernameSection';

type Props = FormikProps<UserAccessFormValues> & {
  edit?: boolean;
  missingSubjects?: boolean;
};

export const UserAccessForm: React.FC<React.PropsWithChildren<Props>> = ({
  edit,
  missingSubjects = false,
  isSubmitting,
  dirty,
  errors, // The errors is caculated by formik automatically.
  status,
  handleSubmit,
  handleReset,
}) => {
  const namespace = useNamespace();
  const { values } = useFormikContext<{ usernames: string[] }>();
  // After we add 'enter' to input usernames, when users select roles and then input username with enter,
  // errors about empty usernames would be returned. This makes submit button disabled.
  // We prevent the enter default behaviour in UsernameSection but not for the form here.
  // Entering username would also bring default submit behavior.
  // Add the customErrors here to avoid unexpected disabled button. While when the submit buttion is
  // active, it is saying there is no hidden submit.
  const customErrors =
    errors?.usernames === '' && values?.usernames.length > 0 ? undefined : errors;

  return (
    <PageLayout
      title={
        edit ? `Edit access to namespace, ${namespace}` : `Grant access to namespace, ${namespace}`
      }
      description={
        edit
          ? 'Change permissions for this user by adding a role or removing a current role.'
          : 'Invite users to collaborate with you by granting them access to your namespace.'
      }
      footer={
        <FormFooter
          submitLabel={edit ? 'Save changes' : 'Grant access'}
          handleCancel={handleReset}
          // Customizing the handleSubmit is useless to hanle the submit button status
          handleSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          disableSubmit={!dirty || !isEmpty(customErrors) || isSubmitting}
          errorMessage={status?.submitError}
        />
      }
    >
      <PageSection isFilled variant={PageSectionVariants.light}>
        <Form onSubmit={handleSubmit}>
          <UsernameSection disabled={!missingSubjects && edit} />
          <RoleSection />
        </Form>
      </PageSection>
    </PageLayout>
  );
};
