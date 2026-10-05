import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PipelineRunLabel } from '~/consts/pipelinerun';
import { usePipelineRunsV2 } from '~/hooks/usePipelineRunsV2';
import { PipelineRunKind } from '~/types';
import { renderWithQueryClientAndRouter } from '~/unit-test-utils';
import RelatedNamespacePipelineRuns from '../RelatedNamespacePipelineRuns';

jest.mock('~/hooks/usePipelineRunsV2', () => ({ usePipelineRunsV2: jest.fn() }));
const run: PipelineRunKind = {
  apiVersion: 'tekton.dev/v1',
  kind: 'PipelineRun',
  metadata: {
    name: 'build',
    namespace: 'team',
    labels: {
      [PipelineRunLabel.COMPONENT_GROUP]: 'checkout',
      [PipelineRunLabel.COMPONENT]: 'api',
      [PipelineRunLabel.COMMIT_LABEL]: 'sha',
    },
  },
  spec: {},
};
const nextPage = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  jest
    .mocked(usePipelineRunsV2)
    .mockReturnValue([
      [],
      true,
      undefined,
      nextPage,
      { hasNextPage: false, isFetchingNextPage: false },
    ]);
});

it('scopes related runs to the group and commit, excluding the current run', async () => {
  const user = userEvent.setup();
  jest.mocked(usePipelineRunsV2).mockReturnValue([
    [
      run,
      { ...run, metadata: { ...run.metadata, name: 'test' } },
      {
        ...run,
        metadata: {
          ...run.metadata,
          name: 'legacy',
          labels: { ...run.metadata.labels, [PipelineRunLabel.APPLICATION]: 'app' },
        },
      },
    ],
    true,
    undefined,
    nextPage,
    { hasNextPage: false, isFetchingNextPage: false },
  ]);
  renderWithQueryClientAndRouter(<RelatedNamespacePipelineRuns pipelineRun={run} />);
  expect(usePipelineRunsV2).toHaveBeenCalledWith('team', {
    selector: {
      matchLabels: { [PipelineRunLabel.COMPONENT_GROUP]: 'checkout' },
      filterByCommit: 'sha',
    },
  });
  await user.click(screen.getByRole('button', { name: '2 pipeline runs' }));
  expect(screen.getByRole('link', { name: 'test' })).toHaveAttribute(
    'href',
    '/ns/team/pipelineruns/test',
  );
  expect(screen.getByRole('link', { name: 'legacy' })).toHaveAttribute(
    'href',
    '/ns/team/applications/app/pipelineruns/legacy',
  );
  expect(screen.queryByRole('link', { name: 'build' })).not.toBeInTheDocument();
});

it('falls back to component scope and accepts the integration-test commit label', () => {
  const componentRun = {
    ...run,
    metadata: {
      ...run.metadata,
      labels: {
        [PipelineRunLabel.COMPONENT]: 'api',
        [PipelineRunLabel.TEST_SERVICE_COMMIT]: 'test-sha',
      },
    },
  };
  renderWithQueryClientAndRouter(<RelatedNamespacePipelineRuns pipelineRun={componentRun} />);
  expect(usePipelineRunsV2).toHaveBeenCalledWith('team', {
    selector: { matchLabels: { [PipelineRunLabel.COMPONENT]: 'api' }, filterByCommit: 'test-sha' },
  });
});

it.each([
  undefined,
  { [PipelineRunLabel.COMPONENT_GROUP]: 'checkout' },
  { [PipelineRunLabel.COMMIT_LABEL]: 'sha' },
])('disables queries without both owner context and a commit: %s', (labels) => {
  renderWithQueryClientAndRouter(
    <RelatedNamespacePipelineRuns
      pipelineRun={{ ...run, metadata: { ...run.metadata, labels } }}
    />,
  );
  expect(usePipelineRunsV2).toHaveBeenCalledWith(null, expect.anything());
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
  expect(screen.getByText('-')).toBeInTheDocument();
});

it('marks partial counts and loads more results inside the popover', async () => {
  const user = userEvent.setup();
  jest
    .mocked(usePipelineRunsV2)
    .mockReturnValue([
      [],
      true,
      undefined,
      nextPage,
      { hasNextPage: true, isFetchingNextPage: false },
    ]);
  renderWithQueryClientAndRouter(<RelatedNamespacePipelineRuns pipelineRun={run} />);
  await user.click(screen.getByRole('button', { name: '0+ pipeline runs' }));
  expect(screen.queryByText('No related pipeline runs')).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Load more' }));
  expect(nextPage).toHaveBeenCalledTimes(1);
});

it('shows an empty result once every page is loaded', async () => {
  const user = userEvent.setup();
  renderWithQueryClientAndRouter(<RelatedNamespacePipelineRuns pipelineRun={run} />);
  await user.click(screen.getByRole('button', { name: '0 pipeline runs' }));
  expect(screen.getByText('No related pipeline runs')).toBeInTheDocument();
});

it('shows loading and error states without reporting a false zero count', () => {
  jest
    .mocked(usePipelineRunsV2)
    .mockReturnValue([
      [],
      false,
      undefined,
      nextPage,
      { hasNextPage: false, isFetchingNextPage: false },
    ]);
  const view = renderWithQueryClientAndRouter(<RelatedNamespacePipelineRuns pipelineRun={run} />);
  expect(screen.getByText('Loading related pipeline runs')).toBeInTheDocument();
  jest
    .mocked(usePipelineRunsV2)
    .mockReturnValue([
      [],
      true,
      { code: 403 },
      nextPage,
      { hasNextPage: false, isFetchingNextPage: false },
    ]);
  view.rerender(<RelatedNamespacePipelineRuns pipelineRun={run} />);
  expect(screen.getByText('Unable to load related pipeline runs')).toBeInTheDocument();
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
});
