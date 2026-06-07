import { redirect, RouteObject } from 'react-router-dom';
import { PIPELINE_RUNS_PAGE_PATH } from '@routes/paths';
import { PipelineRunsPage } from '~/components/PipelineRunsPage/PipelineRunsPage';
import { NuqsAdapter } from '~/shared/components/Filter';
import { RouteErrorBoundry } from '../RouteErrorBoundary';

export const pipelineRunsPageLoader = ({ request }: { request: Request }) => {
  const url = new URL(request.url);
  const slug = url.searchParams.get('view');

  // Only redirect if 'view' is the only param (bare bookmark URL).
  // After redirect, URL will have additional params from the saved view,
  // so having keys beyond 'view' means params are already expanded — don't redirect again.
  const paramKeys = Array.from(url.searchParams.keys());
  if (slug && paramKeys.length === 1 && paramKeys[0] === 'view') {
    try {
      const stored = localStorage.getItem('saved-views:pipeline-runs');
      if (stored) {
        const views = JSON.parse(stored) as Array<{ slug: string; searchParams?: string }>;
        const savedView = views.find((v) => v.slug === slug);
        if (savedView?.searchParams) {
          return redirect(`${url.pathname}?view=${slug}&${savedView.searchParams}`);
        }
      }
    } catch {
      // Parse error — fall through to normal page load
    }
  }
  return null;
};

export const pipelineRunsPageRoutes: RouteObject[] = [
  {
    path: PIPELINE_RUNS_PAGE_PATH.path,
    loader: pipelineRunsPageLoader,
    element: (
      <NuqsAdapter>
        <PipelineRunsPage />
      </NuqsAdapter>
    ),
    errorElement: <RouteErrorBoundry />,
  },
];
