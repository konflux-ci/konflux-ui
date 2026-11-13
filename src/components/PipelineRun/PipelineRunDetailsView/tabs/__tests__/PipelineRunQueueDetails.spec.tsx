import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataState, testPipelineRuns } from '~/__data__/pipelinerun-data';
import { useIsOnFeatureFlag } from '~/feature-flags/hooks';
import { KUEUE_PRIORITY_CLASS_LABEL, KUEUE_QUEUE_NAME_LABEL } from '~/kueue/const';
import { useKueueQueuePositionForPipelineRun } from '~/kueue/kueue-hooks';
import { useCurrentTime } from '~/shared/hooks/useCurrentTime';
import type { PipelineRunKind } from '~/types';
import { renderWithQueryClientAndRouter } from '~/unit-test-utils';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import { PipelineRunQueueDetails } from '../PipelineRunQueueDetails';

jest.mock('~/feature-flags/hooks', () => ({
  ...jest.requireActual('~/feature-flags/hooks'),
  useIsOnFeatureFlag: jest.fn(),
}));

jest.mock('~/kueue/kueue-hooks', () => ({
  useKueueQueuePositionForPipelineRun: jest.fn(),
}));

jest.mock('~/shared/hooks/useCurrentTime', () => ({
  useCurrentTime: jest.fn(),
}));

const mockUseIsOnFeatureFlag = jest.mocked(useIsOnFeatureFlag);
const mockUseKueuePosition = jest.mocked(useKueueQueuePositionForPipelineRun);
const mockUseCurrentTime = jest.mocked(useCurrentTime);

const CLASS_NAME = 'konflux-pre-merge-test';
const HELP_TEXT =
  'Priority classes are set by your cluster admin. Higher values are scheduled first.';
// 6 hours 12 minutes after the fixture's creationTimestamp ('2022-11-28T12:08:22Z').
const NOW = Date.parse('2022-11-28T12:08:22Z') + (6 * 60 + 12) * 60 * 1000;

const basePlr = testPipelineRuns[DataState.PIPELINE_RUN_QUEUED_KUEUE];

const createRun = ({ withClass = true }: { withClass?: boolean } = {}): PipelineRunKind =>
  ({
    ...basePlr,
    metadata: {
      ...basePlr.metadata,
      labels: {
        ...basePlr.metadata.labels,
        [KUEUE_QUEUE_NAME_LABEL]: 'default-queue',
        ...(withClass ? { [KUEUE_PRIORITY_CLASS_LABEL]: CLASS_NAME } : {}),
      },
    },
  }) as PipelineRunKind;

const hookResult = (
  overrides: Partial<ReturnType<typeof useKueueQueuePositionForPipelineRun>> = {},
): ReturnType<typeof useKueueQueuePositionForPipelineRun> => ({
  queuePosition: undefined,
  isLoading: false,
  error: undefined,
  hasPayload: false,
  ...overrides,
});

const position = (positionInClusterQueue: number, priority = 600) => ({
  positionInClusterQueue,
  positionInLocalQueue: positionInClusterQueue,
  localQueueName: 'default-queue',
  priority,
});

const queuePositionValue = () => screen.getByTestId('queue-position');
const queuePriorityValue = () => screen.getByTestId('queue-priority');

