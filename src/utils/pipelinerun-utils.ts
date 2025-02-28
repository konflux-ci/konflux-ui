import { curry } from 'lodash-es';
import { PipelineRunLabel } from '../consts/pipelinerun';
import { k8sQueryGetResource } from '../k8s';
import { getQueryClient } from '../k8s/query/core';
import { PipelineRunModel, TaskRunModel } from '../models';
import { PipelineRunKind } from '../types';
import { K8sModelCommon } from '../types/k8s';
import { getPipelineRuns, getTaskRuns, createTektonResultQueryOptions, EQ } from './tekton-results';

export const stripQueryStringParams = (url: string) => {
  if (!url) return undefined;

  const { origin, pathname } = new URL(url);
  return `${origin}${pathname}`;
};

export const getSourceUrl = (pipelineRun: PipelineRunKind): string => {
  if (!pipelineRun) {
    return undefined;
  }

  const repoFromBuildServiceAnnotation =
    pipelineRun.metadata?.annotations?.[PipelineRunLabel.BUILD_SERVICE_REPO_ANNOTATION];
  const repoFromPACAnnotation =
    pipelineRun.metadata?.annotations?.[PipelineRunLabel.COMMIT_FULL_REPO_URL_ANNOTATION];

  return stripQueryStringParams(repoFromPACAnnotation || repoFromBuildServiceAnnotation);
};

const QueryRun = curry(
  async (
    fetchFn,
    model: K8sModelCommon,
    namespace: string,
    workspace: string,
    name: string,
  ): Promise<PipelineRunKind> => {
    try {
      return await k8sQueryGetResource(
        { model, queryOptions: { ns: namespace, ws: workspace, name } },
        { retry: false },
      );
    } catch (e) {
      if (e.code === 404) {
        return await getQueryClient()
          .ensureInfiniteQueryData({
            ...createTektonResultQueryOptions(fetchFn, model, namespace, {
              filter: EQ('data.metadata.name', name),
            }),
            retry: false,
          })
          .then((data) => {
            return data.pages[0]?.data;
          });
      }
      throw e;
    }
  },
);

export const QueryPipelineRun = QueryRun(getPipelineRuns, PipelineRunModel);
export const QueryTaskRun = QueryRun(getTaskRuns, TaskRunModel);
