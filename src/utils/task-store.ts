import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LinkSecretStatus } from '~/components/Secrets/SecretsListView/SecretsListRowWithComponents';

export type TaskStatus = `${LinkSecretStatus}`;

export interface Task {
  id: string;
  status: TaskStatus;
  error?: string;
}

interface TaskStore {
  tasks: Record<string, Task>;
  setTaskStatus: (id: string, status: TaskStatus, error?: string) => void;
  clearTask: (id: string) => void;
}

export const useTaskStore = create<TaskStore>()(
  // Save store to local storage to ensure users can get data when revisit
  // the page.
  persist(
    (set) => ({
      tasks: {},
      setTaskStatus: (id, status, error) =>
        set((state) => ({
          tasks: {
            ...state.tasks,
            [id]: { id, status, error },
          },
        })),
      clearTask: (id) =>
        set((state) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [id]: _, ...rest } = state.tasks;
          return { tasks: rest };
        }),
    }),
    {
      name: 'task-store',
      partialize: (state) => ({ tasks: state.tasks }),
    },
  ),
);