describe('PipelineRunQueueDetails', () => {
  mockUseNamespaceHook('test-ns');

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseIsOnFeatureFlag.mockReturnValue(true);
    mockUseKueuePosition.mockReturnValue(hookResult());
    mockUseCurrentTime.mockReturnValue(NOW);
  });

  describe('loaded', () => {
    beforeEach(() => {
      mockUseKueuePosition.mockReturnValue(
        hookResult({ queuePosition: position(1), hasPayload: true }),
      );
    });

    it('shows position, class name with priority number, and waiting time', () => {
      renderWithQueryClientAndRouter(<PipelineRunQueueDetails pipelineRun={createRun()} />);

      expect(screen.getByText('Queue position')).toBeInTheDocument();
      expect(queuePositionValue()).toHaveTextContent('2');
      expect(screen.getByText('Queue priority')).toBeInTheDocument();
      expect(queuePriorityValue()).toHaveTextContent(`${CLASS_NAME} (600)`);
      expect(screen.getByText('Waiting for')).toBeInTheDocument();
      expect(screen.getByText('6 hours 12 minutes')).toBeInTheDocument();
    });

    it('renders position 1 for API position 0 (0-based)', () => {
      mockUseKueuePosition.mockReturnValue(
        hookResult({ queuePosition: position(0), hasPayload: true }),
      );
      renderWithQueryClientAndRouter(<PipelineRunQueueDetails pipelineRun={createRun()} />);
      expect(queuePositionValue()).toHaveTextContent(/^1$/);
    });

    it('shows the help text when hovering the icon beside Queue priority', async () => {
      const user = userEvent.setup();
      renderWithQueryClientAndRouter(<PipelineRunQueueDetails pipelineRun={createRun()} />);

      const icon = within(screen.getByTestId('queue-priority-help')).getByRole('img', {
        hidden: true,
      });
      await user.hover(icon);
      expect(await screen.findByText(HELP_TEXT)).toBeInTheDocument();
    });

    it('renders `name (0)` for priority 0 when the class label is set', () => {
      mockUseKueuePosition.mockReturnValue(
        hookResult({ queuePosition: position(1, 0), hasPayload: true }),
      );
      renderWithQueryClientAndRouter(<PipelineRunQueueDetails pipelineRun={createRun()} />);
      expect(queuePriorityValue()).toHaveTextContent(`${CLASS_NAME} (0)`);
    });

    it('renders `0` for priority 0 when the class label is missing', () => {
      mockUseKueuePosition.mockReturnValue(
        hookResult({ queuePosition: position(1, 0), hasPayload: true }),
      );
      renderWithQueryClientAndRouter(
        <PipelineRunQueueDetails pipelineRun={createRun({ withClass: false })} />,
      );
      expect(queuePriorityValue()).toHaveTextContent(/^0$/);
    });

    it('renders the number alone when the class label is missing', () => {
      renderWithQueryClientAndRouter(
        <PipelineRunQueueDetails pipelineRun={createRun({ withClass: false })} />,
      );
      expect(queuePriorityValue()).toHaveTextContent(/^600$/);
    });
  });

  describe('loading', () => {
    beforeEach(() => {
      mockUseKueuePosition.mockReturnValue(hookResult({ isLoading: true }));
    });

    it('shows a skeleton for position, keeps the class name without parentheses, and keeps the help icon', () => {
      renderWithQueryClientAndRouter(<PipelineRunQueueDetails pipelineRun={createRun()} />);

      expect(
        within(queuePositionValue()).getByText('Loading', { selector: '.pf-v6-screen-reader' }),
      ).toBeInTheDocument();
      expect(queuePriorityValue()).toHaveTextContent(new RegExp(`^${CLASS_NAME}$`));
      expect(screen.getByTestId('queue-priority-help')).toBeInTheDocument();
      expect(screen.getByText('6 hours 12 minutes')).toBeInTheDocument();
    });

    it('shows a skeleton for the whole priority value when the class label is missing', () => {
      renderWithQueryClientAndRouter(
        <PipelineRunQueueDetails pipelineRun={createRun({ withClass: false })} />,
      );
      expect(
        within(queuePriorityValue()).getByText('Loading', { selector: '.pf-v6-screen-reader' }),
      ).toBeInTheDocument();
      expect(screen.getByTestId('queue-priority-help')).toBeInTheDocument();
    });
  });

  describe('payload without this run', () => {
    beforeEach(() => {
      mockUseKueuePosition.mockReturnValue(hookResult({ hasPayload: true }));
    });

    it('shows a dash for position and keeps the class name', () => {
      renderWithQueryClientAndRouter(<PipelineRunQueueDetails pipelineRun={createRun()} />);
      expect(queuePositionValue()).toHaveTextContent(/^-$/);
      expect(queuePriorityValue()).toHaveTextContent(new RegExp(`^${CLASS_NAME}$`));
    });

    it('shows a dash for priority when the class label is missing', () => {
      renderWithQueryClientAndRouter(
        <PipelineRunQueueDetails pipelineRun={createRun({ withClass: false })} />,
      );
      expect(queuePriorityValue()).toHaveTextContent(/^-$/);
    });

    it('keeps the dash, not N/A, when a later poll failed', () => {
      mockUseKueuePosition.mockReturnValue(
        hookResult({ hasPayload: true, error: new Error('NetworkError') }),
      );
      renderWithQueryClientAndRouter(<PipelineRunQueueDetails pipelineRun={createRun()} />);
      expect(queuePositionValue()).toHaveTextContent(/^-$/);
      expect(queuePriorityValue()).toHaveTextContent(new RegExp(`^${CLASS_NAME}$`));
    });
  });

  describe('error', () => {
    const error = new Error('Forbidden');

    it('shows N/A for position when there was never a payload, and keeps the class name', () => {
      mockUseKueuePosition.mockReturnValue(hookResult({ error }));
      renderWithQueryClientAndRouter(<PipelineRunQueueDetails pipelineRun={createRun()} />);
      expect(queuePositionValue()).toHaveTextContent(/^N\/A$/);
      expect(queuePriorityValue()).toHaveTextContent(new RegExp(`^${CLASS_NAME}$`));
      expect(screen.getByText('6 hours 12 minutes')).toBeInTheDocument();
    });

    it('shows N/A for the whole priority value when the class label is missing', () => {
      mockUseKueuePosition.mockReturnValue(hookResult({ error }));
      renderWithQueryClientAndRouter(
        <PipelineRunQueueDetails pipelineRun={createRun({ withClass: false })} />,
      );
      expect(queuePriorityValue()).toHaveTextContent(/^N\/A$/);
    });

    it('keeps `name (number)` and the position when the error comes with a cached position', () => {
      mockUseKueuePosition.mockReturnValue(
        hookResult({ queuePosition: position(1), hasPayload: true, error }),
      );
      renderWithQueryClientAndRouter(<PipelineRunQueueDetails pipelineRun={createRun()} />);
      expect(queuePositionValue()).toHaveTextContent(/^2$/);
      expect(queuePriorityValue()).toHaveTextContent(`${CLASS_NAME} (600)`);
    });
  });

  describe('hidden', () => {
    it('renders no queue terms for a running run that still has the queue label', () => {
      const running = testPipelineRuns[DataState.RUNNING];
      const plr = {
        ...running,
        metadata: {
          ...running.metadata,
          labels: { ...running.metadata.labels, [KUEUE_QUEUE_NAME_LABEL]: 'default-queue' },
        },
      } as PipelineRunKind;
      renderWithQueryClientAndRouter(<PipelineRunQueueDetails pipelineRun={plr} />);
      expect(screen.queryByText('Queue position')).not.toBeInTheDocument();
      expect(screen.queryByText('Queue priority')).not.toBeInTheDocument();
      expect(screen.queryByText('Waiting for')).not.toBeInTheDocument();
    });

    it('renders no queue terms when the feature flag is off', () => {
      mockUseIsOnFeatureFlag.mockReturnValue(false);
      renderWithQueryClientAndRouter(<PipelineRunQueueDetails pipelineRun={createRun()} />);
      expect(screen.queryByText('Queue position')).not.toBeInTheDocument();
      expect(screen.queryByText('Waiting for')).not.toBeInTheDocument();
    });

    it('renders no queue terms for a pending run without the queue-name label', () => {
      renderWithQueryClientAndRouter(
        <PipelineRunQueueDetails
          pipelineRun={testPipelineRuns[DataState.PIPELINE_RUN_PENDING_NO_QUEUE_LABEL]}
        />,
      );
      expect(screen.queryByText('Queue position')).not.toBeInTheDocument();
      expect(screen.queryByText('Queue priority')).not.toBeInTheDocument();
      expect(screen.queryByText('Waiting for')).not.toBeInTheDocument();
    });
  });
});
