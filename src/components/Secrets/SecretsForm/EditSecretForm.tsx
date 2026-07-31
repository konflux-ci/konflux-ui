import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bullseye, Form, PageSection, Spinner } from '@patternfly/react-core';
import { Formik } from 'formik';
import { isEmpty } from 'lodash-es';
import PageLayout from '~/components/PageLayout/PageLayout';
import { secretFormValidationSchema } from '~/components/Secrets/utils/secret-validation';
import { LEARN_MORE_ABOUT_SECRETS_CREATION } from '~/consts/documentation';
import { FeatureFlagIndicator } from '~/feature-flags/FeatureFlagIndicator';
import { useSearchParam } from '~/hooks/useSearchParam';
import { useSecretMetadata } from '~/hooks/useSecretMetadata';
import { logger } from '~/monitoring/logger';
import { SECRET_LIST_PATH } from '~/routes/paths';
import FormFooter from '~/shared/components/form-components/FormFooter';
import ExternalLink from '~/shared/components/links/ExternalLink';
import { useNamespace } from '~/shared/providers/Namespace';
import { getErrorState } from '~/shared/utils/error-utils';
import {
  AddSecretFormValues,
  ImagePullSecretType,
  KeyValueEntry,
  SecretFor,
  SecretKind,
  SecretLabels,
  SecretType,
  SecretTypeDropdownLabel,
} from '~/types';
import {
  editSecretResource,
  fetchFullSecret,
  getAuthType,
  getRegistryCreds,
  getResolvedKubernetesSecretType,
  getSecretBreadcrumbs,
  typeToDropdownLabel,
} from '~/utils/secrets/secret-utils';
import { EditSecretSensitiveContextProvider } from './EditSecretSensitiveContextProvider';
import { SecretTypeSubForm } from './SecretTypeSubForm';

const isUnset = (value: unknown): boolean => value === '' || value === undefined;

/** In edit mode, blank sensitive fields mean “keep cluster value” — fill from loaded secret before patch. */
function preserveUnsetSensitiveSecretValues(
  values: AddSecretFormValues,
  secretData: SecretKind,
  secretType: SecretTypeDropdownLabel,
  typeFromLabels: SecretType,
  parsedRegistryCreds: ReturnType<typeof getRegistryCreds>,
): void {
  if (!secretData.data) {
    return;
  }
  switch (typeFromLabels) {
    case SecretType.sshAuth:
      if (isUnset(values.source['ssh-privatekey'])) {
        values.source['ssh-privatekey'] = secretData.data['ssh-privatekey'];
      }
      break;
    case SecretType.basicAuth:
      if (
        secretType === SecretTypeDropdownLabel.source &&
        isUnset(values.source.password) &&
        secretData.data?.password
      ) {
        values.source.password = atob(secretData.data.password);
      }
      break;
    case SecretType.dockercfg:
    case SecretType.dockerconfigjson:
      if (secretType === SecretTypeDropdownLabel.image) {
        values.image.registryCreds.forEach((cred, idx) => {
          cred.password = cred.password === '' ? parsedRegistryCreds[idx].password : cred.password;
        });
      }
      break;
    default:
      break;
  }
}

function editRequiresFullSecretPayload(
  values: AddSecretFormValues,
  typeFromLabels: SecretType,
  secretType: SecretTypeDropdownLabel,
): boolean {
  switch (typeFromLabels) {
    case SecretType.sshAuth:
      return (
        secretType === SecretTypeDropdownLabel.source && isUnset(values.source['ssh-privatekey'])
      );
    case SecretType.basicAuth:
      return secretType === SecretTypeDropdownLabel.source && isUnset(values.source.password);
    case SecretType.dockerconfigjson:
    case SecretType.dockercfg: {
      if (secretType !== SecretTypeDropdownLabel.image) {
        return false;
      }
      if (values.image?.authType === ImagePullSecretType.UploadConfigFile) {
        return isUnset(values.image?.dockerconfig);
      }
      return values.image.registryCreds.some((c) => isUnset(c.password));
    }
    case SecretType.opaque:
      return secretType === SecretTypeDropdownLabel.opaque;
    default:
      return false;
  }
}

