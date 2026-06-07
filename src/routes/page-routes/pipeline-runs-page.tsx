import { redirect, RouteObject } from 'react-router-dom';
import { PIPELINE_RUNS_PAGE_PATH } from '@routes/paths';
import { RouteErrorBoundry } from '../RouteErrorBoundary';

// Placeholder page component until Task 12
const PipelineRunsPage = () => <div data-test="pipeline-runs-page">Pipeline Runs</div>;

const pipelineRunsPageLoader = ({ request }: { request: Request }) => {
  const url = new URL(request.url);
  const slug = url.searchParams.get('view');

  // Only redirect if view param is present but filter params are missing
  // (bare bookmark URL like ?view=slug with no app/component params)
  if (slug && !url.searchParams.has('app') && !url.searchParams.has('component')) {
    try {
      const stored = localStorage.getItem('saved-views:pipeline-runs');
      if (stored) {
        const views = JSON.parse(stored);
        const savedView = views.find((v: { slug: string }) => v.slug === slug);
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
    element: <PipelineRunsPage />,
    errorElement: <RouteErrorBoundry />,
  },
];
