import { PipelineRunLabel } from '~/consts/pipelinerun';
import { ComponentReference, ComponentState, PipelineRunKind } from '~/types';

export const getComponentGroupVersionMap = (
  components: ComponentReference[],
): Map<string, Set<string>> => {
  const versions = new Map<string, Set<string>>();
  for (const component of components) {
    const version = component.componentVersion?.name;
    if ((component.kind && component.kind.toLowerCase() !== 'component') || !version) {
      continue;
    }
    if (!versions.has(component.name)) {
      versions.set(component.name, new Set());
    }
    versions.get(component.name).add(version);
  }
  return versions;
};

/** Match exact pairs in O(n), using the group's precomputed version map. */
export const filterPipelineRunsByComponentVersions = (
  pipelineRuns: PipelineRunKind[],
  versions: ReadonlyMap<string, ReadonlySet<string>>,
): PipelineRunKind[] =>
  pipelineRuns.filter((run) => {
    const labels = run.metadata?.labels;
    const component = labels?.[PipelineRunLabel.COMPONENT];
    const version = labels?.[PipelineRunLabel.COMPONENT_VERSION];
    return !!component && !!version && versions.get(component)?.has(version);
  });

const parsePromotedBuildTime = (time?: string): number => {
  const parsed = Date.parse(time ?? '');
  return Number.isNaN(parsed) ? Number.NEGATIVE_INFINITY : parsed;
};

export const getLatestPromotedBuild = (
  builds: ComponentState[],
  componentName?: string,
  version?: string,
): ComponentState | undefined => {
  // A missing build version means the component has only one version, otherwise match the requested version
  const filteredBuilds = builds.filter(
    (build) =>
      (componentName === undefined || build.name === componentName) &&
      (version === undefined || build.version === undefined || build.version === version),
  );

  return filteredBuilds.reduce<ComponentState | undefined>((latest, build) => {
    if (!latest) {
      return build;
    }

    const latestTime = parsePromotedBuildTime(latest.lastPromotedBuildTime);
    const buildTime = parsePromotedBuildTime(build.lastPromotedBuildTime);

    return buildTime > latestTime ? build : latest;
  }, undefined);
};
