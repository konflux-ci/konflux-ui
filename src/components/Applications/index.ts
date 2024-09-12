import { LoaderFunction } from 'react-router-dom';
import { K8sListResourceItems } from '../../k8s/k8s-fetch';
import { ApplicationModel } from '../../models';
import { createLoaderWithAccessCheck } from '../../utils/rbac';
import { getNamespaceUsingWorspaceFromQueryCache } from '../Workspace/utils';

const applicationPage: LoaderFunction = async ({ params }) => {
  const ns = await getNamespaceUsingWorspaceFromQueryCache(params.workspaceName);
  return ns
    ? await K8sListResourceItems({
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
