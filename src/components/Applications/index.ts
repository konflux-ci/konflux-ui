import { LoaderFunction } from 'react-router-dom';
import { K8sQueryListResourceItems } from '../../k8s';
import { ApplicationModel } from '../../models';
import { createLoaderWithAccessCheck } from '../../utils/rbac';

const applicationPage: LoaderFunction = async ({ params }) => {
  return await K8sQueryListResourceItems({
    model: ApplicationModel,
    queryOptions: { ns: params.workspaceName },
  });
};

export const applicationPageLoader = createLoaderWithAccessCheck(applicationPage, {
  model: ApplicationModel,
  verb: 'list',
});

export { default as ApplicationListView } from './ApplicationListView';
