import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bullseye, Form, PageSection, PageSectionVariants, Spinner } from '@patternfly/react-core';
import { logger } from '@sentry/react';
import { Formik } from 'formik';
import { isEmpty } from 'lodash-es';
import PageLayout from '~/components/PageLayout/PageLayout';
import { LEARN_MORE_ABOUT_SECRETS_CREATION } from '~/consts/documentation';
import { FeatureFlagIndicator } from '~/feature-flags/FeatureFlagIndicator';
import { useSearchParam } from '~/hooks/useSearchParam';
import { useSecret } from '~/hooks/useSecrets';
import { SECRET_LIST_PATH } from '~/routes/paths';
import FormFooter from '~/shared/components/form-components/FormFooter';
import ExternalLink from '~/shared/components/links/ExternalLink';
import { useNamespace } from '~/shared/providers/Namespace';
import { getErrorState } from '~/shared/utils/error-utils';
import {
  AddSecretFormValues,
  KeyValueEntry,
  SecretFor,
  SecretLabels,
  SecretType,
  SecretTypeDropdownLabel,
} from '~/types';
import {
  editSecretResource,
  getAuthType,
  getRegistryCreds,
  getSecretBreadcrumbs,
  typeToDropdownLabel,
} from '~/utils/secrets/secret-utils';
import { getSecretFormValidationSchema } from '../utils/secret-validation';
import { SecretTypeSubForm } from './SecretTypeSubForm';

const EditSecretForm: React.FC = () => {
  const namespace = useNamespace();
  const navigate = useNavigate();
  const [secretName] = useSearchParam('secretName');

  const [secretData, secretLoaded, error] = useSecret(namespace, secretName);

  if (!secretLoaded) {
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  }

  if (error) {
    return getErrorState(error, secretLoaded, 'secret');
  }

  const typeFromLabels = secretData.type as SecretType;
  const secretType = typeToDropdownLabel(typeFromLabels) as SecretTypeDropdownLabel;
  const authTypeFromLabels = getAuthType(typeFromLabels);

  const readLabels = secretData.metadata.labels
    ? Object.entries(secretData.metadata.labels).map(([key, value]) => ({ key, value }))
    : [];

  const opaqueSecret = Object.entries(secretData.data ?? {}).map(([key, value]) => ({
    key,
    value,
  }));

  const imageSecret =
    secretType === SecretTypeDropdownLabel.image
      ? {
          authType: authTypeFromLabels,
          registryCreds: getRegistryCreds(secretData),
          dockerconfig: secretData.data?.['.dockercfg'],
        }
      : undefined;

  const sourceSecret =
    secretType === SecretTypeDropdownLabel.source
      ? {
          authType: authTypeFromLabels,
          username:
            typeFromLabels === SecretType.basicAuth && secretData.data?.username
              ? atob(secretData.data.username)
              : '',
          password: '', // Intentionally not displayed, password is sensitive
          host: secretData.metadata.labels?.[SecretLabels.HOST_LABEL] || '',
          repo: secretData.metadata.annotations?.[SecretLabels.REPO_ANNOTATION] || '',
          ...(typeFromLabels === SecretType.sshAuth && { 'ssh-privatekey': '' }),
        }
      : undefined;

  const initialValues: AddSecretFormValues = {
    type: secretType,
    name: secretData.metadata.name,
    secretFor: SecretFor.Build,
    opaque: {
      keyValues: opaqueSecret,
    },
    image: imageSecret,
    source: { ...sourceSecret },
    labels: [...readLabels] as KeyValueEntry[],
  };

  return (
    <Formik
      initialValues={initialValues}
      onReset={() => {
        navigate(-1);
      }}
      onSubmit={(values, actions) => {
        // SSH field left blank in edit: keep existing key
        if (
          typeFromLabels === SecretType.sshAuth &&
          (values.source['ssh-privatekey'] === '' || values.source['ssh-privatekey'] === undefined)
        ) {
          values.source['ssh-privatekey'] = secretData.data['ssh-privatekey'];
        }

        editSecretResource(values, secretData.metadata.namespace)
          .then(() => {
            navigate(SECRET_LIST_PATH.createPath({ workspaceName: namespace }));
          })
          .catch((editError) => {
            // eslint-disable-next-line no-console
            logger.warn('Error while submitting secret form:', { editError });
            actions.setSubmitting(false);
            actions.setStatus({ submitError: editError.message });
          });
      }}
      validationSchema={getSecretFormValidationSchema({ isEditMode: true })}
    >
      {({ status, isSubmitting, handleReset, dirty, errors, handleSubmit }) => (
        <PageLayout
          breadcrumbs={getSecretBreadcrumbs(namespace, 'Edit')}
          title={
            <>
              Edit secret
              <FeatureFlagIndicator flags={['edit-secret-page']} />
            </>
          }
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
              <SecretTypeSubForm isEditMode={true} />
            </Form>
          </PageSection>
        </PageLayout>
      )}
    </Formik>
  );
};
export default EditSecretForm;
