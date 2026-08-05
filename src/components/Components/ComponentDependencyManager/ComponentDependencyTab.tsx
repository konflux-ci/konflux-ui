import { useParams } from 'react-router-dom';
import { RouterParams } from '@routes/utils';
import { DependencyRunsListView } from '~/components/Components/ComponentDependencyManager/DependencyRunsListView';
import { DetailsSection } from '~/components/DetailsPage';
import { FeatureFlagIndicator } from '~/feature-flags/FeatureFlagIndicator';

export const ComponentDependencyTab = () => {
  const params = useParams<RouterParams>();
  const { componentName } = params;

  return (
    <DetailsSection
      title={
        <>
          Dependency updates <FeatureFlagIndicator flags={['mintmaker']} />
        </>
      }
    >
      <DependencyRunsListView componentName={componentName} />
    </DetailsSection>
  );
};
