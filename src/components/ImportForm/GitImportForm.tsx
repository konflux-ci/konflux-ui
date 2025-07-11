import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertVariant, Form, PageSection } from '@patternfly/react-core';
import { Formik, FormikHelpers } from 'formik';
import { CREATING_SOURCE_CONTROL_SECRETS } from '~/consts/documentation';
import { useKonfluxPublicInfo } from '~/hooks/useKonfluxPublicInfo';
import { CurrentComponentRef } from '~/types';
import { useNotifications } from '../../hooks/useUIInstance';
import { APPLICATION_DETAILS_PATH } from '../../routes/paths';
import { ExternalLink } from '../../shared';
import { useNamespace } from '../../shared/providers/Namespace';
import { AnalyticsProperties, TrackEvents, useTrackEvent } from '../../utils/analytics';
import ApplicationSection from './ApplicationSection/ApplicationSection';
import { ComponentSection } from './ComponentSection/ComponentSection';
import { getErrorMessage } from './error-utils';
import GitImportActions from './GitImportActions';
import { PipelineSection } from './PipelineSection/PipelineSection';
import SecretSection from './SecretSection/SecretSection';
import { createResourcesWithLinkingComponents } from './submit-utils';
import { ImportFormValues } from './type';
import { formValidationSchema } from './validation.utils';
import './GitImportForm.scss';

export const GitImportForm: React.FC<{ applicationName: string }> = ({ applicationName }) => {
  const track = useTrackEvent();
  const navigate = useNavigate();
  const namespace = useNamespace();
  const notifications = useNotifications();
  const initialValues: ImportFormValues = {
    application: applicationName || '',
    inAppContext: !!applicationName,
    showComponent: !!applicationName,
    componentName: '',
    gitProviderAnnotation: '',
    gitURLAnnotation: '',
    isPrivateRepo: false,
    source: {
      git: {
        url: '',
      },
    },
    pipeline: '',
    importSecrets: [],
    newSecrets: [],
  };

  const handleSubmit = React.useCallback(
    (values: ImportFormValues, formikHelpers: FormikHelpers<ImportFormValues>) => {
      track(TrackEvents.ButtonClicked, { link_name: 'import-submit', namespace });
      createResourcesWithLinkingComponents(values, namespace, notifications)
        .then(({ applicationName: appName, application, component }) => {
          if (application) {
            track('Application Create', {
              app_name: appName,
              app_id: application.metadata.uid,
              id: namespace,
            });
          }

          if (values.showComponent) {
            track('Component Create', {
              component_name: component.metadata.name,
              component_id: component.metadata.uid,
              namespace,
              git_url: component.spec.source.git.url,
              git_reference: component.spec.source.git.revision,
              context_dir: component.spec.source.git.context,
            });
          }

          navigate(
            APPLICATION_DETAILS_PATH.createPath({
              workspaceName: namespace,
              applicationName: appName,
            }),
          );
        })
        .catch((error) => {
          // eslint-disable-next-line no-console
          console.warn('Error while submitting import form:', error);
          track('Git import failed', error as AnalyticsProperties);
          formikHelpers.setSubmitting(false);
          const errorMessage = getErrorMessage(error);
          formikHelpers.setStatus({ submitError: errorMessage });
        });
    },
    [namespace, notifications, track, navigate],
  );

  const handleReset = React.useCallback(() => {
    track(TrackEvents.ButtonClicked, { link_name: 'import-leave', namespace });
    navigate(-1);
  }, [navigate, track, namespace]);

  const [konfluxInfo] = useKonfluxPublicInfo();
  const applicationUrl = konfluxInfo?.integrations?.github?.application_url || '';

  return (
    <Formik<ImportFormValues>
      initialValues={initialValues}
      onSubmit={handleSubmit}
      onReset={handleReset}
      validationSchema={formValidationSchema}
    >
      {(formikProps) => {
        return (
          <Form onSubmit={formikProps.handleSubmit} onReset={formikProps.handleReset}>
            <PageSection className="git-import-form">
              <ApplicationSection />
              {formikProps.values.showComponent ? (
                <>
                  <ComponentSection />
                  <PipelineSection />
                  <SecretSection
                    currentComponent={
                      {
                        componentName: formikProps.values.componentName,
                        applicationName: formikProps.values.application,
                      } as CurrentComponentRef
                    }
                  />
                  <Alert
                    className="pf-v5-u-mt-md"
                    variant={AlertVariant.info}
                    isInline
                    title="Onboarding components to Konflux"
                  >
                    To ensure that Konflux has appropriate access to your source code Git
                    repository, install your organization&apos;s{' '}
                    {applicationUrl ? (
                      <ExternalLink
                        href={applicationUrl}
                        dataTestID="git-import-form-konflux-gh-app-external-link"
                      >
                        Konflux GitHub App
                      </ExternalLink>
                    ) : (
                      'Konflux GitHub App'
                    )}{' '}
                    or{' '}
                    <ExternalLink
                      href={CREATING_SOURCE_CONTROL_SECRETS}
                      dataTestID="git-import-form-konflux-create-secret-external-link"
                    >
                      Create a secret
                    </ExternalLink>{' '}
                    for GitLab source code repository.
                  </Alert>
                </>
              ) : null}
            </PageSection>
            <GitImportActions />
          </Form>
        );
      }}
    </Formik>
  );
};
