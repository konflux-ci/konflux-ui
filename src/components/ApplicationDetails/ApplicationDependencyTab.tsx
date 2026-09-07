import React from 'react';
import { useParams } from 'react-router-dom';
import { Bullseye, Spinner } from '@patternfly/react-core';
import { DetailsSection } from '~/components/DetailsPage';
import { DependencyRunsListView } from '~/components/MintMaker/DependencyRuns/DependencyRunsListView';
import { FeatureFlagIndicator } from '~/feature-flags/FeatureFlagIndicator';
import { useApplication } from '~/hooks/useApplications';
import { useComponents } from '~/hooks/useComponents';
import { RouterParams } from '~/routes/utils';
import { useNamespace } from '~/shared/providers/Namespace';
import { getErrorState } from '~/shared/utils/error-utils';

export const ApplicationDependencyTab: React.FC = () => {
  const namespace = useNamespace();
  const { applicationName } = useParams<RouterParams>();
  const [application, applicationLoaded, applicationError] = useApplication(
    namespace,
    applicationName,
  );
  const [components, componentsLoaded, componentsError] = useComponents(
    namespace,
    applicationName,
    true,
  );

  if (!applicationLoaded || !componentsLoaded) {
    return (
      <Bullseye>
        <Spinner data-test="dependency-runs-spinner" />
      </Bullseye>
    );
  }

  const error = applicationError ?? componentsError;
  if (error) {
    return getErrorState(
      error,
      applicationError ? applicationLoaded : componentsLoaded,
      'dependency runs',
    );
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
        componentNames={components.map((component) => component.metadata.name)}
        filterByCreationTimestampAfter={application.metadata.creationTimestamp}
        isSingleComponent={false}
      />
    </DetailsSection>
  );
};

export default ApplicationDependencyTab;
