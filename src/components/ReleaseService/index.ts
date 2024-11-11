import { k8sQueryGetResource, K8sQueryListResourceItems } from '../../k8s';
import { ReleaseModel, ReleasePlanModel } from '../../models';
import { ReleasePlanAdmissionModel } from '../../models/release-plan-admission';
import { RouterParams } from '../../routes/utils';
import { createLoaderWithAccessCheck } from '../../utils/rbac';
import { getNamespaceUsingWorspaceFromQueryCache } from '../Workspace/utils';

export const releasePlanListLoader = createLoaderWithAccessCheck(
  async ({ params }) => {
    const ns = await getNamespaceUsingWorspaceFromQueryCache(params[RouterParams.workspaceName]);
    return K8sQueryListResourceItems({
      model: ReleasePlanModel,
      queryOptions: { ns, ws: params[RouterParams.workspaceName] },
    });
  },
  { model: ReleasePlanModel, verb: 'list' },
);

export const releasePlanAdmissionListLoader = createLoaderWithAccessCheck(
  async ({ params }) => {
    const ns = await getNamespaceUsingWorspaceFromQueryCache(params[RouterParams.workspaceName]);
    return K8sQueryListResourceItems({
      model: ReleasePlanAdmissionModel,
      queryOptions: { ns, ws: params[RouterParams.workspaceName] },
    });
  },
  { model: ReleasePlanAdmissionModel, verb: 'list' },
);

export const releasePlanTriggerLoader = createLoaderWithAccessCheck(
  async ({ params }) => {
    const ns = await getNamespaceUsingWorspaceFromQueryCache(params[RouterParams.workspaceName]);
    return K8sQueryListResourceItems({
      model: ReleasePlanModel,
      queryOptions: { ns, ws: params[RouterParams.workspaceName] },
    });
  },
  [
    { model: ReleasePlanModel, verb: 'list' },
    { model: ReleaseModel, verb: 'create' },
  ],
);

export const releasePlanEditFormLoader = createLoaderWithAccessCheck(
  async ({ params }) => {
    const ns = await getNamespaceUsingWorspaceFromQueryCache(params[RouterParams.workspaceName]);
    return k8sQueryGetResource({
      model: ReleasePlanModel,
      queryOptions: {
        ns,
        ws: params[RouterParams.workspaceName],
        name: params[RouterParams.releasePlanName],
      },
    });
  },
  { model: ReleasePlanModel, verb: 'update' },
);

export const releasePlanCreateFormLoader = createLoaderWithAccessCheck(() => null, {
  model: ReleasePlanModel,
  verb: 'create',
});

export { ReleaseService } from './ReleaseService';
export { default as ReleasePlanListView } from './ReleasePlan/ReleasePlanListView';
export { default as ReleasePlanAdmissionListView } from './ReleasePlanAdmission/ReleasePlanAdmissionListView';
export { TriggerReleaseFormPage } from './ReleasePlan/TriggerRelease/TriggerReleaseFormPage';
export { ReleasePlanCreateFormPage, ReleasePlanEditFormPage } from './ReleasePlan/ReleasePlanForm';
