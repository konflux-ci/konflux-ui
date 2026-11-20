import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Spinner } from '@patternfly/react-core';
import type { Meta, StoryObj } from '@storybook/react';
import { ToastProvider, useToast } from '~/shared/components/toast';

type ToastDemoMode = 'all' | 'progress' | 'batch' | 'download' | 'concurrent' | 'overflow';

const wait = (duration: number) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, duration));

const ToastInfrastructureDemo: React.FC<{ mode?: ToastDemoMode }> = ({ mode = 'all' }) => {
  const { addToast, updateToast, removeToast } = useToast();
  const progressToastId = React.useRef<string>();

  const startProgressExample = () => {
    progressToastId.current = addToast({
      title: 'Progress control example',
      description: 'The caller controls this progress value.',
      percentage: 0,
      timeout: false,
    });
  };

  const setProgress = (percentage: number) => {
    if (progressToastId.current) updateToast(progressToastId.current, { percentage });
  };

  const clearProgress = () => {
    if (progressToastId.current) updateToast(progressToastId.current, { percentage: null });
  };

  const runBatch = () => {
    const requests = [
      { name: 'registry credentials', succeeds: true, delay: 500 },
      { name: 'build context secret', succeeds: false, delay: 1000 },
      { name: 'source credentials', succeeds: true, delay: 1500 },
    ];
    const id = addToast({
      title: 'Linking secrets',
      description: `0 of ${requests.length} requests completed`,
      percentage: 0,
      timeout: false,
    });
    let settled = 0;
    let succeeded = 0;
    const failures: string[] = [];

    const runRequest = async (request: (typeof requests)[number]) => {
      try {
        await wait(request.delay);
        if (!request.succeeds) throw new Error('The simulated request failed');
        succeeded++;
      } catch {
        failures.push(request.name);
      } finally {
        settled++;
        updateToast(id, {
          percentage: (settled / requests.length) * 100,
          description: `${settled} of ${requests.length} requests completed`,
        });
      }
    };

    void Promise.all(requests.map(runRequest)).then(() => {
      removeToast(id);
      addToast({
        title: `Linked ${succeeded} of ${requests.length}; ${failures.length} failed`,
        variant: failures.length > 0 ? 'danger' : 'success',
        description:
          failures.length > 0 ? (
            <ul>
              {failures.map((name) => (
                <li key={name}>
                  <Link to={`/ns/demo/secrets/${encodeURIComponent(name)}`}>{name}</Link> could not
                  be linked.
                </li>
              ))}
            </ul>
          ) : (
            'All secrets were linked.'
          ),
      });
    });
  };

  const startDownload = () => {
    const id = addToast({
      title: 'Preparing task logs',
      description: (
        <span>
          <Spinner size="sm" /> Waiting for log content to be prepared.
        </span>
      ),
      timeout: false,
    });

    void wait(1500).then(() => {
      removeToast(id);
      addToast({
        title: 'Log download started',
        description: 'The browser has received the file download.',
        variant: 'success',
        timeout: 3000,
      });
    });
  };

  const runOperation = (name: string, duration: number) => {
    const id = addToast({
      title: `${name} in progress`,
      description: 'The operation is running in the background.',
      percentage: 0,
      timeout: false,
    });

    void wait(duration / 2).then(() => updateToast(id, { percentage: 50 }));
    void wait(duration).then(() => {
      updateToast(id, { percentage: 100 });
      removeToast(id);
      addToast({ title: `${name} complete`, variant: 'success' });
    });
  };

  const addLongFailures = () => {
    Array.from({ length: 12 }, (_, index) =>
      addToast({
        title: `Failed resource operation ${index + 1}`,
        variant: 'danger',
        description: (
          <Link to={`/ns/demo/secrets/${index}`}>
            {`registry-credential-${index}-${'unusually-long-resource-name-'.repeat(5)}`}
          </Link>
        ),
      }),
    );
  };

  const showProgress = mode === 'all' || mode === 'progress';
  const showBatch = mode === 'all' || mode === 'batch';
  const showDownload = mode === 'all' || mode === 'download';
  const showConcurrent = mode === 'all' || mode === 'concurrent';
  const showOverflow = mode === 'all' || mode === 'overflow';

  return (
    <section aria-labelledby="toast-demo-title">
      <h2 id="toast-demo-title">Toast notification examples</h2>
      {showProgress && (
        <div>
          <Button onClick={startProgressExample}>Start progress example</Button>{' '}
          <Button onClick={() => setProgress(43.5)}>Set progress to 43.5%</Button>{' '}
          <Button onClick={() => setProgress(100)}>Set progress to 100%</Button>{' '}
          <Button onClick={clearProgress}>Remove progress bar</Button>
        </div>
      )}
      {showBatch && <Button onClick={runBatch}>Link three sample secrets</Button>}
      {showDownload && <Button onClick={startDownload}>Download all task logs</Button>}
      {showConcurrent && (
        <Button
          onClick={() => {
            runOperation('Fast background task', 1500);
            runOperation('Slow background task', 3000);
          }}
        >
          Start two concurrent tasks
        </Button>
      )}
      {showOverflow && <Button onClick={addLongFailures}>Show long failures and overflow</Button>}
    </section>
  );
};

const meta: Meta<typeof ToastInfrastructureDemo> = {
  title: 'Shared/Toast Notifications',
  component: ToastInfrastructureDemo,
  decorators: [
    (Story) => (
      <ToastProvider>
        <Story />
      </ToastProvider>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof ToastInfrastructureDemo>;

export const ProgressControls: Story = { args: { mode: 'progress' } };
export const BulkOperationWithPartialFailure: Story = { args: { mode: 'batch' } };
export const DownloadWithUnknownProgress: Story = { args: { mode: 'download' } };
export const ConcurrentOperations: Story = { args: { mode: 'concurrent' } };
export const OverflowAndLongFailures: Story = { args: { mode: 'overflow' } };
export const AllExamples: Story = { args: { mode: 'all' } };
