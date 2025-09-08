import * as yup from 'yup';
import { K8sQueryCreateResource } from '../../../../k8s';
import { ReleaseGroupVersionKind, ReleaseModel } from '../../../../models';
import { CVE, ReleaseKind, ReleaseSpec } from '../../../../types/coreBuildService';
import { resourceNameYupValidation } from '../../../../utils/validation-utils';

export enum ReleasePipelineLocation {
  current,
  target,
}

export const getIssues = (issues): { id: string; source: string }[] => {
  return issues?.map((issue) => {
    return { id: issue.id, source: issue.source };
  });
};

// Create release notes object, filtering out empty values
export const createReleaseNotes = (values: {
  issues?: object[];
  cves?: CVE[];
  references?: string[];
  synopsis?: string;
  topic?: string;
  description?: string;
  solution?: string;
}) => {
  const { issues, cves, references, synopsis, topic, description, solution } = values;

  const releaseNotes: NonNullable<ReleaseSpec['data']>['releaseNotes'] = {};

  // Only add fields if they have values
  if (synopsis?.trim()) {
    releaseNotes.synopsis = synopsis;
  }
  if (description?.trim()) {
    releaseNotes.description = description;
  }
  if (topic?.trim()) {
    releaseNotes.topic = topic;
  }
  if (solution?.trim()) {
    releaseNotes.solution = solution;
  }
  if (references?.length > 0) {
    releaseNotes.references = references;
  }
  if (issues?.length > 0) {
    releaseNotes.issues = { fixed: getIssues(issues) };
  }
  if (cves?.length > 0) {
    releaseNotes.cves = cves;
  }

  // Return undefined if no fields were added
  return Object.keys(releaseNotes).length > 0 ? releaseNotes : undefined;
};

export type TriggerReleaseFormValues = {
  releasePlan: string;
  snapshot: string;
  synopsis?: string;
  topic?: string;
  description?: string;
  solution?: string;
  references?: string[];
  issues?: object[];
  cves?: CVE[];
  labels?: { key: string; value: string }[];
};

export const triggerReleaseFormSchema = yup.object({
  releasePlan: resourceNameYupValidation,
  snapshot: resourceNameYupValidation,
});

export const createRelease = async (values: TriggerReleaseFormValues, namespace: string) => {
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

  // Create release notes object and filter out empty values
  const releaseNotes = createReleaseNotes({
    issues,
    cves,
    references,
    synopsis,
    topic,
    description,
    solution,
  });

  // Only include data if releaseNotes has any non-empty fields
  const data = releaseNotes ? { releaseNotes } : undefined;

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
      ...(data && { data: data as ReleaseSpec['data'] }),
    },
  };
  return await K8sQueryCreateResource({
    model: ReleaseModel,
    queryOptions: {
      ns: namespace,
    },
    resource,
  });
};
