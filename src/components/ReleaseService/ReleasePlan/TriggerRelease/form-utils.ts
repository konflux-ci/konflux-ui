import * as yup from 'yup';
import { K8sQueryCreateResource } from '../../../../k8s';
import { ReleaseGroupVersionKind, ReleaseModel } from '../../../../models';
import { CVE, ReleaseKind } from '../../../../types/coreBuildService';
import { resourceNameYupValidation } from '../../../../utils/validation-utils';

export enum ReleasePipelineLocation {
  current,
  target,
}

const getIssues = (issues): { id: string; source: string }[] => {
  return issues?.map((issue) => {
    return { id: issue.id, source: issue.source };
  });
};

export type TriggerReleaseFormValues = {
  releasePlan: string;
  snapshot: string;
  synopsis: string;
  topic: string;
  description?: string;
  solution?: string;
  references?: string;
  issues?: object[];
  cves?: CVE[];
  labels?: { key: string; value: string }[];
};

export const triggerReleaseFormSchema = yup.object({
  releasePlan: resourceNameYupValidation,
  snapshot: resourceNameYupValidation,
});

export const createRelease = async (
  values: TriggerReleaseFormValues,
  namespace: string,
  workspace: string,
) => {
  const {
    releasePlan: rp,
    snapshot,
    cves,
    topic,
    labels: labelPairs,
    description,
    solution,
    issues,
    references,
    synopsis,
  } = values;

  const labels = labelPairs
    .filter((l) => !!l.key)
    .reduce((acc, o) => ({ ...acc, [o.key]: o.value }), {} as Record<string, string>);

  const resource: ReleaseKind = {
    apiVersion: `${ReleaseGroupVersionKind.group}/${ReleaseGroupVersionKind.version}`,
    kind: ReleaseGroupVersionKind.kind,
    metadata: {
      generateName: rp,
      namespace,
      labels: {
        ...labels,
      },
    },
    spec: {
      releasePlan: rp,
      snapshot,
      data: {
        releaseNotes: {
          fixed: getIssues(issues),
          cves,
          references,
          synopsis,
          topic,
          description,
          solution,
        },
      },
    },
  };
  return await K8sQueryCreateResource({
    model: ReleaseModel,
    queryOptions: {
      ns: namespace,
      ws: workspace,
    },
    resource,
  });
};
