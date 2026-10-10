import { screen } from '@testing-library/react';
import ComponentVersionDetailsTab from '~/components/ComponentVersion/tabs/ComponentVersionDetailsTab';
import { PipelineRunLabel } from '~/consts/pipelinerun';
import { useComponentV2 } from '~/hooks/useComponentsV2';
import { useLatestSuccessfulBuildPipelineRunForComponentV2 } from '~/hooks/useLatestPushBuildPipeline';
import { ComponentKind, PipelineRunKind } from '~/types';
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
      url: 'https://github.com/org/repo',
      versions: [
        {
          name: 'stable',
          revision: 'release-1',
          context: 'frontend',
          'build-pipeline': { pull: { 'pipelineref-by-name': 'stable-pipeline' } },
        },
        { name: 'next', revision: 'main' },
      ],
    },
    'default-build-pipeline': { push: { 'pipelineref-by-name': 'default-pipeline' } },
  },
} as ComponentKind;
const run = {
  apiVersion: 'tekton.dev/v1',
  kind: 'PipelineRun',
  spec: {},
  metadata: { name: 'stable-build', labels: { [PipelineRunLabel.COMPONENT_VERSION]: 'stable' } },
  status: {
    pipelineSpec: { tasks: [] },
    results: [{ name: 'IMAGE_URL', value: 'quay.io/org/frontend:stable' }],
  },
} as PipelineRunKind;

describe('ComponentVersionDetailsTab', () => {
  mockUseNamespaceHook('test-ns');
  const params = createUseParamsMock({ componentName: 'frontend', versionRevision: 'stable' });
  beforeEach(() => {
    jest.clearAllMocks();
    params.mockReturnValue({ componentName: 'frontend', versionRevision: 'stable' });
    jest.mocked(useComponentV2).mockReturnValue([component, true, undefined]);
    jest
      .mocked(useLatestSuccessfulBuildPipelineRunForComponentV2)
      .mockReturnValue([run, true, undefined]);
  });

  it('shows version source and settings, and scopes builds by version name rather than Git revision', () => {
    renderWithQueryClientAndRouter(<ComponentVersionDetailsTab />);
    expect(screen.getByText('Version details')).toBeInTheDocument();
    expect(screen.getByTestId('version-name')).toHaveTextContent('stable');
    expect(screen.getByRole('link', { name: /org\/repo/ })).toHaveAttribute(
      'href',
      'https://github.com/org/repo/tree/release-1/frontend',
    );
    expect(screen.getByText('stable-pipeline')).toBeInTheDocument();
    expect(screen.queryByText('default-pipeline')).not.toBeInTheDocument();
    expect(screen.getByDisplayValue('quay.io/org/frontend:stable')).toBeInTheDocument();
    expect(useLatestSuccessfulBuildPipelineRunForComponentV2).toHaveBeenCalledWith(
      'test-ns',
      'frontend',
      'stable',
    );
    expect(screen.getByText('Registry Login Information')).toBeInTheDocument();
    expect(screen.queryByText(/Nudg/i)).not.toBeInTheDocument();
  });

  it('clears previous build data when navigating to a version without successful builds', () => {
    const { rerender } = renderWithQueryClientAndRouter(<ComponentVersionDetailsTab />);
    params.mockReturnValue({ componentName: 'frontend', versionRevision: 'next' });
    jest
      .mocked(useLatestSuccessfulBuildPipelineRunForComponentV2)
      .mockReturnValue([undefined, false, undefined]);
    rerender(<ComponentVersionDetailsTab />);
    expect(screen.queryByDisplayValue('quay.io/org/frontend:stable')).not.toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    jest
      .mocked(useLatestSuccessfulBuildPipelineRunForComponentV2)
      .mockReturnValue([undefined, true, undefined]);
    rerender(<ComponentVersionDetailsTab />);
    expect(screen.getByText('No successful build pipeline available')).toBeInTheDocument();
    expect(screen.getByText('default-pipeline')).toBeInTheDocument();
    expect(useLatestSuccessfulBuildPipelineRunForComponentV2).toHaveBeenLastCalledWith(
      'test-ns',
      'frontend',
      'next',
    );
  });

  it('shows a spinner while loading the Component', () => {
    jest.mocked(useComponentV2).mockReturnValue([undefined, false, undefined]);
    renderWithQueryClientAndRouter(<ComponentVersionDetailsTab />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows an API error', () => {
    jest.mocked(useComponentV2).mockReturnValue([undefined, true, { code: 500 }]);
    renderWithQueryClientAndRouter(<ComponentVersionDetailsTab />);
    expect(screen.getByText('Unable to load Component version')).toBeInTheDocument();
  });

  it.each(['nonexistent', 'release-1'])(
    'rejects missing version %s before querying builds',
    (versionRevision) => {
      params.mockReturnValue({ componentName: 'frontend', versionRevision });
      renderWithQueryClientAndRouter(<ComponentVersionDetailsTab />);
      expect(screen.getByText('404: Page not found')).toBeInTheDocument();
      expect(useLatestSuccessfulBuildPipelineRunForComponentV2).not.toHaveBeenCalled();
    },
  );

  it.each([{ versions: undefined }, { versions: [] }])(
    'does not invent a version when versions is %s',
    ({ versions }) => {
      jest
        .mocked(useComponentV2)
        .mockReturnValue([
          { ...component, spec: { ...component.spec, source: { versions } } },
          true,
          undefined,
        ]);
      renderWithQueryClientAndRouter(<ComponentVersionDetailsTab />);
      expect(screen.getByText('404: Page not found')).toBeInTheDocument();
      expect(useLatestSuccessfulBuildPipelineRunForComponentV2).not.toHaveBeenCalled();
    },
  );

  it('shows not found for a missing Component', () => {
    jest.mocked(useComponentV2).mockReturnValue([undefined, true, undefined]);
    renderWithQueryClientAndRouter(<ComponentVersionDetailsTab />);
    expect(screen.getByText('404: Page not found')).toBeInTheDocument();
    expect(useLatestSuccessfulBuildPipelineRunForComponentV2).not.toHaveBeenCalled();
  });

  it('shows revision as text when repository URL is missing', () => {
    jest.mocked(useComponentV2).mockReturnValue([
      {
        ...component,
        spec: { ...component.spec, source: { versions: component.spec.source.versions } },
      },
      true,
      undefined,
    ]);
    renderWithQueryClientAndRouter(<ComponentVersionDetailsTab />);
    expect(screen.getByText('release-1')).toBeInTheDocument();
  });
});
