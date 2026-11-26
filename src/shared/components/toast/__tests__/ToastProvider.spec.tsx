import React from 'react';
import { Link, MemoryRouter } from 'react-router-dom';
import { act, render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider, useToast, type ToastApi } from '~/shared/components/toast';

const ToastActions = () => {
  const toast = useToast();
  const originalApi = React.useRef(toast);
  const firstId = React.useRef<string>();
  const progressId = React.useRef<string>();
  const timedId = React.useRef<string>();

  return (
    <>
      <span data-test="api-stability">{originalApi.current === toast ? 'stable' : 'changed'}</span>
      <button
        onClick={() => {
          firstId.current = toast.addToast({
            title: 'First toast',
            description: 'First description',
          });
        }}
      >
        Add first
      </button>
      <button
        onClick={() => {
          toast.addToast({ title: 'First toast', description: 'First description' });
        }}
      >
        Add duplicate
      </button>
      <button
        onClick={() => {
          progressId.current = toast.addToast({
            title: 'Progress toast',
            description: 'Waiting for work',
            percentage: 0,
          });
        }}
      >
        Add progress
      </button>
      <button
        onClick={() => {
          if (progressId.current) {
            toast.updateToast(progressId.current, { percentage: null });
          }
        }}
      >
        Clear progress
      </button>
      <button
        onClick={() => {
          if (progressId.current) {
            toast.updateToast(progressId.current, { description: 'Progress continues' });
          }
        }}
      >
        Update progress description
      </button>
      <button
        onClick={() => {
          if (progressId.current) {
            toast.updateToast(progressId.current, { percentage: 100 });
          }
        }}
      >
        Complete progress
      </button>
      <button
        onClick={() => {
          if (progressId.current) {
            toast.updateToast(progressId.current, { percentage: 43.5 });
          }
        }}
      >
        Set fractional progress
      </button>
      {(['info', 'success', 'warning', 'danger'] as const).map((variant) => (
        <button
          key={variant}
          onClick={() => toast.addToast({ title: `${variant} toast`, variant })}
        >
          Add {variant}
        </button>
      ))}
      <button
        onClick={() =>
          toast.addToast({
            title: 'Danger policy toast',
            variant: 'danger',
            timeout: 1000,
            isDismissible: false,
          })
        }
      >
        Add danger policy
      </button>
      <button
        onClick={() => {
          timedId.current = toast.addToast({ title: 'Timed toast', timeout: 1000 });
        }}
      >
        Add timed toast
      </button>
      <button
        onClick={() => {
          if (timedId.current) {
            toast.updateToast(timedId.current, { timeout: 1000 });
          }
        }}
      >
        Reset timed toast
      </button>
      <button
        onClick={() => {
          if (timedId.current) {
            toast.updateToast(timedId.current, { description: 'Still working' });
          }
        }}
      >
        Update timed toast content
      </button>
      <button
        onClick={() => {
          if (timedId.current) {
            toast.updateToast(timedId.current, { timeout: false });
          }
        }}
      >
        Make timed toast persistent
      </button>
      <button
        onClick={() => {
          if (timedId.current) {
            toast.updateToast(timedId.current, { variant: 'danger', isDismissible: false });
          }
        }}
      >
        Make timed toast danger
      </button>
      <button
        onClick={() =>
          toast.addToast({ title: 'Pending toast', timeout: false, isDismissible: false })
        }
      >
        Add non-dismissible pending toast
      </button>
      <button
        onClick={() => {
          if (firstId.current) {
            toast.updateToast(firstId.current, { title: 'Updated toast', description: null });
          }
        }}
      >
        Update first
      </button>
      <button
        onClick={() => {
          if (firstId.current) {
            toast.removeToast(firstId.current);
          }
        }}
      >
        Remove first
      </button>
    </>
  );
};

const renderToastActions = () =>
  render(
    <ToastProvider>
      <ToastActions />
    </ToastProvider>,
  );

const SingleTimedToast = () => {
  const { addToast } = useToast();
  return (
    <button onClick={() => addToast({ title: 'Short-lived toast', timeout: 1000 })}>
      Add short-lived toast
    </button>
  );
};

