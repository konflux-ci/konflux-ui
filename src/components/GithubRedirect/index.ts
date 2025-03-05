import { LoaderFunction } from 'react-router-dom';
import { PipelineRunModel } from '../../models';
import { GithubRedirectRouteParams } from '../../routes/utils';
import { QueryPipelineRun } from '../../utils/pipelinerun-utils';
import { checkReviewAccesses } from '../../utils/rbac';

export const githubRedirectLoader: LoaderFunction = async ({ params }) => {
  const allowed = await checkReviewAccesses(
    {
      model: PipelineRunModel,
      verb: 'get',
    },
    params[GithubRedirectRouteParams.ns],
  );
  if (!allowed) throw new Response('Access check Denied', { status: 403 });
  if (!params[GithubRedirectRouteParams.pipelineRunName]) return null;
  return QueryPipelineRun(
    params[GithubRedirectRouteParams.ns],
    params[GithubRedirectRouteParams.pipelineRunName],
  );
};

export { default as GithubRedirect } from './GithubRedirect';
