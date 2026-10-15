import {
  NAMESPACE_PIPELINE_RUN_DETAILS_PATH,
  PIPELINE_RUNS_DETAILS_PATH,
} from '@routes/paths';
import pipelineRoutes from '../pipeline';

describe('PipelineRun page routes', () => {
  it('registers vulnerabilities as a relative child route', () => {
    const detailsRoutes = pipelineRoutes.filter(
      (route) =>
        route.path === NAMESPACE_PIPELINE_RUN_DETAILS_PATH.path ||
        route.path === PIPELINE_RUNS_DETAILS_PATH.path,
    );

    expect(detailsRoutes).toHaveLength(2);

    detailsRoutes.forEach((route) => {
      if (!('children' in route)) {
        throw new Error('Expected the PipelineRun details route to have child routes');
      }

      expect(route.children.map((child) => ('path' in child ? child.path : undefined))).toContain(
        'vulnerabilities',
      );
    });
  });
});
