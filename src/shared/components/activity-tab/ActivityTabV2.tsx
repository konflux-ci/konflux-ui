import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Flex, Tab, Tabs, TabTitleText, Text, Title } from '@patternfly/react-core';
import { COMPONENT_ACTIVITY_V2_PATH, COMPONENT_VERSION_ACTIVITY_PATH } from '@routes/paths';
import { RouterParams } from '@routes/utils';
import CommitsListViewV2 from '~/components/Commits/CommitsListPage/CommitsListViewV2';
import { FilterContextProvider } from '~/components/Filter/generic/FilterContext';
import PipelineRunsListViewV2 from '~/components/PipelineRun/PipelineRunListView/PipelineRunsListViewV2';
import { useNamespace } from '~/shared/providers/Namespace';

export const ActivityTabV2: React.FC = () => {
  const namespace = useNamespace();
  const {
    componentName,
    versionRevision,
    activityTab = 'latest-commits',
  } = useParams<RouterParams>();
  const navigate = useNavigate();

  const getActivityTabRoute = React.useCallback(
    (tab: string) => {
      const baseUrl = versionRevision
        ? COMPONENT_VERSION_ACTIVITY_PATH
        : COMPONENT_ACTIVITY_V2_PATH;
      return `${baseUrl.createPath({ workspaceName: namespace, componentName, ...{ versionRevision } })}/${tab}`;
    },

    [namespace, componentName, versionRevision],
  );

  const setActiveTab = React.useCallback(
    (newTab: string) => {
      if (activityTab !== newTab) {
        navigate(getActivityTabRoute(newTab));
      }
    },
    [activityTab, getActivityTabRoute, navigate],
  );

  return (
    <Flex direction={{ default: 'column' }}>
      <Title size="xl" headingLevel="h3" className="pf-v5-c-title pf-v5-u-mt-lg pf-v5-u-mb-sm">
        Activity by
      </Title>
      <Text className="pf-v5-u-mb-sm">
        Monitor your commits and their pipeline progression{' '}
        {versionRevision ? 'in this component version' : 'across all component versions'}.
      </Text>
      <Tabs
        style={{
          width: 'fit-content',
          marginBottom: 'var(--pf-v5-global--spacer--md)',
        }}
        activeKey={activityTab}
        onSelect={(_, k: string) => {
          setActiveTab(k);
        }}
        data-test="activities-tabs-id"
        mountOnEnter
        unmountOnExit
      >
        <Tab
          data-test={`activity__tabItem latest-commits`}
          title={<TabTitleText>Latest commits</TabTitleText>}
          key="latest-commits"
          eventKey="latest-commits"
          className="activity-tab"
        >
          <FilterContextProvider filterParams={['name', 'status', 'version']}>
            <CommitsListViewV2 componentName={componentName} versionName={versionRevision} />
          </FilterContextProvider>
        </Tab>
        <Tab
          data-test={`activity__tabItem pipelineruns`}
          title={<TabTitleText>Pipeline runs</TabTitleText>}
          key="pipelineruns"
          eventKey="pipelineruns"
          className="activity-tab"
        >
          <FilterContextProvider filterParams={['name', 'status', 'type', 'version']}>
            <PipelineRunsListViewV2 componentName={componentName} versionName={versionRevision} />
          </FilterContextProvider>
        </Tab>
      </Tabs>
    </Flex>
  );
};
