import * as yup from 'yup';
import { K8sQueryCreateResource, K8sQueryPatchResource } from '../../../k8s';
import { SpaceBindingRequestGroupVersionKind, SpaceBindingRequestModel } from '../../../models';
import { SpaceBindingRequest, WorkspaceRole } from '../../../types';

export type UserAccessFormValues = {
  usernames: string[];
  role: WorkspaceRole;
};

export const userAccessFormSchema = yup.object({
  usernames: yup
    .array()
    .of(yup.string())
    .min(1, 'Must have at least 1 username.')
    .required('Required.'),
  role: yup
    .string()
    .matches(/contributor|maintainer|admin/, 'Invalid role.')
    .required('Required.'),
});

export const createSBRs = async (
  values: UserAccessFormValues,
  namespace: string,
  dryRun?: boolean,
): Promise<SpaceBindingRequest[]> => {
  const { usernames, role } = values;
  const objs: SpaceBindingRequest[] = usernames.map((username) => ({
    apiVersion: `${SpaceBindingRequestGroupVersionKind.group}/${SpaceBindingRequestGroupVersionKind.version}`,
    kind: SpaceBindingRequestGroupVersionKind.kind,
    metadata: {
      generateName: `${username}-`,
      namespace,
    },
    spec: {
      masterUserRecord: username,
      spaceRole: role,
    },
  }));

  return Promise.all(
    objs.map((obj) =>
      K8sQueryCreateResource({
        model: SpaceBindingRequestModel,
        queryOptions: {
          ns: namespace,
          ...(dryRun && { queryParams: { dryRun: 'All' } }),
        },
        resource: obj,
      }),
    ),
  );
};

/**
 * Only updates one SBR, but returning array to
 * keep it consistent with `createSBRs()`
 */
export const editSBR = async (
  values: UserAccessFormValues,
  sbr: SpaceBindingRequest,
  dryRun?: boolean,
): Promise<SpaceBindingRequest[]> => {
  const { role } = values;

  return Promise.all([
    K8sQueryPatchResource({
      model: SpaceBindingRequestModel,
      queryOptions: {
        name: sbr.metadata.name,
        ns: sbr.metadata.namespace,
        ...(dryRun && { queryParams: { dryRun: 'All' } }),
      },
      patches: [
        {
          op: 'replace',
          path: '/spec/spaceRole',
          value: role,
        },
      ],
    }),
  ]) as Promise<SpaceBindingRequest[]>;
};
