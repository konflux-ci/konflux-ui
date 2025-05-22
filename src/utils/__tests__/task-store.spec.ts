import { LinkSecretStatus } from '~/components/Secrets/SecretsListView/SecretsListRowWithComponents';
import { useTaskStore } from '../task-store';

describe('useTaskStore', () => {
  it('empty tasks', () => {
    const state = useTaskStore.getState();
    expect(state.tasks).toEqual({});
  });

  it('setTaskStatus adds new task', () => {
    const id = 'task-1';
    const status = LinkSecretStatus.Succeeded;
    useTaskStore.getState().setTaskStatus(id, status);

    const state = useTaskStore.getState();
    expect(state.tasks[id]).toEqual({ id, status });
  });

  it('setTaskStatus updates task status and error', () => {
    const id = 'task-2';
    const initialStatus = LinkSecretStatus.Running;
    const updatedStatus = LinkSecretStatus.Failed;
    const error = 'Something went wrong';

    useTaskStore.getState().setTaskStatus(id, initialStatus);
    useTaskStore.getState().setTaskStatus(id, updatedStatus, error);

    const state = useTaskStore.getState();
    expect(state.tasks[id]).toEqual({ id, status: updatedStatus, error });
  });

  it('clearTask removes task', () => {
    const id = 'task-3';
    useTaskStore.getState().setTaskStatus(id, LinkSecretStatus.Running);

    let state = useTaskStore.getState();
    expect(state.tasks[id]).toBeDefined();

    useTaskStore.getState().clearTask(id);

    state = useTaskStore.getState();
    expect(state.tasks[id]).toBeUndefined();
  });
});
