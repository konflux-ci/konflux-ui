import { useParams } from 'react-router-dom';
import { FilterContextProvider } from '~/components/Filter/generic/FilterContext';
import { K8sQueryListResourceItems } from '../../../k8s';
import { ComponentModel } from '../../../models';
import { RouterParams } from '../../../routes/utils';
import { createLoaderWithAccessCheck } from '../../../utils/rbac';
import { default as ComponentListView } from './ComponentListView';

export const componentsTabLoader = createLoaderWithAccessCheck(
  async ({ params }) => {
    const ns = params[RouterParams.workspaceName];
    return K8sQueryListResourceItems({
      model: ComponentModel,
      queryOptions: { ns },
    });
  },
  { model: ComponentModel, verb: 'list' },
);

export const ComponentListTab: React.FC = () => {
  const { applicationName } = useParams<RouterParams>();
  return (
    <FilterContextProvider filterParams={['name', 'status']}>
      <ComponentListView applicationName={applicationName} />
    </FilterContextProvider>
  );
};
