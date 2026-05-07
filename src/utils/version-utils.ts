import { ComponentKind, ComponentVersion } from '~/types';

export const getComponentVersion = (
  component: ComponentKind,
  versionRevision: string,
): ComponentVersion | undefined =>
  component.spec.source?.versions?.find((v) => v.revision === versionRevision);
