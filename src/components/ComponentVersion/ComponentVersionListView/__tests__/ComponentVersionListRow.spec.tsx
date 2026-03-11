import { screen } from '@testing-library/react';
import { ComponentVersion } from '~/types/component';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import { renderWithQueryClient } from '~/unit-test-utils/mock-react-query';
import { ComponentVersionListRow, VersionListRowCustomData } from '../ComponentVersionListRow';

jest.mock('react-router-dom', () => ({
  Link: (props) => <a href={props.to}>{props.children}</a>,
}));

const mockVersion: ComponentVersion = {
  name: 'Version 1.0',
  revision: 'ver-1.0',
  context: './frontend',
};

const mockVersionNoPipeline: ComponentVersion = {
  name: 'Test',
  revision: 'test',
};

const mockVersionWithPipeline: ComponentVersion = {
  name: 'Custom Pipeline',
  revision: 'custom-branch',
  context: './backend',
  'build-pipeline': {
    'pull-and-push': {
      'pipelineref-by-name': 'my-custom-pipeline',
    },
  },
};

const defaultCustomData: VersionListRowCustomData = {
  repoUrl: 'https://github.com/org/repo',
  componentName: 'my-component',
};

describe('ComponentVersionListRow', () => {
  mockUseNamespaceHook('test-ns');

  it('should render version name as a link', () => {
    renderWithQueryClient(
      <ComponentVersionListRow obj={mockVersion} columns={[]} customData={defaultCustomData} />,
    );
    const link = screen.getByText('Version 1.0');
    expect(link).toBeInTheDocument();
    expect(link.closest('a')).toHaveAttribute('href', expect.stringContaining('ver-1.0'));
  });

  it('should render revision as an external link for GitHub repos', () => {
    renderWithQueryClient(
      <ComponentVersionListRow obj={mockVersion} columns={[]} customData={defaultCustomData} />,
    );
    const externalLink = screen.getByText('ver-1.0');
    expect(externalLink.closest('a')).toHaveAttribute(
      'href',
      'https://github.com/org/repo/tree/ver-1.0',
    );
  });

  it('should render revision as plain text when repo URL is unknown provider', () => {
    const customData: VersionListRowCustomData = {
      repoUrl: 'https://unknown-git.example.com/org/repo',
      componentName: 'my-component',
    };
    renderWithQueryClient(
      <ComponentVersionListRow obj={mockVersion} columns={[]} customData={customData} />,
    );
    expect(screen.getByText('ver-1.0')).toBeInTheDocument();
  });

  it('should render revision as plain text when repo URL is not set', () => {
    const customData: VersionListRowCustomData = {
      componentName: 'my-component',
    };
    renderWithQueryClient(
      <ComponentVersionListRow obj={mockVersion} columns={[]} customData={customData} />,
    );
    expect(screen.getByText('ver-1.0')).toBeInTheDocument();
  });

  it('should render pipeline name from version build-pipeline', () => {
    renderWithQueryClient(
      <ComponentVersionListRow
        obj={mockVersionWithPipeline}
        columns={[]}
        customData={defaultCustomData}
      />,
    );
    expect(screen.getByText('my-custom-pipeline')).toBeInTheDocument();
  });

  it('should render pipeline name from default-build-pipeline when version has none', () => {
    const customData: VersionListRowCustomData = {
      repoUrl: 'https://github.com/org/repo',
      componentName: 'my-component',
      defaultPipeline: {
        'pull-and-push': {
          'pipelinespec-from-bundle': {
            name: 'docker-build-oci-ta',
            bundle: 'latest',
          },
        },
      },
    };
    renderWithQueryClient(
      <ComponentVersionListRow obj={mockVersionNoPipeline} columns={[]} customData={customData} />,
    );
    expect(screen.getByText('docker-build-oci-ta')).toBeInTheDocument();
  });

  it('should render "-" when no pipeline is configured', () => {
    renderWithQueryClient(
      <ComponentVersionListRow
        obj={mockVersionNoPipeline}
        columns={[]}
        customData={defaultCustomData}
      />,
    );
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('should prefer version pipeline over default pipeline', () => {
    const customData: VersionListRowCustomData = {
      repoUrl: 'https://github.com/org/repo',
      componentName: 'my-component',
      defaultPipeline: {
        'pull-and-push': {
          'pipelinespec-from-bundle': {
            name: 'default-pipeline',
            bundle: 'latest',
          },
        },
      },
    };
    renderWithQueryClient(
      <ComponentVersionListRow
        obj={mockVersionWithPipeline}
        columns={[]}
        customData={customData}
      />,
    );
    expect(screen.getByText('my-custom-pipeline')).toBeInTheDocument();
    expect(screen.queryByText('default-pipeline')).not.toBeInTheDocument();
  });
});
