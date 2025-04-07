import { ReleaseKind } from '../types/release';

export const getNamespaceAndPRName = (
  releasePipelineRunReference: string,
): [namespace?: string, pipelineRun?: string] => {
  return releasePipelineRunReference
    ? (releasePipelineRunReference.split('/').slice(0, 2) as [string?, string?])
    : [undefined, undefined];
};

export const getManagedPipelineRunFromRelease = (release: ReleaseKind): string => {
  return release.status?.managedProcessing?.pipelineRun;
};

export const getTenantPipelineRunFromRelease = (release: ReleaseKind): string => {
  return release.status?.tenantProcessing?.pipelineRun;
};

export const getFinalPipelineRunFromRelease = (release: ReleaseKind): string => {
  return release.status?.finalProcessing?.pipelineRun;
};
