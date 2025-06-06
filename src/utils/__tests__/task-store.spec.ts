import { BackgroundTaskInfo } from '~/consts/backgroundjobs';
import { BackgroundJobStatus, useTaskStore } from '../task-store';

describe('useTaskStore', () => {
  const action = BackgroundTaskInfo.SecretTask.action;

  it('empty tasks', () => {
    const state = useTaskStore.getState();
    expect(state.tasks).toEqual({});
  });

  it('setTaskStatus adds new task', () => {
    const id = 'task-1';
    const status = BackgroundJobStatus.Succeeded;
    useTaskStore.getState().setTaskStatus(id, action, status);

    const state = useTaskStore.getState();
    expect(state.tasks[id]).toEqual({ id, action, status });
  });

  it('setTaskStatus updates task status and error', () => {
    const id = 'task-2';
    const initialStatus = BackgroundJobStatus.Running;
    const updatedStatus = BackgroundJobStatus.Failed;
    const error = 'Something went wrong';

    useTaskStore.getState().setTaskStatus(id, action, initialStatus);
    useTaskStore.getState().setTaskStatus(id, action, updatedStatus, error);

    const state = useTaskStore.getState();
    expect(state.tasks[id]).toEqual({ id, action, status: updatedStatus, error });
  });

  it('clearTask removes task', () => {
    const id = 'task-3';
    useTaskStore.getState().setTaskStatus(id, action, BackgroundJobStatus.Running);

    let state = useTaskStore.getState();
    expect(state.tasks[id]).toBeDefined();

    useTaskStore.getState().clearTask(id);

    state = useTaskStore.getState();
    expect(state.tasks[id]).toBeUndefined();
  });
});
