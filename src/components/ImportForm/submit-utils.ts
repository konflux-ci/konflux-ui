import { ApplicationKind, ImportSecret } from '../../types';
import { SBOMEventNotification } from '../../types/konflux-public-info';
import {
  createApplication,
  createComponent,
  createImageRepository,
  createSecretWithLinkingComponents,
} from '../../utils/create-utils';
import {
  EC_INTEGRATION_TEST_PATH,
  EC_INTEGRATION_TEST_REVISION,
  EC_INTEGRATION_TEST_URL,
} from '../IntegrationTests/IntegrationTestForm/const';
import { IntegrationTestFormValues } from '../IntegrationTests/IntegrationTestForm/types';
import { createIntegrationTest } from '../IntegrationTests/IntegrationTestForm/utils/create-utils';
import { ImportFormValues } from './type';

const BUILD_PIPELINE_ANNOTATION = 'build.appstudio.openshift.io/pipeline';

export const createSecretsWithLinkingComponents = async (
  secrets: ImportSecret[],
  component: string,
  namespace: string,
  dryRun: boolean,
) => {
  // We cannot enjoy the below parallel functions:
  //  await Promise.all(
  //   secrets.map((secret) => createSecretWithLinkingComponents(secret, namespace, dryRun)),
  // );
  // The reason is that createSecretWithLinkingComponents would linking secrets to multiple
  // service account.
  // Assuming we have several secrets those linking to similar service accounts,
  // then failures easily occurred due to resource contention.
  // We need jobs run in order.

  const results = [];
  for (const secret of secrets) {
    const result = await createSecretWithLinkingComponents(secret, component, namespace, dryRun);
    results.push(result);
  }
  return results;
};

export const createResourcesWithLinkingComponents = async (
  formValues: ImportFormValues,
  namespace: string,
  notifications: SBOMEventNotification[],
) => {
  const {
    source,
    application,
    componentName,
    gitProviderAnnotation,
    gitURLAnnotation,
    inAppContext,
    importSecrets = [],
    pipeline,
    showComponent,
    isPrivateRepo,
  } = formValues;
  const shouldCreateApplication = !inAppContext;
  let applicationName = application;
  const componentAnnotations: { [key: string]: string } = {
    [BUILD_PIPELINE_ANNOTATION]: JSON.stringify({ name: pipeline, bundle: 'latest' }),
  };

  const integrationTestValues: IntegrationTestFormValues = {
    name: `${applicationName}-enterprise-contract`,
    url: EC_INTEGRATION_TEST_URL,
    revision: EC_INTEGRATION_TEST_REVISION,
    path: EC_INTEGRATION_TEST_PATH,
    optional: false,
    resourceKind: 'pipeline',
  };

  let applicationData: ApplicationKind;
  if (shouldCreateApplication) {
    await createApplication(application, namespace, true);
    applicationData = await createApplication(application, namespace);
    await createIntegrationTest(integrationTestValues, applicationName, namespace, true);
  }
  if (showComponent) {
    await createComponent(
      { componentName, application, source, gitProviderAnnotation, gitURLAnnotation },
      applicationName,
      namespace,
      '',
      true,
      undefined,
      'create',
      undefined,
      componentAnnotations,
    );
    await createImageRepository(
      {
        application,
        component: componentName,
        namespace,
        isPrivate: isPrivateRepo,
        notifications,
      },
      true,
    );
  }

  if (shouldCreateApplication) {
    applicationName = applicationData.metadata.name;
    await createIntegrationTest(integrationTestValues, applicationName, namespace);
  }

  let createdComponent;
  if (showComponent) {
    const secretsToCreate = importSecrets.filter((secret) =>
      secret.existingSecrets.find((existing) => secret.secretName === existing.name) ? false : true,
    );

    await createSecretsWithLinkingComponents(secretsToCreate, componentName, namespace, true);

    createdComponent = await createComponent(
      { componentName, application, gitProviderAnnotation, source, gitURLAnnotation },
      applicationName,
      namespace,
      '',
      false,
      undefined,
      'create',
      undefined,
      componentAnnotations,
    );

    await createImageRepository({
      application,
      component: componentName,
      namespace,
      isPrivate: isPrivateRepo,
      notifications,
    });

    await createSecretsWithLinkingComponents(secretsToCreate, componentName, namespace, false);
  }

  return {
    applicationName,
    application: applicationData,
    component: createdComponent,
  };
};
