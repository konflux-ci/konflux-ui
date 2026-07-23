import { LoaderFunction } from 'react-router-dom';
import { isFeatureFlagOn } from '../../feature-flags/utils';
import { PipelineRunModel } from '../../models';
import { GithubRedirectRouteParams } from '../../routes/utils';
import { QueryPipelineRun, QueryPipelineRunWithKubearchive } from '../../utils/pipelinerun-utils';
import { checkReviewAccesses } from '../../utils/rbac';

export const githubRedirectLoader: LoaderFunction = async ({ params }) => {
  const namespace = params[GithubRedirectRouteParams.ns];
  const allowed = await checkReviewAccesses(
    {
      model: PipelineRunModel,
      verb: 'get',
    },
    namespace,
  );
  if (!allowed) throw new Response('Access check Denied', { status: 403 });
  if (!params[GithubRedirectRouteParams.pipelineRunName]) return null;

  const ns = params[GithubRedirectRouteParams.ns];
  const pipelineRunName = params[GithubRedirectRouteParams.pipelineRunName];

  if (isFeatureFlagOn('pipelineruns-kubearchive')) {
    return QueryPipelineRunWithKubearchive(ns, pipelineRunName);
  }

  return QueryPipelineRun(ns, pipelineRunName);
};

export { default as GithubRedirect } from './GithubRedirect';
