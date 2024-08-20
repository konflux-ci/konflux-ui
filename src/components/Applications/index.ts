import { LoaderFunction } from 'react-router-dom';
import { ApplicationModel } from '../../models';
import { K8sListResourceItems } from '../../k8s/k8s-fetch';

export const applicationPageLoader: LoaderFunction<{ ws: string }> = async ({ params }) => {
  return K8sListResourceItems({
    model: ApplicationModel,
    queryOptions: { ns: 'user-ns1', ws: params.workspace },
  });
};
