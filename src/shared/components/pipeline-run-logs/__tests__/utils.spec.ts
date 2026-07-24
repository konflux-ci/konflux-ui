import type { ContainerStatus } from '../../types';
import { isContainerStepCompleted } from '../utils';

const containerStatus = (state: ContainerStatus['state']): ContainerStatus => ({
  name: 'step',
  state,
  ready: false,
  restartCount: 0,
  image: 'img',
  imageID: 'img-id',
});

describe('isContainerStepCompleted', () => {
  it('should return false when the container is still running', () => {
    expect(isContainerStepCompleted(containerStatus({ running: {} }))).toBe(false);
  });

  it('should return true for any terminated step', () => {
    expect(
      isContainerStepCompleted(containerStatus({ terminated: { exitCode: 0, reason: 'Completed' } })),
    ).toBe(true);
    expect(isContainerStepCompleted(containerStatus({ terminated: { exitCode: 1 } }))).toBe(true);
  });

  it('should return false when container status is missing', () => {
    expect(isContainerStepCompleted(undefined)).toBe(false);
  });
});
