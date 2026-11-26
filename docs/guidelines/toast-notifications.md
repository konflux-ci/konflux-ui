# Toast notification guidelines

Status: Implemented; manual screen-reader, dark-theme, and modal-focus checks remain.

Use shared toasts to give users feedback while an operation runs and when it finishes. The application-level ToastProvider renders PatternFly AlertGroup and Alert. It is mounted in the persistent root route layout, inside router and namespace context and outside ModalProvider, so page and modal consumers share one host across navigation.

## Public API

Import from `~/shared/components/toast`:

```tsx
const { addToast, updateToast, removeToast } = useToast();
```

| Method | Behavior |
| --- | --- |
| `addToast(options)` | Returns a fresh string ID and adds one toast. Identical content still produces separate toasts. |
| `updateToast(id, patch)` | Patches an existing toast without moving it. Missing/removed IDs are ignored. |
| `removeToast(id)` | Removes the toast and its timer. Repeated removal is safe. |

Options:

```tsx
type ToastOptions = {
  title: string;
  variant?: 'info' | 'success' | 'warning' | 'danger';
  description?: React.ReactNode | null;
  percentage?: number | null;
  timeout?: number | false;
  isDismissible?: boolean;
};
```

Title must be a non-empty string. Percentage, when provided as a number, must be finite and between 0 and 100 inclusive; invalid values throw before mutation. Timeout must be false or a positive finite number of milliseconds. Invalid known-record input throws before changing state. Undefined patch fields preserve values; `description: null` clears the body and `percentage: null` removes the progress bar. Updating a missing record is always a no-op, even when its patch is invalid. Calling useToast outside its provider is a configuration error.

API functions and the returned object remain stable as content changes. Pass callbacks to utilities or queued work; hooks must only run in React consumers. Captured callbacks keep working when the initiating page unmounts, while old callbacks become inert after their provider is destroyed.

## Lifetime and dismissal

| Variant | Default timeout | Close button |
| --- | --- | --- |
| info | Persistent | Enabled by default |
| success | 5000 ms | Enabled by default |
| warning | Persistent | Enabled by default |
| danger | Always persistent | Always enabled |

Use `timeout: false` for pending operations. Info/success/warning may override timeout and isDismissible. Danger normalizes to persistent and dismissible even if overrides are supplied. Use isDismissible false only when the caller guarantees removal or replacement on every terminal path, including setup failures.

A content update keeps the existing countdown. An explicit timeout update starts a full new duration, even when its numeric value is unchanged; false cancels expiry. Changing variant retains stored lifetime settings except for danger's required policy. When changing a persistent toast into success in place, explicitly set its timeout.

Hovering or focusing inside the toast pauses its remaining time. Countdown resumes only when neither applies. Provider teardown cancels timers and makes old callbacks inert; ordinary route changes do not. Refresh/tab closure does not restore toasts or resume jobs.

Each toast uses one timer controller with PatternFly Alert timeout disabled. Resetting a timer must not remount focused content, and stale timer callbacks must not remove refreshed records.

## Async operation pattern

Use one progress toast per operation. Dismissal hides feedback without cancelling work. Further updates to the removed ID do nothing; completion removes that ID and adds a fresh result so the outcome is still visible.

```tsx
const progressId = addToast({
  title: 'Linking secrets',
  description: '0 of 20 requests completed',
  percentage: 0,
  timeout: false,
});

// Call from actual execution progress, not from enqueue completion.
updateToast(progressId, {
  percentage: 90,
  description: '18 of 20 requests completed',
});

// Called exactly once after all requests settle.
removeToast(progressId);
addToast({
  variant: 'danger',
  title: 'Linked 18 of 20; 2 failed',
  description: failureDetails, // caller-provided safe React content
});
```

Callers own execution, aggregation, and exactly-once terminal reporting. Continue remaining batch requests after individual failures. Count both successes and failures as settled progress; summarize any failures in one persistent danger toast with resource details or links. Always handle setup/queue failure so pending feedback is removed. Late callbacks must target the old ID rather than the new result.

For downloads, show persistent info while preparing logs, then a success toast after browser download handoff. “Log download started” is accurate; browser disk-save completion is not observable. Success may use the default 5 seconds or an explicit shorter timeout. Report incomplete content as an incomplete result rather than all-success.

For a future **Download all task logs** integration, use this lifecycle: show a pending toast while collecting task logs, then report a short success after handing the file to the browser. If sections are unavailable because they are still waiting or time out, report the count in a persistent warning. Failed log requests should produce a persistent danger summary. Partial outcomes should state that the downloaded file may be incomplete. A preparation or handoff failure should also produce a danger toast. The single-task **Download** action remains toast-free.

For an operation with no reliable total, omit `percentage` and keep the toast persistent while it runs. For example, show a spinner and explanatory text while preparing task logs, then replace the pending toast with a short success result after handing the download to the browser:

