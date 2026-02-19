import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Bullseye, Spinner, Tab, Tabs, TabTitleText } from '@patternfly/react-core';
import PipelineRunsTab from '~/components/Activity/PipelineRunsTab';
import CommitsListView from '~/components/Commits/CommitsListPage/CommitsListView';
import { DetailsSection } from '~/components/DetailsPage';
import { FilterContextProvider } from '~/components/Filter/generic/FilterContext';
import { PipelineRunLabel } from '~/consts/pipelinerun';
import { FeatureFlagIndicator } from '~/feature-flags/FeatureFlagIndicator';
import { IfFeature } from '~/feature-flags/hooks';
import { useComponent } from '~/hooks/useComponents';
import { COMPONENT_VERSION_ACTIVITY_CHILD_TAB_PATH } from '~/routes/paths';
import { RouterParams } from '~/routes/utils';
import { useLocalStorage } from '~/shared/hooks/useLocalStorage';
import { useNamespace } from '~/shared/providers/Namespace/useNamespaceInfo';
import { getErrorState } from '~/shared/utils/error-utils';
import { PipelineRunKind } from '~/types';

export const COMPONENT_VERSION_ACTIVITY_SECONDARY_TAB_KEY = 'component-version-activity-tab';

const ComponentVersionActivityTab: React.FC = () => {
  const params = useParams<RouterParams>();
  const { activityTab, componentName, versionName } = params;
  const namespace = useNamespace();
  const [component, loaded, componentError] = useComponent(namespace, componentName ?? '');
  const [lastSelectedTab, setLocalStorageItem] = useLocalStorage<string>(
    `${componentName ?? ''}_${versionName ?? ''}_${COMPONENT_VERSION_ACTIVITY_SECONDARY_TAB_KEY}`,
  );
  const currentTab = activityTab || lastSelectedTab || 'latest-commits';

  const getActivityTabRoute = React.useCallback(
    (tab: string) =>
      COMPONENT_VERSION_ACTIVITY_CHILD_TAB_PATH.createPath({
        workspaceName: namespace,
        componentName: componentName ?? '',
        versionName: versionName ?? '',
        activityTab: tab,
      }),
    [componentName, namespace, versionName],
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

  const nonTestSnapShotFilter = (plr: PipelineRunKind) =>
    plr.metadata.labels?.[PipelineRunLabel.PIPELINE_TYPE] !== 'test' ||
    !plr.spec.params?.find((p) => p.name === 'SNAPSHOT');

  return (
    <IfFeature flag="components-page">
      <DetailsSection
        title="Activity"
        featureFlag={
          <FeatureFlagIndicator flags={['pipelineruns-kubearchive', 'components-page']} />
        }
        description="Monitor your commits and their pipeline progression for this branch."
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
          data-test="component-version-activities-tabs-id"
          unmountOnExit
        >
          <Tab
            data-test="comp-version-activity-tab-commits"
            title={<TabTitleText>Commits</TabTitleText>}
            key="commits"
            eventKey="latest-commits"
            className="activity-tab"
          >
            <FilterContextProvider filterParams={['name', 'status']}>
              <CommitsListView
                applicationName={applicationName}
                componentName={component?.spec?.componentName}
                branchName={versionName}
              />
            </FilterContextProvider>
          </Tab>
          <Tab
            data-test="comp-version-activity-tab-pipelineruns"
            title={<TabTitleText>Pipeline runs</TabTitleText>}
            key="pipelineruns"
            eventKey="pipelineruns"
            className="activity-tab"
          >
            <PipelineRunsTab
              applicationName={applicationName}
              componentName={component?.spec?.componentName}
              branchName={versionName}
              customFilter={nonTestSnapShotFilter}
            />
          </Tab>
        </Tabs>
      </DetailsSection>
    </IfFeature>
  );
};

export default ComponentVersionActivityTab;
