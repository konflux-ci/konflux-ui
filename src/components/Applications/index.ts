import { LoaderFunction } from 'react-router-dom';
import { K8sListResourceItems } from '../../k8s/k8s-fetch';
import { ApplicationModel } from '../../models';

export const applicationPageLoader: LoaderFunction<{ ws: string }> = async ({ params }) => {
  return K8sListResourceItems({
    model: ApplicationModel,
    queryOptions: { ns: 'user-ns1', ws: params.workspace },
  });
};
