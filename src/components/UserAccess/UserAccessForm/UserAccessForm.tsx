import React from 'react';
import { Form, PageSection, PageSectionVariants } from '@patternfly/react-core';
import { FormikProps } from 'formik';
import isEmpty from 'lodash/isEmpty';
import PageLayout from '../../../components/PageLayout/PageLayout';
import { FormFooter } from '../../../shared';
import { useNamespace } from '../../../shared/providers/Namespace';
import { useWorkspaceBreadcrumbs } from '../../../utils/breadcrumb-utils';
import { UserAccessFormValues } from './form-utils';
import { RoleSection } from './RoleSection';
import { UsernameSection } from './UsernameSection';

type Props = FormikProps<UserAccessFormValues> & {
  edit?: boolean;
};

export const UserAccessForm: React.FC<React.PropsWithChildren<Props>> = ({
  edit,
  isSubmitting,
  dirty,
  errors,
  status,
  handleSubmit,
  handleReset,
}) => {
  const breadcrumbs = useWorkspaceBreadcrumbs();
  const namespace = useNamespace();

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
      breadcrumbs={[
        ...breadcrumbs,
        {
          path: '#',
          name: 'User access',
        },
      ]}
      footer={
        <FormFooter
          submitLabel={edit ? 'Save changes' : 'Grant access'}
          handleCancel={handleReset}
          handleSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          disableSubmit={!dirty || !isEmpty(errors) || isSubmitting}
          errorMessage={status?.submitError}
        />
      }
    >
      <PageSection isFilled variant={PageSectionVariants.light}>
        <Form onSubmit={handleSubmit}>
          <UsernameSection disabled={edit} />
          <RoleSection />
        </Form>
      </PageSection>
    </PageLayout>
  );
};