const DeferredOperation = () => {
  const { addToast, updateToast, removeToast } = useToast();
  const operationId = React.useRef<string>();
  const resolveOperation = React.useRef<() => void>();

  const startOperation = () => {
    const id = addToast({
      title: 'Operation in progress',
      description: '0 of 2 requests completed',
      percentage: 0,
      timeout: false,
    });
    operationId.current = id;
    let hasReportedResult = false;
    const operation = new Promise<void>((resolve) => {
      resolveOperation.current = resolve;
    });
    void operation.then(() => {
      if (hasReportedResult) return;
      hasReportedResult = true;
      removeToast(id);
      addToast({ title: 'Operation completed', variant: 'success' });
    });
  };

  const updateOperation = () => {
    if (operationId.current) {
      updateToast(operationId.current, {
        percentage: 100,
        description: '2 of 2 requests completed',
      });
    }
  };

  return (
    <>
      <button onClick={startOperation}>Start deferred operation</button>
      <button onClick={updateOperation}>Update deferred progress</button>
      <button onClick={() => resolveOperation.current?.()}>Finish deferred operation</button>
    </>
  );
};

const PartialFailureBatch = () => {
  const { addToast, updateToast, removeToast } = useToast();

  const startBatch = () => {
    const requests = [
      { name: 'registry-secret', succeeds: true },
      { name: 'build-secret', succeeds: false },
      { name: 'source-secret', succeeds: true },
    ];
    const id = addToast({
      title: 'Linking 3 secrets',
      description: '0 of 3 requests completed',
      percentage: 0,
      timeout: false,
    });
    let settled = 0;
    let succeeded = 0;
    const failures: string[] = [];

    const runRequest = async (request: (typeof requests)[number]) => {
      await Promise.resolve();
      try {
        if (!request.succeeds) throw new Error('Simulated request failure');
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
        description: (
          <>
            <p>
              {requests.length} of {requests.length} requests completed.
            </p>
            <ul>
              {failures.map((failure) => (
                <li key={failure}>
                  <Link to={`/ns/demo/secrets/${failure}`}>{failure}</Link> could not be linked.
                </li>
              ))}
            </ul>
          </>
        ),
      });
    });
  };

  return <button onClick={startBatch}>Run partial failure batch</button>;
};

const ManyToasts = () => {
  const { addToast } = useToast();
  return (
    <button
      onClick={() =>
        Array.from({ length: 30 }, (_, index) => addToast({ title: `Toast ${index + 1}` }))
      }
    >
      Add thirty toasts
    </button>
  );
};

