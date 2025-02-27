import { k8sQueryGetResource, K8sQueryListResourceItems } from '../../k8s';
import { ReleaseModel, ReleasePlanModel } from '../../models';
import { ReleasePlanAdmissionModel } from '../../models/release-plan-admission';
import { RouterParams } from '../../routes/utils';
import { getLastUsedNamespace } from '../../shared/providers/Namespace/utils';
import { createLoaderWithAccessCheck } from '../../utils/rbac';

export const releasePlanListLoader = createLoaderWithAccessCheck(
  async () => {
    const ns = getLastUsedNamespace();
    return K8sQueryListResourceItems({
      model: ReleasePlanModel,
      queryOptions: { ns },
    });
  },
  { model: ReleasePlanModel, verb: 'list' },
);

export const releasePlanAdmissionListLoader = createLoaderWithAccessCheck(
  async () => {
    const ns = getLastUsedNamespace();
    return K8sQueryListResourceItems({
      model: ReleasePlanAdmissionModel,
      queryOptions: { ns },
    });
  },
  { model: ReleasePlanAdmissionModel, verb: 'list' },
);

export const releasePlanTriggerLoader = createLoaderWithAccessCheck(async () => {
  const ns = getLastUsedNamespace();
  return K8sQueryListResourceItems({
    model: ReleasePlanModel,
    queryOptions: { ns },
  });
}, [
  { model: ReleasePlanModel, verb: 'list' },
  { model: ReleaseModel, verb: 'create' },
]);

export const releasePlanEditFormLoader = createLoaderWithAccessCheck(
  async ({ params }) => {
    const ns = getLastUsedNamespace();
    return k8sQueryGetResource({
      model: ReleasePlanModel,
      queryOptions: {
        ns,
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
