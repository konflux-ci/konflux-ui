import React from 'react';
import { useParams } from 'react-router-dom';
import { Bullseye, Spinner } from '@patternfly/react-core';
import { DetailsSection } from '~/components/DetailsPage';
import { DependencyRunsListView } from '~/components/MintMaker/DependencyRuns/DependencyRunsListView';
import { FeatureFlagIndicator } from '~/feature-flags/FeatureFlagIndicator';
import { useComponent } from '~/hooks/useComponents';
import { RouterParams } from '~/routes/utils';
import { useNamespace } from '~/shared/providers/Namespace';
import { getErrorState } from '~/shared/utils/error-utils';

export const ComponentDependencyTab: React.FC = () => {
  const namespace = useNamespace();
  const { applicationName, componentName } = useParams<RouterParams>();
  const [component, loaded, error] = useComponent(namespace, componentName, true);

  if (!loaded) {
    return (
      <Bullseye>
        <Spinner data-test="dependency-runs-spinner" />
      </Bullseye>
    );
  }

  if (error) {
    return getErrorState(error, loaded, 'dependency runs');
  }

  return (
    <DetailsSection
      title={
        <>
          Dependency updates <FeatureFlagIndicator flags={['mintmaker']} />
        </>
      }
    >
      <DependencyRunsListView
        applicationName={applicationName}
        componentNames={[component.metadata.name]}
        filterByCreationTimestampAfter={component.metadata.creationTimestamp}
        isSingleComponent
      />
    </DetailsSection>
  );
};

export default ComponentDependencyTab;
