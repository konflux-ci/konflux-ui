import { create } from 'zustand';
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

export const useTaskStore = create<TaskStore>((set) => ({
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
}));
