export const RouterParams = {
  /**
   * @deprecated
   * Existing usages are permitted for backward compatibility;
   * however, please avoid adding new references
   *
   * use [useNamespace](../shared/providers/Namespace)
   */
  workspaceName: 'workspaceName',
  applicationName: 'applicationName',
  integrationTestName: 'integrationTestName',
  releaseName: 'releaseName',
  activityTab: 'activityTab',
  pipelineRunName: 'pipelineRunName',
  taskRunName: 'taskRunName',
  componentName: 'componentName',
  commitName: 'commitName',
  releasePlanName: 'releasePlanName',
  snapshotName: 'snapshotName',
  bindingName: 'bindingName',
} as const;

export type RouterParams = typeof RouterParams;

export enum GithubRedirectRouteParams {
  ns = 'ns',
  pipelineRunName = 'pipelineRunName',
  taskName = 'taskName',
}

/* eslint-disable @typescript-eslint/no-unused-vars */
type ParamsFromPath<Path extends string> = Path extends `${infer _}/:${infer Param}/${infer Rest}`
  ? Param | ParamsFromPath<`/${Rest}`>
  : Path extends `${infer _}/:${infer Param}`
    ? Param
    : never;

type ParamObject<T extends string> = T extends never ? object : { [K in T]: string };

type CreatePathOptions = {
  leadingSlash: boolean;
};

export type RouteDefinition<Path extends string> = {
  path: Path;
  createPath: (params: ParamObject<ParamsFromPath<Path>>, options?: CreatePathOptions) => string;
  extend: <SubPath extends string>(subpath: SubPath) => RouteDefinition<`${Path}/${SubPath}`>;
};

export function buildRoute<Path extends string>(path: Path): RouteDefinition<Path> {
  return {
    path,
    createPath: (
      params: ParamObject<ParamsFromPath<Path>>,
      options: CreatePathOptions = { leadingSlash: true },
    ): string => {
      const leadingSlash = options?.leadingSlash;
      const generatedPath = Object.entries(params).reduce(
        (acc, [key, value]) => acc.replace(`:${key}`, value),
        path,
      );
      return leadingSlash ? `/${generatedPath}` : generatedPath;
    },
    extend: (subpath) => {
      return buildRoute(`${path}/${subpath}`);
    },
  };
}
