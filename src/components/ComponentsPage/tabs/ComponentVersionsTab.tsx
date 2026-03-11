import { useParams } from 'react-router-dom';
import { Title } from '@patternfly/react-core';
import { RouterParams } from '@routes/utils';
import ComponentVersionListView from '~/components/ComponentVersion/ComponentVersionListView/ComponentVersionListView';
import { FilterContextProvider } from '~/components/Filter/generic/FilterContext';

export const ComponentVersionsTab: React.FC = () => {
  const params = useParams<RouterParams>();
  const { componentName } = params;

  return (
    <>
      <Title size="lg" headingLevel="h4" className="pf-v5-c-title pf-v5-u-mt-lg pf-v5-u-mb-sm">
        Versions
      </Title>
      <FilterContextProvider filterParams={['name']}>
        <ComponentVersionListView componentName={componentName} />
      </FilterContextProvider>
    </>
  );
};
