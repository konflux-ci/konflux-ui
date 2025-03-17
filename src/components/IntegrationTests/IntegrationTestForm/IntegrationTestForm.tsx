import React from 'react';
import { Form, FormSection, PageSection, PageSectionVariants } from '@patternfly/react-core';
import { useFormikContext } from 'formik';
import isEmpty from 'lodash/isEmpty';
import { INTEGRATION_TEST_LIST_PATH } from '@routes/paths';
import { useNamespace } from '~/shared/providers/Namespace';
import { FormFooter } from '../../../shared';
import { useApplicationBreadcrumbs } from '../../../utils/breadcrumb-utils';
import PageLayout from '../../PageLayout/PageLayout';
import IntegrationTestSection from './IntegrationTestSection';

// [TODO]: Refactor form styles from the shared style sheet
import '../../../shared/style.scss';
import './IntegrationTestForm.scss';

type IntegrationTestFormProps = {
  applicationName: string;
  edit?: boolean;
};

const IntegrationTestForm: React.FunctionComponent<
  React.PropsWithChildren<IntegrationTestFormProps>
> = ({ applicationName, edit }) => {
  const namespace = useNamespace();
  const applicationBreadcrumbs = useApplicationBreadcrumbs();
  const { dirty, handleSubmit, handleReset, isSubmitting, status, errors } = useFormikContext();
  const footer = (
    <FormFooter
      submitLabel={edit ? 'Save changes' : 'Add integration test'}
      handleCancel={handleReset}
      handleSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      disableSubmit={!dirty || !isEmpty(errors) || isSubmitting}
      errorMessage={status?.submitError}
    />
  );

  const title = edit ? 'Edit integration test' : 'Add integration test';

  return (
    <PageLayout
      breadcrumbs={[
        ...applicationBreadcrumbs,
        {
          path: INTEGRATION_TEST_LIST_PATH.createPath({
            workspaceName: namespace,
            applicationName,
          }),
          name: 'Integration tests',
        },
        { path: '#', name: title },
      ]}
      title={title}
      description="Test all your components after you commit code by adding an integration test. Integration tests run in parallel using temporary environments."
      footer={footer}
    >
      <PageSection isFilled variant={PageSectionVariants.light}>
        <Form onSubmit={handleSubmit}>
          <FormSection className="integration-test-form">
            <IntegrationTestSection isInPage edit={edit} />
          </FormSection>
        </Form>
      </PageSection>
    </PageLayout>
  );
};

export default IntegrationTestForm;
