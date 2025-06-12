import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, PageSection, PageSectionVariants } from '@patternfly/react-core';
import { Formik } from 'formik';
import { isEmpty } from 'lodash-es';
import { SECRET_LIST_PATH } from '@routes/paths';
import { useNamespace } from '~/shared/providers/Namespace';
import FormFooter from '../../../shared/components/form-components/FormFooter';
import ExternalLink from '../../../shared/components/links/ExternalLink';
import { AddSecretFormValues, SecretFor, SecretTypeDropdownLabel } from '../../../types';
import { addSecretWithLinkingComponents } from '../../../utils/create-utils';
import PageLayout from '../../PageLayout/PageLayout';
import { getAddSecretBreadcrumbs } from '../utils/secret-utils';
import { secretFormValidationSchema } from '../utils/secret-validation';
import { SecretTypeSubForm } from './SecretTypeSubForm';

const AddSecretForm: React.FC = () => {
  const namespace = useNamespace();
  const navigate = useNavigate();
  const initialValues: AddSecretFormValues = {
    type: SecretTypeDropdownLabel.opaque,
    name: '',
    secretFor: SecretFor.Build,
    opaque: {
      keyValues: [{ key: '', value: '' }],
    },
    image: {
      authType: 'Image registry credentials',
      registryCreds: [
        {
          registry: '',
          username: '',
          password: '',
          email: '',
        },
      ],
    },
    source: {
      authType: 'Basic authentication',
    },
    relatedComponents: [],
    secretForComponentOption: null,
  };
  return (
    <Formik
      initialValues={initialValues}
      onReset={() => {
        navigate(-1);
      }}
      onSubmit={(values, actions) => {
        addSecretWithLinkingComponents(values, namespace)
          .then(() => {
            navigate(SECRET_LIST_PATH.createPath({ workspaceName: namespace }));
          })
          .catch((error) => {
            // eslint-disable-next-line no-console
            console.warn('Error while submitting secret form:', error);
            actions.setSubmitting(false);
            actions.setStatus({ submitError: error.message });
          });
      }}
      validationSchema={secretFormValidationSchema}
    >
      {({ status, isSubmitting, handleReset, dirty, errors, handleSubmit }) => (
        <PageLayout
          breadcrumbs={getAddSecretBreadcrumbs(namespace)}
          title="Add secret"
          description={
            <>
              Add a secret that will be stored using AWS Secret Manager to keep your data private.{' '}
              <ExternalLink href="https://konflux-ci.dev/docs/building/creating-secrets/">
                Learn more
              </ExternalLink>
            </>
          }
          footer={
            <FormFooter
              submitLabel="Add secret"
              handleSubmit={handleSubmit}
              errorMessage={status && status.submitError}
              handleCancel={handleReset}
              isSubmitting={isSubmitting}
              disableSubmit={!dirty || !isEmpty(errors) || isSubmitting}
            />
          }
        >
          <PageSection variant={PageSectionVariants.light} isFilled isWidthLimited>
            <Form style={{ maxWidth: '70%' }}>
              <SecretTypeSubForm />
            </Form>
          </PageSection>
        </PageLayout>
      )}
    </Formik>
  );
};
export default AddSecretForm;
