import { useParams } from 'react-router-dom';
import { RouterParams } from '@routes/utils';
import { DetailsSection } from '~/components/DetailsPage';
import { FeatureFlagIndicator } from '~/feature-flags/FeatureFlagIndicator';
import { DependencyRunsListView } from '~/shared/components/DependencyManager/DependencyRunsListView';

export const DependencyTab = () => {
  const params = useParams<RouterParams>();
  const { applicationName, componentName } = params;

  return (
    <DetailsSection
      title={
        <>
          Dependency updates <FeatureFlagIndicator flags={['mintmaker']} />
        </>
      }
    >
      <DependencyRunsListView applicationName={applicationName} componentName={componentName} />
    </DetailsSection>
  );
};
