import { screen, within } from '@testing-library/react';
import { PipelineRunLabel } from '~/consts/pipelinerun';
import { usePipelineRunV2 } from '~/hooks/usePipelineRunsV2';
import { useTaskRunV2 } from '~/hooks/useTaskRunsV2';
import { TaskRunKind, TektonResourceLabel } from '~/types';
import {
  createUseParamsMock,
  mockUseNamespaceHook,
  renderWithQueryClientAndRouter,
} from '~/unit-test-utils';
import NamespaceTaskRunDetailsTab from '../NamespaceTaskRunDetailsTab';

jest.mock('~/hooks/useTaskRunsV2', () => ({ useTaskRunV2: jest.fn() }));
jest.mock('~/hooks/usePipelineRunsV2', () => ({ usePipelineRunV2: jest.fn() }));
createUseParamsMock({ pipelineRunName: 'build', taskRunName: 'compile' });
mockUseNamespaceHook('team');
const task: TaskRunKind = {
  apiVersion: 'tekton.dev/v1',
  kind: 'TaskRun',
  metadata: {
    name: 'compile',
    namespace: 'team',
    labels: { [TektonResourceLabel.pipelinerun]: 'build', [PipelineRunLabel.COMPONENT]: 'api' },
  },
  spec: { taskRef: { name: 'compile-task' }, params: [{ name: 'revision', value: 'main' }] },
  status: {
    conditions: [
      { type: 'Succeeded', status: 'False', reason: 'Failed', message: 'Compilation failed' },
    ],
  },
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useTaskRunV2).mockReturnValue([task, true, undefined]);
  jest.mocked(usePipelineRunV2).mockReturnValue([undefined, true, { code: 404 }]);
});

it('renders task details with namespace parent, component and logs links', () => {
  renderWithQueryClientAndRouter(<NamespaceTaskRunDetailsTab />);
  expect(screen.getByRole('link', { name: 'build' })).toHaveAttribute(
    'href',
    '/ns/team/pipelineruns/build',
  );
  expect(screen.getByRole('link', { name: 'api' })).toHaveAttribute(
    'href',
    '/ns/team/components/api',
  );
  expect(screen.getByRole('link', { name: 'See logs' })).toHaveAttribute(
    'href',
    '/ns/team/pipelineruns/build/taskruns/compile/logs',
  );
  expect(screen.getByText('compile-task')).toBeInTheDocument();
  expect(screen.getByText('Compilation failed')).toBeInTheDocument();
  expect(screen.getByText('revision')).toBeInTheDocument();
  expect(screen.queryByText('Application')).not.toBeInTheDocument();
});

it('shows loading, failure and missing task states', () => {
  jest.mocked(useTaskRunV2).mockReturnValue([undefined, false, undefined]);
  const view = renderWithQueryClientAndRouter(<NamespaceTaskRunDetailsTab />);
  expect(screen.getByRole('progressbar')).toBeInTheDocument();
  jest.mocked(useTaskRunV2).mockReturnValue([undefined, true, { code: 403 }]);
  view.rerender(<NamespaceTaskRunDetailsTab />);
  expect(screen.getByText('Unable to load task run')).toBeInTheDocument();
  jest.mocked(useTaskRunV2).mockReturnValue([undefined, true, undefined]);
  view.rerender(<NamespaceTaskRunDetailsTab />);
  expect(screen.getByText('404: Page not found')).toBeInTheDocument();
});

it('renders an inline task without labels when linked through its owner reference', () => {
  jest.mocked(useTaskRunV2).mockReturnValue([
    {
      ...task,
      metadata: {
        name: 'compile',
        namespace: 'team',
        ownerReferences: [
          { apiVersion: 'tekton.dev/v1', kind: 'PipelineRun', name: 'build', uid: 'parent' },
        ],
      },
      spec: { taskSpec: { steps: [] } },
    },
    true,
    undefined,
  ]);
  renderWithQueryClientAndRouter(<NamespaceTaskRunDetailsTab />);
  expect(screen.getByRole('heading', { name: 'Task run details' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'build' })).toHaveAttribute(
    'href',
    '/ns/team/pipelineruns/build',
  );
});

it('matches the existing details field order within each column', () => {
  renderWithQueryClientAndRouter(<NamespaceTaskRunDetailsTab />);
  expect(
    within(
      screen
        .getAllByRole('term')
        .find((term) => term.textContent === 'Name')
        .closest('dl'),
    )
      .getAllByRole('term')
      .map((term) => term.textContent),
  ).toEqual(['Name', 'Namespace', 'Labels', 'Annotations', 'Created at', 'Duration']);
  expect(
    within(
      screen
        .getAllByRole('term')
        .find((term) => term.textContent === 'Task')
        .closest('dl'),
    )
      .getAllByRole('term')
      .map((term) => term.textContent),
  ).toEqual([
    'Task',
    'Description',
    'Status',
    'Message',
    'Log snippet',
    'Pipeline run',
    'Component',
  ]);
  expect(screen.queryByText('Started')).not.toBeInTheDocument();
});
