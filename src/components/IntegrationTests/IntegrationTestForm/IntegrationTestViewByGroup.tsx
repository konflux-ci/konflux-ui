import React from 'react';
import { useParams } from 'react-router-dom';
import { useComponentGroupBreadcrumbs } from '~/components/ComponentGroups/breadcrumb-utils';
import {
  GROUP_INTEGRATION_TEST_DETAILS_PATH,
  GROUP_INTEGRATION_TEST_LIST_PATH,
} from '~/routes/paths';
import { RouterParams } from '~/routes/utils';
import { useNamespace } from '~/shared/providers/Namespace';
import { IntegrationTestScenarioKind } from '~/types/coreBuildService';
import { TrackEvents, useTrackEvent } from '~/utils/analytics';
import { defaultSelectedContextOptionForComponentGroups } from '../utils/creation-utils';
import IntegrationTestView, { FormContext } from './IntegrationTestView';
import { createIntegrationTestForComponentGroup } from './utils/create-utils';

type IntegrationTestViewByGroupProps = {
  integrationTest?: IntegrationTestScenarioKind | undefined | null;
};

const IntegrationTestViewByGroup: React.FC<IntegrationTestViewByGroupProps> = ({
  integrationTest,
}) => {
  const namespace = useNamespace();
  const track = useTrackEvent();
  const componentGroupsBreadcrumbs = useComponentGroupBreadcrumbs();
  const { groupName } = useParams<RouterParams>();

  return (
    <IntegrationTestView
      integrationTest={integrationTest}
      breadcrumbs={[
        ...componentGroupsBreadcrumbs,
        {
          path: GROUP_INTEGRATION_TEST_LIST_PATH.createPath({
            workspaceName: namespace,
            groupName,
          }),
          name: 'Integration tests',
        },
      ]}
      detailsPath={GROUP_INTEGRATION_TEST_DETAILS_PATH.createPath({
        groupName,
        integrationTestName: integrationTest?.metadata?.name,
        workspaceName: namespace,
      })}
      listPath={GROUP_INTEGRATION_TEST_LIST_PATH.createPath({
        groupName,
        workspaceName: namespace,
      })}
      trackEvents={{
        editIntegrationTestSubmit: () =>
          track(TrackEvents.ButtonClicked, {
            link_name: 'edit-integration-test-submit',
            // group_name: integrationTest?.spec.componentGroup, // TODO: check if it's okay
            integration_test_name: integrationTest?.metadata?.name,
          }),
        addIntegrationTestSubmit: () =>
          track(TrackEvents.ButtonClicked, {
            link_name: 'add-integration-test-submit',
            // group_name: groupName, // TODO: check if it's okay
          }),
        integrationTestEditedOrCreated: (newIntegrationTest) =>
          track(integrationTest ? 'Integration test Edited' : 'Integration test Created', {
            // group_name: newIntegrationTest?.spec.componentGroup, // TODO: check if it's okay
            integration_test_name: newIntegrationTest.metadata?.name,
            bundle: newIntegrationTest.spec.bundle,
            pipeline: newIntegrationTest.spec.pipeline,
          }),
        editIntegrationTestLeave: () =>
          track(TrackEvents.ButtonClicked, {
            link_name: 'edit-integration-test-leave',
            // group_name: integrationTest?.spec.componentGroup, // TODO: check if it's okay
            integration_test_name: integrationTest?.metadata?.name,
          }),
        addIntegrationTestLeave: () =>
          track(TrackEvents.ButtonClicked, {
            link_name: 'add-integration-test-leave',
            // group_name: integrationTest?.spec.componentGroup, // TODO: check if it's okay
          }),
      }}
      createIntegrationTest={(integrationTestFormValues) =>
        createIntegrationTestForComponentGroup(
          integrationTestFormValues,
          groupName ?? '',
          namespace,
        )
      }
      defaultSelectedContextOption={defaultSelectedContextOptionForComponentGroups as FormContext}
    />
  );
};

export default IntegrationTestViewByGroup;
