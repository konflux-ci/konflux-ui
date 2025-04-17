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

// Example:
// Math.random().toString(36)               // "0.f5b27xpmc"
// Math.random().toString(36).slice(2, 7)   // "f5b27"
const generateSuffix = (length = 5): string =>
  Math.random()
    .toString(36)
    .slice(2, 2 + length);

export const generateNewReleaseName = (currentName: string): string => {
  // generate a short random 5-character suffix
  const randomSuffix = generateSuffix(5);

  // Use a fallback name if currentName is falsy or empty after trimming
  const safeName = currentName?.trim() || 'release';

  // remove any existing "-rerun" or "-rerun-xxx" from the name
  const baseName = safeName.replace(/(-rerun(-[a-z0-9]+)?)$/, '');

  const newName = `${baseName}-rerun-${randomSuffix}`;

  return newName;
};
