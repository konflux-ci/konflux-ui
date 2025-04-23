import React from 'react';
import { APPLICATION_RELEASE_DETAILS_PATH } from '../../paths';
import releaseRoutes from '../release';

jest.mock('../../../components/Releases', () => ({
  ReleaseDetailsLayout: () => <div>ReleaseDetailsLayout</div>,
  ReleaseOverviewTab: () => <div>ReleaseOverviewTab</div>,
  ReleasePipelineRunTab: () => <div>ReleasePipelineRunTab</div>,
  releaseListViewTabLoader: jest.fn(),
}));

jest.mock('../../../components/Releases/ReleaseArtifactsTab', () => {
  return function ReleaseArtifactsTab() {
    return <div>ReleaseArtifactsTab</div>;
  };
});

jest.mock('../../../components/Releases/ReleaseYamlTab', () => ({
  ReleaseYamlTab: () => <div>ReleaseYamlTab</div>,
}));

describe('Release Routes Configuration', () => {
  it('should export an array of routes', () => {
    expect(Array.isArray(releaseRoutes)).toBe(true);
    expect(releaseRoutes).toHaveLength(1);
  });

  describe('main release route', () => {
    let mainRoute: {
      path: string;
      loader: unknown;
      errorElement: JSX.Element;
      element: JSX.Element;
      children: Array<{
        path?: string;
        index?: boolean;
        element?: JSX.Element;
        lazy?: () => Promise<{ element: JSX.Element }>;
      }>;
    };

    beforeEach(() => {
      [mainRoute] = releaseRoutes;
    });

    it('should have correct path', () => {
      expect(mainRoute.path).toBe(APPLICATION_RELEASE_DETAILS_PATH.path);
    });

    it('should have loader function', () => {
      expect(typeof mainRoute.loader).toBe('function');
    });

    it('should have error element', () => {
      expect(mainRoute.errorElement).toBeDefined();
      expect(React.isValidElement(mainRoute.errorElement)).toBe(true);
    });

    it('should have children routes', () => {
      expect(Array.isArray(mainRoute.children)).toBe(true);
      expect(mainRoute.children).toHaveLength(4);
    });

    it('should have overview tab as index route', () => {
      const overviewRoute = mainRoute.children.find((child) => child.index === true);
      expect(overviewRoute).toBeDefined();
      expect(overviewRoute?.element).toBeDefined();
      expect(React.isValidElement(overviewRoute?.element)).toBe(true);
    });

    it('should have pipelineruns child route', () => {
      const pipelinerunsRoute = mainRoute.children.find((child) => child.path === 'pipelineruns');
      expect(pipelinerunsRoute).toBeDefined();
      expect(pipelinerunsRoute?.element).toBeDefined();
      expect(React.isValidElement(pipelinerunsRoute?.element)).toBe(true);
    });

    it('should have artifacts child route', () => {
      const artifactsRoute = mainRoute.children.find((child) => child.path === 'artifacts');
      expect(artifactsRoute).toBeDefined();
      expect(artifactsRoute?.path).toBe('artifacts');
      expect(artifactsRoute?.element).toBeDefined();
      expect(React.isValidElement(artifactsRoute?.element)).toBe(true);
    });

    it('should have yaml child route with lazy loading', async () => {
      const yamlRoute = mainRoute.children.find((child) => child.path === 'yaml');
      expect(yamlRoute).toBeDefined();
      expect(typeof yamlRoute?.lazy).toBe('function');

      const lazyResult = await yamlRoute?.lazy?.();
      expect(lazyResult).toBeDefined();
      expect(lazyResult).toHaveProperty('element');
      expect(React.isValidElement(lazyResult?.element)).toBe(true);
    });

    it('should have all route elements defined', () => {
      // eslint-disable-next-line @typescript-eslint/no-shadow
      const [mainRoute] = releaseRoutes;
      expect(mainRoute.element).toBeDefined();
      expect(React.isValidElement(mainRoute.element)).toBe(true);
      expect(mainRoute.errorElement).toBeDefined();
      expect(React.isValidElement(mainRoute.errorElement)).toBe(true);
    });
  });
});
