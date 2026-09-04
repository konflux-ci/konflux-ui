import { useParams } from 'react-router-dom';
import { RouterParams } from '@routes/utils';
import { DetailsSection } from '~/components/DetailsPage';
import { DependencyRunsListView } from '~/components/MintMaker/DependencyRuns/DependencyRunsListView';
import { FeatureFlagIndicator } from '~/feature-flags/FeatureFlagIndicator';

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
