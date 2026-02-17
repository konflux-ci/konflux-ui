import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Bullseye, Spinner, Tab, Tabs, TabTitleText } from '@patternfly/react-core';
import { FilterContextProvider } from '~/components/Filter/generic/FilterContext';
import { FeatureFlagIndicator } from '~/feature-flags/FeatureFlagIndicator';
import { IfFeature } from '~/feature-flags/hooks';
import { getErrorState } from '~/shared/utils/error-utils';
import { PipelineRunLabel } from '../../../../consts/pipelinerun';
import { useComponent } from '../../../../hooks/useComponents';
import { COMPONENT_ACTIVITY_V2_CHILD_TAB_PATH } from '../../../../routes/paths';
import { RouterParams } from '../../../../routes/utils';
import { useLocalStorage } from '../../../../shared/hooks/useLocalStorage';
import { useNamespace } from '../../../../shared/providers/Namespace/useNamespaceInfo';
import { PipelineRunKind } from '../../../../types';
import PipelineRunsTab from '../../../Activity/PipelineRunsTab';
import CommitsListView from '../../../Commits/CommitsListPage/CommitsListView';
import { DetailsSection } from '../../../DetailsPage';

export const ACTIVITY_SECONDARY_TAB_KEY = 'activity-secondary-tab';

export const ComponentActivityTab: React.FC = () => {
  const params = useParams<RouterParams>();
  const { activityTab, componentName } = params;
  const namespace = useNamespace();
  const [component, loaded, componentError] = useComponent(namespace, componentName);
  const [lastSelectedTab, setLocalStorageItem] = useLocalStorage<string>(
    `${componentName ?? ''}_${ACTIVITY_SECONDARY_TAB_KEY}`,
  );
  const currentTab = activityTab || lastSelectedTab || 'latest-commits';

  const getActivityTabRoute = React.useCallback(
    (tab: string) =>
      COMPONENT_ACTIVITY_V2_CHILD_TAB_PATH.createPath({
        workspaceName: namespace,
        componentName,
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

  React.useEffect(() => {
    if (activityTab !== lastSelectedTab) {
      setLocalStorageItem(currentTab);
    }
  }, [activityTab, lastSelectedTab, currentTab, setLocalStorageItem]);

  React.useEffect(() => {
    if (!activityTab && lastSelectedTab) {
      navigate(getActivityTabRoute(lastSelectedTab), { replace: true });
    }
  }, [activityTab, getActivityTabRoute, lastSelectedTab, navigate]);

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

  // We will not include any test pipelines that were run against the snapshot that contained the image.
  // If there is such a test pipeline directly run on the image itself, and not on the snapshot, then we want to include it
  const nonTestSnapShotFilter = (plr: PipelineRunKind) =>
    plr.metadata.labels?.[PipelineRunLabel.PIPELINE_TYPE] !== 'test' ||
    !plr.spec.params?.find((p) => p.name === 'SNAPSHOT');

  return (
    <IfFeature flag="components-page" fallback={null}>
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
              customFilter={nonTestSnapShotFilter}
            />
          </Tab>
        </Tabs>
      </DetailsSection>
    </IfFeature>
  );
};

export default ComponentActivityTab;