```tsx
const downloadId = addToast({
  title: 'Preparing task logs',
  description: <><Spinner size="sm" /> Waiting for log content.</>,
  timeout: false,
});

try {
  await prepareAndSaveLogs();
  removeToast(downloadId);
  addToast({
    title: 'Log download started',
    description: 'The browser has received the file download.',
    variant: 'success',
    timeout: 3000,
  });
} catch {
  removeToast(downloadId);
  addToast({ title: 'Unable to prepare task logs', variant: 'danger' });
}
```

The browser does not expose when the file has finished saving to disk. Do not claim disk-save completion.

## Rich content and accessibility

Description accepts ReactNode for text, resource links, and custom content. The provider renders the standard PatternFly Progress below the description whenever percentage is numeric, including 0. Callers do not need to construct a Progress component. The visible label and accessible value use the supplied number; the bar uses min 0, max 100, and the toast title as its accessible name. PatternFly 6.6.1 floors the visual fill width to a whole percent for fractional values. Capture originating namespace/resource in links so later navigation does not change their meaning.

Percentage contract:

- Omitted or null on add: no progress bar. A number from 0 through 100 (including fractions): render the bar.
- A numeric update changes the bar in place; omitted/undefined on update preserves its value. `percentage: null` removes the bar without removing the toast or description.
- Percentage-only updates do not reset the timeout, reorder the toast, or revive a dismissed toast. Use `timeout: false` for pending work; percentage does not implicitly change lifetime.
- 100 means the measured work has settled, not that it succeeded. It never automatically removes the toast or changes its variant. The caller still removes progress and adds one final success/failure result.
- For a known nonzero total, callers calculate `(settled / total) * 100`, counting both successes and failures. For an unknown or zero total, omit percentage and use descriptive text (optionally a Spinner in description); never divide by zero or invent progress.

Rendering sketch inside the toast body:

```tsx
{typeof toast.percentage === 'number' && (
  <Progress
    value={toast.percentage}
    label={`${toast.percentage}%`}
    min={0}
    max={100}
    measureLocation="outside"
    aria-label={toast.title}
  />
)}
```

The numeric check is required: a truthiness check would hide the bar at 0%. Keep the percentage bar visually separate from the description so links and explanatory text remain available.

The host uses one polite AlertGroup live region without nested alert live regions or focus stealing. Coalesce rapidly changing progress text into meaningful announcements. Title-only alerts use a paragraph; alerts with a description or progress use a heading. Each alert can receive keyboard focus so users can reach and scroll the full stack. Use accessible close-button names and non-color status cues. Verify announcements with a screen reader; DOM assertions alone do not establish usable announcements.

Keep success confirmations concise. Detailed errors and essential actions need persistent feedback or another durable destination. No essential action should exist only in an expiring toast. Render React content safely; never inject server HTML or display secret values/tokens.

Render newest additions first without reordering updates. Every active toast remains available in a viewport-bounded, keyboard-accessible scrolling stack; do not silently evict persistent notifications. Respect modal focus trapping and make essential feedback available within the modal flow when needed.

Konflux intentionally chooses a 5-second default instead of PatternFly's recommended 8 seconds and allows pending work to hide its close button. Interaction pauses, persistent detailed feedback, and caller-owned terminal cleanup are required for these choices.

## Relationship to existing systems

- `src/utils/task-store.ts` tracks task execution in memory. Toasts do not schedule work, subscribe to that store, or control its unload warning.
- `enqueueLinkingTask` in `src/utils/create-utils.ts` resolves after enqueueing. Future secret integration must report completion from the queued callback or a true completion promise.
- `getDownloadAllLogsCallback` in `src/shared/components/pipeline-run-logs/logs/logs-utils.ts` prepares task logs and calls `saveAs`. A future toast integration should distinguish incomplete sections and timeouts from failed requests before reporting success; browser save completion is not observable. The single-task **Download** action remains a direct browser download.
- The system notification drawer reads ConfigMaps through `useSystemNotifications`. Operation feedback is not written into the drawer or persisted as history.

This story supplies toast infrastructure. Secret link/unlink and **Download all task logs** workflow integrations remain separate consumer work.

## References

- [KFLUXUI-1859](https://redhat.atlassian.net/browse/KFLUXUI-1859)
- [PatternFly Progress](https://www.patternfly.org/components/progress/): value, range, measure placement, and accessible naming.
- [PatternFly Alert](https://www.patternfly.org/components/alert/)
- [PatternFly Alert accessibility](https://www.patternfly.org/components/alert/accessibility/)
- [PatternFly Alert design guidance](https://www.patternfly.org/components/alert/design-guidelines/)
- [Repository unit testing guidelines](unit-testing.md)

Target the repository's pinned PatternFly 6.6.1 API; public documentation may describe a newer release.
