import { render, screen } from '@testing-library/react';
import { usePipelineRunsForCommitV2 } from '~/hooks/usePipelineRunsForCommitV2';
import { useComponents } from '../../../../../hooks/useComponents';
import { useIntegrationTestScenarios } from '../../../../../hooks/useIntegrationTestScenarios';
import { useReleasePlans } from '../../../../../hooks/useReleasePlans';
import { useReleases } from '../../../../../hooks/useReleases';
import { CustomError } from '../../../../../k8s/error';
import { Commit } from '../../../../../types';
import {
  MockBuildPipelines,
  MockIntegrationTests,
  MockComponents,
  MockReleasePlans,
  MockReleases,
  MockTestPipelines,
  MockCommit,
} from '../__data__/MockCommitWorkflowData';
import CommitVisualization from '../CommitVisualization';

jest.mock('../../../../../hooks/useTektonResults');

jest.mock('../../../../../hooks/usePipelineRunsForCommitV2', () => ({
  usePipelineRunsForCommitV2: jest.fn(),
}));
jest.mock('../../../../../hooks/useComponents', () => ({
  useComponents: jest.fn(),
}));

jest.mock('../../../../../hooks/useIntegrationTestScenarios', () => ({
  useIntegrationTestScenarios: jest.fn(),
}));
jest.mock('../../../../../hooks/useReleasePlans', () => ({
  useReleasePlans: jest.fn(),
}));
jest.mock('../../../../../hooks/useReleases', () => ({
  useReleases: jest.fn(),
}));
jest.mock('../../../../../hooks/useSnapshots', () => ({
  useSnapshots: jest.fn(),
}));

const mockUsePipelineRunsForCommit = usePipelineRunsForCommitV2 as jest.Mock;
const mockUseComponents = useComponents as jest.Mock;
const mockUseIntegrationTestScenarios = useIntegrationTestScenarios as jest.Mock;
const mockUseReleasePlans = useReleasePlans as jest.Mock;
const mockUseReleases = useReleases as jest.Mock;

const commit = MockCommit;

describe('CommitVisualization', () => {
  /* eslint-disable @typescript-eslint/no-explicit-any */

  beforeEach(() => {
    mockUsePipelineRunsForCommit.mockReturnValue([
      [...MockBuildPipelines, ...MockTestPipelines],
      true,
    ]);
    mockUseComponents.mockReturnValue([MockComponents, true]);
    mockUseIntegrationTestScenarios.mockReturnValue([MockIntegrationTests, true]);
    mockUseReleasePlans.mockReturnValue([MockReleasePlans, true]);
    mockUseReleases.mockReturnValue([MockReleases, true]);

    (window.SVGElement as any).prototype.getBBox = () => ({
      x: 100,
      y: 100,
    });
    (HTMLCanvasElement as any).prototype.getContext = () => null;
  });

  afterEach(() => {
    jest.clearAllMocks();
    (window.SVGElement as any).prototype.getBBox = undefined;
    (HTMLCanvasElement as any).prototype.getContext = undefined;
  });

  it('should not render the commit visualization graph', () => {
    mockUsePipelineRunsForCommit.mockReturnValue([[], false]);
    mockUseComponents.mockReturnValue([[], false]);
    mockUseIntegrationTestScenarios.mockReturnValue([[], false]);
    mockUseReleasePlans.mockReturnValue([[], false]);
    mockUseReleases.mockReturnValue([[], false]);
    render(<CommitVisualization commit={commit as Commit} />);
    expect(screen.queryByTestId('commit-graph')).not.toBeInTheDocument();
  });

  it('should render the commit visualization graph', () => {
    render(<CommitVisualization commit={commit as Commit} />);
    screen.getByTestId('commit-graph');
  });

  it('should render the commit visualization graph', () => {
    mockUsePipelineRunsForCommit.mockReturnValue([
      [],
      true,
      new CustomError('Model does not exist'),
    ]);
    mockUseComponents.mockReturnValue([[], true]);
    mockUseIntegrationTestScenarios.mockReturnValue([[], true]);
    mockUseReleasePlans.mockReturnValue([[], true]);
    mockUseReleases.mockReturnValue([[], true]);

    render(<CommitVisualization commit={commit as Commit} />);
    screen.getByText('Model does not exist');
  });
  it('should render the commit visualization graph', () => {
    render(<CommitVisualization commit={commit as Commit} />);

    const graph = screen.getByTestId('commit-graph');
    expect(graph).toBeVisible();

    const nodes = graph.querySelectorAll('[data-kind="node"]');

    expect(nodes).toHaveLength(6);
  });
});
