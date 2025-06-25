import { useEffect } from 'react';
import { BackgroundJobAction } from '~/consts/backgroundjobs';
import { BackgroundJobStatus, useTaskStore } from '~/utils/task-store';

/**
 * useRunningTaskActions
 *
 * This hook retrieves the list of background task `action`s that are currently
 * in `Running` or `Pending` status.
 *
 * @returns runningActions - A list of `action`s that are still running or pending.
 */
export const useRunningTaskActions = (): BackgroundJobAction[] => {
  const tasks = useTaskStore((state) => state.tasks);

  const runningActions = Object.values(tasks)
    .filter(
      (task) =>
        task.status === BackgroundJobStatus.Running || task.status === BackgroundJobStatus.Pending,
    )
    .map((task) => task.action);

  // Optional: remove duplicates
  return [...new Set(runningActions)];
};

// Just check whether we have running/pending tasks.
export const useHasRunningTasks = (): boolean => {
  return useRunningTaskActions().length > 0;
};

/**
 * usePreventWindowCloseIfTaskRunning
 *
 * This hook adds a browser-level `beforeunload` event listener to prevent the user
 * from accidentally closing or refreshing the page when there are background tasks running.
 *
 * It should be used once in a high-level component (e.g. AppRoot).
 * It does not show any UI. It only triggers the native browser warning.
 *
 * @returns hasRunningTasks - boolean indicating if any background task is currently running.
 */
export const usePreventWindowCloseIfTaskRunning = (): boolean => {
  const hasRunningTasks = useHasRunningTasks();
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasRunningTasks) {
        e.preventDefault();
        e.returnValue = ''; // Triggers default browser confirmation dialog
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasRunningTasks]);

  return hasRunningTasks;
};
