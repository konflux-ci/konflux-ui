import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Tab, Tabs, TabTitleText, Text, Title } from '@patternfly/react-core';
import { INTEGRATION_TEST_LIST_PATH } from '../../routes/paths';
import { RouterParams } from '../../routes/utils';
import { FilterContextProvider } from '../Filter/generic/FilterContext';
import { IntegrationTestsListView } from './IntegrationTestsListView/IntegrationTestsListView';
import { ScheduledJobsTab } from './ScheduledJobsTab';

export const INTEGRATION_TESTS_SECONDARY_TAB_KEY = 'integration-tests-secondary-tab';

export const IntegrationTestsTab: React.FC = () => {
  const params = useParams<RouterParams>();
  const { applicationName, workspaceName, integrationTestTab } = params;

  // Ensure we have a valid tab, defaulting to 'list'
  const currentTab = integrationTestTab || 'list';

  const getIntegrationTestTabRoute = React.useCallback(
    (tab: string) =>
      `${INTEGRATION_TEST_LIST_PATH.createPath({ workspaceName, applicationName })}/tabs/${tab}`,
    [applicationName, workspaceName],
  );

  const navigate = useNavigate();
  const setActiveTab = React.useCallback(
    (newTab: string) => {
      if (currentTab !== newTab) {
        const newRoute = getIntegrationTestTabRoute(newTab);
        navigate(newRoute);
      }
    },
    [currentTab, getIntegrationTestTabRoute, navigate],
  );

  return (
    <>
      <Title size="xl" headingLevel="h3" className="pf-v5-c-title pf-v5-u-mt-lg pf-v5-u-mb-sm">
        Integration tests
      </Title>
      <Text className="pf-v5-u-mb-sm">
        Manage integration tests and scheduled jobs for your application.
      </Text>
      <Tabs
        style={{
          width: 'fit-content',
          marginBottom: 'var(--pf-v5-global--spacer--md)',
        }}
        activeKey={currentTab}
        onSelect={(_, k: string) => {
          setActiveTab(k);
        }}
        data-test="integration-tests-tabs-id"
        mountOnEnter
        unmountOnExit
      >
        <Tab
          data-test={`integration-tests__tabItem list`}
          title={<TabTitleText>Tests</TabTitleText>}
          key="list"
          eventKey="list"
          className="integration-tests-tab"
        >
          <FilterContextProvider filterParams={['name']}>
            <IntegrationTestsListView />
          </FilterContextProvider>
        </Tab>
        <Tab
          data-test={`integration-tests__tabItem scheduled`}
          title={<TabTitleText>Scheduled jobs</TabTitleText>}
          key="scheduled"
          eventKey="scheduled"
          className="integration-tests-tab"
        >
          <ScheduledJobsTab />
        </Tab>
      </Tabs>
    </>
  );
};
