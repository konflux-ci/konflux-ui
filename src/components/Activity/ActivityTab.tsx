import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Tab, Tabs, TabTitleText } from '@patternfly/react-core';
import { FeatureFlagIndicator } from '~/feature-flags/FeatureFlagIndicator';
import ListLayout from '~/shared/components/list-layout/ListLayout';
import { APPLICATION_ACTIVITY_PATH } from '../../routes/paths';
import { RouterParams } from '../../routes/utils';
import CommitsListView from '../Commits/CommitsListPage/CommitsListView';
import { FilterContextProvider } from '../Filter/generic/FilterContext';
import PipelineRunsTab from './PipelineRunsTab';

import './ActivityTab.scss';

export const ACTIVITY_SECONDARY_TAB_KEY = 'activity-secondary-tab';

/**
 * @deprecated
 * Replaced by ActivityTabV2 with new component model
 */
export const ActivityTab: React.FC = () => {
  const params = useParams<RouterParams>();
  const { applicationName, workspaceName, activityTab = 'latest-commits' } = params;
  const currentTab = activityTab || 'latest-commits';

  const getActivityTabRoute = React.useCallback(
    (tab: string) =>
      `${APPLICATION_ACTIVITY_PATH.createPath({ workspaceName, applicationName })}/${tab}`,
    [applicationName, workspaceName],
  );

  const navigate = useNavigate();
  const setActiveTab = React.useCallback(
    (newTab: string) => {
      if (currentTab !== newTab) {
        navigate(getActivityTabRoute(newTab));
      }
    },
    [currentTab, getActivityTabRoute, navigate],
  );

  return (
    <ListLayout
      title={
        <>
          Activity by <FeatureFlagIndicator flags={['pipelineruns-kubearchive']} />
        </>
      }
      description="Monitor your commits and their pipeline progression across all components."
    >
      <Tabs
        style={{
          width: 'fit-content',
          marginBottom: 'var(--pf-t--global--spacer--md)',
        }}
        activeKey={currentTab}
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
          <FilterContextProvider filterParams={['name', 'status']}>
            <CommitsListView applicationName={applicationName} />
          </FilterContextProvider>
        </Tab>
        <Tab
          data-test={`activity__tabItem pipelineruns`}
          title={<TabTitleText>Pipeline runs</TabTitleText>}
          key="pipelineruns"
          eventKey="pipelineruns"
          className="activity-tab"
        >
          <PipelineRunsTab applicationName={applicationName} />
        </Tab>
      </Tabs>
    </ListLayout>
  );
};
