import { useParams } from 'react-router-dom';
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
      queryOptions: { ns, ws: params[RouterParams.workspaceName] },
    });
  },
  { model: ComponentModel, verb: 'list' },
);

export const ComponentListTab: React.FC = () => {
  const { applicationName } = useParams<RouterParams>();
  return <ComponentListView applicationName={applicationName} />;
};