describe('ToastProvider', () => {
  it('requires useToast to be called within a provider', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      expect(() => renderHook(() => useToast())).toThrow(
        'useToast must be used within ToastProvider',
      );
    } finally {
      errorSpy.mockRestore();
    }
  });

  it('adds independent toasts with unique IDs and keeps the API stable', async () => {
    const user = userEvent.setup();
    renderToastActions();

    await user.click(screen.getByRole('button', { name: 'Add first' }));
    await user.click(screen.getByRole('button', { name: 'Add duplicate' }));

    const firstToast = screen.getAllByText('First toast')[0].closest('[id]');
    const secondToast = screen.getAllByText('First toast')[1].closest('[id]');
    expect(firstToast?.id).toBeTruthy();
    expect(secondToast?.id).toBeTruthy();
    expect(firstToast?.id).not.toBe(secondToast?.id);
    expect(screen.getByText('stable')).toBeInTheDocument();
  });

  it('remains usable under React StrictMode effect replay', async () => {
    const user = userEvent.setup();
    render(
      <React.StrictMode>
        <ToastProvider>
          <ToastActions />
        </ToastProvider>
      </React.StrictMode>,
    );

    await user.click(screen.getByRole('button', { name: 'Add first' }));

    expect(screen.getByText('First toast')).toBeInTheDocument();
  });

  it('keeps a toast added from a child effect removable under StrictMode replay', async () => {
    const user = userEvent.setup();
    const EffectToast = () => {
      const { addToast, removeToast } = useToast();
      const toastId = React.useRef('');

      React.useEffect(() => {
        const id = addToast({ title: 'Effect toast' });
        toastId.current = id;
        return () => removeToast(id);
      }, [addToast, removeToast]);

      return <button onClick={() => removeToast(toastId.current)}>Remove effect toast</button>;
    };

    render(
      <React.StrictMode>
        <ToastProvider>
          <EffectToast />
        </ToastProvider>
      </React.StrictMode>,
    );

    expect(screen.getAllByText('Effect toast')).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: 'Remove effect toast' }));

    expect(screen.queryByText('Effect toast')).not.toBeInTheDocument();
  });

  it('makes callbacks from a torn-down provider inert', () => {
    let oldApi: ToastApi | undefined;
    const CaptureApi = () => {
      oldApi = useToast();
      return null;
    };
    const view = render(
      <ToastProvider>
        <CaptureApi />
      </ToastProvider>,
    );
    let liveId = '';
    act(() => {
      liveId = oldApi?.addToast({ title: 'Live toast' }) ?? '';
    });
    view.unmount();

    act(() => {
      const staleId = oldApi?.addToast({ title: 'Stale toast' }) ?? '';
      expect(() => oldApi?.updateToast(liveId, { timeout: -1 })).not.toThrow();
      expect(() => oldApi?.updateToast(staleId, { timeout: -1 })).not.toThrow();
      oldApi?.removeToast(liveId);
      oldApi?.removeToast(staleId);
    });

    render(
      <ToastProvider>
        <ToastActions />
      </ToastProvider>,
    );
    expect(screen.queryByText('Stale toast')).not.toBeInTheDocument();
  });

  it('renders a 0 percent progress bar and keeps it separate from the description', async () => {
    const user = userEvent.setup();
    renderToastActions();

    await user.click(screen.getByRole('button', { name: 'Add progress' }));
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
    expect(screen.getByText('Waiting for work')).toBeInTheDocument();
  });

  it('keeps a 100 percent toast until the caller reports completion', async () => {
    const user = userEvent.setup();
    renderToastActions();

    await user.click(screen.getByRole('button', { name: 'Add progress' }));
    await user.click(screen.getByRole('button', { name: 'Complete progress' }));

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
    expect(screen.getByText('Progress toast')).toBeInTheDocument();
  });

  it('renders a fractional percentage in the PatternFly progress measure', async () => {
    const user = userEvent.setup();
    renderToastActions();

    await user.click(screen.getByRole('button', { name: 'Add progress' }));
    await user.click(screen.getByRole('button', { name: 'Set fractional progress' }));

    expect(screen.getByRole('progressbar', { name: 'Progress toast' })).toHaveAttribute(
      'aria-valuenow',
      '43.5',
    );
    expect(screen.getByText('43.5%')).toBeInTheDocument();
  });

  it('clears progress when percentage is explicitly set to null', async () => {
    const user = userEvent.setup();
    renderToastActions();

    await user.click(screen.getByRole('button', { name: 'Add progress' }));
    await user.click(screen.getByRole('button', { name: 'Clear progress' }));

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.getByText('Waiting for work')).toBeInTheDocument();
  });

  it('preserves the percentage when an update omits it', async () => {
    const user = userEvent.setup();
    renderToastActions();

    await user.click(screen.getByRole('button', { name: 'Add progress' }));
    await user.click(screen.getByRole('button', { name: 'Update progress description' }));

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
    expect(screen.getByText('Progress continues')).toBeInTheDocument();
  });

  it('renders all alert variants and keeps danger dismissible when the caller disables it', async () => {
    const user = userEvent.setup();
    renderToastActions();

    for (const variant of ['info', 'success', 'warning', 'danger']) {
      await user.click(screen.getByRole('button', { name: `Add ${variant}` }));
    }
    await user.click(screen.getByRole('button', { name: 'Add danger policy' }));

    for (const variant of ['info', 'success', 'warning', 'danger']) {
      expect(screen.getByText(`${variant} toast`)).toBeInTheDocument();
    }
    expect(
      screen.getByRole('button', { name: 'Dismiss notification: Danger policy toast' }),
    ).toBeInTheDocument();
  });

  it('updates one toast without changing its ID or removing unrelated toasts', async () => {
    const user = userEvent.setup();
    renderToastActions();

    await user.click(screen.getByRole('button', { name: 'Add first' }));
    await user.click(screen.getByRole('button', { name: 'Add progress' }));
    const firstToast = screen.getByText('First toast').closest('[id]');

    await user.click(screen.getByRole('button', { name: 'Update first' }));

    expect(screen.getByText('Updated toast').closest('[id]')).toBe(firstToast);
    expect(screen.queryByText('First description')).not.toBeInTheDocument();
    expect(screen.getByText('Waiting for work')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  });

  it('removes only the requested toast and ignores unknown IDs', async () => {
    const user = userEvent.setup();
    renderToastActions();

    await user.click(screen.getByRole('button', { name: 'Add first' }));
    await user.click(screen.getByRole('button', { name: 'Add progress' }));
    await user.click(screen.getByRole('button', { name: 'Remove first' }));

    expect(screen.queryByText('First toast')).not.toBeInTheDocument();
    expect(screen.getByText('Waiting for work')).toBeInTheDocument();
  });

  it('validates known toast updates before changing the record and ignores invalid updates to missing IDs', () => {
    const wrapper = ({ children }: React.PropsWithChildren) => (
      <ToastProvider>{children}</ToastProvider>
    );
    const { result } = renderHook(() => useToast(), { wrapper });
    let id = '';

    act(() => {
      id = result.current.addToast({ title: 'Validated toast' });
    });

    for (const percentage of [-1, 101, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => result.current.updateToast(id, { percentage })).toThrow(
        'Toast percentage must be between 0 and 100',
      );
    }
    expect(() => result.current.addToast({ title: '   ' })).toThrow(
      'Toast title must be a non-empty string',
    );
    for (const timeout of [-1, 0, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => result.current.addToast({ title: 'Bad timeout', timeout })).toThrow(
        'Toast timeout must be false or a positive finite number',
      );
    }
    for (const timeout of [-1, 0, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => result.current.updateToast(id, { timeout })).toThrow(
        'Toast timeout must be false or a positive finite number',
      );
    }
    expect(() => result.current.updateToast('missing', { percentage: 101 })).not.toThrow();
    expect(screen.getByText('Validated toast')).toBeInTheDocument();
  });
});

