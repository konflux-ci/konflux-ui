import { screen } from '@testing-library/react';
import ComponentBuildSettings from '~/components/ComponentsPage/ComponentDetails/ComponentBuildSettings';
import { ComponentKind, ComponentVersion } from '~/types';
import { renderWithQueryClientAndRouter } from '~/unit-test-utils';

const component = {
  metadata: { name: 'frontend', namespace: 'test-ns' },
  spec: { 'default-build-pipeline': { push: { 'pipelineref-by-name': 'default-pipeline' } } },
} as ComponentKind;

describe('new Component build settings', () => {
  it('shows version overrides for both pull and push without inheriting other definitions', () => {
    const version: ComponentVersion = {
      name: 'stable',
      revision: 'release-1',
      'skip-builds': true,
      'build-pipeline': {
        pull: {
          'pipelinespec-from-bundle': {
            name: 'pull-pipeline',
            bundle: 'quay.io/pipelines/build@sha256:123',
          },
        },
        push: {
          'pipelineref-by-git-resolver': {
            url: 'https://github.com/org/pipelines',
            revision: 'v2',
            pathInRepo: 'pipelines/build.yaml',
          },
        },
      },
    };
    renderWithQueryClientAndRouter(
      <ComponentBuildSettings component={component} version={version} />,
    );
    expect(screen.getByText('Current configuration for version stable')).toBeInTheDocument();
    expect(screen.getByText('Disabled')).toBeInTheDocument();
    expect(screen.getByText('Pull pipeline')).toBeInTheDocument();
    expect(screen.getByText('Push pipeline')).toBeInTheDocument();
    expect(screen.getByText('pull-pipeline')).toBeInTheDocument();
    expect(screen.getByText('quay.io/pipelines/build@sha256:123')).toBeInTheDocument();
    expect(screen.getByText('pipelines/build.yaml')).toBeInTheDocument();
    expect(screen.getByText('v2')).toBeInTheDocument();
    expect(screen.queryByText('default-pipeline')).not.toBeInTheDocument();
  });

  it('inherits component pipeline defaults for a version without overrides', () => {
    renderWithQueryClientAndRouter(
      <ComponentBuildSettings component={component} version={{ name: 'next', revision: 'main' }} />,
    );
    expect(screen.getByText('default-pipeline')).toBeInTheDocument();
    expect(screen.getByText('Enabled')).toBeInTheDocument();
  });

  it('identifies defaults without claiming a version and links to version overrides', () => {
    renderWithQueryClientAndRouter(<ComponentBuildSettings component={component} />);
    expect(screen.getByText('Component defaults')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View version overrides' })).toHaveAttribute(
      'href',
      '/ns/test-ns/components/frontend/versions',
    );
    expect(screen.queryByText('Enabled')).not.toBeInTheDocument();
  });

  it('does not inherit defaults for an explicitly empty override', () => {
    renderWithQueryClientAndRouter(
      <ComponentBuildSettings
        component={component}
        version={{ name: 'empty', revision: 'main', 'build-pipeline': {} }}
      />,
    );
    expect(screen.getByText('No pipeline configured')).toBeInTheDocument();
    expect(screen.queryByText('default-pipeline')).not.toBeInTheDocument();
  });

  it('shows a combined pull and push definition', () => {
    renderWithQueryClientAndRouter(
      <ComponentBuildSettings
        component={component}
        version={{
          name: 'main',
          revision: 'main',
          'build-pipeline': { 'pull-and-push': { 'pipelineref-by-name': 'combined' } },
        }}
      />,
    );
    expect(screen.getByText('Pull and push pipeline')).toBeInTheDocument();
    expect(screen.getByText('combined')).toBeInTheDocument();
  });
});
