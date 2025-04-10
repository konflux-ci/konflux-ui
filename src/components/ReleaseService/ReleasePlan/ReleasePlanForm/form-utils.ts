import * as yup from 'yup';
import { K8sQueryCreateResource, K8sQueryUpdateResource } from '../../../../k8s';
import { ReleasePlanGroupVersionKind, ReleasePlanModel } from '../../../../models';
import { RELEASE_SERVICE_PATH } from '../../../../routes/paths';
import { Param } from '../../../../types';
import {
  ReleasePlanKind,
  ReleasePlanLabel,
  ResolverType,
} from '../../../../types/coreBuildService';
import { GIT_URL_REGEX, resourceNameYupValidation } from '../../../../utils/validation-utils';
import { ResolverRefParams } from '../../../IntegrationTests/IntegrationTestForm/utils/create-utils';

export enum ReleasePipelineLocation {
  current,
  target,
}

export type ReleasePlanFormValues = {
  name: string;
  application: string;
  autoRelease?: boolean;
  standingAttribution?: boolean;
  releasePipelineLocation: ReleasePipelineLocation;
  git: {
    url: string;
    revision: string;
    path: string;
  };
  serviceAccount?: string;
  target?: string;
  labels?: { key: string; value: string }[];
  params?: Param[];
  data?: string;
};

export const releasePlanFormSchema = yup.object({
  name: resourceNameYupValidation,
  application: yup.string().required('Required'),
  git: yup.object().when('releasePipelineLocation', {
    is: ReleasePipelineLocation.current,
    then: yup.object({
      url: yup.string().matches(GIT_URL_REGEX).required('Required'),
      revision: yup.string().required('Required'),
      path: yup.string().required('Required'),
    }),
    otherwise: yup.object({
      url: yup.string().matches(GIT_URL_REGEX),
      revision: yup.string(),
      path: yup.string(),
    }),
  }),
  serviceAccount: yup.string().when('releasePipelineLocation', {
    is: ReleasePipelineLocation.current,
    then: yup.string().required('Required'),
  }),
  target: yup.string().when('releasePipelineLocation', {
    is: ReleasePipelineLocation.target,
    then: yup.string().required('Required'),
  }),
});

export const releasePlanFormParams = (releasePlan: ReleasePlanKind) =>
  (releasePlan?.spec?.pipelineRef?.params?.filter(
    (p) =>
      p.name !== ResolverRefParams.URL &&
      p.name !== ResolverRefParams.REVISION &&
      p.name !== ResolverRefParams.PATH,
  ) ?? []) as Param[];

export const createReleasePlan = async (
  values: ReleasePlanFormValues,
  namespace: string,
  dryRun?: boolean,
) => {
  const {
    name,
    application,
    serviceAccount,
    target,
    labels: labelPairs,
    releasePipelineLocation,
    git,
    data,
    params,
    autoRelease,
    standingAttribution,
  } = values;
  const targetNs = releasePipelineLocation === ReleasePipelineLocation.current ? namespace : target;
  const labels = labelPairs
    .filter((l) => !!l.key)
    .reduce((acc, o) => ({ ...acc, [o.key]: o.value }), {} as Record<string, string>);
  const resource: ReleasePlanKind = {
    apiVersion: `${ReleasePlanGroupVersionKind.group}/${ReleasePlanGroupVersionKind.version}`,
    kind: ReleasePlanGroupVersionKind.kind,
    metadata: {
      name,
      namespace,
      labels: {
        ...labels,
        ...{
          [ReleasePlanLabel.AUTO_RELEASE]: String(Boolean(autoRelease)),
          [ReleasePlanLabel.STANDING_ATTRIBUTION]: String(Boolean(standingAttribution)),
        },
      },
    },
    spec: {
      application,
      ...(data ? { data } : {}),
      serviceAccount,
      target: `${targetNs}`,
      pipelineRef: {
        resolver: ResolverType.GIT,
        params: [
          ...params,
          { name: ResolverRefParams.URL, value: git.url },
          { name: ResolverRefParams.REVISION, value: git.revision },
          { name: ResolverRefParams.PATH, value: git.path },
        ],
      },
    },
  };
  return await K8sQueryCreateResource({
    model: ReleasePlanModel,
    queryOptions: {
      name,
      ns: namespace,
      ...(dryRun && { queryParams: { dryRun: 'All' } }),
    },
    resource,
  });
};

export const editReleasePlan = async (
  releasePlan: ReleasePlanKind,
  values: ReleasePlanFormValues,
  namespace: string,
  dryRun?: boolean,
) => {
  const {
    application,
    serviceAccount,
    target,
    labels: labelPairs,
    releasePipelineLocation,
    git,
    data,
    params,
    autoRelease,
    standingAttribution,
  } = values;
  const targetNs = releasePipelineLocation === ReleasePipelineLocation.current ? namespace : target;
  const labels = labelPairs
    .filter((l) => !!l.key)
    .reduce((acc, o) => ({ ...acc, [o.key]: o.value }), {} as Record<string, string>);
  const resource: ReleasePlanKind = {
    ...releasePlan,
    apiVersion: `${ReleasePlanGroupVersionKind.group}/${ReleasePlanGroupVersionKind.version}`,
    kind: ReleasePlanGroupVersionKind.kind,
    metadata: {
      ...releasePlan.metadata,
      labels: {
        ...labels,
        ...{
          [ReleasePlanLabel.AUTO_RELEASE]: String(Boolean(autoRelease)),
          [ReleasePlanLabel.STANDING_ATTRIBUTION]: String(Boolean(standingAttribution)),
        },
      },
    },
    spec: {
      ...releasePlan.spec,
      application,
      ...(data ? { data } : {}),
      serviceAccount,
      target: `${targetNs}`,
      pipelineRef: {
        resolver: ResolverType.GIT,
        params: [
          ...params,
          { name: ResolverRefParams.URL, value: git.url },
          { name: ResolverRefParams.REVISION, value: git.revision },
          { name: ResolverRefParams.PATH, value: git.path },
        ],
      },
    },
  };
  return await K8sQueryUpdateResource({
    model: ReleasePlanModel,
    queryOptions: {
      name: releasePlan.metadata.name,
      ns: releasePlan.metadata.namespace,
      ...(dryRun && { queryParams: { dryRun: 'All' } }),
    },
    resource,
  });
};

export const getReleasePlanFormBreadcrumbs = (namespace, edit) => {
  return [
    {
      path: RELEASE_SERVICE_PATH.createPath({ workspaceName: namespace }),
      name: 'Releases',
    },
    {
      path: '#',
      name: edit ? 'Edit release plan' : 'Create release plan',
    },
  ];
};
