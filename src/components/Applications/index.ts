import { LoaderFunction } from 'react-router-dom';
import { K8sQueryListResourceItems } from '../../k8s';
import { ApplicationModel } from '../../models';
import { createLoaderWithAccessCheck } from '../../utils/rbac';
import { getNamespaceUsingWorspaceFromQueryCache } from '../Workspace/utils';

const applicationPage: LoaderFunction = async ({ params }) => {
  const ns = await getNamespaceUsingWorspaceFromQueryCache(params.workspaceName);
  return ns
    ? await K8sQueryListResourceItems({
        model: ApplicationModel,
        queryOptions: { ns, ws: params.workspaceName },
      })
    : Promise.resolve([]);
};

export const applicationPageLoader = createLoaderWithAccessCheck(applicationPage, {
  model: ApplicationModel,
  verb: 'list',
});

export { default as ApplicationListView } from './ApplicationListView';
