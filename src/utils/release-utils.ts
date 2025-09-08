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

export const getTenantCollectorPipelineRunFromRelease = (release: ReleaseKind): string => {
  return release.status?.collectorsProcessing?.tenantCollectorsProcessing?.pipelineRun;
};

export const getFinalPipelineRunFromRelease = (release: ReleaseKind): string => {
  return release.status?.finalProcessing?.pipelineRun;
};

export const getManagedProcessingFromRelease = (release: ReleaseKind) => {
  return release.status?.managedProcessing;
};

export const getTenantProcessingFromRelease = (release: ReleaseKind) => {
  return release.status?.tenantProcessing;
};

export const getTenantCollectorProcessingFromRelease = (release: ReleaseKind) => {
  return release.status?.collectorsProcessing?.tenantCollectorsProcessing;
};

export const getFinalFromRelease = (release: ReleaseKind) => {
  return release.status?.finalProcessing;
};

export const generateNewReleaseName = (currentName: string): string => {
  // Use a fallback name if currentName is falsy or empty after trimming
  const safeName = currentName?.trim() || 'release';

  // remove any existing "-rerun" or "-rerun-xxx" from the name
  const baseName = safeName.replace(/(-rerun(-[a-z0-9]+)?)$/, '');

  const newName = `${baseName}-rerun-`;

  return newName;
};
