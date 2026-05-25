import { useParams } from 'react-router-dom';
import { RouterParams } from '@routes/utils';
import { DependencyRunsListView } from '~/components/Components/ComponentDependencyManager/DependencyRunsListView';
import { DetailsSection } from '~/components/DetailsPage';
import { FilterContextProvider } from '~/components/Filter/generic/FilterContext';
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
      <FilterContextProvider filterParams={['name', 'status']}>
        <DependencyRunsListView componentName={componentName} />
      </FilterContextProvider>
    </DetailsSection>
  );
};