describe('ToastProvider lifetimes', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('expires success after five seconds while persistent variants remain', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderToastActions();
    await user.click(screen.getByRole('button', { name: 'Add success' }));
    await user.click(screen.getByRole('button', { name: 'Add info' }));
    await user.click(screen.getByRole('button', { name: 'Add warning' }));
    await user.click(screen.getByRole('button', { name: 'Add danger' }));
    await user.click(screen.getByRole('button', { name: 'Add danger policy' }));

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(screen.queryByText('success toast')).not.toBeInTheDocument();
    expect(screen.getByText('info toast')).toBeInTheDocument();
    expect(screen.getByText('warning toast')).toBeInTheDocument();
    expect(screen.getByText('danger toast')).toBeInTheDocument();
    expect(screen.getByText('Danger policy toast')).toBeInTheDocument();
  });

  it('does not restart a countdown for content updates but restarts it for an explicit timeout update', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderToastActions();
    await user.click(screen.getByRole('button', { name: 'Add timed toast' }));

    act(() => {
      jest.advanceTimersByTime(500);
    });
    await user.click(screen.getByRole('button', { name: 'Update timed toast content' }));
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(screen.queryByText('Timed toast')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Add timed toast' }));
    act(() => {
      jest.advanceTimersByTime(500);
    });
    await user.click(screen.getByRole('button', { name: 'Reset timed toast' }));
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(screen.getByText('Timed toast')).toBeInTheDocument();
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(screen.queryByText('Timed toast')).not.toBeInTheDocument();
  });

  it('cancels expiry when timeout is updated to false', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderToastActions();
    await user.click(screen.getByRole('button', { name: 'Add timed toast' }));
    await user.click(screen.getByRole('button', { name: 'Make timed toast persistent' }));

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(screen.getByText('Timed toast')).toBeInTheDocument();
  });

  it('enforces the danger policy when a timed toast is updated to danger', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderToastActions();
    await user.click(screen.getByRole('button', { name: 'Add timed toast' }));
    await user.click(screen.getByRole('button', { name: 'Make timed toast danger' }));

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(screen.getByText('Timed toast')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Dismiss notification: Timed toast' }),
    ).toBeInTheDocument();
  });

  it('pauses while hovered and resumes with the remaining time', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderToastActions();
    await user.click(screen.getByRole('button', { name: 'Add timed toast' }));
    const alert = screen.getByText('Timed toast').closest('[data-test="toast-alert"]');
    expect(alert).not.toBeNull();

    act(() => {
      jest.advanceTimersByTime(400);
    });
    await user.hover(alert);
    act(() => {
      jest.advanceTimersByTime(1500);
    });
    expect(screen.getByText('Timed toast')).toBeInTheDocument();

    await user.unhover(alert);
    act(() => {
      jest.advanceTimersByTime(599);
    });
    expect(screen.getByText('Timed toast')).toBeInTheDocument();
    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(screen.queryByText('Timed toast')).not.toBeInTheDocument();
  });

  it('pauses while focus is inside the toast and resumes only after focus leaves', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(
      <ToastProvider>
        <SingleTimedToast />
      </ToastProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'Add short-lived toast' }));
    const alert = screen.getByText('Short-lived toast').closest('[data-test="toast-alert"]');
    const dismissButton = screen.getByRole('button', {
      name: 'Dismiss notification: Short-lived toast',
    });
    await user.tab();
    expect(alert).toHaveFocus();

    act(() => {
      jest.advanceTimersByTime(1500);
    });
    expect(screen.getByText('Short-lived toast')).toBeInTheDocument();

    await user.tab();
    expect(dismissButton).toHaveFocus();
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(screen.getByText('Short-lived toast')).toBeInTheDocument();

    await user.tab();
    act(() => {
      jest.advanceTimersByTime(999);
    });
    expect(screen.getByText('Short-lived toast')).toBeInTheDocument();
    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(screen.queryByText('Short-lived toast')).not.toBeInTheDocument();
  });

  it('keeps the countdown paused until both hover and focus leave', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(
      <ToastProvider>
        <SingleTimedToast />
      </ToastProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'Add short-lived toast' }));
    const alert = screen.getByText('Short-lived toast').closest('[data-test="toast-alert"]');
    expect(alert).not.toBeNull();
    await user.hover(alert);
    await user.tab();
    await user.unhover(alert);

    act(() => {
      jest.advanceTimersByTime(1500);
    });
    expect(screen.getByText('Short-lived toast')).toBeInTheDocument();

    await user.tab();
    expect(
      screen.getByRole('button', { name: 'Dismiss notification: Short-lived toast' }),
    ).toHaveFocus();
    await user.tab();
    act(() => {
      jest.advanceTimersByTime(999);
    });
    expect(screen.getByText('Short-lived toast')).toBeInTheDocument();
    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(screen.queryByText('Short-lived toast')).not.toBeInTheDocument();
  });

  it('does not show a close control for a caller-managed pending toast', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderToastActions();
    await user.click(screen.getByRole('button', { name: 'Add non-dismissible pending toast' }));

    expect(screen.getByText('Pending toast')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Dismiss notification: Pending toast' }),
    ).not.toBeInTheDocument();
  });
});

