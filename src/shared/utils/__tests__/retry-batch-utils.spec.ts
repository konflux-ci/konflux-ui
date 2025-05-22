import { cloneDeep } from 'lodash-es';
import { processWithPLimit } from '../retry-batch-utils';

const k8s503Error = {
  kind: 'Status',
  apiVersion: 'v1',
  status: 'Failure',
  message: 'temp error 503',
  reason: 'temp error',
  code: 503,
};

describe('processWithPLimit', () => {
  it('should retry failed items and complete successfully', async () => {
    const items = ['item1', 'item2', 'item3'];
    const processor = jest.fn(async (item: string) => {
      if (item === 'item2' && processor.mock.calls.length < 3) {
        await new Promise((resolve) => setTimeout(resolve, 0)); // Simulate async behavior
        throw k8s503Error;
      }
      return `result-${item}`;
    });

    const result = await processWithPLimit(items, 3, processor);
    expect(processor).toHaveBeenCalledTimes(4); // Initial attempt + 1 retry for item2
    expect(result).toEqual(['result-item1', 'result-item2', 'result-item3']);
  });

  it('should fail if retries are exhausted', async () => {
    const items = ['item1', 'item2'];

    const processor = jest.fn(async (item: string) => {
      if (item === 'item2') {
        await new Promise((resolve) => setTimeout(resolve, 0)); // Simulate async behavior
        throw k8s503Error; // Temporary error for item2
      }
    });

    // Expect the function to throw an error when retries are exhausted
    await expect(processWithPLimit(items, 2, processor)).rejects.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          item: 'item2',
          error: expect.objectContaining({
            code: k8s503Error.code,
            message: k8s503Error.message,
          }),
        }),
      ]),
    );

    // Verify retries
    const expectedCallCount = items.length + 3; // Initial attempt + retries for item2
    expect(processor).toHaveBeenCalledTimes(expectedCallCount);
  });

  it('should not retry on non-temporary errors', async () => {
    const items = ['item1', 'item2'];
    const k8s404Error = { ...cloneDeep(k8s503Error), code: 404, message: 'temp error 404' };

    const processor = jest.fn(async (item: string) => {
      if (item === 'item2') {
        await new Promise((resolve) => setTimeout(resolve, 0)); // Simulate async behavior
        throw k8s404Error; // Non-temporary error for item2
      }
      return `processed-${item}`;
    });

    await expect(processWithPLimit(items, 2, processor)).rejects.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          item: 'item2',
          error: expect.objectContaining({
            code: k8s404Error.code,
            message: k8s404Error.message,
          }),
        }),
      ]),
    );

    // Verify no retries for non-temporary errors
    expect(processor).toHaveBeenCalledTimes(2); // Only one attempt per item
  });
});
