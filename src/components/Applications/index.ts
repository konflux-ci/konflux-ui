import { LoaderFunction } from 'react-router-dom';
import { K8sListResourceItems } from '../../k8s/k8s-fetch';
import { ApplicationModel } from '../../models';
import { getNamespaceUsingWorspaceFromQueryCache } from '../Workspace/utils';

export const applicationPageLoader: LoaderFunction<{ ws: string }> = async ({ params }) => {
  const ns = getNamespaceUsingWorspaceFromQueryCache(params.workspaceName);
  return ns
    ? await K8sListResourceItems({
        model: ApplicationModel,
        queryOptions: { ns, ws: params.workspaceName },
      })
    : Promise.resolve([]);
};