describe('ToastProvider operation reporting', () => {
  it('does not revive dismissed progress and shows one fresh completion result', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <DeferredOperation />
      </ToastProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Start deferred operation' }));
    await user.click(screen.getByRole('button', { name: 'Update deferred progress' }));
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
    expect(screen.getByText('Operation in progress')).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'Dismiss notification: Operation in progress' }),
    );
    await user.click(screen.getByRole('button', { name: 'Update deferred progress' }));
    expect(screen.queryByText('Operation in progress')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Finish deferred operation' }));
    await user.click(screen.getByRole('button', { name: 'Finish deferred operation' }));

    expect(await screen.findByText('Operation completed')).toBeInTheDocument();
    expect(screen.getAllByText('Operation completed')).toHaveLength(1);
  });

  it('continues a batch after individual failures and reports one final summary', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ToastProvider>
          <PartialFailureBatch />
        </ToastProvider>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: 'Run partial failure batch' }));

    expect(await screen.findByText('Linked 2 of 3; 1 failed')).toBeInTheDocument();
    expect(screen.getByText('3 of 3 requests completed.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'build-secret' })).toHaveAttribute(
      'href',
      '/ns/demo/secrets/build-secret',
    );
    expect(screen.queryByText('Linking 3 secrets')).not.toBeInTheDocument();
  });

  it('keeps every toast in a polite, keyboard-reachable scroll stack without stealing focus', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <ManyToasts />
      </ToastProvider>,
    );

    const trigger = screen.getByRole('button', { name: 'Add thirty toasts' });
    await user.click(trigger);

    const alertGroup = screen.getByRole('list', { name: 'Notifications' });
    const alerts = alertGroup.querySelectorAll('[data-test="toast-alert"]');
    const alertItems = alertGroup.querySelectorAll('.pf-v6-c-alert-group__item');
    expect(alertGroup).toHaveAttribute('aria-live', 'polite');
    expect(alertGroup).toHaveAttribute('aria-atomic', 'false');
    expect(alertGroup).toHaveClass('toast-alert-group');
    expect(alerts).toHaveLength(30);
    expect(alertItems).toHaveLength(30);
    expect(alerts[0]).toHaveAttribute('tabindex', '0');
    expect(alerts[29]).toHaveAttribute('tabindex', '0');
    expect(alerts[0]).not.toHaveAttribute('aria-live');
    expect(trigger).toHaveFocus();
  });
});
