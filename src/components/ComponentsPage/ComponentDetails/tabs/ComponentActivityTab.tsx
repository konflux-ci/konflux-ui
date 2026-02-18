import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Bullseye, Spinner, Tab, Tabs, TabTitleText } from '@patternfly/react-core';
import PipelineRunsTab from '~/components/Activity/PipelineRunsTab';
import CommitsListView from '~/components/Commits/CommitsListPage/CommitsListView';
import { DetailsSection } from '~/components/DetailsPage';
import { FilterContextProvider } from '~/components/Filter/generic/FilterContext';
import { FeatureFlagIndicator } from '~/feature-flags/FeatureFlagIndicator';
import { IfFeature } from '~/feature-flags/hooks';
import { useComponent } from '~/hooks/useComponents';
import { COMPONENT_ACTIVITY_V2_CHILD_TAB_PATH } from '~/routes/paths';
import { RouterParams } from '~/routes/utils';
import { useNamespace } from '~/shared/providers/Namespace/useNamespaceInfo';
import { getErrorState } from '~/shared/utils/error-utils';

export const ComponentActivityTab: React.FC = () => {
  const params = useParams<RouterParams>();
  const { activityTab, componentName } = params;
  const namespace = useNamespace();
  const [component, loaded, componentError] = useComponent(namespace, componentName ?? '');
  const currentTab = activityTab || 'latest-commits';

  const getActivityTabRoute = React.useCallback(
    (tab: string) =>
      COMPONENT_ACTIVITY_V2_CHILD_TAB_PATH.createPath({
        workspaceName: namespace,
        componentName: componentName ?? '',
        activityTab: tab,
      }),
    [componentName, namespace],
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

  if (!componentName) {
    return null;
  }

  if (!loaded) {
    return (
      <Bullseye>
        <Spinner data-test="spinner" />
      </Bullseye>
    );
  }

  if (componentError) {
    return getErrorState(componentError, loaded, 'component');
  }

  const applicationName = component?.spec?.application;

  return (
    <IfFeature flag="components-page">
      <DetailsSection
        title="Activity"
        featureFlag={
          <FeatureFlagIndicator flags={['pipelineruns-kubearchive', 'components-page']} />
        }
        description="Monitor your commits and their pipeline progression across all components."
      >
        <Tabs
          style={{
            width: 'fit-content',
            marginBottom: 'var(--pf-v5-global--spacer--md)',
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
            data-test={`comp__activity__tabItem commits`}
            title={<TabTitleText>Commits</TabTitleText>}
            key="commits"
            eventKey="latest-commits"
            className="activity-tab"
          >
            <FilterContextProvider filterParams={['name', 'status']}>
              <CommitsListView
                applicationName={applicationName}
                componentName={component?.spec?.componentName}
              />
            </FilterContextProvider>
          </Tab>
          <Tab
            data-test={`comp__activity__tabItem pipelineruns`}
            title={<TabTitleText>Pipeline runs</TabTitleText>}
            key="pipelineruns"
            eventKey="pipelineruns"
            className="activity-tab"
          >
            <PipelineRunsTab
              applicationName={applicationName}
              componentName={component?.spec?.componentName}
            />
          </Tab>
        </Tabs>
      </DetailsSection>
    </IfFeature>
  );
};

export default ComponentActivityTab;
