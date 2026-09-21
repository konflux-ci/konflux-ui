import React from 'react';
import { useParams } from 'react-router-dom';
import { useApplicationBreadcrumbs } from '~/components/Applications/breadcrumbs/breadcrumb-utils';
import { INTEGRATION_TEST_DETAILS_PATH, INTEGRATION_TEST_LIST_PATH } from '~/routes/paths';
import { RouterParams } from '~/routes/utils';
import { useNamespace } from '~/shared/providers/Namespace';
import { IntegrationTestScenarioKind } from '~/types/coreBuildService';
import { TrackEvents, useTrackEvent } from '~/utils/analytics';
import { defaultSelectedContextOption } from '../utils/creation-utils';
import IntegrationTestView, { FormContext } from './IntegrationTestView';
import { createIntegrationTest } from './utils/create-utils';

type IntegrationTestViewByApplicationProps = {
  integrationTest?: IntegrationTestScenarioKind;
};

const IntegrationTestViewByApplication: React.FC<IntegrationTestViewByApplicationProps> = ({
  integrationTest,
}) => {
  const namespace = useNamespace();
  const track = useTrackEvent();
  const applicationBreadcrumbs = useApplicationBreadcrumbs();
  const { applicationName } = useParams<RouterParams>();

  return (
    <IntegrationTestView
      integrationTest={integrationTest}
      breadcrumbs={[
        ...applicationBreadcrumbs,
        {
          path: INTEGRATION_TEST_LIST_PATH.createPath({
            workspaceName: namespace,
            applicationName,
          }),
          name: 'Integration tests',
        },
      ]}
      detailsPath={INTEGRATION_TEST_DETAILS_PATH.createPath({
        applicationName,
        integrationTestName: integrationTest?.metadata?.name,
        workspaceName: namespace,
      })}
      listPath={INTEGRATION_TEST_LIST_PATH.createPath({
        applicationName,
        workspaceName: namespace,
      })}
      trackEvents={{
        editIntegrationTestSubmit: () =>
          track(TrackEvents.ButtonClicked, {
            link_name: 'edit-integration-test-submit',
            app_name: integrationTest?.spec.application,
            integration_test_name: integrationTest?.metadata?.name,
          }),
        addIntegrationTestSubmit: () =>
          track(TrackEvents.ButtonClicked, {
            link_name: 'add-integration-test-submit',
            app_name: applicationName,
          }),
        integrationTestEditedOrCreated: (newIntegrationTest) =>
          track(integrationTest ? 'Integration test Edited' : 'Integration test Created', {
            app_name: newIntegrationTest.spec.application,
            integration_test_name: newIntegrationTest.metadata?.name,
            bundle: newIntegrationTest.spec.bundle,
            pipeline: newIntegrationTest.spec.pipeline,
          }),
        editIntegrationTestLeave: () =>
          track(TrackEvents.ButtonClicked, {
            link_name: 'edit-integration-test-leave',
            app_name: integrationTest?.spec.application,
            integration_test_name: integrationTest?.metadata?.name,
          }),
        addIntegrationTestLeave: () =>
          track(TrackEvents.ButtonClicked, {
            link_name: 'add-integration-test-leave',
            app_name: applicationName,
          }),
      }}
      createIntegrationTest={(integrationTestFormValues) =>
        createIntegrationTest(integrationTestFormValues, applicationName ?? '', namespace)
      }
      defaultSelectedContextOption={defaultSelectedContextOption as FormContext}
    />
  );
};

export default IntegrationTestViewByApplication;
