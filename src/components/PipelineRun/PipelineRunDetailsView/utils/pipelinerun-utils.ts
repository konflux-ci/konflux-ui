import { isTaskV1Beta1, SBOMResultKeys } from '~/utils/pipeline-utils';
import { PipelineRunLabel } from '../../../../consts/pipelinerun';
import { PipelineRunKind, TaskRunKind, TektonResourceLabel } from '../../../../types';

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

export type TaskRunSBOM = {
  url?: string;
  platform?: string;
  isIndex: boolean;
};

export const getSBOMSha = (sbomBlobUrl: string) => {
  const parts = sbomBlobUrl.split('@');
  return parts.length === 2 ? parts[1] : null;
};

export const getSBOMsFromTaskRuns = (
  taskRuns: TaskRunKind[],
  generateUrl: (sbomSha?: string) => string | undefined,
) => {
  return taskRuns
    .map((taskRun): TaskRunSBOM | undefined => {
      const results = isTaskV1Beta1(taskRun)
        ? taskRun.status?.taskResults
        : taskRun.status?.results;
      const sbomResult = results?.find((res) => res.name === SBOMResultKeys.SBOM_SHA);

      if (!sbomResult) {
        return;
      }

      const sha = getSBOMSha(sbomResult.value);
      if (!sha) {
        return;
      }

      const url = generateUrl(sha);

      if (
        taskRun.metadata?.labels[TektonResourceLabel.task] === 'build-image-index' ||
        taskRun.metadata?.labels[TektonResourceLabel.pipelineTask] === 'build-image-index'
      ) {
        return {
          url,
          isIndex: true,
        };
      }

      const platform = taskRun.metadata?.labels[TektonResourceLabel.targetPlatform];
      if (platform) {
        return {
          url,
          platform,
          isIndex: false,
        };
      }

      return {
        url,
        isIndex: false,
      };
    })
    .filter((sbom) => sbom !== undefined && sbom.url);
};