const EditSecretForm: React.FC = () => {
  const namespace = useNamespace();
  const navigate = useNavigate();
  const [secretName] = useSearchParam('secretName');

  const [secretMeta, secretLoaded, error] = useSecretMetadata(namespace, secretName);
  const [fullSecret, setFullSecret] = React.useState<SecretKind | null>(null);
  const [isLoadingFullSecret, setIsLoadingFullSecret] = React.useState(false);

  const clearSensitiveMemory = React.useCallback(() => {
    setFullSecret(null);
  }, []);

  React.useEffect(() => {
    clearSensitiveMemory();
  }, [namespace, secretName, clearSensitiveMemory]);

  const requestFullSecret = React.useCallback(async () => {
    if (fullSecret) {
      return fullSecret;
    }
    setIsLoadingFullSecret(true);

    try {
      const s = await fetchFullSecret(namespace, secretName);
      setFullSecret(s);
      return s;
    } catch (e) {
      logger.error('Failed to load full secret', e instanceof Error ? e : undefined, {
        namespace,
        secretName,
      });
      return undefined;
    } finally {
      setIsLoadingFullSecret(false);
    }
  }, [fullSecret, namespace, secretName]);

  if (!secretLoaded) {
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  }

  if (error || !secretMeta) {
    return getErrorState(error, secretLoaded, 'secret');
  }

  const typeFromLabels = getResolvedKubernetesSecretType(secretMeta);
  const secretType = typeToDropdownLabel(typeFromLabels) as SecretTypeDropdownLabel;
  const authTypeFromLabels = getAuthType(typeFromLabels);

  const readLabels = secretMeta.metadata.labels
    ? Object.entries(secretMeta.metadata.labels).map(([key, value]) => ({ key, value }))
    : [];

  const opaqueSecret = Object.entries(secretMeta.data ?? {}).map(([key, value]) => ({
    key,
    value,
  }));

  const imageSecret =
    secretType === SecretTypeDropdownLabel.image
      ? {
          authType: authTypeFromLabels,
          registryCreds: [{ registry: '', username: '', password: '', email: '' }],
          dockerconfig: undefined,
        }
      : undefined;

  const sourceSecret =
    secretType === SecretTypeDropdownLabel.source
      ? {
          authType: authTypeFromLabels,
          username: '',
          password: '',
          host: secretMeta.metadata.labels?.[SecretLabels.HOST_LABEL] || '',
          repo: secretMeta.metadata.annotations?.[SecretLabels.REPO_ANNOTATION] || '',
          ...(typeFromLabels === SecretType.sshAuth && { 'ssh-privatekey': '' }),
        }
      : undefined;

  const initialValues: AddSecretFormValues = {
    type: secretType,
    name: secretMeta.metadata.name,
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
        const payloadSecret = fullSecret ?? secretMeta;
        if (
          editRequiresFullSecretPayload(values, typeFromLabels, secretType) &&
          !payloadSecret.data
        ) {
          actions.setStatus({
            submitError: 'Reveal secret values to load data from the cluster before saving.',
          });
          actions.setSubmitting(false);
          return;
        }

        preserveUnsetSensitiveSecretValues(
          values,
          payloadSecret,
          secretType,
          typeFromLabels,
          getRegistryCreds(payloadSecret),
        );

        editSecretResource(values, secretMeta.metadata.namespace, payloadSecret)
          .then(() => {
            clearSensitiveMemory();
            navigate(SECRET_LIST_PATH.createPath({ workspaceName: namespace }));
          })
          .catch((editError) => {
            const errorMessage = editError instanceof Error ? editError.message : String(editError);
            logger.warn('Error while submitting secret form', {
              message: errorMessage,
            });
            actions.setSubmitting(false);
            actions.setStatus({ submitError: errorMessage });
          });
      }}
      validationSchema={secretFormValidationSchema({ isEditMode: true })}
    >
      {(formik) => (
        <EditSecretSensitiveContextProvider
          formik={formik}
          fullSecret={fullSecret}
          isLoadingFullSecret={isLoadingFullSecret}
          requestFullSecret={requestFullSecret}
          clearSensitiveMemory={clearSensitiveMemory}
        >
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
                submitLabel="Save changes"
                handleSubmit={formik.handleSubmit}
                errorMessage={formik.status && formik.status.submitError}
                handleCancel={formik.handleReset}
                isSubmitting={formik.isSubmitting}
                disableSubmit={!formik.dirty || !isEmpty(formik.errors) || formik.isSubmitting}
              />
            }
          >
            <PageSection hasBodyWrapper isFilled isWidthLimited>
              <Form className="edit-secret-form__content">
                <SecretTypeSubForm isEditMode={true} />
              </Form>
            </PageSection>
          </PageLayout>
        </EditSecretSensitiveContextProvider>
      )}
    </Formik>
  );
};
export default EditSecretForm;
