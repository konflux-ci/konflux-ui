import * as React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Form, PageSection, PageSectionVariants } from '@patternfly/react-core';
import { Formik } from 'formik';
import { isEmpty } from 'lodash-es';
import PageLayout from '~/components/PageLayout/PageLayout';
import { LEARN_MORE_ABOUT_SECRETS_CREATION } from '~/consts/documentation';
// import { useLinkedServiceAccounts } from '~/hooks/useLinkedServiceAccounts';
import { SECRET_LIST_PATH } from '~/routes/paths';
import FormFooter from '~/shared/components/form-components/FormFooter';
import ExternalLink from '~/shared/components/links/ExternalLink';
import { useNamespace } from '~/shared/providers/Namespace';
import {
  AddSecretFormValues,
  KeyValueEntry,
  SecretFor,
  SecretKind,
  SecretType,
  SecretTypeDropdownLabel,
} from '~/types';
import { addSecretWithLinkingComponents } from '~/utils/create-utils';
import {
  getAuthType,
  getSecretBreadcrumbs,
  typeToDropdownLabel,
} from '~/utils/secrets/secret-utils';
import { secretFormValidationSchema } from '../utils/secret-validation';
import { SecretTypeSubForm } from './SecretTypeSubForm';

const EditSecretForm: React.FC = () => {
  const namespace = useNamespace();
  const navigate = useNavigate();
  const { secretData } = useLocation().state as { secretData: SecretKind };

  const typeFromLabels = secretData.type as SecretType;
  const secretType = typeToDropdownLabel(typeFromLabels) as SecretTypeDropdownLabel;
  const authTypeFromLabels = getAuthType(typeFromLabels);

  const readLabels = secretData.metadata.labels
    ? Object.entries(secretData.metadata.labels).map(([key, value]) => ({ key, value }))
    : [];

  // console.log('secretData', secretData);

  // const { linkedServiceAccounts, isLoading, error } = useLinkedServiceAccounts(
  //   namespace,
  //   secretData,
  //   false,
  // );
  // console.log("linkedServiceAccounts", linkedServiceAccounts);

  const opaqueSecret = Object.entries(secretData.data).map(([key, value]) => ({ key, value }));

  const imageSecret =
    secretType === SecretTypeDropdownLabel.image
      ? {
          authType: authTypeFromLabels, //
          registryCreds: [
            // TODO: get registryCreds from secretData
            {
              registry: '',
              username: '',
              password: '',
              email: '',
            },
          ],
          dockerconfig: secretData.data['.dockercfg'], //
        }
      : undefined;

  const sourceSecret =
    secretType === SecretTypeDropdownLabel.source
      ? {
          authType: authTypeFromLabels, //
          // username: secretData.data['username'] || '', hashed
          // password: secretData.data['password'] || '', hashed
          username: '',
          password: '',
          host: secretData.metadata.labels['appstudio.redhat.com/scm.host'] || '',
          repo: secretData.metadata.annotations['appstudio.redhat.com/scm.repository'] || '',
        }
      : undefined;

  const initialValues: AddSecretFormValues = {
    type: secretType, //
    name: secretData.metadata.name, //
    secretFor: SecretFor.Build, // TODO: get secretFor from secretData
    opaque: {
      keyValues: opaqueSecret, //
    },
    image: imageSecret,
    source: { ...sourceSecret }, // asi ?
    labels: [...readLabels] as KeyValueEntry[], //
    relatedComponents: [], // TODO: get related components from secretData
    secretForComponentOption: null, // TODO: get secretForComponentOption from secretData - all, partial, none
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
          breadcrumbs={getSecretBreadcrumbs(namespace, 'Edit')}
          title="Edit secret"
          description={
            <>
              Edit a secret that is stored using AWS Secret Manager to keep your data private.{' '}
              <ExternalLink href={LEARN_MORE_ABOUT_SECRETS_CREATION}>Learn more</ExternalLink>
            </>
          }
          footer={
            <FormFooter
              submitLabel="Edit secret"
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
export default EditSecretForm;
