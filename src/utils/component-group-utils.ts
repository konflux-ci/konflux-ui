import { ComponentState } from '~/types';

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
