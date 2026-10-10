import { screen, within } from '@testing-library/react';
import ComponentDetailsTab from '~/components/ComponentsPage/ComponentDetails/ComponentDetailsTab';
import { PipelineRunLabel } from '~/consts/pipelinerun';
import { useComponentV2 } from '~/hooks/useComponentsV2';
import { useLatestSuccessfulBuildPipelineRunForComponentV2 } from '~/hooks/useLatestPushBuildPipeline';
import { ComponentKind } from '~/types';
import {
  createUseParamsMock,
  mockUseNamespaceHook,
  renderWithQueryClientAndRouter,
} from '~/unit-test-utils';

jest.mock('~/hooks/useComponentsV2', () => ({ useComponentV2: jest.fn() }));
jest.mock('~/hooks/useLatestPushBuildPipeline', () => ({
  useLatestSuccessfulBuildPipelineRunForComponentV2: jest.fn(),
}));
jest.mock('~/hooks/useTaskRunsV2', () => ({
  useTaskRunsForPipelineRuns: () => [[], true, undefined],
}));
jest.mock('~/hooks/useImageProxy', () => ({ useImageProxy: () => [null, true, undefined] }));
jest.mock('~/hooks/useImageRepository', () => ({
  useImageRepository: () => [undefined, true, undefined],
}));
jest.mock('~/image-controller/conditional-checks', () => ({
  useIsImageControllerEnabled: () => ({ isImageControllerEnabled: false }),
}));

const component = {
  apiVersion: 'konflux-ci.dev/v1alpha1',
  kind: 'Component',
  metadata: { name: 'frontend', namespace: 'test-ns' },
  spec: {
    source: {
      url: 'https://github.com/example/frontend',
      versions: [
        {
          name: 'next',
          revision: 'main',
          'build-pipeline': { push: { 'pipelineref-by-name': 'next-pipeline' } },
        },
        {
          name: 'stable',
          revision: 'release-1',
          'build-pipeline': { push: { 'pipelineref-by-name': 'stable-pipeline' } },
        },
      ],
    },
    'default-build-pipeline': { push: { 'pipelineref-by-name': 'default-pipeline' } },
    containerImage: 'quay.io/example/frontend',
  },
} as ComponentKind;

describe('new-model ComponentDetailsTab', () => {
  mockUseNamespaceHook('test-ns');
  createUseParamsMock({ componentName: 'frontend' });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useComponentV2).mockReturnValue([component, true, undefined]);
    jest
      .mocked(useLatestSuccessfulBuildPipelineRunForComponentV2)
      .mockReturnValue([undefined, true, undefined]);
  });

  it('shows the new resource details without legacy application edit controls', () => {
    renderWithQueryClientAndRouter(<ComponentDetailsTab />);
    expect(screen.getByRole('link', { name: 'example/frontend' })).toHaveAttribute(
      'href',
      'https://github.com/example/frontend',
    );
    expect(screen.getByText('quay.io/example/frontend')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Edit build pipeline plan' }),
    ).not.toBeInTheDocument();
    expect(useComponentV2).toHaveBeenCalledWith('test-ns', 'frontend', true);
  });

  it('selects across versions and shows settings of the successful build version', () => {
    jest.mocked(useLatestSuccessfulBuildPipelineRunForComponentV2).mockReturnValue([
      {
        apiVersion: 'tekton.dev/v1',
        kind: 'PipelineRun',
        metadata: {
          name: 'stable-build',
          labels: { [PipelineRunLabel.COMPONENT_VERSION]: 'stable' },
        },
        spec: {},
      },
      true,
      undefined,
    ]);
    renderWithQueryClientAndRouter(<ComponentDetailsTab />);
    expect(useLatestSuccessfulBuildPipelineRunForComponentV2).toHaveBeenCalledWith(
      'test-ns',
      'frontend',
    );
    expect(screen.getByText('stable-pipeline')).toBeInTheDocument();
    expect(screen.queryByText('next-pipeline')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'example/frontend' })).toHaveAttribute(
      'href',
      'https://github.com/example/frontend',
    );
    expect(screen.getByText('Registry Login Information')).toBeInTheDocument();
    expect(screen.queryByText(/Nudg/i)).not.toBeInTheDocument();
  });

  it('shows component defaults when a historical build version is no longer configured', () => {
    jest.mocked(useLatestSuccessfulBuildPipelineRunForComponentV2).mockReturnValue([
      {
        apiVersion: 'tekton.dev/v1',
        kind: 'PipelineRun',
        metadata: {
          name: 'removed-build',
          labels: { [PipelineRunLabel.COMPONENT_VERSION]: 'removed' },
        },
        spec: {},
      },
      true,
      undefined,
    ]);
    renderWithQueryClientAndRouter(<ComponentDetailsTab />);
    expect(screen.getByText('Component defaults')).toBeInTheDocument();
    expect(screen.getByText('default-pipeline')).toBeInTheDocument();
    expect(screen.queryByText('next-pipeline')).not.toBeInTheDocument();
  });

  it('keeps source and registry information visible when builds fail to load', () => {
    jest
      .mocked(useLatestSuccessfulBuildPipelineRunForComponentV2)
      .mockReturnValue([undefined, true, { code: 500 }]);
    renderWithQueryClientAndRouter(<ComponentDetailsTab />);
    expect(screen.getByText('Unable to load pipeline run')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'example/frontend' })).toBeInTheDocument();
    expect(screen.getByText('Registry Login Information')).toBeInTheDocument();
  });

  it('shows not found for a missing Component', () => {
    jest.mocked(useComponentV2).mockReturnValue([null, true, undefined]);
    renderWithQueryClientAndRouter(<ComponentDetailsTab />);
    expect(screen.getByText('404: Page not found')).toBeInTheDocument();
    expect(useLatestSuccessfulBuildPipelineRunForComponentV2).not.toHaveBeenCalled();
  });

  it('keeps identity and source together, separate from image repository details', () => {
    renderWithQueryClientAndRouter(<ComponentDetailsTab />);
    const source = screen.getByText('Source code').closest('dl');
    const image = screen.getByText('Container image repository').closest('dl');
    expect(source).not.toBe(image);
    expect(
      within(source)
        .getAllByRole('term')
        .map((term) => term.textContent),
    ).toEqual(['Name', 'Namespace', 'Source code']);
  });

  it('shows loading while fetching the new resource', () => {
    jest.mocked(useComponentV2).mockReturnValue([null, false, undefined]);
    renderWithQueryClientAndRouter(<ComponentDetailsTab />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows an API error', () => {
    jest.mocked(useComponentV2).mockReturnValue([null, true, { code: 403 }]);
    renderWithQueryClientAndRouter(<ComponentDetailsTab />);
    expect(screen.getByText('Unable to load component')).toBeInTheDocument();
  });
});
