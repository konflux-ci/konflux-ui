import { create } from 'zustand';
import { BackgroundJobAction } from '~/consts/backgroundjobs';

export enum BackgroundJobStatus {
  Succeeded = 'Succeeded',
  Failed = 'Failed',
  Running = 'Running',
  Pending = 'Pending',
}

export interface Task {
  id: string;
  action: BackgroundJobAction;
  status: BackgroundJobStatus;
  error?: string;
}

interface TaskStore {
  tasks: Record<string, Task>;
  setTaskStatus: (id: string, action: string, status: BackgroundJobStatus, error?: string) => void;
  clearTask: (id: string) => void;
}

export const useTaskStore = create<TaskStore>((set) => ({
  tasks: {},
  setTaskStatus: (id, action, status, error) =>
    set((state) => ({
      tasks: {
        ...state.tasks,
        [id]: { id, action, status, error },
      },
    })),
  clearTask: (id) =>
    set((state) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [id]: _, ...rest } = state.tasks;
      return { tasks: rest };
    }),
}));
